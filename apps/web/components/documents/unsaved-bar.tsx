"use client";

import { useEffect } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@submitin/ui/components/button";
import { useTranslations } from "@/lib/i18n-context";

/** Pede confirmação ao recarregar/fechar a aba com alterações não salvas. */
export function useUnsavedWarning(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
}

/**
 * Rodapé de card com salvamento manual: com alterações pendentes vira uma barra
 * fixa no fim da tela (Descartar / Salvar); sem alterações mostra "Tudo salvo".
 */
export function UnsavedBar({
  dirty,
  saving,
  onSave,
  onDiscard,
  saveLabel,
}: {
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
  onDiscard: () => void;
  saveLabel: string;
}) {
  const tDocs = useTranslations("documents");
  const t = (key: string) => tDocs(`detail.unsaved.${key}`);
  useUnsavedWarning(dirty);

  if (!dirty) {
    return (
      <p className="flex items-center gap-1.5 text-sm text-muted-foreground" aria-live="polite">
        <Check className="h-4 w-4 text-emerald-600" />
        {t("allSaved")}
      </p>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/95 px-4 py-3 shadow-lg backdrop-blur animate-fade-in-up"
    >
      <span className="flex items-center gap-2 text-sm font-medium text-amber-900">
        <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" />
        {t("message")}
      </span>
      <div className="flex gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onDiscard} disabled={saving}>
          {t("discard")}
        </Button>
        <Button type="button" size="sm" onClick={onSave} disabled={saving} className="gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saveLabel}
        </Button>
      </div>
    </div>
  );
}
