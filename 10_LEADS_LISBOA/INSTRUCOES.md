# VIALLUX — Sistema de Leads Lisboa

Máquina automática de geração de leads para os 4 segmentos:
- Gestão de Condomínios
- Hotéis
- Hostels
- Alojamento Local

## Instalação

```bash
cd 10_LEADS_LISBOA
npm install
cp .env.example .env
# Editar .env com as tuas chaves
```

## Uso

### Pipeline completo (scraping + email + export)
```bash
npm run pipeline
```

### Só um segmento
```bash
node index.js --segment=condominios
node index.js --segment=hoteis,hostels
```

### Usar cache (sem re-scraping)
```bash
node index.js --cache
```

### Sem enriquecimento de email
```bash
node index.js --no-enrich
```

### Automático diário (cron)
```bash
npm run cron
```

### Dashboard (http://localhost:3000)
```bash
npm run dashboard
```

## Estrutura dos ficheiros

```
10_LEADS_LISBOA/
├── index.js              # Entrada principal
├── pipeline.js           # Orquestra scraping + enrichment + export
├── cron.js               # Execução automática diária
├── config/
│   ├── settings.js       # Segmentos, queries, pesos
│   └── logger.js         # Logs coloridos
├── scraper/
│   └── googleMaps.js     # Puppeteer → Google Maps
├── enrichment/
│   ├── emailFinder.js    # Extração de emails dos sites
│   └── scorer.js         # Classificação de leads
├── output/
│   ├── exporter.js       # CSV + Excel + Google Sheets
│   └── data/             # Ficheiros gerados
├── whatsapp/
│   └── sender.js         # Envio WhatsApp via Twilio
├── dashboard/
│   ├── server.js         # API Express
│   └── index.html        # Interface web
├── .env.example          # Variáveis de ambiente
└── package.json
```

## Configuração de APIs (opcional)

### Hunter.io (emails)
1. Criar conta em hunter.io
2. Copiar API key
3. Adicionar ao .env: `HUNTER_API_KEY=...`

### Google Sheets (export)
1. Criar projeto no Google Cloud Console
2. Ativar Sheets API
3. Criar Service Account e descarregar JSON
4. Guardar em `config/google-service-account.json`
5. Partilhar a Sheets com o email do Service Account
6. Adicionar ao .env: `GOOGLE_SHEETS_ID=...`

### WhatsApp via Twilio
1. Criar conta em twilio.com
2. Ativar WhatsApp Sandbox
3. Adicionar ao .env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN

## Estrutura dos leads

| Campo | Descrição |
|---|---|
| nome | Nome da empresa |
| categoria | Segmento |
| telefone | Número de contacto |
| email | Email encontrado |
| website | URL do site |
| morada | Endereço em Lisboa |
| avaliação | Rating Google Maps |
| score | Pontuação (0-9) |
| tier | quente / médio / frio |
| prioridade | 1 / 2 / 3 |
| dataCaptura | Data |

## Scoring

| Critério | Pontos |
|---|---|
| Tem website | +1 |
| Tem email | +2 |
| Tem telefone | +2 |
| Empresa grande | +3 |
| Avaliação ≥ 4.0 | +1 |

- **6+ pontos → 🔥 Quente** (contactar hoje)
- **3-5 pontos → ⚡ Médio** (contactar esta semana)
- **0-2 pontos → ❄️ Frio** (nurturing)
