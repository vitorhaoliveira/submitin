"use client";

import { cn } from "@submitin/ui/lib/utils";
import { PLANS, yearlyMonthlyEquivalent, type BillingInterval, type PlanType } from "@/lib/stripe";

function brl(value: number): string {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: Number.isInteger(value) ? 0 : 2, maximumFractionDigits: 2 });
}

/** Alternância Mensal / Anual ("2 meses grátis"). */
export function IntervalToggle({
  value,
  onChange,
  className,
}: {
  value: BillingInterval;
  onChange: (v: BillingInterval) => void;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Forma de cobrança"
      className={cn("inline-flex items-center gap-1 rounded-full border bg-background p-1 text-sm", className)}
    >
      {(["month", "year"] as const).map((interval) => (
        <button
          key={interval}
          type="button"
          role="radio"
          aria-checked={value === interval}
          onClick={() => onChange(interval)}
          className={cn(
            "flex items-center gap-2 rounded-full px-4 py-1.5 font-medium transition-colors",
            value === interval ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {interval === "month" ? "Mensal" : "Anual"}
          {interval === "year" && (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                value === "year" ? "bg-pop text-white" : "bg-brand-soft text-brand"
              )}
            >
              2 meses grátis
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/** Preço do plano no intervalo escolhido; no anual mostra o total do ano e o equivalente mensal. */
export function PlanPriceTag({
  plan,
  interval,
  size = "lg",
}: {
  plan: PlanType;
  interval: BillingInterval;
  size?: "lg" | "md";
}) {
  const p = PLANS[plan];
  const big = size === "lg" ? "text-5xl" : "text-3xl";
  if (p.price === 0) {
    return (
      <p className="flex items-baseline gap-1.5">
        <span className={cn("font-display font-bold tracking-tight tabular-nums", big)}>R$ 0</span>
        <span className="text-muted-foreground">para sempre</span>
      </p>
    );
  }
  if (interval === "year" && p.yearlyPrice > 0) {
    // Valor com centavos é mais largo: um passo menor para caber no card.
    const yearBig = size === "lg" ? "text-4xl" : "text-2xl";
    return (
      <div>
        <p className="flex items-baseline gap-1.5 whitespace-nowrap">
          <span className={cn("font-display font-bold tracking-tight tabular-nums", yearBig)}>
            R$ {brl(yearlyMonthlyEquivalent(plan))}
          </span>
          <span className="text-muted-foreground">/mês</span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground tabular-nums">
          R$ {brl(p.yearlyPrice)} cobrados por ano{" "}
          <span className="text-muted-foreground/70 line-through">R$ {brl(p.price * 12)}</span>
        </p>
      </div>
    );
  }
  return (
    <p className="flex items-baseline gap-1.5 whitespace-nowrap">
      <span className={cn("font-display font-bold tracking-tight tabular-nums", big)}>R$ {brl(p.price)}</span>
      <span className="text-muted-foreground">/mês</span>
    </p>
  );
}
