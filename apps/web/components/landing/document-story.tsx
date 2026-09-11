"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "@/lib/i18n-context";
import { Button } from "@submitin/ui/components/button";
import { cn } from "@submitin/ui/lib/utils";
import { ArrowRight, Check, Inbox, Paperclip } from "lucide-react";
import { LogoMark } from "@/components/logo";
import { Sparkle } from "./doodles";

const STEPS = 4;
const AUTO_ADVANCE_MS = 5000;

/**
 * "Como funciona" em bloco de cor forte (inspirado no Jota): linha do tempo de
 * passos à esquerda e um mockup que acompanha o passo ativo à direita.
 */
export function DocumentStory() {
  const t = useTranslations("landing");
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => setActive((s) => (s + 1) % STEPS), AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, [paused]);

  return (
    <section id="como-funciona" className="container mx-auto px-4 py-10 md:py-16">
      <div className="relative overflow-hidden rounded-[2rem] bg-brand px-6 py-14 md:px-14 md:py-20 text-brand-foreground">
        <Sparkle className="absolute right-8 top-8 w-10 text-brand-foreground/40" />

        <div className="max-w-2xl">
          <p className="text-sm font-medium text-brand-foreground/70">{t("story.eyebrow")}</p>
          <h2 className="mt-2 font-display text-4xl md:text-5xl font-bold tracking-tight">
            {t("story.title")}
          </h2>
          <p className="mt-3 text-lg text-brand-foreground/75">{t("story.subtitle")}</p>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          {/* Linha do tempo */}
          <ol
            className="relative space-y-2 border-l border-brand-foreground/25 pl-6"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {Array.from({ length: STEPS }, (_, i) => {
              const isActive = i === active;
              return (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => setActive(i)}
                    className={cn(
                      "relative w-full rounded-2xl px-4 py-3 text-left transition-colors",
                      isActive ? "bg-brand-foreground/10" : "hover:bg-brand-foreground/5"
                    )}
                    aria-current={isActive ? "step" : undefined}
                  >
                    <span
                      className={cn(
                        "absolute -left-[31px] top-5 h-2.5 w-2.5 rounded-full transition-colors",
                        isActive ? "bg-brand-foreground" : "bg-brand-foreground/40"
                      )}
                    />
                    <span className="flex items-baseline gap-3">
                      <span className="text-sm tabular-nums text-brand-foreground/60">
                        0{i + 1}
                      </span>
                      <span
                        className={cn(
                          "font-display text-xl font-semibold transition-opacity",
                          isActive ? "opacity-100" : "opacity-60"
                        )}
                      >
                        {t(`story.steps.${i}.title`)}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "grid transition-all duration-300",
                        isActive ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0"
                      )}
                    >
                      <span className="overflow-hidden pl-8 text-brand-foreground/80 leading-relaxed">
                        {t(`story.steps.${i}.description`)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>

          {/* Mockup do passo ativo */}
          <div className="relative min-h-[320px] rounded-3xl bg-background p-5 sm:p-6 text-foreground shadow-2xl shadow-black/20">
            <div key={active} className="animate-fade-in-up">
              {active === 0 && <WordStep t={t} />}
              {active === 1 && <FormStep t={t} />}
              {active === 2 && <PhoneStep t={t} />}
              {active === 3 && <InboxStep t={t} />}
            </div>
          </div>
        </div>

        <Button
          size="lg"
          className="mt-12 h-12 px-7 text-base bg-foreground text-background hover:bg-foreground/90"
          asChild
        >
          <Link href="/dashboard/documents/new">
            {t("story.cta")}
            <ArrowRight />
          </Link>
        </Button>
      </div>
    </section>
  );
}

type T = (key: string) => string;

/** Destaca {{variaveis}} dentro do texto. */
function highlightVars(text: string) {
  return text.split(/(\{\{[^}]+\}\})/g).map((part, i) =>
    part.startsWith("{{") ? (
      <mark key={i} className="rounded bg-brand-soft px-1 font-mono text-[0.8em] text-brand">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

function WordStep({ t }: { t: T }) {
  return (
    <div>
      <div className="flex items-center gap-2 border-b pb-3">
        <div className="w-7 h-7 rounded bg-[#2B579A] flex items-center justify-center text-[11px] font-bold text-white">
          W
        </div>
        <span className="text-sm font-medium">{t("story.wordFile")}</span>
      </div>
      <p className="mt-5 font-serif text-[15px] leading-8">{highlightVars(t("story.wordText"))}</p>
      <div className="mt-5 space-y-2">
        <div className="h-2 w-full rounded bg-muted" />
        <div className="h-2 w-10/12 rounded bg-muted" />
        <div className="h-2 w-7/12 rounded bg-muted" />
      </div>
    </div>
  );
}

function FormStep({ t }: { t: T }) {
  const fields = [
    [t("story.fieldGuardian"), t("story.typeText"), "{{nome_responsavel}}"],
    [t("mock.cpf"), t("story.typeCpf"), "{{cpf_responsavel}}"],
    [t("mock.student"), t("story.typeText"), "{{nome_aluno}}"],
    [t("mock.fee"), t("story.typeCurrency"), "{{valor_mensalidade}}"],
  ];
  return (
    <div>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
        <Check className="w-3.5 h-3.5" />
        {t("story.detected")}
      </span>
      <ul className="mt-4 divide-y rounded-xl border">
        {fields.map(([label, type, key]) => (
          <li key={key} className="flex items-center gap-3 px-3 py-2.5 text-sm">
            <span className="font-medium">{label}</span>
            <span className="rounded-md border px-1.5 py-0.5 text-[11px] text-muted-foreground">
              {type}
            </span>
            <code className="ml-auto hidden sm:block font-mono text-[11px] text-brand">{key}</code>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PhoneStep({ t }: { t: T }) {
  return (
    <div className="flex justify-center">
      <div className="w-[230px] rounded-[2rem] border-[6px] border-foreground bg-background">
        <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-foreground/15" />
        <div className="p-4 space-y-3">
          <p className="font-display font-semibold">{t("mock.formTitle")}</p>
          {[
            [t("mock.student"), t("mock.studentValue")],
            [t("mock.cpf"), t("mock.cpfValue")],
            [t("mock.fee"), `R$ ${t("mock.feeValue")}`],
          ].map(([label, value]) => (
            <div key={label} className="space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground">{label}</p>
              <div className="flex items-center justify-between rounded-md border border-emerald-300 px-2 py-1.5 text-xs">
                <span className="truncate">{value}</span>
                <Check className="w-3 h-3 text-emerald-600" />
              </div>
            </div>
          ))}
          <div className="flex items-center justify-center gap-1 rounded-full bg-foreground py-2 text-xs font-medium text-background">
            {t("mock.send")}
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </div>
    </div>
  );
}

function InboxStep({ t }: { t: T }) {
  return (
    <div>
      <div className="flex items-center gap-2 border-b pb-3 text-sm font-medium">
        <Inbox className="w-4 h-4" />
        {t("story.inbox")}
      </div>
      <div className="mt-4 rounded-xl border bg-brand-soft/60 p-4">
        <div className="flex items-start gap-3">
          <LogoMark className="w-9 h-9" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">{t("mock.emailFrom")}</p>
              <span className="text-xs text-muted-foreground">{t("story.now")}</span>
            </div>
            <p className="text-sm text-muted-foreground truncate">{t("mock.emailSubject")}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3 rounded-lg border bg-background p-3">
          <div className="w-9 h-11 shrink-0 rounded border flex items-end justify-center pb-1 text-[9px] font-bold text-red-600">
            PDF
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate flex items-center gap-1">
              <Paperclip className="w-3.5 h-3.5 shrink-0" />
              {t("mock.attachment")}
            </p>
            <p className="text-xs text-muted-foreground">148 KB</p>
          </div>
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
            <Check className="w-3 h-3" />
            {t("mock.ready")}
          </span>
        </div>
      </div>
      <div className="mt-3 space-y-2 opacity-50">
        <div className="h-10 rounded-lg border" />
        <div className="h-10 rounded-lg border" />
      </div>
    </div>
  );
}
