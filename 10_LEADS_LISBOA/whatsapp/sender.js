import "dotenv/config";
import { logger } from "../config/logger.js";

const VIALLUX_TEMPLATES = {
  condominios: (nome) =>
    `Olá ${nome}! 👋\n\nSomos a *VIALLUX Instalações Elétricas*, especializados em manutenção elétrica para condomínios em Lisboa.\n\n✅ Certificados ERSE\n✅ Resposta em 2h\n✅ Orçamento gratuito\n\nPosso enviar mais informação? 🔌`,

  hoteis: (nome) =>
    `Olá ${nome}! 👋\n\nSomos a *VIALLUX Instalações Elétricas* — parceiros de manutenção elétrica para hotéis em Lisboa.\n\n⚡ Contratos de manutenção preventiva\n⚡ Urgências 24h\n⚡ Conformidade legal garantida\n\nGostaria de receber proposta? 🏨`,

  hostels: (nome) =>
    `Olá ${nome}! 👋\n\nSomos a *VIALLUX Instalações Elétricas* em Lisboa.\n\nTrabalhamos com hostels para:\n✔️ Manutenção elétrica regular\n✔️ Instalação de tomadas/iluminação\n✔️ Urgências rápidas\n\nInteressa receber orçamento gratuito? 🔌`,

  alojamento_local: (nome) =>
    `Olá ${nome}! 👋\n\nSomos a *VIALLUX Instalações Elétricas*, especializados em alojamento local em Lisboa.\n\n⚡ Certificados para check-in elétrico\n⚡ Instalação de fechaduras smart\n⚡ Manutenção rápida entre hóspedes\n\nPosso ajudar? 🏠`,
};

function getSegmentId(categoria) {
  if (categoria.toLowerCase().includes("condomínio")) return "condominios";
  if (categoria.toLowerCase().includes("hotel")) return "hoteis";
  if (categoria.toLowerCase().includes("hostel")) return "hostels";
  return "alojamento_local";
}

export function buildWhatsAppMessage(lead) {
  const segId = getSegmentId(lead.categoria);
  const template = VIALLUX_TEMPLATES[segId] || VIALLUX_TEMPLATES.alojamento_local;
  return template(lead.nome);
}

export async function sendWhatsAppTwilio(lead) {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM } = process.env;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    logger.warn("Twilio não configurado — a simular envio");
    const msg = buildWhatsAppMessage(lead);
    logger.info(`[SIMULAÇÃO] WhatsApp para ${lead.nome} (${lead.telefone}):\n${msg}`);
    return false;
  }

  if (!lead.telefone) {
    logger.warn(`${lead.nome} — sem telefone, a saltar`);
    return false;
  }

  // Normalizar número português
  let phone = lead.telefone.replace(/\s/g, "").replace(/^00/, "+");
  if (phone.startsWith("9") || phone.startsWith("2")) {
    phone = `+351${phone}`;
  }

  const message = buildWhatsAppMessage(lead);

  try {
    const credentials = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");
    const body = new URLSearchParams({
      From: TWILIO_WHATSAPP_FROM,
      To: `whatsapp:${phone}`,
      Body: message,
    });

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      }
    );

    const data = await response.json();

    if (data.sid) {
      logger.success(`WhatsApp enviado para ${lead.nome} (${phone})`);
      return true;
    } else {
      logger.error(`Falha no envio para ${lead.nome}: ${data.message}`);
      return false;
    }
  } catch (err) {
    logger.error(`Erro Twilio para ${lead.nome}: ${err.message}`);
    return false;
  }
}

export async function sendBatchWhatsApp(leads, options = {}) {
  const { onlyHot = true, maxPerRun = 20, delayMs = 3000 } = options;

  const targets = onlyHot ? leads.filter((l) => l.tier === "quente") : leads;
  const batch = targets.slice(0, maxPerRun);

  logger.section(`WHATSAPP — Envio em lote (${batch.length} leads)`);

  let sent = 0;
  let failed = 0;

  for (const lead of batch) {
    const ok = await sendWhatsAppTwilio(lead);
    if (ok) sent++;
    else failed++;

    if (batch.indexOf(lead) < batch.length - 1) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  logger.success(`Envio completo: ${sent} enviados | ${failed} falhados`);
  return { sent, failed };
}
