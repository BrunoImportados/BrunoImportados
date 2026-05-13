import "dotenv/config";
import express from "express";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.DASHBOARD_PORT || 3000;
const CACHE_FILE = "../output/data/leads_cache.json";

app.use(express.json());
app.use(express.static(__dirname));

async function getLeads() {
  try {
    const data = await fs.readFile(path.join(__dirname, CACHE_FILE), "utf8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

app.get("/api/leads", async (req, res) => {
  const leads = await getLeads();
  const { categoria, tier, search } = req.query;

  let filtered = leads;
  if (categoria) filtered = filtered.filter((l) => l.categoria === categoria);
  if (tier) filtered = filtered.filter((l) => l.tier === tier);
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(
      (l) =>
        l.nome.toLowerCase().includes(s) ||
        l.email?.toLowerCase().includes(s) ||
        l.telefone?.includes(s)
    );
  }

  res.json({
    total: filtered.length,
    leads: filtered,
  });
});

app.get("/api/stats", async (req, res) => {
  const leads = await getLeads();
  const stats = {
    total: leads.length,
    comTelefone: leads.filter((l) => l.telefone).length,
    comEmail: leads.filter((l) => l.email).length,
    quentes: leads.filter((l) => l.tier === "quente").length,
    medios: leads.filter((l) => l.tier === "médio").length,
    frios: leads.filter((l) => l.tier === "frio").length,
    porCategoria: {},
  };

  const cats = [...new Set(leads.map((l) => l.categoria))];
  for (const cat of cats) {
    stats.porCategoria[cat] = leads.filter((l) => l.categoria === cat).length;
  }

  res.json(stats);
});

app.listen(PORT, () => {
  console.log(`\n🔌 Dashboard VIALLUX Leads: http://localhost:${PORT}\n`);
});
