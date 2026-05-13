#!/usr/bin/env node
import "dotenv/config";
import { runPipeline } from "./pipeline.js";
import { logger } from "./config/logger.js";

const args = process.argv.slice(2);

const options = {
  useCache: args.includes("--cache"),
  skipEnrichment: args.includes("--no-enrich"),
  segmentIds: null,
};

// Filtrar segmentos específicos: --segment condominios,hoteis
const segArg = args.find((a) => a.startsWith("--segment="));
if (segArg) {
  options.segmentIds = segArg.replace("--segment=", "").split(",");
}

logger.section("🔌 VIALLUX — MÁQUINA DE LEADS LISBOA");
logger.info("Segmentos: gestão de condomínios | hotéis | hostels | alojamento local");
logger.info(`Opções: ${JSON.stringify(options)}`);

runPipeline(options)
  .then(({ stats }) => {
    logger.section("✅ PIPELINE CONCLUÍDO");
    logger.success(`${stats.total} leads gerados | ${stats.quentes} quentes | ${stats.comEmail} com email`);
    process.exit(0);
  })
  .catch((err) => {
    logger.error(`Pipeline falhou: ${err.message}`);
    console.error(err);
    process.exit(1);
  });
