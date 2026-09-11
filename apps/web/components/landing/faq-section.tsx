"use client";

import { useState } from "react";
import { useTranslations } from "@/lib/i18n-context";
import { ChevronDown } from "lucide-react";

export function FaqSection() {
  const t = useTranslations("landing");
  const [open, setOpen] = useState<number | null>(0);

  const items = [0, 1, 2, 3, 4, 5].map((i) => ({
    q: t(`faq.items.${i}.q`),
    a: t(`faq.items.${i}.a`),
  }));

  return (
    <section id="faq" className="container mx-auto px-4 py-24">
      <div className="text-center mb-12">
        <h2 className="font-display text-4xl md:text-5xl font-bold mb-3 tracking-tight">
          {t("faq.title")}
        </h2>
        <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
          {t("faq.subtitle")}
        </p>
      </div>

      <div className="max-w-3xl mx-auto divide-y rounded-2xl border">
        {items.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={i} className="overflow-hidden">
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="w-full flex items-center justify-between gap-4 p-5 text-left"
                aria-expanded={isOpen}
              >
                <span className="font-display text-lg font-semibold">{item.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-300 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`grid transition-all duration-300 ease-out ${
                  isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
                    {item.a}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
