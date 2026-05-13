export const SEGMENTS = [
  {
    id: "condominios",
    label: "Gestão de Condomínios",
    queries: [
      "gestão de condomínios Lisboa",
      "administração condomínios Lisboa",
      "síndico Lisboa",
    ],
  },
  {
    id: "hoteis",
    label: "Hotéis",
    queries: ["hotel Lisboa", "hotel boutique Lisboa", "hotel 4 estrelas Lisboa"],
  },
  {
    id: "hostels",
    label: "Hostels",
    queries: ["hostel Lisboa", "youth hostel Lisboa", "backpacker Lisboa"],
  },
  {
    id: "alojamento_local",
    label: "Alojamento Local",
    queries: [
      "alojamento local Lisboa",
      "apartamento turístico Lisboa",
      "airbnb management Lisboa",
    ],
  },
];

export const SCRAPER = {
  maxResultsPerQuery: 30,
  delayMin: 1500,
  delayMax: 3500,
  retries: 3,
  headless: true,
  timeout: 30000,
};

export const EMAIL_PRIORITIES = ["geral@", "info@", "comercial@", "contacto@", "reservas@"];

export const SCORE_WEIGHTS = {
  hasWebsite: 1,
  hasEmail: 2,
  hasPhone: 2,
  isLargeCompany: 3,
  hasHighRating: 1,
};

export const SCORE_TIERS = {
  hot: 6,
  medium: 3,
  cold: 0,
};

export const OUTPUT_DIR = "./output/data";
export const GOOGLE_SHEETS_ID = process.env.GOOGLE_SHEETS_ID || "";
