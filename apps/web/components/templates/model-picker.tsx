"use client";

import Link from "next/link";
import { ArrowRight, ExternalLink, FileText } from "lucide-react";
import { DOCUMENT_MODELS } from "@/lib/templates/catalog";

/** Modelos prontos dentro do painel: "Usar" cria o documento a partir do modelo. */
export function ModelPicker({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <section className="space-y-3" aria-label={title}>
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {DOCUMENT_MODELS.map((m, i) => (
          <li
            key={m.slug}
            className={`flex items-start gap-3 rounded-xl border bg-background p-4 transition-colors hover:border-brand/50 ${
              i === DOCUMENT_MODELS.length - 1 && DOCUMENT_MODELS.length % 2 === 1 ? "sm:col-span-2" : ""
            }`}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
              <FileText className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium leading-tight">{m.title}</p>
              <p className="text-xs text-muted-foreground">{m.segment}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <Link
                  href={`/dashboard/documents/new?modelo=${m.slug}`}
                  className="inline-flex items-center gap-1 font-medium text-brand hover:underline"
                >
                  Usar este modelo <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <a
                  href={`/modelos/${m.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                >
                  Ver exemplo <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
