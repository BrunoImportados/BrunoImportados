/**
 * Envia 4 emails de teste (1 por segmento) para validar templates.
 * Executar: node test-email.js
 */
import "dotenv/config";
import axios from "axios";
import { logger } from "./config/logger.js";

const BREVO_API = "https://api.brevo.com/v3";
const TEST_TO = "Brunoimportados1995@gmail.com";
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
  name: "VIALLUX Instalações Elétricas",
  email: process.env.BREVO_SENDER_EMAIL || CONTACT_EMAIL,
};

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
    <a href="#" style="color: #bbb;">Cancelar subscrição</a>
  </div>`;
}

function header() {
  return `
  <div style="background: #1F4E79; padding: 24px; text-align: center;">
    <h1 style="color: #FFD700; margin: 0; font-size: 24px; letter-spacing: 1px;">⚡ VIALLUX</h1>
    <p style="color: #cce; margin: 6px 0 0; font-size: 13px;">Instalações Elétricas · Lisboa</p>
  </div>`;
}

function cta(label) {
  return `
  <div style="text-align: center; margin: 32px 0;">
    <a href="tel:+351912273834"
       style="background: #FFD700; color: #1a1a1a; padding: 14px 28px; text-decoration: none;
              border-radius: 6px; font-weight: bold; font-size: 15px; margin-right: 10px; display: inline-block; margin-bottom: 8px;">
      📞 ${PHONE}
    </a>
    <a href="mailto:${CONTACT_EMAIL}"
       style="background: #1F4E79; color: #fff; padding: 14px 28px; text-decoration: none;
              border-radius: 6px; font-weight: bold; font-size: 15px; display: inline-block; margin-bottom: 8px;">
      📩 ${label}
    </a>
  </div>`;
}

const TEMPLATES = [
  {
    segmento: "Gestão de Condomínios",
    subject: "[TESTE] Parceria Elétrica para Condomínios em Lisboa — VIALLUX",
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
  {
    segmento: "Hotéis",
    subject: "[TESTE] Manutenção Elétrica para Hotéis em Lisboa — VIALLUX",
    html: (nome) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a; border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden;">
  ${header()}
  <div style="padding: 32px 28px;">
    <p style="font-size: 16px; margin-top: 0;">Olá <strong>${nome}</strong>,</p>
    <p>A <strong>VIALLUX Instalações Elétricas</strong> trabalha com hotéis em Lisboa para garantir segurança elétrica total e continuidade operacional.</p>
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
  {
    segmento: "Hostels",
    subject: "[TESTE] Serviços Elétricos para Hostels em Lisboa — VIALLUX",
    html: (nome) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a; border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden;">
  ${header()}
  <div style="padding: 32px 28px;">
    <p style="font-size: 16px; margin-top: 0;">Olá <strong>${nome}</strong>,</p>
    <p>A <strong>VIALLUX Instalações Elétricas</strong> tem experiência em instalações para hostels e alojamento partilhado em Lisboa.</p>
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
  {
    segmento: "Alojamento Local",
    subject: "[TESTE] Instalações Elétricas para Alojamento Local — VIALLUX Lisboa",
    html: (nome) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a; border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden;">
  ${header()}
  <div style="padding: 32px 28px;">
    <p style="font-size: 16px; margin-top: 0;">Olá <strong>${nome}</strong>,</p>
    <p>A <strong>VIALLUX Instalações Elétricas</strong> apoia proprietários de alojamento local em Lisboa com serviços certificados e resposta rápida.</p>
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
];

async function sendTestEmail(template) {
  const key = getApiKey();

  const payload = {
    sender: SENDER,
    to: [{ email: TEST_TO, name: "Bruno (Teste VIALLUX)" }],
    subject: template.subject,
    htmlContent: template.html("Empresa Exemplo Lda"),
    tags: ["viallux-teste"],
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

async function main() {
  logger.section("VIALLUX — ENVIO DE EMAILS DE TESTE");
  logger.info(`Destinatário: ${TEST_TO}`);
  logger.info(`Remetente: ${SENDER.email}`);
  logger.info(`A enviar ${TEMPLATES.length} templates (1 por segmento)...`);

  let ok = 0;
  for (const template of TEMPLATES) {
    try {
      const msgId = await sendTestEmail(template);
      logger.success(`✅ ${template.segmento} — enviado (ID: ${msgId})`);
      ok++;
      await new Promise((r) => setTimeout(r, 1500));
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      logger.error(`❌ ${template.segmento} — FALHOU: ${msg}`);
      if (err.response?.data) {
        console.error("Detalhe:", JSON.stringify(err.response.data, null, 2));
      }
    }
  }

  logger.section(`RESULTADO: ${ok}/${TEMPLATES.length} emails enviados`);
  if (ok === TEMPLATES.length) {
    logger.success(`Verifica a caixa de entrada de ${TEST_TO}`);
    logger.info("(Verifica também o spam caso não apareça na inbox)");
  }
}

main().catch((err) => {
  logger.error(err.message);
  process.exit(1);
});
