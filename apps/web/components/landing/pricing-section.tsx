import Link from "next/link";
import { getTranslations } from "@/lib/i18n";
import { Button } from "@submitin/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@submitin/ui/components/card";
import { Badge } from "@submitin/ui/components/badge";
import { ArrowRight, Check, Crown, Sparkles } from "lucide-react";
import { PLANS, type PlanType } from "@/lib/stripe";

const PLAN_ORDER: PlanType[] = ["free", "plus", "premium"];

const PLAN_DESC: Record<PlanType, string> = {
  free: "Perfeito para começar",
  plus: "Para quem está crescendo",
  premium: "Tudo ilimitado, sem limites",
};

function formatBRL(value: number): string {
  return value === 0 ? "Grátis" : `R$ ${value}`;
}

export async function PricingSection() {
  const t = await getTranslations("landing");

  return (
    <section id="pricing" className="bg-muted/30">
      <div className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("pricing.title")}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">{t("pricing.subtitle")}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-start">
          {PLAN_ORDER.map((planKey) => {
            const plan = PLANS[planKey];
            const isPlus = planKey === "plus";
            const isPremium = planKey === "premium";
            return (
              <Card
                key={planKey}
                className={`relative border-2 ${
                  isPlus ? "border-primary shadow-xl md:scale-[1.03]" : ""
                } ${isPremium ? "border-yellow-500/50" : ""}`}
              >
                {isPlus && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center">
                    <Badge className="bg-gradient-to-r from-primary to-violet-500 text-white px-4 py-1">
                      Mais popular
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    {plan.name}
                    {isPremium && <Crown className="h-5 w-5 text-yellow-500" />}
                  </CardTitle>
                  <CardDescription>{PLAN_DESC[planKey]}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{formatBRL(plan.price)}</span>
                    {plan.price > 0 && (
                      <span className="text-muted-foreground ml-2">{t("pricing.perMonth")}</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check
                          className={`h-5 w-5 shrink-0 mt-0.5 ${
                            isPremium ? "text-yellow-600" : "text-emerald-600"
                          }`}
                        />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    variant={planKey === "free" ? "outline" : "default"}
                    className={
                      isPremium
                        ? "w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                        : "w-full"
                    }
                    asChild
                  >
                    <Link href="/login">
                      {planKey === "free" ? t("pricing.free.cta") : `Assinar ${plan.name}`}
                      {planKey === "free" ? (
                        <ArrowRight className="w-4 h-4 ml-2" />
                      ) : (
                        <Sparkles className="w-4 h-4 ml-2" />
                      )}
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
