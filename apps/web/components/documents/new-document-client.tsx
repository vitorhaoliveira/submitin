"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@submitin/ui/components/button";
import { Input } from "@submitin/ui/components/input";
import { Label } from "@submitin/ui/components/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@submitin/ui/components/card";
import { AlertTriangle, Braces, FileText, FileType2, Loader2, Upload, XCircle } from "lucide-react";
import { cn } from "@submitin/ui/lib/utils";
import { PageHeader } from "@/components/page-header";
import { useTranslations } from "@/lib/i18n-context";
import { toast } from "@/hooks/use-toast";
import { fmt, useFieldTypeLabel } from "./shared";

type Preview = {
  fileName: string;
  variables: { key: string; label: string; type: string; nature: string }[];
  missingFonts: string[];
  unsupportedTags: string[];
};

type UploadError = { error: string; details?: string[] };

export function NewDocumentClient() {
  const t = useTranslations("documents");
  const tCommon = useTranslations("common");
  const fieldTypeLabel = useFieldTypeLabel();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<UploadError | null>(null);
  const [name, setName] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [dragging, setDragging] = useState(false);

  async function analyze(selected: File) {
    setFile(selected);
    setPreview(null);
    setError(null);
    setAnalyzing(true);
    try {
      const body = new FormData();
      body.append("file", selected);
      const res = await fetch("/api/documents/preview", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        setError(data as UploadError);
        return;
      }
      setPreview(data as Preview);
      setName(selected.name.replace(/\.docx$/i, ""));
    } catch {
      setError({ error: t("newPage.error") });
    } finally {
      setAnalyzing(false);
    }
  }

  async function create() {
    if (!file) return;
    setCreating(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("name", name);
      const res = await fetch("/api/documents", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/dashboard/documents/${data.id}`);
    } catch (err) {
      toast({
        title: tCommon("error"),
        description: err instanceof Error ? err.message : t("newPage.error"),
        variant: "destructive",
      });
      setCreating(false);
    }
  }

  function reset() {
    setFile(null);
    setPreview(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title={t("newPage.title")}
        description={t("newPage.subtitle")}
        backHref="/dashboard/documents"
        backLabel={t("title")}
      />

      {!preview && (
        <>
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const dropped = e.dataTransfer.files[0];
              if (dropped) void analyze(dropped);
            }}
            className={cn(
              "flex min-h-64 cursor-pointer flex-col items-center justify-center gap-5 rounded-xl border border-dashed px-6 py-10 text-center transition-colors",
              dragging
                ? "border-brand/50 bg-brand-soft"
                : "border-foreground/20 hover:border-foreground/35 hover:bg-muted/30"
            )}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="sr-only"
              onChange={(e) => {
                const selected = e.target.files?.[0];
                if (selected) void analyze(selected);
              }}
            />
            {analyzing ? (
              <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
            ) : (
              <UploadIconCluster dragging={dragging} />
            )}
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {analyzing ? t("newPage.analyzing") : t("newPage.dropTitle")}
              </p>
              <p className="text-xs text-muted-foreground">{t("newPage.dropHint")}</p>
            </div>
            {!analyzing && (
              <span className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
                <Upload className="w-3.5 h-3.5" />
                {t("newPage.browse")}
              </span>
            )}
          </label>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-2">
              <p className="flex items-center gap-2 text-sm font-medium text-red-700">
                <XCircle className="w-4 h-4 shrink-0" />
                {error.error}
              </p>
              {error.details && error.details.length > 0 && (
                <ul className="list-disc pl-10 text-sm text-red-700/90 space-y-1">
                  {error.details.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("newPage.howTo")}</CardTitle>
              <CardDescription>{t("newPage.howToText")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="rounded-md border bg-muted/40 px-4 py-3 font-mono text-xs leading-relaxed">
                {t("newPage.example")}
              </p>
              <p className="text-muted-foreground">{t("newPage.howToTips")}</p>
            </CardContent>
          </Card>
        </>
      )}

      {preview && (
        <Card className="animate-fade-in-up">
          <CardHeader>
            <CardTitle>{fmt(t("newPage.detected"), { count: preview.variables.length })}</CardTitle>
            <CardDescription>{t("newPage.detectedDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="doc-name">{t("newPage.name")}</Label>
              <Input
                id="doc-name"
                value={name}
                maxLength={100}
                placeholder={t("newPage.namePlaceholder")}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              />
            </div>

            {preview.missingFonts.length > 0 && (
              <Warning>{fmt(t("newPage.missingFonts"), { fonts: preview.missingFonts.join(", ") })}</Warning>
            )}
            {preview.unsupportedTags.length > 0 && (
              <Warning>{fmt(t("newPage.unsupported"), { tags: preview.unsupportedTags.join(", ") })}</Warning>
            )}

            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">{t("newPage.label")}</th>
                    <th className="px-3 py-2 font-medium">{t("newPage.type")}</th>
                    <th className="px-3 py-2 font-medium">{t("newPage.variable")}</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.variables.map((v) => (
                    <tr key={v.key} className="border-t">
                      <td className="px-3 py-2">
                        {v.label}
                        {v.nature !== "pergunta" && (
                          <span className="ml-2 rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-medium text-brand">
                            {t(`natures.${v.nature}`)}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">{fieldTypeLabel(v.type)}</td>
                      <td className="px-3 py-2 font-mono text-xs text-brand whitespace-nowrap">{`{{${v.key}}}`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3">
              <Button variant="ghost" onClick={reset} disabled={creating}>
                {t("newPage.otherFile")}
              </Button>
              <Button onClick={create} disabled={creating || !name.trim()} className="gap-2">
                {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                {creating ? t("newPage.creating") : t("newPage.create")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/** Ícones de arquivo em leque que se abrem ao arrastar (inspirado no File Upload do 21st.dev). */
const ICON_TRANSFORMS = [
  { idle: "translate(-96%, -50%) rotate(-8deg)", active: "translate(-114%, -50%) rotate(-12deg) scale(1.08)" },
  { idle: "translate(-50%, -50%) rotate(0deg)", active: "translate(-50%, -50%) rotate(0deg) scale(1.18)" },
  { idle: "translate(-4%, -50%) rotate(8deg)", active: "translate(14%, -50%) rotate(12deg) scale(1.08)" },
];

function UploadIconCluster({ dragging }: { dragging: boolean }) {
  return (
    <div className="relative h-14 w-36" aria-hidden>
      {[Braces, FileType2, FileText].map((Icon, index) => (
        <div
          key={index}
          className={cn(
            "absolute top-1/2 left-1/2 grid size-12 place-items-center rounded-xl border bg-background text-muted-foreground shadow-sm transition-[transform,color,box-shadow] duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
            index === 1 && "z-10",
            dragging && "text-brand shadow-md",
            index === 1 && !dragging && "text-brand"
          )}
          style={{ transform: dragging ? ICON_TRANSFORMS[index]?.active : ICON_TRANSFORMS[index]?.idle }}
        >
          <Icon className="size-5" />
        </div>
      ))}
    </div>
  );
}

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
      <p>{children}</p>
    </div>
  );
}
