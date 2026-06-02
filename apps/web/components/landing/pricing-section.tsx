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
import { PLANS } from "@/lib/stripe";

export async function PricingSection() {
  const t = await getTranslations("landing");

  return (
    <section id="pricing" className="bg-muted/30">
      <div className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("pricing.title")}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">{t("pricing.subtitle")}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free */}
          <Card className="relative border-2">
            <CardHeader>
              <CardTitle className="text-2xl">{PLANS.free.name}</CardTitle>
              <CardDescription>{t("pricing.free.description")}</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">${PLANS.free.price}</span>
                <span className="text-muted-foreground ml-2">{t("pricing.perMonth")}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {[0, 1, 2, 3, 4].map((index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <span className="text-sm">{t(`pricing.free.features.${index}`)}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/login">
                  {t("pricing.free.cta")}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Pro */}
          <Card className="relative border-2 border-primary shadow-xl">
            <div className="absolute -top-4 left-0 right-0 flex justify-center">
              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-1">
                {t("pricing.pro.badge")}
              </Badge>
            </div>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                {PLANS.pro.name}
                <Crown className="h-5 w-5 text-yellow-500" />
              </CardTitle>
              <CardDescription>{t("pricing.pro.description")}</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">${PLANS.pro.price}</span>
                <span className="text-muted-foreground ml-2">{t("pricing.perMonth")}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {[0, 1, 2, 3, 4, 5, 6].map((index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                    <span className="text-sm font-medium">
                      {t(`pricing.pro.features.${index}`)}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                asChild
              >
                <Link href="/login">
                  {t("pricing.pro.cta")}
                  <Sparkles className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </section>
  );
}
