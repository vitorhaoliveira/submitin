"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@submitin/ui/components/button";
import { Input } from "@submitin/ui/components/input";
import { Label } from "@submitin/ui/components/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@submitin/ui/components/card";
import { AlertTriangle, ArrowLeft, FileUp, Loader2, XCircle } from "lucide-react";
import { useTranslations } from "@/lib/i18n-context";
import { toast } from "@/hooks/use-toast";
import { fmt, useFieldTypeLabel } from "./shared";

type Preview = {
  fileName: string;
  variables: { key: string; label: string; type: string }[];
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
      <div className="flex items-center gap-4">
        <Link href="/dashboard/documents">
          <Button variant="ghost" size="icon" aria-label={t("detail.back")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("newPage.title")}</h1>
          <p className="text-muted-foreground">{t("newPage.subtitle")}</p>
        </div>
      </div>

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
            className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-14 text-center cursor-pointer transition-colors ${
              dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/40"
            }`}
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
              <>
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="font-medium">{t("newPage.analyzing")}</p>
              </>
            ) : (
              <>
                <FileUp className="w-10 h-10 text-primary" />
                <p className="font-medium">{t("newPage.dropTitle")}</p>
                <p className="text-sm text-muted-foreground">{t("newPage.dropHint")}</p>
              </>
            )}
          </label>

          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-2">
              <p className="flex items-center gap-2 font-medium text-destructive">
                <XCircle className="w-4 h-4 shrink-0" />
                {error.error}
              </p>
              {error.details && error.details.length > 0 && (
                <ul className="list-disc pl-10 text-sm text-destructive/90 space-y-1">
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
              <p className="rounded-lg bg-muted/60 px-4 py-3 leading-relaxed">
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
                      <td className="px-3 py-2">{v.label}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{fieldTypeLabel(v.type)}</td>
                      <td className="px-3 py-2 font-mono text-xs text-primary/80 whitespace-nowrap">{`{{${v.key}}}`}</td>
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

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-800 dark:text-amber-300">
      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
      <p>{children}</p>
    </div>
  );
}
