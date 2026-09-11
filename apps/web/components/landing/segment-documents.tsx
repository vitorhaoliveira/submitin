"use client";

import { useState } from "react";
import { useTranslations } from "@/lib/i18n-context";
import { cn } from "@submitin/ui/lib/utils";
import {
  Briefcase,
  Camera,
  ClipboardCheck,
  ClipboardList,
  Dumbbell,
  FileHeart,
  FilePen,
  GraduationCap,
  Handshake,
  HeartPulse,
  House,
  KeyRound,
  Receipt,
  ScrollText,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { Squiggle } from "./doodles";

/** Segmentos atendidos; o primeiro (escolas) é o foco inicial e abre por padrão. */
const SEGMENTS = [
  { icon: GraduationCap, docIcons: [FilePen, ClipboardList, Camera] },
  { icon: Stethoscope, docIcons: [FileHeart, ShieldCheck, HeartPulse] },
  { icon: Dumbbell, docIcons: [Receipt, ClipboardCheck, ShieldCheck] },
  { icon: House, docIcons: [ClipboardList, KeyRound, ScrollText] },
  { icon: Briefcase, docIcons: [Handshake, ClipboardCheck, FilePen] },
];

export function SegmentDocuments() {
  const t = useTranslations("landing");
  const [active, setActive] = useState(0);
  const segment = SEGMENTS[active]!;

  return (
    <section id="documentos" className="container mx-auto px-4 py-20 md:py-28">
      <div className="max-w-2xl">
        <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight">{t("segments.title")}</h2>
        <Squiggle className="mt-2 h-3 w-40 text-pop" />
        <p className="mt-4 text-lg text-muted-foreground">{t("segments.subtitle")}</p>
      </div>

      {/* Abas por segmento (rolam na horizontal no celular) */}
      <div className="-mx-4 mt-10 overflow-x-auto px-4 pb-1">
        <div role="tablist" aria-label={t("audience.title")} className="flex w-max gap-2">
          {SEGMENTS.map(({ icon: Icon }, i) => {
            const selected = i === active;
            return (
              <button
                key={i}
                id={`segment-tab-${i}`}
                role="tab"
                type="button"
                aria-selected={selected}
                aria-controls="segment-panel"
                onClick={() => setActive(i)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  selected
                    ? "border-foreground bg-foreground text-background"
                    : "bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
                {t(`segments.items.${i}.name`)}
              </button>
            );
          })}
        </div>
      </div>

      <div
        id="segment-panel"
        role="tabpanel"
        aria-labelledby={`segment-tab-${active}`}
        className="mt-6"
      >
        <p className="font-display text-xl font-semibold">{t(`segments.items.${active}.intro`)}</p>
        <div key={active} className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in-up">
          {segment.docIcons.map((Icon, d) => (
            <div
              key={d}
              className="group rounded-2xl border bg-background p-6 transition-colors hover:border-brand/40 hover:bg-brand-soft/40"
            >
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-brand-soft text-brand flex items-center justify-center transition-transform group-hover:-rotate-6">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="font-mono text-xs text-muted-foreground">.docx → .pdf</span>
              </div>
              <h3 className="mt-5 font-display text-xl font-semibold">
                {t(`segments.items.${active}.docs.${d}.title`)}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t(`segments.items.${active}.docs.${d}.description`)}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-muted-foreground">{t("segments.yours")}</p>
      </div>
    </section>
  );
}
