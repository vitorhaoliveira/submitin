"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@submitin/ui/components/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@submitin/ui/components/card";
import { Badge } from "@submitin/ui/components/badge";
import { Loader2, Check, Crown, Sparkles, Phone } from "lucide-react";
import { PLANS } from "@/lib/stripe";
import { SUPPORT_PHONE_DISPLAY, SUPPORT_PHONE_TEL } from "@/lib/utils";
import { useTranslations } from "@/lib/i18n-context";

interface UserSubscription {
  plan: string;
  stripeCurrentPeriodEnd: string | null;
  stripeCustomerId: string | null;
  cancelAtPeriodEnd: boolean;
}

export default function BillingPage() {
  const { data: session } = useSession();
  const t = useTranslations("landing");
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [userPlan, setUserPlan] = useState<UserSubscription | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Fetch user subscription data
    const fetchSubscription = async () => {
      try {
        const response = await fetch("/api/user/subscription");
        if (response.ok) {
          const data = await response.json();
          setUserPlan(data);
        }
      } catch (error) {
        console.error("Error fetching subscription:", error);
      }
    };

    if (session?.user) {
      fetchSubscription();
    }
  }, [session]);

  const handleUpgrade = async (priceId: string) => {
    try {
      setLoading(true);
      const response = await fetch("/api/billing/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
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
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setPortalLoading(true);
      const response = await fetch("/api/billing/portal", {
        method: "POST",
      });

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

  const isPro = userPlan?.plan === "pro";
  const hasStripeCustomer = !!userPlan?.stripeCustomerId;

  if (!mounted) {
    return (
      <div className="container max-w-6xl py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-8"></div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Planos e Preços</h1>
        <p className="text-muted-foreground">
          Escolha o plano ideal para suas necessidades
        </p>
      </div>

      {/* Current Plan Badge */}
      {isPro && userPlan?.stripeCurrentPeriodEnd && (
        <div className={`mb-6 p-4 border rounded-lg ${userPlan.cancelAtPeriodEnd
            ? "bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-orange-200 dark:border-orange-800"
            : "bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-yellow-200 dark:border-yellow-800"
          }`}>
          <div className="flex items-center gap-2 mb-1">
            <Crown className={`h-5 w-5 ${userPlan.cancelAtPeriodEnd
                ? "text-orange-600 dark:text-orange-500"
                : "text-yellow-600 dark:text-yellow-500"
              }`} />
            <span className={`font-semibold ${userPlan.cancelAtPeriodEnd
                ? "text-orange-900 dark:text-orange-100"
                : "text-yellow-900 dark:text-yellow-100"
              }`}>
              {userPlan.cancelAtPeriodEnd ? "Assinatura Cancelada" : "Plano Pro Ativo"}
            </span>
          </div>
          <p className={`text-sm ${userPlan.cancelAtPeriodEnd
              ? "text-orange-800 dark:text-orange-200"
              : "text-yellow-800 dark:text-yellow-200"
            }`}>
            {userPlan.cancelAtPeriodEnd
              ? `Você terá acesso ao plano Pro até: ${new Date(userPlan.stripeCurrentPeriodEnd).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}`
              : `Renovação em: ${new Date(userPlan.stripeCurrentPeriodEnd).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}`
            }
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Free Plan */}
        <Card className={!isPro ? "border-primary shadow-lg" : ""}>
          <CardHeader>
            <div className="flex justify-between items-start mb-2">
              <div>
                <CardTitle className="text-2xl">{PLANS.free.name}</CardTitle>
                <CardDescription>Perfeito para começar</CardDescription>
              </div>
              {!isPro && <Badge variant="default">Plano Atual</Badge>}
            </div>
            <div className="mt-4">
              <span className="text-4xl font-bold">${PLANS.free.price}</span>
              <span className="text-muted-foreground ml-2">/ mês</span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {PLANS.free.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" disabled>
              Plano Gratuito
            </Button>
          </CardFooter>
        </Card>

        {/* Pro Plan */}
        <Card className={isPro ? "border-yellow-500 shadow-lg" : "border-primary"}>
          <CardHeader>
            <div className="flex justify-between items-start mb-2">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  {PLANS.pro.name}
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                </CardTitle>
                <CardDescription>Para profissionais e empresas</CardDescription>
              </div>
              {isPro && <Badge variant="default" className="bg-yellow-500">Plano Atual</Badge>}
            </div>
            <div className="mt-4">
              <span className="text-4xl font-bold">${PLANS.pro.price}</span>
              <span className="text-muted-foreground ml-2">/ mês</span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {PLANS.pro.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                  <span className="text-sm font-medium">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            {isPro ? (
              <Button
                onClick={handleManageSubscription}
                disabled={portalLoading}
                className="w-full"
                variant="outline"
              >
                {portalLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Gerenciar Assinatura
              </Button>
            ) : (
              <Button
                onClick={() => handleUpgrade(PLANS.pro.stripePriceId)}
                disabled={loading || !PLANS.pro.stripePriceId}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Upgrade para Pro
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>

      {/* Manage Subscription Button for Pro Users */}
      {isPro && hasStripeCustomer && (
        <Card>
          <CardHeader>
            <CardTitle>Gerenciar Assinatura</CardTitle>
            <CardDescription>
              Atualize seu método de pagamento, veja histórico de faturas ou cancele sua assinatura
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              onClick={handleManageSubscription}
              disabled={portalLoading}
              variant="outline"
            >
              {portalLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Abrir Portal de Cobrança
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* FAQ Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Perguntas Frequentes</h2>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Posso cancelar a qualquer momento?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Sim! Você pode cancelar sua assinatura a qualquer momento através do portal de cobrança.
                Você continuará tendo acesso aos recursos Pro até o final do período pago.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">O que acontece se eu cancelar?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Ao cancelar, você voltará para o plano Free no final do período atual.
                Seus formulários e respostas serão mantidos, mas recursos Pro como tema personalizado
                e remoção de branding serão desativados.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Como funcionam as respostas ilimitadas?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                No plano Free, você tem um limite de 100 respostas por mês. No plano Pro,
                você pode receber quantas respostas quiser, sem limites.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

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
