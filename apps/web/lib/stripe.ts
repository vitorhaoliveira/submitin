import Stripe from "stripe";

// Allow build to succeed without Stripe keys
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "sk_test_placeholder";

export const stripe = new Stripe(stripeSecretKey, {
  typescript: true,
});

// Runtime validation
export function validateStripeConfig() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
}

// Stripe price IDs (NEXT_PUBLIC_ para acesso client-side).
// Planos à venda (módulo Documentos): crie um produto/preço em BRL para cada um no Stripe.
export const STRIPE_DOCS_PRO_PRICE_ID =
  process.env.NEXT_PUBLIC_STRIPE_DOCS_PRO_PRICE_ID || process.env.STRIPE_DOCS_PRO_PRICE_ID || "";

export const STRIPE_DOCS_UNLIMITED_PRICE_ID =
  process.env.NEXT_PUBLIC_STRIPE_DOCS_UNLIMITED_PRICE_ID ||
  process.env.STRIPE_DOCS_UNLIMITED_PRICE_ID ||
  "";

// Planos legados (Plus/Premium): não são mais vendidos, mas assinaturas ativas
// continuam reconhecidas pelo webhook com as mesmas condições.
export const STRIPE_PLUS_PRICE_ID =
  process.env.NEXT_PUBLIC_STRIPE_PLUS_PRICE_ID ||
  process.env.STRIPE_PLUS_PRICE_ID ||
  "";

export const STRIPE_PREMIUM_PRICE_ID =
  process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID ||
  process.env.STRIPE_PREMIUM_PRICE_ID ||
  // Compat: reaproveita o antigo price do "Pro" como Premium, se ainda definido
  process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ||
  process.env.STRIPE_PRO_PRICE_ID ||
  "";

// Deprecado: mantido só para imports legados (= Premium).
export const STRIPE_PRO_PRICE_ID = STRIPE_PREMIUM_PRICE_ID;

// Plans configuration (moeda em Real). Preços são só exibição — a lógica usa
// `limits`; mudar o valor cobrado é trocar o price no Stripe e o número aqui.
export const PLANS = {
  free: {
    name: "Grátis",
    tagline: "Para começar e testar com clientes reais",
    price: 0,
    currency: "BRL",
    interval: "month" as const,
    stripePriceId: "",
    legacy: false,
    features: [
      "20 documentos por mês",
      "Formulário gerado do seu .docx",
      "PDF por e-mail e webhook",
      "Selo \"Gerado com Submitin\" no PDF",
    ],
    limits: {
      maxForms: 5,
      responsesPerMonth: 100,
      // Documentos gerados com sucesso por mês (falha não conta). -1 = ilimitado.
      documentsPerMonth: 20,
      customTheme: false,
      hideBranding: false,
      captcha: false,
      advancedAnalytics: false,
      prioritySupport: false,
    },
  },
  pro: {
    name: "Pro",
    tagline: "Para quem gera documentos toda semana",
    price: 79,
    currency: "BRL",
    interval: "month" as const,
    stripePriceId: STRIPE_DOCS_PRO_PRICE_ID,
    legacy: false,
    features: [
      "Tudo do Grátis +",
      "200 documentos por mês",
      "PDF sem o selo Submitin",
      "Tema personalizado",
    ],
    limits: {
      maxForms: 20,
      responsesPerMonth: 5000,
      documentsPerMonth: 200,
      customTheme: true,
      hideBranding: true,
      captcha: false,
      advancedAnalytics: false,
      prioritySupport: false,
    },
  },
  unlimited: {
    name: "Ilimitado",
    tagline: "Volume alto, sem contar documentos",
    price: 179,
    currency: "BRL",
    interval: "month" as const,
    stripePriceId: STRIPE_DOCS_UNLIMITED_PRICE_ID,
    legacy: false,
    features: [
      "Tudo do Pro +",
      "Documentos ilimitados",
      "Anti-spam (CAPTCHA)",
      "Suporte prioritário",
    ],
    limits: {
      maxForms: -1,
      responsesPerMonth: -1,
      documentsPerMonth: -1,
      customTheme: true,
      hideBranding: true,
      captcha: true,
      advancedAnalytics: true,
      prioritySupport: true,
    },
  },
  // ── Legados (grandfathering) ──
  plus: {
    name: "Plus",
    tagline: "Plano anterior (mantido para assinantes)",
    price: 19,
    currency: "BRL",
    interval: "month" as const,
    stripePriceId: STRIPE_PLUS_PRICE_ID,
    legacy: true,
    features: [
      "Tudo do Grátis +",
      "Até 20 formulários",
      "5.000 respostas/mês",
      "200 documentos por mês",
      "Remover branding Submitin",
      "Tema personalizado",
    ],
    limits: {
      maxForms: 20,
      responsesPerMonth: 5000,
      documentsPerMonth: 200,
      customTheme: true,
      hideBranding: true,
      captcha: false,
      advancedAnalytics: false,
      prioritySupport: false,
    },
  },
  premium: {
    name: "Premium",
    tagline: "Plano anterior (mantido para assinantes)",
    price: 49,
    currency: "BRL",
    interval: "month" as const,
    stripePriceId: STRIPE_PREMIUM_PRICE_ID,
    legacy: true,
    features: [
      "Tudo do Plus +",
      "Formulários ilimitados",
      "Respostas ilimitadas",
      "Documentos ilimitados",
      "Anti-spam (CAPTCHA)",
      "Analytics avançado",
      "Suporte prioritário",
    ],
    limits: {
      maxForms: -1, // ilimitado
      responsesPerMonth: -1, // ilimitado
      documentsPerMonth: -1, // ilimitado
      customTheme: true,
      hideBranding: true,
      captcha: true,
      advancedAnalytics: true,
      prioritySupport: true,
    },
  },
} as const;

export type PlanType = keyof typeof PLANS;
export type PlanFeature = keyof typeof PLANS.free.limits;

/** Planos à venda, na ordem de exibição. */
export const SOLD_PLANS = ["free", "pro", "unlimited"] as const satisfies readonly PlanType[];

const PLAN_KEYS = Object.keys(PLANS) as PlanType[];

// Normaliza qualquer string de plano para um PlanType válido (default: free).
export function normalizePlan(plan: string | null | undefined): PlanType {
  return PLAN_KEYS.includes(plan as PlanType) ? (plan as PlanType) : "free";
}

export function isLegacyPlan(plan: string | null | undefined): boolean {
  return PLANS[normalizePlan(plan)].legacy;
}

// Tem algum plano pago — libera features básicas (remover branding, tema custom).
// Mantido como `isPro` por compat: a maioria das checagens gateia features
// básicas pagas (não premium-only).
export function isPaid(plan: string | null | undefined): boolean {
  return normalizePlan(plan) !== "free";
}
export const isPro = isPaid;

// Plano topo — libera features avançadas (CAPTCHA, agendamento, parciais,
// analytics avançado, suporte prioritário) e uso ilimitado.
export function isPremium(plan: string | null | undefined): boolean {
  return plan === "unlimited" || plan === "premium";
}

export function planLimits(plan: string | null | undefined) {
  return PLANS[normalizePlan(plan)].limits;
}

// Features booleanas (customTheme, hideBranding, captcha, advancedAnalytics, prioritySupport).
export function hasFeature(plan: string | null | undefined, feature: PlanFeature): boolean {
  return Boolean(planLimits(plan)[feature]);
}

// Limite de formulários do plano (-1 = ilimitado).
export function maxFormsFor(plan: string | null | undefined): number {
  return planLimits(plan).maxForms;
}

// Limite de respostas/mês do plano (-1 = ilimitado).
export function maxResponsesPerMonthFor(plan: string | null | undefined): number {
  return planLimits(plan).responsesPerMonth;
}

// Limite de documentos gerados/mês do plano (-1 = ilimitado).
export function maxDocumentsPerMonthFor(plan: string | null | undefined): number {
  return planLimits(plan).documentsPerMonth;
}

// Mapeia o price ID de uma assinatura Stripe para o plano correspondente
// (inclui os legados, para assinaturas antigas continuarem valendo).
export function planFromPriceId(priceId: string | null | undefined): PlanType {
  if (!priceId) return "free";
  const plan = PLAN_KEYS.find((key) => key !== "free" && PLANS[key].stripePriceId === priceId);
  return plan ?? "free";
}

// Price ID do Stripe para um plano à venda ("" para free, legado ou desconhecido).
export function priceIdForPlan(plan: string | null | undefined): string {
  const key = normalizePlan(plan);
  return PLANS[key].legacy ? "" : PLANS[key].stripePriceId;
}

export function getStripeCustomerPortalUrl(customerId: string): Promise<string> {
  validateStripeConfig();

  return stripe.billingPortal.sessions
    .create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
    })
    .then((session) => session.url);
}

export async function createCheckoutSession({
  userId,
  userEmail,
  priceId,
}: {
  userId: string;
  userEmail: string;
  priceId: string;
}): Promise<string> {
  validateStripeConfig();

  const session = await stripe.checkout.sessions.create({
    customer_email: userEmail,
    client_reference_id: userId,
    payment_method_types: ["card"],
    mode: "subscription",
    currency: "brl",
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=true`,
    metadata: {
      userId,
    },
  });

  return session.url || "";
}
