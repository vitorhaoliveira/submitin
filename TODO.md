# Pendências — Submitin

> Snapshot em 2026-06-02. Foco da próxima sessão (2026-06-03): destravar o deploy e validar os 3 planos em produção.

---

## 🔴 Bloqueadores do deploy (fazer primeiro)

- [ ] **Commit + push do refactor de 3 planos** — ~15 arquivos modificados estão **só locais** na `main` (nada deployado). Sem o push, as env vars de preço não têm efeito.
  ```bash
  git add -A && git commit -m "feat: 3 planos (Grátis/Plus/Premium) em BRL" && git push
  ```
- [ ] **Atualizar o git remote** para `https://github.com/vitorhaoliveira/submitin.git` (o repo mudou de nome; hoje funciona via redirect). _(Bloqueado para o agente — fazer manualmente.)_

## 🟠 Stripe — verificar configuração

- [ ] **Test vs Live mode**: confirmar que as `price_...` (Plus/Premium) estão no **mesmo modo** das chaves (`sk_`/`pk_`). Hoje as chaves são `test`. Se for cobrar de verdade → usar chaves **live** + preços criados no modo **live**.
- [ ] Webhook (`/api/webhooks/stripe`) com os eventos: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed` + `STRIPE_WEBHOOK_SECRET` no ambiente certo.
- [ ] Customer Portal ativo (Settings → Billing → Customer portal); habilitar "switch plans" com os preços Plus/Premium se quiser troca de plano pelo portal.
- [ ] Branding do checkout: Brand `#6366F1`, Accent `#4F46E5`, tema claro, logo (exportar `icon.svg` para PNG).

## 🟡 Gating de planos — o que ainda NÃO é enforced

- [ ] **Limite de respostas/mês** (100 / 5.000 / ∞) é **só exibido**, não bloqueia envio. Implementar medição mensal + corte no `POST /api/forms/[id]/responses` se quiser valer de verdade.
- [ ] **Analytics avançado**: aparece no pricing mas **não existe** como feature gateada. Definir o que é e implementar, ou remover da lista.
- [ ] **Suporte prioritário**: é processo, não código (ok deixar só no marketing).
- [ ] Decisão de produto: **lógica condicional** está no **Plus** (qualquer plano pago). Mover para **Premium** se quiser deixá-la exclusiva.

## 🟢 Pós-deploy — validar em produção

- [ ] Testar assinatura em **test mode** (cartão `4242 4242 4242 4242`) → confirmar que o webhook grava `plan` = `plus`/`premium` e o billing reflete.
- [ ] Confirmar que o **dashboard** voltou (erro "Algo deu errado" era schema desatualizado; o `db push` no deploy deve aplicar a coluna `conversational`).
- [ ] Validar **modo conversacional** do formulário + polish da UI (validação inline, choice cards, confete).
- [ ] Validar **dark mode** na página de planos/landing (fix do `.glass`).

## 🔵 Landing / Pricing (melhoria)

- [ ] A **landing pública não tem seção de planos** — `PricingSection` e `ComparisonSection` existem mas **não são renderizadas** em `apps/web/app/page.tsx`. Considerar adicioná-las (+ link "Preços" no header).
- [ ] Se for usar a `ComparisonSection`, atualizá-la para **3 colunas** (hoje é Free vs "Pro"). _(A tabela detalhada de 3 colunas já foi feita na página de billing.)_

## ⚪ Dívidas técnicas / limpeza

- [ ] Remover `console.log` de debug no webhook e no `create-checkout`.
- [ ] Remover `apps/web/components/form-builder.tsx.bak` do repo.
- [ ] `messages/*.json` → `landing.pricing.*` (arrays de features `free`/`pro`) ficaram **sem uso** após a pricing-section passar a ler do `PLANS`. Limpar ou re-aproveitar.
- [ ] Revisar textos: nomenclatura "PRO" ainda aparece em algumas strings i18n (`comparison.pro`, badges) — alinhar para Plus/Premium.

---

## Estado atual (referência)

- **Planos**: Grátis (R$0) · Plus (R$19) · Premium (R$49), em BRL — definidos em `apps/web/lib/stripe.ts`.
- **Matriz**: Plus libera branding/tema/lógica condicional; Premium adiciona CAPTCHA, parciais, agendamento, analytics, suporte + uso ilimitado.
- **Limites enforced**: formulários (5/20/∞) ✅ · respostas/mês ❌ (só exibido).
- **Build**: `prebuild` roda `db push` (precisa `DIRECT_URL`) → `prisma generate` → `next build`.
- Typecheck: **passa** (`pnpm --filter @submitin/web exec tsc --noEmit`).
