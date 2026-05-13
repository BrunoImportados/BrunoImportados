import axios from "axios";
import { logger } from "../config/logger.js";
import { promises as fs } from "fs";
import path from "path";

const BREVO_API = "https://api.brevo.com/v3";
const DAILY_LIMIT = 300;
const SEND_DELAY_MS = 1200;
const LOG_FILE = "./output/data/email_log.json";

const PHONE = "912 273 834";
const DOMAIN = "vialluxinstalacoes.com";
const CONTACT_EMAIL = `geral@${DOMAIN}`;
const WEBSITE = `https://www.${DOMAIN}`;

function getApiKey() {
  const key = process.env.BREVO_API_KEY;
  if (!key) throw new Error("BREVO_API_KEY não definido no .env");
  return key;
}

const SENDER = {
  name: process.env.BREVO_SENDER_NAME || "VIALLUX Instalações Elétricas",
  email: process.env.BREVO_SENDER_EMAIL || CONTACT_EMAIL,
};

// ─── Rodapé comum a todos os emails ──────────────────────────────────────────
function footer() {
  return `
  <div style="background: #1F4E79; padding: 20px 28px; text-align: center; border-top: 3px solid #FFD700;">
    <p style="color: #fff; margin: 0 0 10px; font-size: 14px; font-weight: bold;">⚡ VIALLUX Instalações Elétricas</p>
    <table style="margin: 0 auto; border-collapse: collapse;">
      <tr>
        <td style="padding: 4px 12px; color: #cce; font-size: 13px;">
          📞 <a href="tel:+351912273834" style="color: #FFD700; text-decoration: none; font-weight: bold;">${PHONE}</a>
        </td>
        <td style="padding: 4px 12px; color: #cce; font-size: 13px;">
          ✉️ <a href="mailto:${CONTACT_EMAIL}" style="color: #FFD700; text-decoration: none;">${CONTACT_EMAIL}</a>
        </td>
        <td style="padding: 4px 12px; color: #cce; font-size: 13px;">
          🌐 <a href="${WEBSITE}" style="color: #FFD700; text-decoration: none;">${DOMAIN}</a>
        </td>
      </tr>
    </table>
  </div>
  <div style="background: #f5f5f5; padding: 12px 28px; font-size: 11px; color: #aaa; text-align: center;">
    VIALLUX Instalações Elétricas Lda · Lisboa, Portugal<br/>
    <a href="{{unsubscribeUrl}}" style="color: #bbb;">Cancelar subscrição</a>
  </div>`;
}

// ─── Header comum ─────────────────────────────────────────────────────────────
function header() {
  return `
  <div style="background: #1F4E79; padding: 24px; text-align: center;">
    <h1 style="color: #FFD700; margin: 0; font-size: 24px; letter-spacing: 1px;">⚡ VIALLUX</h1>
    <p style="color: #cce; margin: 6px 0 0; font-size: 13px;">Instalações Elétricas · Lisboa</p>
  </div>`;
}

// ─── CTA button ───────────────────────────────────────────────────────────────
function cta(label) {
  return `
  <div style="text-align: center; margin: 32px 0;">
    <a href="tel:+351912273834"
       style="background: #FFD700; color: #1a1a1a; padding: 14px 28px; text-decoration: none;
              border-radius: 6px; font-weight: bold; font-size: 15px; margin-right: 10px;">
      📞 ${PHONE}
    </a>
    <a href="mailto:${CONTACT_EMAIL}"
       style="background: #1F4E79; color: #fff; padding: 14px 28px; text-decoration: none;
              border-radius: 6px; font-weight: bold; font-size: 15px;">
      📩 ${label}
    </a>
  </div>`;
}

// ─── Templates por segmento ───────────────────────────────────────────────────
const EMAIL_TEMPLATES = {
  "Gestão de Condomínios": {
    subject: "Parceria Elétrica para Condomínios em Lisboa — VIALLUX",
    html: (nome) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a; border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden;">
  ${header()}
  <div style="padding: 32px 28px;">
    <p style="font-size: 16px; margin-top: 0;">Olá <strong>${nome}</strong>,</p>
    <p>A <strong>VIALLUX Instalações Elétricas</strong> é especializada em serviços elétricos para condomínios em Lisboa — desde manutenção preventiva a intervenções urgentes.</p>
    <p><strong>O que garantimos ao seu condomínio:</strong></p>
    <ul style="padding-left: 20px; line-height: 2.2;">
      <li>✅ Manutenção preventiva das zonas comuns, elevadores e garagem</li>
      <li>✅ Inspeções ERSE e certificações obrigatórias</li>
      <li>✅ Resposta a urgências em menos de 2 horas</li>
      <li>✅ Instalação de carregadores EV nos lugares de garagem</li>
      <li>✅ Relatórios mensais de manutenção</li>
    </ul>
    <p>Envio proposta personalizada em 24h — sem compromisso.</p>
    ${cta("Solicitar Proposta")}
  </div>
  ${footer()}
</div>`,
  },

  "Hotéis": {
    subject: "Manutenção Elétrica para Hotéis em Lisboa — VIALLUX",
    html: (nome) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a; border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden;">
  ${header()}
  <div style="padding: 32px 28px;">
    <p style="font-size: 16px; margin-top: 0;">Olá <strong>${nome}</strong>,</p>
    <p>A <strong>VIALLUX Instalações Elétricas</strong> trabalha com hotéis em Lisboa para garantir segurança elétrica total e continuidade operacional — porque uma avaria elétrica não pode esperar.</p>
    <p><strong>Serviços para o seu hotel:</strong></p>
    <ul style="padding-left: 20px; line-height: 2.2;">
      <li>⚡ Contratos anuais de manutenção preventiva e corretiva</li>
      <li>⚡ Urgências 24h — respondemos antes de o hóspede reclamar</li>
      <li>⚡ Conformidade legal: ERSE, RTIEBT, certificação anual</li>
      <li>⚡ Instalação de carregadores elétricos (EV) no parking</li>
      <li>⚡ Relatório mensal de intervenções</li>
    </ul>
    <p>Podemos enviar proposta em 24h ou agendar visita técnica gratuita.</p>
    ${cta("Pedir Proposta Gratuita")}
  </div>
  ${footer()}
</div>`,
  },

  "Hostels": {
    subject: "Serviços Elétricos para Hostels em Lisboa — VIALLUX",
    html: (nome) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a; border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden;">
  ${header()}
  <div style="padding: 32px 28px;">
    <p style="font-size: 16px; margin-top: 0;">Olá <strong>${nome}</strong>,</p>
    <p>A <strong>VIALLUX Instalações Elétricas</strong> tem experiência em instalações para hostels e alojamento partilhado em Lisboa — sabemos que uma tomada avariada pode gerar reclamações imediatas.</p>
    <p><strong>O que fazemos para o seu hostel:</strong></p>
    <ul style="padding-left: 20px; line-height: 2.2;">
      <li>🔌 Instalação de tomadas e carregadores USB em quartos coletivos</li>
      <li>🔌 Iluminação eficiente (LED + sensores de presença)</li>
      <li>🔌 Quadros elétricos e proteções diferenciadas</li>
      <li>🔌 Urgências rápidas entre check-ins</li>
      <li>🔌 Orçamento gratuito e sem compromisso</li>
    </ul>
    ${cta("Contactar Agora")}
  </div>
  ${footer()}
</div>`,
  },

  "Alojamento Local": {
    subject: "Instalações Elétricas para Alojamento Local — VIALLUX Lisboa",
    html: (nome) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a; border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden;">
  ${header()}
  <div style="padding: 32px 28px;">
    <p style="font-size: 16px; margin-top: 0;">Olá <strong>${nome}</strong>,</p>
    <p>A <strong>VIALLUX Instalações Elétricas</strong> apoia proprietários de alojamento local em Lisboa com serviços certificados e resposta rápida — para que nenhuma avaria interrompa a experiência do seu hóspede.</p>
    <p><strong>Serviços mais pedidos:</strong></p>
    <ul style="padding-left: 20px; line-height: 2.2;">
      <li>🏠 Certificado de inspeção elétrica (obrigatório ERSE para AL)</li>
      <li>🏠 Instalação de fechaduras smart e intercomunicadores</li>
      <li>🏠 Atualização e proteção do quadro elétrico</li>
      <li>🏠 Urgências entre check-out e check-in</li>
      <li>🏠 Orçamento enviado em 2 horas</li>
    </ul>
    ${cta("Orçamento em 2 Horas")}
  </div>
  ${footer()}
</div>`,
  },
};

function getTemplate(categoria) {
  return EMAIL_TEMPLATES[categoria] || EMAIL_TEMPLATES["Alojamento Local"];
}

// ─── Deduplicação robusta ─────────────────────────────────────────────────────
// Bloqueia envio duplicado por: email OU nome normalizado da empresa
function normalizeCompanyName(nome) {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remover acentos
    .replace(/[^a-z0-9]/g, "")       // só letras e números
    .trim();
}

async function loadLog() {
  try {
    const data = await fs.readFile(LOG_FILE, "utf8");
    return JSON.parse(data);
  } catch {
    return { sentToday: 0, lastReset: null, sent: [] };
  }
}

async function saveLog(log) {
  await fs.mkdir(path.dirname(LOG_FILE), { recursive: true });
  await fs.writeFile(LOG_FILE, JSON.stringify(log, null, 2));
}

function resetIfNewDay(log) {
  const today = new Date().toISOString().split("T")[0];
  if (log.lastReset !== today) {
    log.sentToday = 0;
    log.lastReset = today;
  }
  return log;
}

// ─── API pública ──────────────────────────────────────────────────────────────

export async function sendBrevoEmail(lead) {
  const key = getApiKey();
  const template = getTemplate(lead.categoria);

  const payload = {
    sender: SENDER,
    to: [{ email: lead.email, name: lead.nome }],
    subject: template.subject,
    htmlContent: template.html(lead.nome),
    tags: ["viallux-leads", lead.categoria.toLowerCase().replace(/\s/g, "-")],
    headers: {
      "X-Mailin-custom": `empresa:${normalizeCompanyName(lead.nome)}`,
    },
  };

  const res = await axios.post(`${BREVO_API}/smtp/email`, payload, {
    headers: {
      "api-key": key,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  return res.data.messageId;
}

export async function sendDailyEmails(leads) {
  logger.section("BREVO — ENVIO DE EMAILS DIÁRIO");

  let log = await loadLog();
  log = resetIfNewDay(log);

  // Construir índice de já enviados (email + nome normalizado)
  const sentEmails = new Set(log.sent.map((s) => s.email.toLowerCase()));
  const sentCompanies = new Set(log.sent.map((s) => normalizeCompanyName(s.nome)));

  const remaining = DAILY_LIMIT - log.sentToday;

  if (remaining <= 0) {
    logger.warn(`Limite diário de ${DAILY_LIMIT} emails já atingido. Reinicia amanhã.`);
    return { sent: 0, skipped: leads.length, failed: 0 };
  }

  const targets = leads
    .filter((l) => {
      if (!l.email) return false;
      // Bloquear se email OU empresa já recebeu
      if (sentEmails.has(l.email.toLowerCase())) return false;
      if (sentCompanies.has(normalizeCompanyName(l.nome))) return false;
      return true;
    })
    .sort((a, b) => (a.prioridade || 3) - (b.prioridade || 3))
    .slice(0, remaining);

  const skipped = leads.length - targets.length;
  logger.info(`${targets.length} novos destinatários | ${skipped} ignorados (já contactados)`);

  let sent = 0;
  let failed = 0;

  for (const lead of targets) {
    try {
      const msgId = await sendBrevoEmail(lead);
      sent++;
      log.sentToday++;
      log.sent.push({
        email: lead.email,
        nome: lead.nome,
        nomeNormalizado: normalizeCompanyName(lead.nome),
        categoria: lead.categoria,
        messageId: msgId,
        dataEnvio: new Date().toISOString(),
      });

      logger.success(`[${sent}/${targets.length}] ✉️  ${lead.email} — ${lead.nome}`);
      await saveLog(log);
      await new Promise((r) => setTimeout(r, SEND_DELAY_MS));
    } catch (err) {
      failed++;
      const msg = err.response?.data?.message || err.message;
      logger.error(`Falha ${lead.email}: ${msg}`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  logger.success(`Envio concluído: ${sent} enviados | ${failed} falhados | ${skipped} ignorados`);
  logger.info(`Total enviado hoje: ${log.sentToday}/${DAILY_LIMIT}`);

  return { sent, failed, skipped };
}

export async function testBrevoConnection() {
  const key = getApiKey();
  try {
    const res = await axios.get(`${BREVO_API}/account`, {
      headers: { "api-key": key, Accept: "application/json" },
    });
    const acc = res.data;
    logger.success(`Brevo conectado: ${acc.email} | Plano: ${acc.plan?.[0]?.type || "free"}`);
    return true;
  } catch (err) {
    logger.error(`Brevo falhou: ${err.response?.data?.message || err.message}`);
    return false;
  }
}

export async function getBrevoStats() {
  const key = getApiKey();
  const today = new Date().toISOString().split("T")[0];
  try {
    const res = await axios.get(
      `${BREVO_API}/smtp/statistics/reports?startDate=${today}&endDate=${today}`,
      { headers: { "api-key": key, Accept: "application/json" } }
    );
    return res.data;
  } catch (err) {
    logger.error(`Stats Brevo: ${err.response?.data?.message || err.message}`);
    return null;
  }
}
