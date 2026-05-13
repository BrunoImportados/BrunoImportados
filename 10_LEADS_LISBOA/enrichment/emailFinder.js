import puppeteer from "puppeteer";
import axios from "axios";
import * as cheerio from "cheerio";
import { EMAIL_PRIORITIES, SCRAPER } from "../config/settings.js";
import { logger } from "../config/logger.js";

const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
const IGNORE_DOMAINS = ["sentry.io", "example.com", "wixpress.com", "google.com", "facebook.com"];
const CONTACT_PATHS = ["/contacto", "/contactos", "/contact", "/contacts", "/sobre", "/about", "/quem-somos"];

function cleanEmail(email) {
  return email.toLowerCase().trim().replace(/[,;>]+$/, "");
}

function isValidEmail(email, domain) {
  if (!email.includes("@")) return false;
  if (IGNORE_DOMAINS.some((d) => email.includes(d))) return false;
  const parts = email.split("@");
  if (parts[0].length < 2) return false;
  return true;
}

function scoreEmail(email, priorities) {
  for (let i = 0; i < priorities.length; i++) {
    if (email.startsWith(priorities[i])) return priorities.length - i;
  }
  return 0;
}

async function extractEmailsFromHTML(html, domain) {
  const $ = cheerio.load(html);

  // Remover scripts e estilos
  $("script, style, noscript").remove();

  const text = $.html();
  const matches = text.match(EMAIL_REGEX) || [];

  const emails = [...new Set(matches.map(cleanEmail))].filter((e) =>
    isValidEmail(e, domain)
  );

  // Ordenar por prioridade
  emails.sort((a, b) => scoreEmail(b, EMAIL_PRIORITIES) - scoreEmail(a, EMAIL_PRIORITIES));

  return emails;
}

async function fetchPage(url, timeout = 10000) {
  try {
    const response = await axios.get(url, {
      timeout,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-PT,pt;q=0.9,en;q=0.8",
      },
      maxRedirects: 5,
    });
    return response.data;
  } catch {
    return null;
  }
}

async function findEmailsOnWebsite(website) {
  if (!website) return [];

  const domain = new URL(website).hostname;
  const allEmails = [];

  // Verificar página principal
  const mainHtml = await fetchPage(website);
  if (mainHtml) {
    const emails = await extractEmailsFromHTML(mainHtml, domain);
    allEmails.push(...emails);
  }

  // Se ainda sem email, verificar páginas de contacto
  if (allEmails.length === 0) {
    for (const path of CONTACT_PATHS) {
      const url = `${website.replace(/\/$/, "")}${path}`;
      const html = await fetchPage(url);
      if (html) {
        const emails = await extractEmailsFromHTML(html, domain);
        allEmails.push(...emails);
        if (allEmails.length > 0) break;
      }
    }
  }

  return [...new Set(allEmails)];
}

async function findEmailViaHunter(domain) {
  const apiKey = process.env.HUNTER_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await axios.get(
      `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${apiKey}&limit=5`
    );
    const emails = response.data?.data?.emails || [];
    if (emails.length > 0) {
      return emails[0].value;
    }
  } catch (err) {
    logger.warn(`Hunter.io falhou para ${domain}: ${err.message}`);
  }
  return null;
}

export async function enrichLeadEmails(leads) {
  logger.section("ENRIQUECIMENTO DE EMAILS");
  const enriched = [];

  for (let i = 0; i < leads.length; i++) {
    const lead = { ...leads[i] };
    logger.info(`[${i + 1}/${leads.length}] ${lead.nome}`);

    if (!lead.website) {
      logger.warn(`  Sem website — a saltar`);
      enriched.push(lead);
      continue;
    }

    // 1. Tentar extrair do website
    const emails = await findEmailsOnWebsite(lead.website);

    if (emails.length > 0) {
      lead.email = emails[0];
      logger.success(`  Email encontrado: ${lead.email}`);
    } else if (process.env.HUNTER_API_KEY) {
      // 2. Fallback para Hunter.io
      const domain = new URL(lead.website).hostname;
      const hunterEmail = await findEmailViaHunter(domain);
      if (hunterEmail) {
        lead.email = hunterEmail;
        logger.success(`  Email via Hunter: ${lead.email}`);
      } else {
        logger.warn(`  Sem email encontrado`);
      }
    } else {
      logger.warn(`  Sem email encontrado`);
    }

    enriched.push(lead);

    // Pausa para não sobrecarregar
    if (i < leads.length - 1) {
      await new Promise((r) => setTimeout(r, 800 + Math.random() * 700));
    }
  }

  const total = enriched.filter((l) => l.email).length;
  logger.success(`Enriquecimento completo: ${total}/${enriched.length} leads com email`);
  return enriched;
}
