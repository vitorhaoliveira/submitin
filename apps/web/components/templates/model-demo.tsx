"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Loader2, RotateCcw, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@submitin/ui/components/button";
import { Input } from "@submitin/ui/components/input";
import { Label } from "@submitin/ui/components/label";
import { Textarea } from "@submitin/ui/components/textarea";
import { maskInput } from "@submitin/documents/input";
import type { ModelField } from "@/lib/templates/model-fields";

const PdfPreview = dynamic(() => import("@/components/documents/pdf-preview"), { ssr: false });

const PLACEHOLDERS: Record<string, string> = {
  cpf: "000.000.000-00",
  cnpj: "00.000.000/0000-00",
  cep: "00000-000",
  phone: "(00) 00000-0000",
  currency: "0,00",
  email: "nome@exemplo.com",
};

/** Formulário do modelo na página pública + PDF de amostra gerado de verdade. */
export function ModelDemo({
  slug,
  fields,
  sample,
  useHref,
}: {
  slug: string;
  fields: ModelField[];
  sample: Record<string, string>;
  useHref: string;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [renderFailed, setRenderFailed] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const onRenderError = useCallback(() => setRenderFailed(true), []);

  useEffect(() => () => void (pdfUrl && URL.revokeObjectURL(pdfUrl)), [pdfUrl]);

  const company = fields.filter((f) => f.company);
  const asked = fields.filter((f) => !f.company && f.nature !== "automatica");

  function set(key: string, type: string, raw: string) {
    setValues((prev) => ({ ...prev, [key]: maskInput(type, raw) }));
  }

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setGenerating(true);
    setError(null);
    // pdf.js baixa enquanto o servidor converte.
    void import("@/components/documents/pdf-preview");
    try {
      const res = await fetch(`/api/modelos/${slug}/demo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Não foi possível gerar o PDF.");
      }
      const blob = await res.blob();
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      setRenderFailed(false);
      setPdfUrl(URL.createObjectURL(blob));
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível gerar o PDF.");
    } finally {
      setGenerating(false);
    }
  }

  function renderField(field: ModelField) {
    const id = `model-${field.key}`;
    const value = values[field.key] ?? "";
    let control: React.ReactNode;
    if (field.type === "select" && field.options) {
      control = (
        <select
          id={id}
          value={value}
          onChange={(e) => set(field.key, "text", e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Escolha…</option>
          {field.options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
    } else if (field.type === "textarea") {
      control = <Textarea id={id} rows={2} value={value} onChange={(e) => set(field.key, "text", e.target.value)} />;
    } else {
      control = (
        <Input
          id={id}
          type={field.type === "date" ? "date" : field.type === "email" ? "email" : "text"}
          inputMode={["cpf", "cnpj", "cep", "phone", "currency", "day"].includes(field.type) ? "numeric" : undefined}
          placeholder={PLACEHOLDERS[field.type]}
          value={value}
          onChange={(e) => set(field.key, field.type, e.target.value)}
        />
      );
    }
    return (
      <div key={field.key} className={field.type === "textarea" ? "space-y-1.5 sm:col-span-2" : "space-y-1.5"}>
        <Label htmlFor={id}>{field.label}</Label>
        {control}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <form onSubmit={generate} className="space-y-8 rounded-3xl border bg-background p-5 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight">Teste o modelo</h2>
            <p className="text-sm text-muted-foreground">
              É este formulário que o seu cliente preenche. Gere um PDF de exemplo para ver o resultado.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setValues(sample)} className="gap-1.5">
            <Wand2 className="h-4 w-4" />
            Preencher com exemplo
          </Button>
        </div>

        {company.length > 0 && (
          <fieldset className="space-y-4 rounded-2xl bg-muted/50 p-4 sm:p-5">
            <legend className="sr-only">Dados da empresa</legend>
            <div>
              <p className="text-sm font-semibold">Dados da sua empresa</p>
              <p className="text-xs text-muted-foreground">
                Você preenche uma vez; eles entram em todos os documentos e não aparecem para o cliente.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">{company.map(renderField)}</div>
          </fieldset>
        )}

        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold">O que o cliente preenche</legend>
          <div className="grid gap-4 sm:grid-cols-2">{asked.map(renderField)}</div>
          <p className="text-xs text-muted-foreground">
            A data de assinatura entra sozinha, por extenso. CPF e CNPJ são validados de verdade.
          </p>
        </fieldset>

        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" size="lg" disabled={generating} className="gap-2">
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {generating ? "Gerando o PDF…" : "Gerar PDF de exemplo"}
          </Button>
          <span className="text-xs text-muted-foreground">Nada é salvo. O exemplo sai com o selo do Submitin.</span>
        </div>
      </form>

      {pdfUrl && (
        <div ref={resultRef} className="scroll-mt-24 space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-brand">Resultado</p>
              <h2 className="font-display text-2xl font-bold tracking-tight">Seu PDF, gerado agora</h2>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => setPdfUrl(null)} className="gap-1.5">
              <RotateCcw className="h-4 w-4" />
              Editar dados
            </Button>
          </div>
          <div className="mx-auto max-w-2xl rounded-2xl bg-muted/60 p-3 sm:p-5">
            {renderFailed ? (
              <p className="p-6 text-center text-sm">
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-brand underline">
                  Abrir o PDF
                </a>
              </p>
            ) : (
              <PdfPreview url={pdfUrl} onError={onRenderError} loadingLabel="Carregando páginas…" />
            )}
          </div>
          <div className="flex flex-col items-center gap-3 rounded-3xl bg-foreground px-6 py-8 text-center text-background">
            <p className="font-display text-2xl font-bold [text-wrap:balance]">
              Gostou? Use este modelo com a marca da sua empresa.
            </p>
            <p className="max-w-lg text-sm text-background/70">
              Crie sua conta grátis, ajuste o que quiser no Word e mande o link para os seus clientes.
            </p>
            <Button asChild size="lg" variant="secondary" className="mt-2">
              <Link href={useHref}>
                Usar este modelo <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
