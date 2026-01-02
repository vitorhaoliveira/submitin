# PRO Plan Features - Submitin

Este documento descreve as funcionalidades do plano PRO e como utilizá-las.

## 📊 Comparação de Planos

### Free Plan
- ✅ Formulários ilimitados
- ✅ 100 respostas por mês
- ✅ Notificações por email
- ✅ Webhook básico
- ❌ Branding Submitin visível

**Preço:** $0/mês

### Pro Plan
- ✅ Tudo do Free +
- ✅ **Respostas ilimitadas**
- ✅ **Remover branding Submitin**
- ✅ **Tema personalizado (cores e bordas)**
- ✅ **Anti-spam com CAPTCHA** (Turnstile/hCaptcha)
- ✅ **Suporte prioritário**

**Preço:** $19/mês

## 🚀 Como Fazer Upgrade

1. Acesse `/dashboard/billing` na sua conta
2. Clique em **"Upgrade para Pro"** no card do plano Pro
3. Preencha os dados de pagamento no Stripe
4. Após a confirmação, seu plano será ativado automaticamente

## 🎨 Recursos PRO

### 1. Tema Personalizado

Personalize a aparência dos seus formulários:

```typescript
// Exemplo de configuração de tema personalizado
{
  primaryColor: "#6366f1",        // Cor primária dos botões
  backgroundColor: "#ffffff",      // Cor de fundo
  cardBackground: "#f9fafb",      // Cor do card do formulário
  textColor: "#111827",           // Cor do texto
  accentColor: "#8b5cf6",         // Cor de destaque
  borderRadius: "lg"              // Raio das bordas: none, sm, md, lg, xl, 2xl
}
```

**Como configurar:**
1. Vá em `/dashboard/forms/[id]` (Editor do formulário)
2. Clique na aba "Settings"
3. Na seção "PRO: Custom Theme", configure as cores
4. As mudanças são aplicadas em tempo real

### 2. Remover Branding

Remove o texto "Powered by Submitin" do rodapé dos formulários.

**Como ativar:**
1. Acesse as configurações do formulário
2. Na seção "PRO: Branding", ative "Hide Submitin Branding"

### 3. Anti-spam (CAPTCHA)

Proteja seus formulários contra spam e bots.

**Providers suportados:**
- **Cloudflare Turnstile** (Recomendado - grátis)
- **hCaptcha**

**Como configurar:**

1. Obtenha as chaves do provider:
   - Turnstile: https://dash.cloudflare.com/
   - hCaptcha: https://www.hcaptcha.com/

2. No editor do formulário, vá em Settings
3. Na seção "PRO: Anti-spam / CAPTCHA":
   - Ative "Enable CAPTCHA"
   - Selecione o provider
   - Cole a Site Key e Secret Key

### 4. Respostas Ilimitadas

Não há limite de respostas por mês no plano Pro.

## 💳 Gerenciar Assinatura

### Acessar Portal do Cliente

1. Vá em `/dashboard/billing`
2. Clique em **"Gerenciar Assinatura"** ou **"Abrir Portal de Cobrança"**

No portal você pode:
- ✅ Atualizar método de pagamento
- ✅ Ver histórico de faturas
- ✅ Cancelar assinatura
- ✅ Fazer download de recibos

### Cancelar Assinatura

1. Acesse o Portal do Cliente
2. Clique em "Cancel subscription"
3. Sua assinatura permanecerá ativa até o fim do período pago
4. Após o cancelamento, você voltará ao plano Free

**⚠️ O que acontece ao cancelar:**
- Seus formulários e respostas são mantidos
- Tema personalizado será desativado (volta ao padrão)
- Branding Submitin voltará a aparecer
- CAPTCHA será desativado
- Limite de 100 respostas/mês volta a valer

## 🔐 Controle de Acesso

### No Backend

```typescript
import { hasFeature, isPro } from "@/lib/stripe";

// Verificar se usuário é PRO
if (isPro(user.plan)) {
  // Código para usuários PRO
}

// Verificar feature específica
if (hasFeature(user.plan, "customTheme")) {
  // Permitir personalização de tema
}
```

### No Frontend

```typescript
import { useProFeatures } from "@/hooks/use-pro-features";

function MyComponent() {
  const { isPro, features, hasAccess } = useProFeatures();

  if (isPro) {
    return <ProFeature />;
  }

  if (hasAccess("customTheme")) {
    return <ThemeCustomizer />;
  }

  return <UpgradePrompt />;
}
```

## 📱 Webhooks do Stripe

Os seguintes eventos são processados automaticamente:

- ✅ `checkout.session.completed` - Upgrade realizado
- ✅ `customer.subscription.updated` - Assinatura atualizada
- ✅ `customer.subscription.deleted` - Assinatura cancelada
- ✅ `invoice.payment_succeeded` - Pagamento bem-sucedido
- ✅ `invoice.payment_failed` - Falha no pagamento

## 🔧 Variáveis de Ambiente

Para usar o sistema de pagamentos, configure:

```bash
# Stripe Keys (obtenha em https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_test_... # ou sk_live_... em produção
STRIPE_WEBHOOK_SECRET=whsec_... # Obtenha ao criar webhook
STRIPE_PRO_PRICE_ID=price_... # ID do preço do plano Pro
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # ou pk_live_...

# URL da aplicação (para redirects)
NEXT_PUBLIC_APP_URL=https://seu-dominio.com
```

## 📈 Métricas e Limites

### Free Plan
- Formulários: **Ilimitados**
- Respostas: **100/mês**
- Campos por formulário: **Ilimitados**
- Webhook: **Básico**
- Email notifications: **Sim**

### Pro Plan
- Formulários: **Ilimitados**
- Respostas: **Ilimitadas**
- Campos por formulário: **Ilimitados**
- Webhook: **Avançado**
- Email notifications: **Sim**
- Theme customization: **Sim**
- Remove branding: **Sim**
- CAPTCHA protection: **Sim**

## 🎯 Casos de Uso PRO

### 1. Formulários de Alta Conversão
Use temas personalizados para combinar com sua marca e aumentar conversões.

### 2. Formulários Corporativos
Remova branding para uma experiência totalmente white-label.

### 3. Formulários Públicos
Use CAPTCHA para proteger contra spam e bots em formulários públicos.

### 4. Eventos e Inscrições
Respostas ilimitadas para eventos com grande volume de inscrições.

## 🆘 Suporte

### Usuários Free
- 📧 Email: support@submitin.com (resposta em até 48h)
- 📚 Documentação: https://docs.submitin.com

### Usuários Pro
- 📧 Email: priority@submitin.com (resposta em até 4h)
- 💬 Chat: Suporte via chat no dashboard
- 📞 Suporte prioritário para problemas críticos

## 📚 Recursos Adicionais

- [Stripe Setup Guide](./STRIPE_SETUP.md) - Como configurar Stripe
- [API Documentation](./API.md) - Documentação da API
- [Webhook Guide](./WEBHOOKS.md) - Como usar webhooks

## 🔄 Roadmap PRO

Próximas features planejadas para o plano Pro:

- [ ] Integração com Zapier
- [ ] Campos condicionais avançados
- [ ] Analytics detalhados
- [ ] Exportação de dados em múltiplos formatos
- [ ] API access com rate limit aumentado
- [ ] Custom domain para formulários
- [ ] Lógica de formulário (skip logic)
- [ ] Multi-idioma nos formulários

---

💡 **Dica:** Comece com o plano Free para testar a plataforma. Você pode fazer upgrade a qualquer momento sem perder seus dados!