"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@submitin/ui/components/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@submitin/ui/components/card";
import { Badge } from "@submitin/ui/components/badge";
import { Loader2, Check, X, Crown, Sparkles, Phone } from "lucide-react";
import { PLANS, SOLD_PLANS, type PlanType, isLegacyPlan, isPaid as isPaidPlan } from "@/lib/stripe";
import { PlanComparisonTable, type SoldPlan } from "@/components/plan-comparison";
import { SUPPORT_PHONE_DISPLAY, SUPPORT_PHONE_TEL } from "@/lib/utils";
import { useTranslations } from "@/lib/i18n-context";

interface UserSubscription {
  plan: string;
  stripeCurrentPeriodEnd: string | null;
  stripeCustomerId: string | null;
  cancelAtPeriodEnd: boolean;
}

function formatBRL(value: number): string {
  return value === 0 ? "Grátis" : `R$ ${value}`;
}

export function BillingClient({ chosenPlan = null }: { chosenPlan?: "pro" | "unlimited" | null }) {
  const { data: session } = useSession();
  const t = useTranslations("landing");
  const [mounted, setMounted] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<PlanType | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [userPlan, setUserPlan] = useState<UserSubscription | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const response = await fetch("/api/user/subscription");
        if (response.ok) {
          setUserPlan(await response.json());
        }
      } catch (error) {
        console.error("Error fetching subscription:", error);
      }
    };

    if (session?.user) {
      fetchSubscription();
    }
  }, [session]);

  const handleUpgrade = async (plan: PlanType) => {
    try {
      setLoadingPlan(plan);
      const response = await fetch("/api/billing/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const data = await response.json();

      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        console.error(data.error || "Erro ao criar sessão de checkout");
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setPortalLoading(true);
      const response = await fetch("/api/billing/portal", { method: "POST" });
      const data = await response.json();
      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        console.error(data.error || "Erro ao abrir portal de cobrança");
      }
    } catch (error) {
      console.error("Error opening portal:", error);
    } finally {
      setPortalLoading(false);
    }
  };

  const currentPlan = (userPlan?.plan as PlanType) || "free";
  const isPaid = isPaidPlan(currentPlan);
  const hasStripeCustomer = !!userPlan?.stripeCustomerId;

  if (!mounted) {
    return (
      <div className="container max-w-6xl py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4" />
          <div className="h-4 bg-muted rounded w-1/2 mb-8" />
          <div className="grid md:grid-cols-3 gap-6">
            <div className="h-96 bg-muted rounded" />
            <div className="h-96 bg-muted rounded" />
            <div className="h-96 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  function renderCta(planKey: SoldPlan) {
    if (planKey === "free") {
      return (
        <Button variant="outline" className="w-full" disabled>
          {currentPlan === "free" ? "Plano atual" : "Plano gratuito"}
        </Button>
      );
    }

    const isCurrent = currentPlan === planKey;
    const priceConfigured = !!PLANS[planKey].stripePriceId;

    // Usuário já pago gerencia/troca pelo portal do Stripe.
    if (isPaid) {
      return (
        <Button
          onClick={handleManageSubscription}
          disabled={portalLoading}
          variant={isCurrent ? "outline" : "default"}
          className="w-full"
        >
          {portalLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isCurrent ? "Gerenciar assinatura" : `Trocar para ${PLANS[planKey].name}`}
        </Button>
      );
    }

    // Usuário free assina via checkout.
    return (
      <Button
        onClick={() => handleUpgrade(planKey)}
        disabled={loadingPlan !== null || !priceConfigured}
        className="w-full"
      >
        {loadingPlan === planKey && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Assinar {PLANS[planKey].name}
      </Button>
    );
  }

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight mb-1">Planos e Preços</h1>
        <p className="text-muted-foreground">Escolha o plano ideal para suas necessidades</p>
      </div>

      {/* Banner do plano atual (pago) */}
      {/* Veio da página de preços com um plano escolhido */}
      {chosenPlan && !isPaid && (
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-brand/30 bg-brand-soft/60 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">Conta criada! Falta só assinar o {PLANS[chosenPlan].name}.</p>
            <p className="text-sm text-muted-foreground">
              Você também pode continuar no Grátis e assinar quando quiser.
            </p>
          </div>
          <Button
            onClick={() => handleUpgrade(chosenPlan)}
            disabled={loadingPlan !== null || !PLANS[chosenPlan].stripePriceId}
            className="shrink-0"
          >
            {loadingPlan === chosenPlan && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Assinar {PLANS[chosenPlan].name}
          </Button>
        </div>
      )}

      {isPaid && userPlan?.stripeCurrentPeriodEnd && (
        <div
          className={`mb-6 p-4 border rounded-lg ${
            userPlan.cancelAtPeriodEnd
              ? "bg-red-50 border-red-200"
              : "bg-muted/40"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Crown
              className={`h-5 w-5 ${
                userPlan.cancelAtPeriodEnd
                  ? "text-orange-600"
                  : "text-yellow-600"
              }`}
            />
            <span className="font-semibold">
              {userPlan.cancelAtPeriodEnd
                ? "Assinatura cancelada"
                : `Plano ${PLANS[currentPlan].name} ativo`}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {userPlan.cancelAtPeriodEnd
              ? `Você terá acesso até: ${new Date(userPlan.stripeCurrentPeriodEnd).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}`
              : `Renovação em: ${new Date(userPlan.stripeCurrentPeriodEnd).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}`}
          </p>
        </div>
      )}

      {/* Plano legado: continua valendo, sem migração forçada */}
      {isLegacyPlan(currentPlan) && (
        <div className="mb-6 rounded-lg border bg-brand-soft/60 p-4 text-sm">
          <p className="font-medium">Você está no plano {PLANS[currentPlan].name}.</p>
          <p className="text-muted-foreground mt-1">
            Ele não é mais vendido, mas continua ativo com as mesmas condições enquanto sua assinatura
            estiver em dia. Se quiser, pode trocar para um dos planos abaixo pelo portal de cobrança.
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {SOLD_PLANS.map((planKey) => {
          const plan = PLANS[planKey];
          const isCurrent = currentPlan === planKey;
          const highlight = planKey === "pro";
          return (
            <Card
              key={planKey}
              className={
                isCurrent ? "border-foreground" : highlight ? "border-foreground/30" : ""
              }
            >
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {plan.name}
                      {highlight && <Sparkles className="h-4 w-4 text-muted-foreground" />}
                    </CardTitle>
                    <CardDescription>{plan.tagline}</CardDescription>
                  </div>
                  {isCurrent && <Badge variant="default" className="shrink-0 whitespace-nowrap">Plano atual</Badge>}
                </div>
                <div className="mt-4">
                  <span className="text-3xl font-semibold tracking-tight">{formatBRL(plan.price)}</span>
                  {plan.price > 0 && <span className="text-muted-foreground ml-2">/ mês</span>}
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check
                        className={`h-5 w-5 shrink-0 mt-0.5 text-foreground`}
                      />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>{renderCta(planKey)}</CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Comparação detalhada dos planos */}
      <Card className="mb-8 overflow-hidden">
        <CardHeader>
          <CardTitle className="text-xl">Compare os planos em detalhe</CardTitle>
          <CardDescription>Veja exatamente o que está incluído em cada plano.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <PlanComparisonTable currentPlan={currentPlan} />
        </CardContent>
      </Card>

      {/* Portal de cobrança para assinantes */}
      {isPaid && hasStripeCustomer && (
        <Card>
          <CardHeader>
            <CardTitle>Gerenciar assinatura</CardTitle>
            <CardDescription>
              Atualize o método de pagamento, veja faturas, troque de plano ou cancele.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={handleManageSubscription} disabled={portalLoading} variant="outline">
              {portalLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Abrir portal de cobrança
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Suporte */}
      <Card className="mt-8 border-primary/30">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Phone className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="font-medium">{t("footer.supportContact")}</p>
              <a
                href={SUPPORT_PHONE_TEL}
                className="text-primary hover:underline font-medium"
                rel="noopener noreferrer"
              >
                {SUPPORT_PHONE_DISPLAY}
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
