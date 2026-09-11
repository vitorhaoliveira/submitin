"use client";

import { useState } from "react";
import { Input } from "@submitin/ui/components/input";
import { Textarea } from "@submitin/ui/components/textarea";
import { Label } from "@submitin/ui/components/label";
import { Switch } from "@submitin/ui/components/switch";
import { Badge } from "@submitin/ui/components/badge";
import { cn } from "@submitin/ui/lib/utils";
import { ArrowDown, ArrowUp, ChevronDown, Wand2 } from "lucide-react";
import { AUTOMATIC_KEYS, EXTENSO_SUFFIX } from "@submitin/documents/variables";
import { maskInput } from "@submitin/documents/input";
import { useTranslations } from "@/lib/i18n-context";
import { toast } from "@/hooks/use-toast";
import { useFieldTypeLabel } from "./shared";

export type Nature = "pergunta" | "fixa" | "pre_preenchida" | "automatica";

export type DocField = {
  id: string;
  label: string;
  type: string;
  required: boolean;
  variableKey: string | null;
  nature: Nature;
  defaultValue: string | null;
  helpText: string | null;
  options: string[] | null;
};

/** Tipos oferecidos na classificação (subconjunto do motor de formulário). */
const TYPES = [
  "text", "textarea", "select", "cpf", "cnpj", "email", "phone", "cep",
  "date", "day", "currency", "percent", "number", "checkbox",
] as const;

const NATURE_ORDER: Nature[] = ["pergunta", "fixa", "pre_preenchida", "automatica"];

type Patch = Partial<Pick<DocField, "nature" | "defaultValue" | "helpText" | "label" | "type" | "required" | "options">>;

/**
 * Classificação das variáveis do documento (spec, seção 3):
 * pergunta · fixa · pré-preenchida (link) · automática.
 */
export function VariablesEditor({
  formId,
  fields,
  templateKeys,
  onChange,
}: {
  formId: string;
  fields: DocField[];
  templateKeys: string[];
  onChange: (fields: DocField[]) => void;
}) {
  const t = useTranslations("documents");
  const [openId, setOpenId] = useState<string | null>(null);

  async function save(field: DocField, patch: Patch) {
    const previous = fields;
    onChange(fields.map((f) => (f.id === field.id ? { ...f, ...patch } : f)));
    try {
      const res = await fetch(`/api/forms/${formId}/fields/${field.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error);
    } catch (err) {
      onChange(previous);
      toast({
        title: t("detail.fields.saveError"),
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    }
  }

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= fields.length) return;
    const previous = fields;
    const next = [...fields];
    [next[index], next[target]] = [next[target]!, next[index]!];
    onChange(next);
    const res = await fetch(`/api/forms/${formId}/fields`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields: next.map((f, order) => ({ id: f.id, order })) }),
    }).catch(() => null);
    if (!res?.ok) onChange(previous);
  }

  // `*_extenso` do template: derivadas, sempre automáticas.
  const derived = templateKeys.filter((k) => k.endsWith(EXTENSO_SUFFIX));

  return (
    <div className="space-y-3">
      <ul className="divide-y rounded-lg border">
        {fields.map((field, index) => (
          <VariableRow
            key={field.id}
            field={field}
            open={openId === field.id}
            onToggle={() => setOpenId(openId === field.id ? null : field.id)}
            onSave={(patch) => save(field, patch)}
            onMoveUp={index > 0 ? () => move(index, -1) : undefined}
            onMoveDown={index < fields.length - 1 ? () => move(index, 1) : undefined}
          />
        ))}
        {derived.map((key) => (
          <li key={key} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5 text-sm text-muted-foreground">
            <Wand2 className="w-4 h-4 shrink-0" />
            <code className="font-mono text-xs text-brand">{`{{${key}}}`}</code>
            <span>{t("detail.fields.derived").replace("{base}", key.slice(0, -EXTENSO_SUFFIX.length))}</span>
            <Badge variant="secondary" className="ml-auto">{t("natures.automatica")}</Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}

function VariableRow({
  field,
  open,
  onToggle,
  onSave,
  onMoveUp,
  onMoveDown,
}: {
  field: DocField;
  open: boolean;
  onToggle: () => void;
  onSave: (patch: Patch) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  const t = useTranslations("documents");
  const fieldTypeLabel = useFieldTypeLabel();
  const canBeAutomatic = Boolean(field.variableKey && field.variableKey in AUTOMATIC_KEYS);
  const asked = field.nature === "pergunta" || field.nature === "pre_preenchida";

  return (
    <li className="text-sm">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5">
        <div className="flex flex-col -my-1">
          <button type="button" onClick={onMoveUp} disabled={!onMoveUp} aria-label={t("detail.fields.moveUp")}
            className="p-0.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-25">
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={onMoveDown} disabled={!onMoveDown} aria-label={t("detail.fields.moveDown")}
            className="p-0.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-25">
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
        </div>

        <button type="button" onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-2 text-left" aria-expanded={open}>
          <span className="min-w-0">
            <span className="block truncate font-medium">{field.label}</span>
            <span className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
              {field.variableKey && <code className="font-mono text-brand">{`{{${field.variableKey}}}`}</code>}
              <span>{fieldTypeLabel(field.type)}</span>
              {asked && field.required && <span>· {t("detail.fields.required")}</span>}
              {field.nature === "fixa" && (
                <span className={cn(!field.defaultValue && "text-amber-700")}>
                  · {field.defaultValue || t("detail.fields.fixedMissing")}
                </span>
              )}
            </span>
          </span>
          <ChevronDown className={cn("ml-auto w-4 h-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
        </button>

        {/* Natureza */}
        <div role="radiogroup" aria-label={t("detail.fields.nature")} className="inline-flex flex-wrap rounded-full border p-0.5 text-xs">
          {NATURE_ORDER.filter((n) => n !== "automatica" || canBeAutomatic).map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={field.nature === n}
              onClick={() => field.nature !== n && onSave({ nature: n })}
              className={cn(
                "rounded-full px-2.5 py-1 font-medium transition-colors",
                field.nature === n
                  ? n === "pergunta"
                    ? "bg-foreground text-background"
                    : "bg-brand text-brand-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t(`natures.${n}`)}
            </button>
          ))}
        </div>
      </div>

      {open && <VariableDetails field={field} onSave={onSave} />}
    </li>
  );
}

function VariableDetails({ field, onSave }: { field: DocField; onSave: (patch: Patch) => void }) {
  const t = useTranslations("documents");
  const fieldTypeLabel = useFieldTypeLabel();
  const [label, setLabel] = useState(field.label);
  const [helpText, setHelpText] = useState(field.helpText ?? "");
  const [options, setOptions] = useState((field.options ?? []).join("\n"));
  const [fixed, setFixed] = useState(field.defaultValue ?? "");
  const asked = field.nature === "pergunta" || field.nature === "pre_preenchida";

  return (
    <div className="grid gap-4 border-t bg-muted/20 px-3 py-4 sm:grid-cols-2">
      <p className="sm:col-span-2 text-xs text-muted-foreground">{t(`detail.fields.natureHelp.${field.nature}`)}</p>

      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor={`label-${field.id}`}>{t("detail.fields.question")}</Label>
        <Input
          id={`label-${field.id}`}
          value={label}
          maxLength={200}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLabel(e.target.value)}
          onBlur={() => label.trim() && label !== field.label && onSave({ label: label.trim() })}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`type-${field.id}`}>{t("detail.fields.type")}</Label>
        <select
          id={`type-${field.id}`}
          value={field.type}
          onChange={(e) => {
            const type = e.target.value;
            if (type === "select" && !(field.options?.length)) {
              onSave({ type, options: ["Sim", "Não"] });
              setOptions("Sim\nNão");
            } else onSave({ type });
          }}
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm"
        >
          {TYPES.map((type) => (
            <option key={type} value={type}>{fieldTypeLabel(type)}</option>
          ))}
        </select>
      </div>

      {asked && (
        <div className="flex items-center justify-between gap-3 rounded-md border bg-background px-3 py-2">
          <Label htmlFor={`req-${field.id}`}>{t("detail.fields.required")}</Label>
          <Switch
            id={`req-${field.id}`}
            checked={field.required}
            onCheckedChange={(checked: boolean) => onSave({ required: checked })}
          />
        </div>
      )}

      {field.type === "select" && (
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor={`opts-${field.id}`}>{t("detail.fields.options")}</Label>
          <Textarea
            id={`opts-${field.id}`}
            rows={4}
            value={options}
            placeholder={t("detail.fields.optionsPlaceholder")}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setOptions(e.target.value)}
            onBlur={() => {
              const list = options.split("\n").map((o) => o.trim()).filter(Boolean);
              if (list.join("\n") !== (field.options ?? []).join("\n")) onSave({ options: list });
            }}
          />
          <p className="text-xs text-muted-foreground">{t("detail.fields.optionsHint")}</p>
        </div>
      )}

      {field.nature === "fixa" && (
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor={`fixed-${field.id}`}>{t("detail.fields.fixedValue")}</Label>
          <Input
            id={`fixed-${field.id}`}
            type={field.type === "date" ? "date" : "text"}
            value={fixed}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFixed(maskInput(field.type, e.target.value))}
            onBlur={() => fixed !== (field.defaultValue ?? "") && onSave({ defaultValue: fixed.trim() || null })}
          />
        </div>
      )}

      {asked && (
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor={`help-${field.id}`}>{t("detail.fields.helpText")}</Label>
          <Input
            id={`help-${field.id}`}
            value={helpText}
            maxLength={300}
            placeholder={t("detail.fields.helpTextPlaceholder")}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHelpText(e.target.value)}
            onBlur={() => helpText !== (field.helpText ?? "") && onSave({ helpText: helpText.trim() || null })}
          />
        </div>
      )}
    </div>
  );
}
