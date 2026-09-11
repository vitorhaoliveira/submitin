"use client";

import { useState } from "react";
import { CheckCircle2, FileSearch, Loader2, XCircle } from "lucide-react";

type Result = "idle" | "checking" | "match" | "mismatch";

/** Calcula o SHA-256 do PDF escolhido no navegador e compara com o registrado. */
export function VerifyFile({ expectedSha256 }: { expectedSha256: string }) {
  const [result, setResult] = useState<Result>("idle");
  const [fileName, setFileName] = useState("");

  async function check(file: File | undefined) {
    if (!file) return;
    setFileName(file.name);
    setResult("checking");
    const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
    const hex = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
    setResult(hex === expectedSha256 ? "match" : "mismatch");
  }

  return (
    <div className="space-y-3">
      <label
        htmlFor="verify-file"
        className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-6 text-center transition-colors hover:border-brand hover:bg-brand-soft/40"
      >
        <FileSearch className="h-6 w-6 text-muted-foreground" />
        <span className="text-sm font-medium">Conferir um arquivo PDF</span>
        <span className="text-xs text-muted-foreground">
          Escolha o PDF que você recebeu para saber se é idêntico ao original.
        </span>
        <input
          id="verify-file"
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          onChange={(e) => void check(e.target.files?.[0])}
        />
      </label>

      {result === "checking" && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
          <Loader2 className="h-4 w-4 animate-spin" /> Conferindo {fileName}…
        </p>
      )}
      {result === "match" && (
        <p className="flex items-start gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800" role="status">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <strong>Arquivo autêntico.</strong> {fileName} é idêntico ao documento entregue.
          </span>
        </p>
      )}
      {result === "mismatch" && (
        <p className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800" role="status">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <strong>Não confere.</strong> {fileName} é diferente do documento entregue — pode ter sido
            alterado ou ser outro arquivo.
          </span>
        </p>
      )}
    </div>
  );
}
