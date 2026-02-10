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

// Stripe product and price IDs
// Use NEXT_PUBLIC_ prefix for client-side access
export const STRIPE_PRO_PRICE_ID = 
  process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || 
  process.env.STRIPE_PRO_PRICE_ID || 
  "";

// Plans configuration
export const PLANS = {
  free: {
    name: "Free",
    price: 0,
    currency: "USD",
    interval: "month" as const,
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
    },
  },
  pro: {
    name: "Pro",
    price: 9,
    currency: "USD",
    interval: "month" as const,
    stripePriceId: STRIPE_PRO_PRICE_ID,
    features: [
      "Tudo do Free +",
      "Formulários ilimitados",
      "Respostas ilimitadas",
      "Remover branding Submitin",
      "Tema personalizado",
      "Anti-spam (CAPTCHA)",
      "Suporte prioritário",
    ],
    limits: {
      maxForms: -1, // unlimited
      responsesPerMonth: -1, // unlimited
      customTheme: true,
      hideBranding: true,
      captcha: true,
    },
  },
} as const;

export type PlanType = keyof typeof PLANS;

// Helper functions
export function isPro(plan: string): boolean {
  return plan === "pro";
}

export function hasFeature(plan: string, feature: keyof typeof PLANS.pro.limits): boolean {
  if (plan === "free") {
    return PLANS.free.limits[feature] as boolean;
  }
  if (plan === "pro") {
    return PLANS.pro.limits[feature] as boolean;
  }
  return false;
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
    currency: "usd",
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

// Debug logging (remove in production)
if (typeof window === 'undefined') {
  console.log('🔍 Stripe Config (Server-side):');
  console.log('  → STRIPE_PRO_PRICE_ID:', STRIPE_PRO_PRICE_ID || '(empty)');
  console.log('  → process.env.STRIPE_PRO_PRICE_ID:', process.env.STRIPE_PRO_PRICE_ID || '(empty)');
  console.log('  → process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID:', process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || '(empty)');
}
