-- Add missing columns to users (password, plan, Stripe subscription fields)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "plan" TEXT NOT NULL DEFAULT 'free';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripePriceId" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripeCurrentPeriodEnd" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS "users_stripeCustomerId_key" ON "users"("stripeCustomerId");
CREATE UNIQUE INDEX IF NOT EXISTS "users_stripeSubscriptionId_key" ON "users"("stripeSubscriptionId");

-- Add missing columns to form_settings
ALTER TABLE "form_settings" ADD COLUMN IF NOT EXISTS "notifyEmails" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "form_settings" ADD COLUMN IF NOT EXISTS "allowMultipleResponses" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "form_settings" ADD COLUMN IF NOT EXISTS "captchaEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "form_settings" ADD COLUMN IF NOT EXISTS "captchaProvider" TEXT;
ALTER TABLE "form_settings" ADD COLUMN IF NOT EXISTS "captchaSiteKey" TEXT;
ALTER TABLE "form_settings" ADD COLUMN IF NOT EXISTS "captchaSecretKey" TEXT;
ALTER TABLE "form_settings" ADD COLUMN IF NOT EXISTS "hideBranding" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "form_settings" ADD COLUMN IF NOT EXISTS "customTheme" JSONB;

-- CreateTable subscriptions (if not exists)
CREATE TABLE IF NOT EXISTS "subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT NOT NULL,
    "stripeCustomerId" TEXT NOT NULL,
    "stripePriceId" TEXT NOT NULL,
    "stripeCurrentPeriodStart" TIMESTAMP(3) NOT NULL,
    "stripeCurrentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "canceledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_stripeSubscriptionId_key" ON "subscriptions"("stripeSubscriptionId");
CREATE INDEX IF NOT EXISTS "subscriptions_userId_idx" ON "subscriptions"("userId");
CREATE INDEX IF NOT EXISTS "subscriptions_stripeSubscriptionId_idx" ON "subscriptions"("stripeSubscriptionId");

ALTER TABLE "subscriptions" DROP CONSTRAINT IF EXISTS "subscriptions_userId_fkey";
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable payment_history (if not exists)
CREATE TABLE IF NOT EXISTS "payment_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT NOT NULL,
    "stripeInvoiceId" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "status" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_history_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "payment_history_stripePaymentIntentId_key" ON "payment_history"("stripePaymentIntentId");
CREATE INDEX IF NOT EXISTS "payment_history_userId_idx" ON "payment_history"("userId");

ALTER TABLE "payment_history" DROP CONSTRAINT IF EXISTS "payment_history_userId_fkey";
ALTER TABLE "payment_history" ADD CONSTRAINT "payment_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
