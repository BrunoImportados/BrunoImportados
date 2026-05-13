import axios from "axios";
import { logger } from "../config/logger.js";
import { promises as fs } from "fs";
import path from "path";

const BREVO_API = "https://api.brevo.com/v3";
const DAILY_LIMIT = 300;
const SEND_DELAY_MS = 1200; // ~300 emails em 6 minutos
const LOG_FILE = "./output/data/email_log.json";

function getApiKey() {
  const key = process.env.BREVO_API_KEY;
  if (!key) throw new Error("BREVO_API_KEY não definido no .env");
  return key;
}

const SENDER = {
  name: process.env.BREVO_SENDER_NAME || "VIALLUX Instalações Elétricas",
  email: process.env.BREVO_SENDER_EMAIL || "geral@viallux.pt",
};

// Templates por segmento
const EMAIL_TEMPLATES = {
  "Gestão de Condomínios": {
    subject: "Parceria Elétrica para Condomínios — VIALLUX Lisboa",
    html: (nome) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
  <div style="background: #1F4E79; padding: 24px; text-align: center;">
    <h1 style="color: #FFD700; margin: 0; font-size: 22px;">⚡ VIALLUX</h1>
    <p style="color: #cce; margin: 6px 0 0; font-size: 13px;">Instalações Elétricas Lisboa</p>
  </div>
  <div style="padding: 32px 28px;">
    <p style="font-size: 16px;">Olá <strong>${nome}</strong>,</p>
    <p>A <strong>VIALLUX Instalações Elétricas</strong> é uma empresa especializada em serviços elétricos para condomínios em Lisboa.</p>
    <p>Oferecemos:</p>
    <ul style="padding-left: 20px; line-height: 2;">
      <li>✅ <strong>Contratos de manutenção preventiva</strong> (zonas comuns, elevadores, garagem)</li>
      <li>✅ <strong>Inspeções ERSE e certificações obrigatórias</strong></li>
      <li>✅ <strong>Urgências 24h</strong> com resposta garantida</li>
      <li>✅ <strong>Instalação de carregadores EV</strong> nos lugares de garagem</li>
    </ul>
    <p>Estamos disponíveis para uma reunião rápida ou envio de proposta sem compromisso.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="mailto:${SENDER.email}" style="background: #FFD700; color: #1a1a1a; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px;">📩 Solicitar Proposta</a>
    </div>
    <p style="font-size: 13px; color: #666;">Pode contactar-nos também pelo <strong>WhatsApp</strong> ou ligar diretamente.</p>
  </div>
  <div style="background: #f5f5f5; padding: 16px 28px; font-size: 12px; color: #999; text-align: center;">
    VIALLUX Instalações Elétricas Lda · Lisboa, Portugal<br/>
    <a href="mailto:${SENDER.email}" style="color: #999;">${SENDER.email}</a><br/><br/>
    <a href="{{unsubscribeUrl}}" style="color: #bbb;">Cancelar subscrição</a>
  </div>
</div>`,
  },

  Hotéis: {
    subject: "Manutenção Elétrica para Hotéis — VIALLUX Lisboa",
    html: (nome) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
  <div style="background: #1F4E79; padding: 24px; text-align: center;">
    <h1 style="color: #FFD700; margin: 0; font-size: 22px;">⚡ VIALLUX</h1>
    <p style="color: #cce; margin: 6px 0 0; font-size: 13px;">Instalações Elétricas Lisboa</p>
  </div>
  <div style="padding: 32px 28px;">
    <p style="font-size: 16px;">Olá <strong>${nome}</strong>,</p>
    <p>A <strong>VIALLUX Instalações Elétricas</strong> trabalha com hotéis em Lisboa para garantir segurança elétrica e continuidade operacional.</p>
    <p>Serviços para o seu hotel:</p>
    <ul style="padding-left: 20px; line-height: 2;">
      <li>⚡ <strong>Contratos anuais de manutenção</strong> com relatório mensal</li>
      <li>⚡ <strong>Urgências 24h</strong> — respondemos antes da reclamação do hóspede</li>
      <li>⚡ <strong>Conformidade legal</strong> — ERSE, RTIEBT, certificação</li>
      <li>⚡ <strong>Instalação de carregadores EV</strong> no parking</li>
    </ul>
    <p>Enviamos proposta personalizada em 24h.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="mailto:${SENDER.email}" style="background: #FFD700; color: #1a1a1a; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px;">📩 Pedir Proposta Gratuita</a>
    </div>
  </div>
  <div style="background: #f5f5f5; padding: 16px 28px; font-size: 12px; color: #999; text-align: center;">
    VIALLUX Instalações Elétricas Lda · Lisboa, Portugal<br/>
    <a href="mailto:${SENDER.email}" style="color: #999;">${SENDER.email}</a><br/><br/>
    <a href="{{unsubscribeUrl}}" style="color: #bbb;">Cancelar subscrição</a>
  </div>
</div>`,
  },

  Hostels: {
    subject: "Serviços Elétricos para Hostels — VIALLUX Lisboa",
    html: (nome) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
  <div style="background: #1F4E79; padding: 24px; text-align: center;">
    <h1 style="color: #FFD700; margin: 0; font-size: 22px;">⚡ VIALLUX</h1>
    <p style="color: #cce; margin: 6px 0 0; font-size: 13px;">Instalações Elétricas Lisboa</p>
  </div>
  <div style="padding: 32px 28px;">
    <p style="font-size: 16px;">Olá <strong>${nome}</strong>,</p>
    <p>A <strong>VIALLUX Instalações Elétricas</strong> tem experiência em instalações para hostels e alojamento partilhado em Lisboa.</p>
    <p>O que fazemos:</p>
    <ul style="padding-left: 20px; line-height: 2;">
      <li>🔌 Tomadas e carregadores USB em quartos coletivos</li>
      <li>🔌 Iluminação eficiente (LED + sensores)</li>
      <li>🔌 Quadros elétricos e fusíveis</li>
      <li>🔌 Urgências rápidas sem espera</li>
    </ul>
    <p>Orçamento gratuito e sem compromisso.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="mailto:${SENDER.email}" style="background: #FFD700; color: #1a1a1a; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px;">📩 Contactar Agora</a>
    </div>
  </div>
  <div style="background: #f5f5f5; padding: 16px 28px; font-size: 12px; color: #999; text-align: center;">
    VIALLUX Instalações Elétricas Lda · Lisboa, Portugal<br/>
    <a href="mailto:${SENDER.email}" style="color: #999;">${SENDER.email}</a><br/><br/>
    <a href="{{unsubscribeUrl}}" style="color: #bbb;">Cancelar subscrição</a>
  </div>
</div>`,
  },

  "Alojamento Local": {
    subject: "Instalações Elétricas para Alojamento Local — VIALLUX Lisboa",
    html: (nome) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
  <div style="background: #1F4E79; padding: 24px; text-align: center;">
    <h1 style="color: #FFD700; margin: 0; font-size: 22px;">⚡ VIALLUX</h1>
    <p style="color: #cce; margin: 6px 0 0; font-size: 13px;">Instalações Elétricas Lisboa</p>
  </div>
  <div style="padding: 32px 28px;">
    <p style="font-size: 16px;">Olá <strong>${nome}</strong>,</p>
    <p>A <strong>VIALLUX Instalações Elétricas</strong> apoia proprietários de alojamento local em Lisboa com serviços rápidos e certificados.</p>
    <p>Serviços mais pedidos:</p>
    <ul style="padding-left: 20px; line-height: 2;">
      <li>🏠 Certificado de inspeção elétrica (obrigatório ERSE)</li>
      <li>🏠 Instalação de fechaduras smart e intercomunicadores</li>
      <li>🏠 Quadro elétrico — atualização e proteção</li>
      <li>🏠 Urgências entre check-in e check-out</li>
    </ul>
    <p>Enviamos orçamento em 2 horas.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="mailto:${SENDER.email}" style="background: #FFD700; color: #1a1a1a; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px;">📩 Orçamento Rápido</a>
    </div>
  </div>
  <div style="background: #f5f5f5; padding: 16px 28px; font-size: 12px; color: #999; text-align: center;">
    VIALLUX Instalações Elétricas Lda · Lisboa, Portugal<br/>
    <a href="mailto:${SENDER.email}" style="color: #999;">${SENDER.email}</a><br/><br/>
    <a href="{{unsubscribeUrl}}" style="color: #bbb;">Cancelar subscrição</a>
  </div>
</div>`,
  },
};

function getTemplate(categoria) {
  return (
    EMAIL_TEMPLATES[categoria] ||
    EMAIL_TEMPLATES["Alojamento Local"]
  );
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
      "X-Mailin-custom": `lead-id:${lead.nome.replace(/\s/g, "-").toLowerCase()}`,
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

  const alreadySent = new Set(log.sent.map((s) => s.email));
  const remaining = DAILY_LIMIT - log.sentToday;

  if (remaining <= 0) {
    logger.warn(`Limite diário de ${DAILY_LIMIT} emails já atingido. Reinicia amanhã.`);
    return { sent: 0, skipped: leads.length, failed: 0 };
  }

  // Filtrar: com email, não enviado ainda, ordenar por prioridade
  const targets = leads
    .filter((l) => l.email && !alreadySent.has(l.email))
    .sort((a, b) => (a.prioridade || 3) - (b.prioridade || 3))
    .slice(0, remaining);

  logger.info(`${targets.length} emails a enviar hoje (limite restante: ${remaining})`);

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
        categoria: lead.categoria,
        messageId: msgId,
        dataEnvio: new Date().toISOString(),
      });

      logger.success(`[${sent}/${targets.length}] ✉️  ${lead.email} (${lead.nome})`);
      await saveLog(log);
      await new Promise((r) => setTimeout(r, SEND_DELAY_MS));
    } catch (err) {
      failed++;
      const msg = err.response?.data?.message || err.message;
      logger.error(`Falha ${lead.email}: ${msg}`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  logger.success(`Envio diário completo: ${sent} enviados | ${failed} falhados`);
  logger.info(`Total enviado hoje: ${log.sentToday}/${DAILY_LIMIT}`);

  return { sent, failed, skipped: leads.length - targets.length };
}

export async function testBrevoConnection() {
  const key = getApiKey();
  try {
    const res = await axios.get(`${BREVO_API}/account`, {
      headers: { "api-key": key, Accept: "application/json" },
    });
    const acc = res.data;
    logger.success(`Brevo conectado: ${acc.email} | Plano: ${acc.plan?.[0]?.type || "free"}`);
    logger.info(`Emails restantes hoje: ${acc.plan?.[0]?.creditsType === "sendLimit" ? acc.plan[0].credits : "ilimitado"}`);
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
