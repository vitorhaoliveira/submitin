"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Check, PartyPopper, X } from "lucide-react";
import { Button } from "@submitin/ui/components/button";
import { cn } from "@submitin/ui/lib/utils";

export type OnboardingStep = {
  key: string;
  title: string;
  description: string;
  done: boolean;
  cta: string;
  href: string | null;
  /** Abre em nova aba (ex.: o formulário público). */
  external?: boolean;
};

/** Primeiros passos no painel: leva a conta nova até o primeiro PDF. */
export function OnboardingChecklist({ steps }: { steps: OnboardingStep[] }) {
  const router = useRouter();
  const [hidden, setHidden] = useState(false);
  const done = steps.filter((s) => s.done).length;
  const allDone = done === steps.length;
  const next = steps.find((s) => !s.done);

  async function dismiss() {
    setHidden(true);
    await fetch("/api/user/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dismissed: true }),
    }).catch(() => {});
    router.refresh();
  }

  if (hidden) return null;

  if (allDone) {
    return (
      <section className="flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 sm:flex-row sm:items-center">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <PartyPopper className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <p className="font-semibold">Tudo pronto — seu primeiro PDF já saiu!</p>
          <p className="text-sm text-muted-foreground">
            Agora é só mandar o link para os seus clientes. Cada envio chega pronto no seu e-mail.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={dismiss}>
          Fechar
        </Button>
      </section>
    );
  }

  return (
    <section aria-labelledby="onboarding-title" className="rounded-2xl border bg-background p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 id="onboarding-title" className="font-display text-lg font-semibold">
            Primeiros passos
          </h2>
          <p className="text-sm text-muted-foreground">
            {done} de {steps.length} feitos · leva menos de 10 minutos até o primeiro PDF.
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Ocultar primeiros passos"
          title="Ocultar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
        <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${(done / steps.length) * 100}%` }} />
      </div>

      <ol className="mt-5 divide-y">
        {steps.map((step, i) => {
          const isNext = step.key === next?.key;
          return (
            <li key={step.key} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
              <span
                className={cn(
                  "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                  step.done
                    ? "bg-emerald-100 text-emerald-700"
                    : isNext
                      ? "bg-brand text-white"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {step.done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm font-medium", step.done && "text-muted-foreground line-through")}>
                  {step.title}
                </p>
                {!step.done && <p className="text-sm text-muted-foreground">{step.description}</p>}
              </div>
              {!step.done && step.href && (
                <Button asChild size="sm" variant={isNext ? "default" : "outline"} className="shrink-0">
                  {step.external ? (
                    <a href={step.href} target="_blank" rel="noopener noreferrer">
                      {step.cta}
                      <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <Link href={step.href}>
                      {step.cta}
                      <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  )}
                </Button>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
