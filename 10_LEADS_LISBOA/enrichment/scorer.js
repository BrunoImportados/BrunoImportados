import { SCORE_WEIGHTS, SCORE_TIERS } from "../config/settings.js";
import { logger } from "../config/logger.js";

const LARGE_COMPANY_KEYWORDS = [
  "hotel", "hostel", "grupo", "group", "condomínios", "gestão", "management",
  "resorts", "suites", "towers", "palace", "grand", "international",
];

function isLargeCompany(lead) {
  const nameLower = lead.nome.toLowerCase();
  return LARGE_COMPANY_KEYWORDS.some((k) => nameLower.includes(k));
}

export function scoreLead(lead) {
  let score = 0;

  if (lead.website) score += SCORE_WEIGHTS.hasWebsite;
  if (lead.email) score += SCORE_WEIGHTS.hasEmail;
  if (lead.telefone) score += SCORE_WEIGHTS.hasPhone;
  if (isLargeCompany(lead)) score += SCORE_WEIGHTS.isLargeCompany;
  if (lead.avaliacao && parseFloat(lead.avaliacao) >= 4.0) score += SCORE_WEIGHTS.hasHighRating;

  let tier = "frio";
  let prioridade = 3;

  if (score >= SCORE_TIERS.hot) {
    tier = "quente";
    prioridade = 1;
  } else if (score >= SCORE_TIERS.medium) {
    tier = "médio";
    prioridade = 2;
  }

  return { ...lead, score, tier, prioridade };
}

export function scoreAllLeads(leads) {
  logger.section("CLASSIFICAÇÃO DE LEADS");

  const scored = leads.map(scoreLead);

  // Ordenar: quentes primeiro, depois médios, depois frios
  scored.sort((a, b) => b.score - a.score);

  const quentes = scored.filter((l) => l.tier === "quente").length;
  const medios = scored.filter((l) => l.tier === "médio").length;
  const frios = scored.filter((l) => l.tier === "frio").length;

  logger.success(`Leads quentes: ${quentes} 🔥`);
  logger.info(`Leads médios: ${medios} ⚡`);
  logger.info(`Leads frios: ${frios} ❄️`);

  return scored;
}
