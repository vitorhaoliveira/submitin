"use client";

import { useState } from "react";
import { Input } from "@submitin/ui/components/input";
import { Badge } from "@submitin/ui/components/badge";
import { cn } from "@submitin/ui/lib/utils";
import { maskInput } from "@submitin/documents/input";
import { useTranslations } from "@/lib/i18n-context";
import { toast } from "@/hooks/use-toast";
import { useFieldTypeLabel } from "./shared";

export type DocField = {
  id: string;
  label: string;
  type: string;
  required: boolean;
  variableKey: string | null;
  filledBy: "client" | "company";
  defaultValue: string | null;
};

/**
 * Lista de campos do documento com a escolha de quem preenche cada um.
 * Campos da empresa saem do formulário do cliente e podem ter um valor fixo.
 */
export function FieldsFillList({
  formId,
  fields,
  onChange,
}: {
  formId: string;
  fields: DocField[];
  onChange: (fields: DocField[]) => void;
}) {
  const t = useTranslations("documents");
  const fieldTypeLabel = useFieldTypeLabel();
  const [savingId, setSavingId] = useState<string | null>(null);

  async function save(field: DocField, patch: Partial<Pick<DocField, "filledBy" | "defaultValue">>) {
    const previous = fields;
    onChange(fields.map((f) => (f.id === field.id ? { ...f, ...patch } : f)));
    setSavingId(field.id);
    try {
      const res = await fetch(`/api/forms/${formId}/fields/${field.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error();
    } catch {
      onChange(previous);
      toast({ title: t("detail.fields.saveError"), variant: "destructive" });
    } finally {
      setSavingId(null);
    }
  }

  return (
    <ul className="divide-y rounded-lg border">
      {fields.map((field) => {
        const company = field.filledBy === "company";
        return (
          <li key={field.id} className="px-3 py-3 text-sm space-y-2.5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <span className="font-medium">{field.label}</span>
              {field.required && !company && (
                <Badge variant="outline" className="text-xs">
                  {t("detail.fields.required")}
                </Badge>
              )}
              <span className="text-muted-foreground">{fieldTypeLabel(field.type)}</span>
              {field.variableKey && (
                <code className="hidden sm:block text-xs font-mono text-brand">{`{{${field.variableKey}}}`}</code>
              )}

              {/* Quem preenche */}
              <div
                role="radiogroup"
                aria-label={t("detail.fields.whoFills")}
                className="ml-auto inline-flex rounded-full border p-0.5 text-xs"
              >
                {(["client", "company"] as const).map((who) => (
                  <button
                    key={who}
                    type="button"
                    role="radio"
                    aria-checked={field.filledBy === who}
                    disabled={savingId === field.id}
                    onClick={() => field.filledBy !== who && save(field, { filledBy: who })}
                    className={cn(
                      "rounded-full px-2.5 py-1 font-medium transition-colors",
                      field.filledBy === who
                        ? who === "company"
                          ? "bg-brand text-brand-foreground"
                          : "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {who === "client" ? t("detail.fields.client") : t("detail.fields.company")}
                  </button>
                ))}
              </div>
            </div>

            {company && (
              <DefaultValueInput
                field={field}
                onSave={(value) => save(field, { defaultValue: value || null })}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}

function DefaultValueInput({ field, onSave }: { field: DocField; onSave: (value: string) => void }) {
  const t = useTranslations("documents");
  const [value, setValue] = useState(field.defaultValue ?? "");
  const inputType = field.type === "date" ? "date" : "text";

  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
      <label htmlFor={`default-${field.id}`} className="shrink-0 text-xs text-muted-foreground">
        {t("detail.fields.fixedValue")}
      </label>
      <Input
        id={`default-${field.id}`}
        type={inputType}
        value={value}
        placeholder={t("detail.fields.fixedValuePlaceholder")}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(maskInput(field.type, e.target.value))}
        onBlur={() => value !== (field.defaultValue ?? "") && onSave(value.trim())}
        className="h-8 text-sm"
      />
    </div>
  );
}
