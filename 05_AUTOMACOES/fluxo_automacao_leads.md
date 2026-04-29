# VIALLUX — SISTEMA DE AUTOMAÇÕES COMPLETO
**Objetivo:** Zero lead sem resposta. Fecho automático onde possível.

---

## FLUXO PRINCIPAL: ANÚNCIO → FECHO → REVIEW

```
[ANÚNCIO] Google Ads / Meta Ads
    ↓
[LANDING PAGE] viallux.pt/orcamento
    ↓
[LEAD CAPTURADO] Nome + Telefone + Tipo de serviço
    ↓
[WHATSAPP AUTO — 0-2 min] Mensagem de boas-vindas
    ↓
[QUALIFICAÇÃO] Bot pergunta: zona, tipo obra, urgência
    ↓
[TRIAGEM]
├── URGENTE → Fundador contacta <30 min
└── NORMAL → Agendamento automático visita
    ↓
[VISITA/ORÇAMENTO] Fundador apresenta proposta
    ↓
[FOLLOW-UP AUTO D+1] Se não fechou
[FOLLOW-UP AUTO D+3] Oferta especial
    ↓
[FECHO] Pagamento + Obra
    ↓
[PÓS-OBRA D+3] Pedido automático review Google
    ↓
[REFERIDO] Convite a indicar amigos com desconto
```

---

## AUTOMAÇÃO 1 — WHATSAPP BUSINESS

### Mensagem Automática Inicial (resposta imediata):
```
Olá [Nome]! 👋

Sou da VIALLUX Instalações — eletricistas certificados em Lisboa.

Recebi o seu contacto e vou responder em poucos minutos!

Para agilizar, pode dizer-me:
1. Qual o tipo de serviço que precisa?
2. Qual a sua zona em Lisboa?
3. É urgente ou pode agendar?

Estamos disponíveis hoje! 🔌⚡
```

### Mensagem se demorar mais de 2h:
```
Olá [Nome]!

Peço desculpa pela demora — estávamos em obra.

Ainda precisa de eletricista? Posso agendar para hoje ou amanhã!

— VIALLUX Instalações | Lisboa
```

### Mensagem fora de horário (após 21h):
```
Olá! A VIALLUX está disponível das 7h às 21h.

Para URGÊNCIAS ELÉTRICAS ligue: [número]

Amanhã cedo respondemos à sua mensagem!

Para obras urgentes agora: deixe mensagem que respondemos em 30 min.
```

---

## AUTOMAÇÃO 2 — SEQUÊNCIA DE FOLLOW-UP (Orçamento enviado)

### D+0 (Imediatamente após orçamento):
```
[Nome], acabei de enviar o orçamento para a sua obra.

Tem alguma dúvida? Posso explicar qualquer detalhe.

Reservo a sua data durante 48h. ✅
```

### D+1 (Se não houve resposta):
```
Olá [Nome]!

Só a confirmar que recebeu o orçamento de ontem?

Se quiser ajustar algo ou tem dúvidas, estou disponível agora.

Posso agendar para esta semana? 📅
```

### D+3 (Oferta especial):
```
[Nome], boa tarde!

Tenho uma janela livre esta semana e posso oferecer:
✅ Arranque imediato
✅ Garantia de 2 anos
✅ Desconto de 10% se fechar até [data]

Quer aproveitar? Responda com "SIM" e agendo já! ⚡
```

### D+7 (Última tentativa):
```
[Nome], última mensagem da nossa parte.

O orçamento de €[valor] para [serviço] ainda está válido.

Se precisar no futuro, guarde o nosso contacto:
📱 VIALLUX Instalações — Lisboa
🔌 Eletricistas Certificados
```

---

## AUTOMAÇÃO 3 — PEDIDO DE REVIEW (Pós-obra)

### D+3 após obra concluída:
```
Olá [Nome]!

Esperamos que a obra tenha ficado ao seu gosto! 😊

Pode deixar uma avaliação no Google? Ajuda muito outros clientes a encontrar-nos:

👉 [LINK GOOGLE REVIEW]

Obrigado pela confiança na VIALLUX! ⚡
```

### D+7 (Se não deixou review):
```
[Nome], tudo bem com a instalação?

Se possível, uma avaliação rápida no Google ajuda-nos imenso:
⭐⭐⭐⭐⭐ [LINK]

Leva menos de 1 minuto! Muito obrigado 🙏
```

---

## AUTOMAÇÃO 4 — PROGRAMA DE REFERIDOS

### Mensagem para clientes que deram 5 estrelas:
```
[Nome], muito obrigado pela avaliação! ⭐⭐⭐⭐⭐

Tem amigos, vizinhos ou colegas que precisem de eletricista?

Se recomendar a VIALLUX e fecharmos uma obra:
🎁 Você ganha €20 de desconto na próxima
🎁 O seu amigo ganha 10% de desconto

Basta partilhar: wa.me/[número] | viallux.pt
```

---

## AUTOMAÇÃO 5 — NEWSLETTER MENSAL (Email)

### Template mensal:
```
Assunto: [Nome], dicas de eletricidade + oferta exclusiva deste mês

Corpo:
- Dica do mês: [ex: "Como saber se o quadro elétrico precisa de substituição"]
- Serviço em destaque: [ex: "Carregadores VE — Instale em Casa"]
- Oferta exclusiva clientes: 15% desconto em [serviço]
- Novidades VIALLUX
- Reviews de clientes satisfeitos
```

---

## FERRAMENTAS RECOMENDADAS

| Ferramenta | Uso | Custo/mês |
|---|---|---|
| WhatsApp Business API (Zaper/Wati) | Automação WhatsApp | €30-60 |
| Google Ads | Captação paid | €300-600 |
| Meta Ads | Captação paid | €150-300 |
| CRM (HubSpot Free / Pipedrive) | Gestão leads | €0-30 |
| Make.com / Zapier | Automações | €20-40 |
| Mailchimp | Email marketing | €0-20 |
| Calendly | Agendamento | €0-15 |
| **TOTAL** | | **€500-1.065** |

**ROI esperado:** Para €600/mês em ads → esperar €3.000-6.000 em obras. ROI mínimo: 5x

---

## FLUXO CRM — ESTADOS DO LEAD

```
NOVO LEAD
    ↓
EM QUALIFICAÇÃO (contactado, a recolher info)
    ↓
VISITA AGENDADA
    ↓
ORÇAMENTO ENVIADO
    ↓
├── FECHADO GANHO ✅ → Obra → Review
└── FECHADO PERDIDO ❌ → Follow-up em 30 dias
    └── EM ESPERA ⏳ → Follow-up D+3
```

---

## REGRAS DE OURO DO SISTEMA

1. **Nenhum lead espera mais de 5 minutos** durante horário de trabalho
2. **Nenhum orçamento fica sem follow-up** após 24h
3. **Nenhum cliente termina obra sem pedido de review**
4. **Nenhum cliente satisfeito sai sem programa de referidos**
5. **Todos os dados entram no CRM** — sem excepções
