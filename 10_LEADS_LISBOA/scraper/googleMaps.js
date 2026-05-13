import puppeteer from "puppeteer";
import { SCRAPER, SEGMENTS } from "../config/settings.js";
import { logger } from "../config/logger.js";

const delay = (min, max) =>
  new Promise((r) => setTimeout(r, Math.floor(Math.random() * (max - min) + min)));

async function humanScroll(page) {
  await page.evaluate(async () => {
    const panel = document.querySelector('div[role="feed"]');
    if (!panel) return;
    for (let i = 0; i < 8; i++) {
      panel.scrollBy(0, 600);
      await new Promise((r) => setTimeout(r, 800 + Math.random() * 400));
    }
  });
}

async function extractListingData(page) {
  return page.evaluate(() => {
    const cards = document.querySelectorAll('div[role="feed"] > div');
    const results = [];

    for (const card of cards) {
      const nameEl = card.querySelector("div.qBF1Pd") || card.querySelector("[aria-label]");
      const name = nameEl?.textContent?.trim() || nameEl?.getAttribute("aria-label") || "";
      if (!name) continue;

      const ratingEl = card.querySelector("span.MW4etd");
      const rating = ratingEl?.textContent?.trim() || "";

      const addressEl = card.querySelector("div.W4Efsd span:last-child");
      const address = addressEl?.textContent?.trim() || "";

      results.push({ name, rating, address });
    }
    return results;
  });
}

async function extractDetailData(page) {
  return page.evaluate(() => {
    const phone =
      document.querySelector('button[data-item-id^="phone"]')?.getAttribute("data-item-id")
        ?.replace("phone:tel:", "")
        ?.replace("phone:", "") ||
      document.querySelector('a[href^="tel:"]')?.href?.replace("tel:", "") ||
      "";

    const website =
      document.querySelector('a[data-item-id="authority"]')?.href ||
      document.querySelector('a[href*="http"]:not([href*="google"])')?.href ||
      "";

    const address =
      document.querySelector('button[data-item-id="address"]')?.textContent?.trim() || "";

    return { phone, website, address };
  });
}

async function scrapeQuery(browser, query, segment) {
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  );
  await page.setViewport({ width: 1366, height: 768 });

  const results = [];

  try {
    const encodedQuery = encodeURIComponent(query);
    await page.goto(`https://www.google.com/maps/search/${encodedQuery}`, {
      waitUntil: "networkidle2",
      timeout: SCRAPER.timeout,
    });

    // Dismiss cookie consent if present
    try {
      await page.waitForSelector('button[aria-label*="Accept"]', { timeout: 3000 });
      await page.click('button[aria-label*="Accept"]');
    } catch {}

    await page.waitForSelector('div[role="feed"]', { timeout: 10000 });
    await delay(SCRAPER.delayMin, SCRAPER.delayMax);

    // Scroll to load more results
    for (let scroll = 0; scroll < 4; scroll++) {
      await humanScroll(page);
      await delay(1000, 2000);
    }

    const listings = await extractListingData(page);
    logger.info(`Query "${query}" → ${listings.length} resultados encontrados`);

    // Visitar cada listing para extrair detalhes
    const cards = await page.$$('div[role="feed"] > div');

    for (let i = 0; i < Math.min(cards.length, SCRAPER.maxResultsPerQuery); i++) {
      try {
        const card = cards[i];
        const nameEl = await card.$("div.qBF1Pd, [aria-label]");
        if (!nameEl) continue;

        await card.click();
        await delay(1500, 2500);

        await page.waitForSelector('h1.DUwDvf, h1[class*="fontHeadlineLarge"]', {
          timeout: 5000,
        });

        const name = await page.evaluate(() => {
          const el =
            document.querySelector("h1.DUwDvf") ||
            document.querySelector('h1[class*="fontHeadlineLarge"]');
          return el?.textContent?.trim() || "";
        });

        if (!name) continue;

        const details = await extractDetailData(page);
        const rating = listings[i]?.rating || "";

        results.push({
          nome: name,
          categoria: segment.label,
          telefone: details.phone,
          website: details.website,
          morada: details.address || listings[i]?.address || "",
          avaliacao: rating,
          email: "",
          score: 0,
          fonte: "Google Maps",
          dataCaptura: new Date().toISOString().split("T")[0],
        });

        logger.success(`  Lead: ${name} | ${details.phone || "sem tel"} | ${details.website || "sem site"}`);
        await delay(SCRAPER.delayMin, SCRAPER.delayMax);

      } catch (err) {
        logger.warn(`  Erro ao processar lead ${i + 1}: ${err.message}`);
        continue;
      }
    }
  } catch (err) {
    logger.error(`Falha na query "${query}": ${err.message}`);
  } finally {
    await page.close();
  }

  return results;
}

export async function scrapeSegment(segment) {
  logger.section(`SCRAPING: ${segment.label}`);

  const browser = await puppeteer.launch({
    headless: SCRAPER.headless,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--disable-infobars",
    ],
    defaultViewport: null,
  });

  const allResults = [];

  for (const query of segment.queries) {
    logger.info(`Pesquisa: "${query}"`);
    const results = await scrapeQuery(browser, query, segment);
    allResults.push(...results);
    await delay(3000, 5000); // Pausa entre queries
  }

  await browser.close();

  // Remover duplicados pelo nome
  const unique = [];
  const seen = new Set();
  for (const lead of allResults) {
    const key = lead.nome.toLowerCase().trim();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(lead);
    }
  }

  logger.success(`${segment.label}: ${unique.length} leads únicos capturados`);
  return unique;
}

export async function scrapeAllSegments(targetSegments = SEGMENTS) {
  const allLeads = [];

  for (const segment of targetSegments) {
    const leads = await scrapeSegment(segment);
    allLeads.push(...leads);
    await delay(5000, 8000);
  }

  logger.success(`TOTAL: ${allLeads.length} leads capturados de todos os segmentos`);
  return allLeads;
}
