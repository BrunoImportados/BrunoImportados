# VIALLUX — Configuração Make.com (Passo a Passo)

## Arquitetura da automação

```
Make.com (agendador 07h)
    │
    ├─► Apify API → scraping Google Maps (4 segmentos Lisboa)
    │       │
    │       └─► Dataset com leads (nome, tel, website, morada)
    │
    ├─► Extrair emails dos websites (regex)
    │
    └─► Brevo API → enviar até 300 emails/dia (templates por segmento)
```

---

## Cenário 1: Pipeline Completo (PRINCIPAL)

### Passo 1 — Importar o Blueprint

1. Aceder a **make.com** → entrar na conta
2. Clicar em **"Create a new scenario"**
3. Clicar nos **3 pontos** (···) no canto superior direito
4. Selecionar **"Import Blueprint"**
5. Fazer upload do ficheiro: `viallux_lead_machine.json`
6. Clicar **"Save"**

---

### Passo 2 — Configurar o Agendador

1. No cenário importado, clicar no **1.º módulo** (Schedule / Webhook)
2. Selecionar **"Scheduling"**
3. Configurar:
   - **Run scenario:** `Every day`
   - **Time:** `07:00`
   - **Timezone:** `Europe/Lisbon`
4. Guardar

---

### Passo 3 — Verificar conexões Apify

O blueprint já tem a chave Apify configurada:
```
SUA_APIFY_API_KEY — ver .env do projeto
```

Se precisares de alterar:
- Módulo **"Start Apify Run"** → campo `qs` → `token`
- Módulo **"Check Run Status"** → campo `qs` → `token`
- Módulo **"Get Dataset"** → campo `qs` → `token`

---

### Passo 4 — Verificar conexões Brevo

A chave Brevo já está no blueprint:
```
SUA_BREVO_API_KEY — ver .env do projeto
```

No módulo **"Send Brevo Email"** confirmar:
- Header `api-key` = chave acima
- `sender.email` = `geral@viallux.pt`
- `sender.name` = `VIALLUX Instalações Elétricas`

> **IMPORTANTE:** O domínio `viallux.pt` tem de estar verificado no Brevo.
> Brevo → Configurações → Domínios → Adicionar `viallux.pt` → Verificar DNS

---

### Passo 5 — Ativar o cenário

1. Clicar no toggle **ON/OFF** (canto inferior esquerdo)
2. O cenário fica **ativo** — corre automaticamente às 07h

---

## Cenário 2: Envio de Email Diário (OPCIONAL — separado)

Se quiseres separar scraping de envio de emails:

### Criar novo cenário manualmente:

```
Módulo 1: Schedule (diário 09:00)
Módulo 2: HTTP GET → /webhook/leads?tier=quente&hasEmail=true
Módulo 3: Iterator (percorrer leads)
Módulo 4: HTTP POST → Brevo /smtp/email (1 email por lead)
Módulo 5: Tools → Set variable (contador)
Módulo 6: Flow Control → Limit (máx 300 iterações)
```

---

## Configuração do Servidor Webhook (Opcional avançado)

Se quiseres usar o servidor Node.js como backend do Make.com:

### Iniciar o servidor:
```bash
cd 10_LEADS_LISBOA
npm install
node server.js
# → Disponível em http://localhost:3000
```

### Expor para a internet (Make.com precisa de URL público):
```bash
# Opção 1: ngrok (teste)
npx ngrok http 3000
# Copiar URL https://xxxx.ngrok.io

# Opção 2: Deploy em VPS/Render/Railway (produção)
```

### Endpoints disponíveis para Make.com:
```
POST /webhook/pipeline/start   → Arranca pipeline completo
GET  /webhook/pipeline/status/:jobId → Verifica estado
POST /webhook/email/send       → Envia emails do cache
GET  /webhook/leads            → Lista leads (com filtros)
GET  /webhook/stats            → Estatísticas completas
```

Header obrigatório: `x-webhook-secret: viallux_make_2025_xK9mP3qR`

---

## Fluxo completo da automação

```
07:00 Lisboa
    │
    ▼
Make.com acorda
    │
    ▼
Apify Actor arranca
(Google Maps → 4 segmentos → ~160 leads)
    │
    ▼
Make.com aguarda conclusão (~2-5 min)
    │
    ▼
Make.com lê dataset Apify
    │
    ▼
Para cada lead com website:
  → Make.com tenta extrair email da página
    │
    ▼
Para cada lead com email:
  → Brevo envia email personalizado
  → Máximo 300/dia
  → Template adaptado ao segmento
    │
    ▼
Resultado: leads capturados + emails enviados
```

---

## Verificação de funcionamento

### Teste manual no Make.com:
1. Abrir o cenário
2. Clicar **"Run once"** (botão azul)
3. Observar os módulos ficarem verdes
4. Verificar emails enviados em: **Brevo → Transactional → Log**

### Ver leads capturados:
- Apify Console → Runs → último run → Dataset
- Ou: `GET https://api.apify.com/v2/datasets/DATASET_ID/items?token=SUA_APIFY_API_KEY`

---

## Custos estimados

| Serviço | Plano | Custo |
|---|---|---|
| Make.com | Free (1000 ops/mês) | €0 |
| Apify | Free ($5 créditos) | ~$2/mês |
| Brevo | Free (300 emails/dia) | €0 |
| **Total** | | **~€2/mês** |

> O plano gratuito do Brevo permite **9.000 emails/mês** (300/dia).
> Para mais volume: plano Starter €19/mês (20.000 emails/mês).

---

## Suporte

Problemas? Verificar:
1. Chave Apify válida: `console.apify.com → Integrations`
2. Domínio verificado no Brevo: `app.brevo.com → Settings → Domains`
3. Make.com logs: cenário → histórico de execuções
