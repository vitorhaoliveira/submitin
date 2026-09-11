"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

/**
 * Renderiza o PDF do preview em canvas com pdf.js. Carregado sob demanda
 * (next/dynamic) só quando o respondente pede para revisar o documento.
 */
/** pdf.js 6 usa Promise.withResolvers, ausente no iOS < 17.4 (o worker tem o seu em public/vendor). */
function polyfillWithResolvers() {
  const P = Promise as PromiseConstructor & { withResolvers?: unknown };
  if (P.withResolvers) return;
  P.withResolvers = function <T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

export default function PdfPreview({
  url,
  onError,
  loadingLabel,
}: {
  url: string;
  onError: () => void;
  loadingLabel: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let destroy: (() => void) | undefined;

    (async () => {
      polyfillWithResolvers();
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
      pdfjs.GlobalWorkerOptions.workerSrc = "/vendor/pdf.worker.entry.mjs";
      const task = pdfjs.getDocument({ url });
      destroy = () => void task.destroy();
      const doc = await task.promise;

      const container = containerRef.current;
      if (cancelled || !container) return;
      container.replaceChildren();
      const width = container.clientWidth;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);

      for (let n = 1; n <= doc.numPages; n++) {
        const page = await doc.getPage(n);
        if (cancelled) return;
        const viewport = page.getViewport({ scale: (width / page.getViewport({ scale: 1 }).width) * ratio });
        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.style.width = "100%";
        canvas.className = "block rounded-sm bg-white shadow-sm ring-1 ring-black/5";
        canvas.setAttribute("aria-label", `Página ${n} de ${doc.numPages}`);
        container.appendChild(canvas);
        await page.render({ canvas, viewport }).promise;
        if (n === 1) setLoading(false);
      }
    })().catch((err) => {
      if (cancelled) return;
      console.error("[preview] pdf.js:", err);
      onError();
    });

    return () => {
      cancelled = true;
      destroy?.();
    };
  }, [url, onError]);

  return (
    <div className="relative">
      {loading && (
        <div className="flex aspect-[1/1.414] w-full items-center justify-center rounded-sm bg-white ring-1 ring-black/5">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {loadingLabel}
          </span>
        </div>
      )}
      <div ref={containerRef} className="space-y-3" />
    </div>
  );
}
