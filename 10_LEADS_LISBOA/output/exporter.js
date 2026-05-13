import { createObjectCsvWriter } from "csv-writer";
import * as XLSX from "xlsx";
import { google } from "googleapis";
import { promises as fs } from "fs";
import path from "path";
import { OUTPUT_DIR, GOOGLE_SHEETS_ID } from "../config/settings.js";
import { logger } from "../config/logger.js";

const HEADERS = [
  { id: "nome", title: "Nome" },
  { id: "categoria", title: "Categoria" },
  { id: "telefone", title: "Telefone" },
  { id: "email", title: "Email" },
  { id: "website", title: "Website" },
  { id: "morada", title: "Morada" },
  { id: "avaliacao", title: "Avaliação" },
  { id: "score", title: "Score" },
  { id: "tier", title: "Classificação" },
  { id: "prioridade", title: "Prioridade" },
  { id: "dataCaptura", title: "Data Captura" },
];

async function ensureDir() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
}

export async function exportCSV(leads, filename = "leads_lisboa.csv") {
  await ensureDir();
  const filepath = path.join(OUTPUT_DIR, filename);

  const writer = createObjectCsvWriter({
    path: filepath,
    header: HEADERS,
    encoding: "utf8",
    fieldDelimiter: ";",
  });

  await writer.writeRecords(leads);
  logger.success(`CSV exportado: ${filepath}`);
  return filepath;
}

export async function exportExcel(leads, filename = "leads_lisboa.xlsx") {
  await ensureDir();
  const filepath = path.join(OUTPUT_DIR, filename);

  const worksheetData = [
    HEADERS.map((h) => h.title),
    ...leads.map((lead) => HEADERS.map((h) => lead[h.id] || "")),
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(worksheetData);

  // Estilo do cabeçalho
  const headerStyle = { font: { bold: true }, fill: { fgColor: { rgb: "1F4E79" } } };
  const range = XLSX.utils.decode_range(ws["!ref"]);
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cell = ws[XLSX.utils.encode_cell({ r: 0, c: col })];
    if (cell) cell.s = headerStyle;
  }

  // Largura das colunas
  ws["!cols"] = [
    { wch: 40 }, // Nome
    { wch: 22 }, // Categoria
    { wch: 16 }, // Telefone
    { wch: 35 }, // Email
    { wch: 35 }, // Website
    { wch: 45 }, // Morada
    { wch: 10 }, // Avaliação
    { wch: 8 },  // Score
    { wch: 12 }, // Classificação
    { wch: 12 }, // Prioridade
    { wch: 14 }, // Data Captura
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Leads Lisboa");

  // Aba por categoria
  const categories = [...new Set(leads.map((l) => l.categoria))];
  for (const cat of categories) {
    const catLeads = leads.filter((l) => l.categoria === cat);
    const catData = [
      HEADERS.map((h) => h.title),
      ...catLeads.map((lead) => HEADERS.map((h) => lead[h.id] || "")),
    ];
    const catWs = XLSX.utils.aoa_to_sheet(catData);
    catWs["!cols"] = ws["!cols"];
    const sheetName = cat.substring(0, 31); // Excel limita a 31 chars
    XLSX.utils.book_append_sheet(wb, catWs, sheetName);
  }

  XLSX.writeFile(wb, filepath);
  logger.success(`Excel exportado: ${filepath}`);
  return filepath;
}

export async function exportGoogleSheets(leads) {
  const sheetsId = GOOGLE_SHEETS_ID;
  const credPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  if (!sheetsId || !credPath) {
    logger.warn("Google Sheets não configurado (GOOGLE_SHEETS_ID ou GOOGLE_SERVICE_ACCOUNT_KEY em falta)");
    return;
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: credPath,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  const values = [
    HEADERS.map((h) => h.title),
    ...leads.map((lead) => HEADERS.map((h) => String(lead[h.id] || ""))),
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetsId,
    range: "Leads!A1",
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });

  logger.success(`Google Sheets atualizado: ${leads.length} leads`);
}

export async function exportAll(leads) {
  logger.section("EXPORTAÇÃO DE DADOS");

  const date = new Date().toISOString().split("T")[0];
  await exportCSV(leads, `leads_lisboa_${date}.csv`);
  await exportExcel(leads, `leads_lisboa_${date}.xlsx`);

  if (GOOGLE_SHEETS_ID) {
    await exportGoogleSheets(leads);
  }

  logger.success(`Exportação completa: ${leads.length} leads`);
}
