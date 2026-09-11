"use client";

import { Badge } from "@submitin/ui/components/badge";
import { Loader2 } from "lucide-react";
import { useTranslations } from "@/lib/i18n-context";

/** Substitui `{chave}` na mensagem traduzida. */
export function fmt(message: string, vars: Record<string, string | number>): string {
  return message.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? `{${key}}`));
}

const STATUS_VARIANT = {
  recebida: "secondary",
  processando: "secondary",
  concluida: "success",
  falha: "destructive",
  limite: "warning",
} as const;

export function DocumentStatusBadge({ status }: { status: string }) {
  const t = useTranslations("documents");
  const variant = STATUS_VARIANT[status as keyof typeof STATUS_VARIANT] ?? "secondary";
  const pending = status === "recebida" || status === "processando";
  return (
    <Badge variant={variant} className="gap-1 whitespace-nowrap">
      {pending && <Loader2 className="w-3 h-3 animate-spin" />}
      {t(`status.${status}`)}
    </Badge>
  );
}

export const FIELD_TYPE_KEYS = [
  "text",
  "textarea",
  "email",
  "phone",
  "cpf",
  "cnpj",
  "cep",
  "date",
  "currency",
  "number",
  "select",
  "checkbox",
  "rating",
] as const;

/** Rótulo do tipo de campo (reaproveita as traduções do construtor). */
export function useFieldTypeLabel() {
  const t = useTranslations("formBuilder");
  return (type: string) => t(`fieldTypes.${type}`);
}
