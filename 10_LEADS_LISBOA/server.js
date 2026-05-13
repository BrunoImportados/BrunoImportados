/**
 * VIALLUX — Servidor principal
 * Webhooks para Make.com + Dashboard + API de leads
 * Executar: node server.js
 */
import "dotenv/config";
import express from "express";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { runPipeline } from "./pipeline.js";
import { sendDailyEmails, testBrevoConnection, getBrevoStats } from "./email/brevo.js";
import { logger } from "./config/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || process.env.DASHBOARD_PORT || 3000;
const WEBHOOK_SECRET = process.env.MAKE_WEBHOOK_SECRET || "viallux_make_2025_xK9mP3qR";
const CACHE_FILE = path.join(__dirname, "output/data/leads_cache.json");
const EMAIL_LOG = path.join(__dirname, "output/data/email_log.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, "dashboard")));

// ─── MIDDLEWARE: autenticação de webhooks ────────────────────────────────────
function authWebhook(req, res, next) {
  const secret = req.headers["x-webhook-secret"] || req.query.secret;
  if (secret !== WEBHOOK_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// Estado de execuções em curso
const jobs = new Map();

async function readJSON(filepath, fallback = null) {
  try {
    const data = await fs.readFile(filepath, "utf8");
    return JSON.parse(data);
  } catch {
    return fallback;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// WEBHOOKS PARA MAKE.COM
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /webhook/pipeline/start
 * Make.com chama este endpoint para arrancar o pipeline completo.
 * Header: x-webhook-secret: <MAKE_WEBHOOK_SECRET>
 * Body (opcional): { "segments": ["condominios","hoteis"], "skipEmail": false }
 */
app.post("/webhook/pipeline/start", authWebhook, async (req, res) => {
  const jobId = `job_${Date.now()}`;
  const options = {
    segmentIds: req.body.segments || null,
    skipEmail: req.body.skipEmail === true,
    useCache: req.body.useCache === true,
  };

  jobs.set(jobId, { status: "running", startedAt: new Date().toISOString(), options });
  logger.info(`Make.com iniciou pipeline: ${jobId}`);

  // Responder imediatamente para não dar timeout no Make.com
  res.json({ jobId, status: "started", message: "Pipeline iniciado com sucesso" });

  // Correr em background
  runPipeline(options)
    .then(({ stats }) => {
      jobs.set(jobId, { status: "completed", completedAt: new Date().toISOString(), stats });
      logger.success(`Pipeline ${jobId} concluído: ${stats.total} leads | ${stats.emailsEnviados} emails`);
    })
    .catch((err) => {
      jobs.set(jobId, { status: "failed", error: err.message, failedAt: new Date().toISOString() });
      logger.error(`Pipeline ${jobId} falhou: ${err.message}`);
    });
});

/**
 * GET /webhook/pipeline/status/:jobId
 * Make.com verifica o estado do pipeline.
 */
app.get("/webhook/pipeline/status/:jobId", authWebhook, (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: "Job não encontrado" });
  res.json(job);
});

/**
 * POST /webhook/email/send
 * Make.com pede envio de emails com leads do cache atual.
 * Body (opcional): { "maxEmails": 300, "onlyHot": false }
 */
app.post("/webhook/email/send", authWebhook, async (req, res) => {
  try {
    const leads = await readJSON(CACHE_FILE, []);
    if (leads.length === 0) {
      return res.json({ sent: 0, message: "Sem leads em cache. Corre o pipeline primeiro." });
    }

    const maxEmails = req.body.maxEmails || 300;
    const emailStats = await sendDailyEmails(leads.slice(0, maxEmails));

    res.json({
      status: "ok",
      sent: emailStats.sent,
      failed: emailStats.failed,
      skipped: emailStats.skipped,
      totalLeads: leads.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /webhook/leads
 * Make.com obtém lista de leads (para processar no cenário).
 * Query: ?tier=quente&limit=100
 */
app.get("/webhook/leads", authWebhook, async (req, res) => {
  const leads = await readJSON(CACHE_FILE, []);
  let filtered = leads;

  if (req.query.tier) filtered = filtered.filter((l) => l.tier === req.query.tier);
  if (req.query.categoria) filtered = filtered.filter((l) => l.categoria === req.query.categoria);
  if (req.query.hasEmail === "true") filtered = filtered.filter((l) => l.email);

  const limit = parseInt(req.query.limit) || 500;
  res.json({
    total: filtered.length,
    leads: filtered.slice(0, limit),
  });
});

/**
 * GET /webhook/stats
 * Make.com obtém estatísticas para enviar por email/Slack.
 */
app.get("/webhook/stats", authWebhook, async (req, res) => {
  const leads = await readJSON(CACHE_FILE, []);
  const emailLog = await readJSON(EMAIL_LOG, { sentToday: 0, sent: [] });

  const stats = {
    leads: {
      total: leads.length,
      comTelefone: leads.filter((l) => l.telefone).length,
      comEmail: leads.filter((l) => l.email).length,
      quentes: leads.filter((l) => l.tier === "quente").length,
      medios: leads.filter((l) => l.tier === "médio").length,
      frios: leads.filter((l) => l.tier === "frio").length,
    },
    emails: {
      enviadosHoje: emailLog.sentToday,
      limiteHoje: 300,
      totalEnviados: emailLog.sent?.length || 0,
    },
    timestamp: new Date().toISOString(),
  };

  res.json(stats);
});

/**
 * POST /webhook/apify/callback
 * Apify notifica quando o actor termina (webhook de actor run).
 * Configura em: Apify Console → Actor → Webhooks → POST para este URL
 */
app.post("/webhook/apify/callback", async (req, res) => {
  const { eventType, resource } = req.body;
  logger.info(`Apify callback: ${eventType} | run: ${resource?.id}`);

  if (eventType === "ACTOR.RUN.SUCCEEDED") {
    logger.success(`Apify run concluído: ${resource?.id}. A enriquecer e enviar emails...`);
    // Trigger enrichment + email para os novos leads
    runPipeline({ useCache: false, skipEmail: false })
      .then(({ stats }) => logger.success(`Auto-pipeline pós-Apify: ${stats.total} leads`))
      .catch((err) => logger.error(`Auto-pipeline falhou: ${err.message}`));
  }

  res.json({ received: true });
});

// ═══════════════════════════════════════════════════════════════════════════════
// API DO DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════

app.get("/api/leads", async (req, res) => {
  const leads = await readJSON(CACHE_FILE, []);
  const { categoria, tier, search } = req.query;

  let filtered = leads;
  if (categoria) filtered = filtered.filter((l) => l.categoria === categoria);
  if (tier) filtered = filtered.filter((l) => l.tier === tier);
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(
      (l) =>
        l.nome.toLowerCase().includes(s) ||
        (l.email || "").toLowerCase().includes(s) ||
        (l.telefone || "").includes(s)
    );
  }

  res.json({ total: filtered.length, leads: filtered });
});

app.get("/api/stats", async (req, res) => {
  const leads = await readJSON(CACHE_FILE, []);
  const emailLog = await readJSON(EMAIL_LOG, { sentToday: 0, sent: [] });

  const stats = {
    total: leads.length,
    comTelefone: leads.filter((l) => l.telefone).length,
    comEmail: leads.filter((l) => l.email).length,
    quentes: leads.filter((l) => l.tier === "quente").length,
    medios: leads.filter((l) => l.tier === "médio").length,
    frios: leads.filter((l) => l.tier === "frio").length,
    emailsHoje: emailLog.sentToday || 0,
    porCategoria: {},
  };

  const cats = [...new Set(leads.map((l) => l.categoria))];
  for (const cat of cats) {
    stats.porCategoria[cat] = leads.filter((l) => l.categoria === cat).length;
  }

  res.json(stats);
});

app.get("/api/email-log", async (req, res) => {
  const log = await readJSON(EMAIL_LOG, { sentToday: 0, sent: [] });
  res.json(log);
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    version: "2.0.0",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    webhookSecret: WEBHOOK_SECRET,
    endpoints: {
      startPipeline: `POST /webhook/pipeline/start`,
      checkStatus: `GET /webhook/pipeline/status/:jobId`,
      sendEmails: `POST /webhook/email/send`,
      getLeads: `GET /webhook/leads`,
      getStats: `GET /webhook/stats`,
      apifyCallback: `POST /webhook/apify/callback`,
    },
  });
});

// ─── INICIAR ─────────────────────────────────────────────────────────────────
await fs.mkdir(path.join(__dirname, "output/data"), { recursive: true });

app.listen(PORT, () => {
  logger.section("⚡ VIALLUX SERVER ONLINE");
  logger.success(`Dashboard: http://localhost:${PORT}`);
  logger.success(`Health:    http://localhost:${PORT}/api/health`);
  logger.info(`Webhook secret: ${WEBHOOK_SECRET}`);
  logger.info(`Make.com → POST http://SEU-IP:${PORT}/webhook/pipeline/start`);
  logger.info(`           Header: x-webhook-secret: ${WEBHOOK_SECRET}`);
});
