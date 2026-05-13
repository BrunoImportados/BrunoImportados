import "dotenv/config";
import cron from "node-cron";
import { runPipeline } from "./pipeline.js";
import { logger } from "./config/logger.js";

logger.section("🕐 VIALLUX — AGENDADOR DE LEADS (CRON)");
logger.info("Pipeline executa todos os dias às 07:00 (Lisboa)");

// Executa às 07:00 todos os dias
cron.schedule(
  "0 7 * * *",
  async () => {
    logger.info("Cron ativado — a iniciar pipeline diário...");
    try {
      const { stats } = await runPipeline({ skipEnrichment: false });
      logger.success(`Pipeline diário concluído: ${stats.total} leads | ${stats.quentes} quentes`);
    } catch (err) {
      logger.error(`Pipeline diário falhou: ${err.message}`);
    }
  },
  { timezone: "Europe/Lisbon" }
);

// Executar imediatamente na primeira vez
logger.info("A executar pipeline inicial...");
runPipeline()
  .then(({ stats }) => {
    logger.success(`Pipeline inicial completo: ${stats.total} leads`);
    logger.info("Cron ativo. A aguardar próxima execução às 07:00...");
  })
  .catch((err) => {
    logger.error(`Falha no pipeline inicial: ${err.message}`);
  });
