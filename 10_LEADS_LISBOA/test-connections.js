#!/usr/bin/env node
/**
 * Testa todas as conexões de API antes de arrancar o pipeline.
 * Executar: node test-connections.js
 */
import "dotenv/config";
import axios from "axios";
import { logger } from "./config/logger.js";

async function testApify() {
  const key = process.env.APIFY_API_KEY;
  if (!key) {
    logger.warn("APIFY_API_KEY — não configurado");
    return false;
  }
  try {
    const res = await axios.get(`https://api.apify.com/v2/users/me?token=${key}`);
    const user = res.data.data;
    logger.success(`Apify ✓ — utilizador: ${user.username} | créditos: $${user.monthlyUsage?.ACTOR_COMPUTE_UNITS?.toFixed(2) || "0"}`);
    return true;
  } catch (err) {
    logger.error(`Apify ✗ — ${err.response?.data?.error?.message || err.message}`);
    return false;
  }
}

async function testBrevo() {
  const key = process.env.BREVO_API_KEY;
  if (!key) {
    logger.warn("BREVO_API_KEY — não configurado");
    return false;
  }
  try {
    const res = await axios.get("https://api.brevo.com/v3/account", {
      headers: { "api-key": key, Accept: "application/json" },
    });
    const acc = res.data;
    const plan = acc.plan?.[0];
    logger.success(`Brevo ✓ — conta: ${acc.email} | plano: ${plan?.type || "free"}`);
    logger.info(`  Emails hoje: ${acc.plan?.[0]?.credits ?? "—"} créditos disponíveis`);
    return true;
  } catch (err) {
    logger.error(`Brevo ✗ — ${err.response?.data?.message || err.message}`);
    return false;
  }
}

async function testHunter() {
  const key = process.env.HUNTER_API_KEY;
  if (!key) {
    logger.warn("HUNTER_API_KEY — não configurado (opcional)");
    return null;
  }
  try {
    const res = await axios.get(`https://api.hunter.io/v2/account?api_key=${key}`);
    const acc = res.data.data;
    logger.success(`Hunter.io ✓ — conta: ${acc.email} | pesquisas restantes: ${acc.requests?.searches?.available}`);
    return true;
  } catch (err) {
    logger.error(`Hunter.io ✗ — ${err.response?.data?.errors?.[0]?.details || err.message}`);
    return false;
  }
}

async function main() {
  logger.section("VIALLUX — TESTE DE CONEXÕES");

  const results = await Promise.all([testApify(), testBrevo(), testHunter()]);

  logger.section("RESUMO");

  const required = results.slice(0, 2);
  const allRequired = required.every(Boolean);

  if (allRequired) {
    logger.success("Sistema pronto para executar! 🚀");
    logger.info("Próximo passo: npm run pipeline");
  } else {
    logger.error("Faltam configurações obrigatórias.");
    logger.info("Edita o ficheiro .env com as tuas chaves API:");
    logger.info("  APIFY_API_KEY=...");
    logger.info("  BREVO_API_KEY=...");
    logger.info("  BREVO_SENDER_EMAIL=...");
    process.exit(1);
  }
}

main().catch((err) => {
  logger.error(err.message);
  process.exit(1);
});
