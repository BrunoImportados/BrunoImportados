import "dotenv/config";
import { scrapeAllSegments } from "./scraper/googleMaps.js";
import { enrichLeadEmails } from "./enrichment/emailFinder.js";
import { scoreAllLeads } from "./enrichment/scorer.js";
import { exportAll } from "./output/exporter.js";
import { SEGMENTS } from "./config/settings.js";
import { logger } from "./config/logger.js";
import { promises as fs } from "fs";

const CACHE_FILE = "./output/data/leads_cache.json";

async function saveCache(leads) {
  await fs.mkdir("./output/data", { recursive: true });
  await fs.writeFile(CACHE_FILE, JSON.stringify(leads, null, 2));
}

async function loadCache() {
  try {
    const data = await fs.readFile(CACHE_FILE, "utf8");
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function runPipeline(options = {}) {
  const { useCache = false, segmentIds = null, skipEnrichment = false } = options;

  logger.section("VIALLUX — PIPELINE DE LEADS LISBOA");
  const startTime = Date.now();

  // Selecionar segmentos
  const segments = segmentIds
    ? SEGMENTS.filter((s) => segmentIds.includes(s.id))
    : SEGMENTS;

  let leads = [];

  // FASE 1: Scraping (ou cache)
  if (useCache) {
    logger.info("A carregar leads do cache...");
    const cached = await loadCache();
    if (cached) {
      leads = cached;
      logger.success(`${leads.length} leads carregados do cache`);
    } else {
      logger.warn("Cache não encontrado — a executar scraping completo");
    }
  }

  if (leads.length === 0) {
    logger.section("FASE 1: SCRAPING GOOGLE MAPS");
    leads = await scrapeAllSegments(segments);
    await saveCache(leads);
    logger.success(`Fase 1 concluída: ${leads.length} leads brutos`);
  }

  // FASE 2: Enriquecimento de emails
  if (!skipEnrichment) {
    logger.section("FASE 2: ENRIQUECIMENTO DE EMAILS");
    leads = await enrichLeadEmails(leads);
  }

  // FASE 3: Scoring
  logger.section("FASE 3: CLASSIFICAÇÃO");
  leads = scoreAllLeads(leads);

  // FASE 4: Exportação
  logger.section("FASE 4: EXPORTAÇÃO");
  await exportAll(leads);

  // Relatório final
  const elapsed = Math.round((Date.now() - startTime) / 1000);
  const stats = {
    total: leads.length,
    comTelefone: leads.filter((l) => l.telefone).length,
    comEmail: leads.filter((l) => l.email).length,
    quentes: leads.filter((l) => l.tier === "quente").length,
    medios: leads.filter((l) => l.tier === "médio").length,
    frios: leads.filter((l) => l.tier === "frio").length,
    tempoExecucao: `${elapsed}s`,
  };

  logger.section("RELATÓRIO FINAL");
  logger.success(`Total de leads: ${stats.total}`);
  logger.success(`Com telefone: ${stats.comTelefone}`);
  logger.success(`Com email: ${stats.comEmail}`);
  logger.success(`Leads quentes 🔥: ${stats.quentes}`);
  logger.info(`Leads médios ⚡: ${stats.medios}`);
  logger.info(`Leads frios ❄️: ${stats.frios}`);
  logger.info(`Tempo de execução: ${stats.tempoExecucao}`);

  return { leads, stats };
}
