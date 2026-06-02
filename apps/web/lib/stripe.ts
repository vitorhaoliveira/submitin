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
// Crie um produto/preço em BRL para cada plano pago no Stripe e cole os IDs.
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

// Plans configuration (moeda em Real)
export const PLANS = {
  free: {
    name: "Grátis",
    price: 0,
    currency: "BRL",
    interval: "month" as const,
    stripePriceId: "",
    features: [
      "Até 5 formulários",
      "100 respostas/mês",
      "Notificações por email",
      "Webhook básico",
      "Branding Submitin",
    ],
    limits: {
      maxForms: 5,
      responsesPerMonth: 100,
      customTheme: false,
      hideBranding: false,
      captcha: false,
      advancedAnalytics: false,
      prioritySupport: false,
    },
  },
  plus: {
    name: "Plus",
    price: 19,
    currency: "BRL",
    interval: "month" as const,
    stripePriceId: STRIPE_PLUS_PRICE_ID,
    features: [
      "Tudo do Grátis +",
      "Até 20 formulários",
      "5.000 respostas/mês",
      "Remover branding Submitin",
      "Tema personalizado",
    ],
    limits: {
      maxForms: 20,
      responsesPerMonth: 5000,
      customTheme: true,
      hideBranding: true,
      captcha: false,
      advancedAnalytics: false,
      prioritySupport: false,
    },
  },
  premium: {
    name: "Premium",
    price: 49,
    currency: "BRL",
    interval: "month" as const,
    stripePriceId: STRIPE_PREMIUM_PRICE_ID,
    features: [
      "Tudo do Plus +",
      "Formulários ilimitados",
      "Respostas ilimitadas",
      "Anti-spam (CAPTCHA)",
      "Analytics avançado",
      "Suporte prioritário",
    ],
    limits: {
      maxForms: -1, // ilimitado
      responsesPerMonth: -1, // ilimitado
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

// Normaliza qualquer string de plano para um PlanType válido (default: free).
export function normalizePlan(plan: string | null | undefined): PlanType {
  return plan === "plus" || plan === "premium" ? plan : "free";
}

// Tem algum plano pago — libera features básicas (remover branding, tema custom).
// Mantido como `isPro` por compat: a maioria das checagens gateia features
// básicas pagas (não premium-only).
export function isPaid(plan: string | null | undefined): boolean {
  return plan === "plus" || plan === "premium";
}
export const isPro = isPaid;

// Plano topo — libera features avançadas (CAPTCHA, agendamento, parciais,
// analytics avançado, suporte prioritário) e uso ilimitado.
export function isPremium(plan: string | null | undefined): boolean {
  return plan === "premium";
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

// Mapeia o price ID de uma assinatura Stripe para o plano correspondente.
export function planFromPriceId(priceId: string | null | undefined): PlanType {
  if (!priceId) return "free";
  if (priceId === STRIPE_PREMIUM_PRICE_ID) return "premium";
  if (priceId === STRIPE_PLUS_PRICE_ID) return "plus";
  return "free";
}

// Price ID do Stripe para um plano pago ("" para free/desconhecido).
export function priceIdForPlan(plan: string | null | undefined): string {
  if (plan === "premium") return STRIPE_PREMIUM_PRICE_ID;
  if (plan === "plus") return STRIPE_PLUS_PRICE_ID;
  return "";
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
