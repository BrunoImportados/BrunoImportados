import axios from "axios";
import { SEGMENTS } from "../config/settings.js";
import { logger } from "../config/logger.js";

const APIFY_BASE = "https://api.apify.com/v2";
const ACTOR_ID = "compass~crawler-google-places"; // Google Maps Scraper oficial Apify

function getApiKey() {
  const key = process.env.APIFY_API_KEY;
  if (!key) throw new Error("APIFY_API_KEY não definido no .env");
  return key;
}

function buildActorInput(queries) {
  return {
    searchStringsArray: queries,
    locationQuery: "Lisboa, Portugal",
    maxCrawledPlacesPerSearch: 40,
    language: "pt",
    exportPlaceUrls: false,
    includeHistogram: false,
    includeOpeningHours: false,
    includePeopleAlsoSearch: false,
    maxImages: 0,
    maxReviews: 0,
    additionalInfo: false,
    scrapeDirectories: false,
    deeperCityScrape: false,
    forceEvenDistribution: false,
  };
}

async function startRun(input) {
  const key = getApiKey();
  const res = await axios.post(
    `${APIFY_BASE}/acts/${ACTOR_ID}/runs?token=${key}`,
    input,
    { headers: { "Content-Type": "application/json" } }
  );
  return res.data.data.id;
}

async function waitForRun(runId, pollInterval = 8000, maxWait = 300000) {
  const key = getApiKey();
  const start = Date.now();

  while (Date.now() - start < maxWait) {
    const res = await axios.get(
      `${APIFY_BASE}/actor-runs/${runId}?token=${key}`
    );
    const status = res.data.data.status;
    logger.info(`Apify run ${runId}: ${status}`);

    if (status === "SUCCEEDED") return res.data.data.defaultDatasetId;
    if (status === "FAILED" || status === "ABORTED") {
      throw new Error(`Apify run falhou com status: ${status}`);
    }

    await new Promise((r) => setTimeout(r, pollInterval));
  }
  throw new Error("Apify run timeout após 5 minutos");
}

async function fetchDataset(datasetId) {
  const key = getApiKey();
  const res = await axios.get(
    `${APIFY_BASE}/datasets/${datasetId}/items?token=${key}&format=json&clean=true`
  );
  return res.data;
}

function mapApifyToLead(item, segmentLabel) {
  const phone =
    item.phone ||
    item.phoneUnformatted ||
    (item.additionalPhones && item.additionalPhones[0]) ||
    "";

  const website = item.website || item.url || "";
  const cleanWebsite = website && !website.includes("google.com") ? website : "";

  return {
    nome: item.title || item.name || "",
    categoria: segmentLabel,
    telefone: phone.replace(/\s/g, "").trim(),
    website: cleanWebsite,
    morada: item.address || item.street || "",
    avaliacao: item.totalScore ? String(item.totalScore) : "",
    email: "",
    score: 0,
    tier: "",
    prioridade: 0,
    fonte: "Apify Google Maps",
    apifyPlaceId: item.placeId || "",
    dataCaptura: new Date().toISOString().split("T")[0],
  };
}

export async function scrapeSegmentApify(segment) {
  logger.section(`APIFY: ${segment.label}`);

  const input = buildActorInput(segment.queries);

  logger.info("A iniciar Apify actor...");
  const runId = await startRun(input);
  logger.info(`Run ID: ${runId} — a aguardar conclusão...`);

  const datasetId = await waitForRun(runId);
  logger.info(`A descarregar dataset ${datasetId}...`);

  const items = await fetchDataset(datasetId);
  logger.info(`${items.length} resultados brutos recebidos`);

  const leads = items
    .map((item) => mapApifyToLead(item, segment.label))
    .filter((l) => l.nome);

  // Remover duplicados pelo nome
  const unique = [];
  const seen = new Set();
  for (const lead of leads) {
    const key = lead.nome.toLowerCase().trim();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(lead);
    }
  }

  logger.success(`${segment.label}: ${unique.length} leads únicos capturados via Apify`);
  return unique;
}

export async function scrapeAllSegmentsApify(targetSegments = SEGMENTS) {
  const allLeads = [];

  for (const segment of targetSegments) {
    try {
      const leads = await scrapeSegmentApify(segment);
      allLeads.push(...leads);
    } catch (err) {
      logger.error(`Falha no segmento "${segment.label}": ${err.message}`);
    }
    // Pausa entre segmentos para não sobrecarregar
    await new Promise((r) => setTimeout(r, 3000));
  }

  logger.success(`APIFY TOTAL: ${allLeads.length} leads capturados`);
  return allLeads;
}
