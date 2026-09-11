"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@submitin/ui/components/button";
import { PLANS, SOLD_PLANS, type BillingInterval } from "@/lib/stripe";
import { IntervalToggle, PlanPriceTag } from "@/components/billing-interval";

/** Cards da página de preços, com a escolha Mensal / Anual. */
export function PricingCards() {
  const [interval, setInterval] = useState<BillingInterval>("month");
  return (
    <div className="space-y-10">
      <div className="flex justify-center">
        <IntervalToggle value={interval} onChange={setInterval} />
      </div>
          <div className="mx-auto grid max-w-5xl items-stretch gap-6 md:grid-cols-3">
            {SOLD_PLANS.map((key) => {
              const plan = PLANS[key];
              const featured = key === "pro";
              return (
                <div
                  key={key}
                  className={`relative flex flex-col rounded-3xl border bg-background p-7 ${
                    featured ? "border-brand shadow-xl shadow-brand/10 ring-1 ring-brand" : ""
                  }`}
                >
                  {featured && (
                    <span className="absolute -top-3 left-7 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white">
                      Recomendado
                    </span>
                  )}
                  <h2 className="font-display text-2xl font-bold">{plan.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
                  <div className="mt-6 min-h-[5.25rem]">
                    <PlanPriceTag plan={key} interval={interval} />
                  </div>
                  <ul className="mt-6 flex-1 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button asChild size="lg" variant={featured ? "default" : "outline"} className="mt-8 w-full">
                    <Link href={key === "free" ? "/dashboard/documents/new" : `/register?plan=${key}${interval === "year" ? "&interval=year" : ""}`}>
                      {key === "free" ? "Começar grátis" : `Assinar ${plan.name}`}
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              );
            })}
          </div>
    </div>
  );
}
