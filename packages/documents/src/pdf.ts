/**
 * Conversão .docx → PDF via Gotenberg (LibreOffice headless).
 * Não reimplementamos layout: o LibreOffice renderiza o documento original.
 */

// Folga para a partida a frio do Cloud Run (~10 s na primeira conversão).
const DEFAULT_TIMEOUT_MS = 45_000;

export class PdfConversionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PdfConversionError";
  }
}

export async function convertDocxToPdf(
  docx: Buffer | Uint8Array,
  options: { gotenbergUrl?: string; timeoutMs?: number; filename?: string } = {}
): Promise<Buffer> {
  const baseUrl = options.gotenbergUrl ?? process.env.GOTENBERG_URL;
  if (!baseUrl) throw new PdfConversionError("GOTENBERG_URL não configurado.");

  const form = new FormData();
  form.append(
    "files",
    new Blob([new Uint8Array(docx)], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }),
    options.filename ?? "documento.docx"
  );

  const headers: Record<string, string> = {};
  if (process.env.GOTENBERG_BASIC_AUTH) {
    headers.Authorization = `Basic ${Buffer.from(process.env.GOTENBERG_BASIC_AUTH).toString("base64")}`;
  }

  let res: Response;
  try {
    res = await fetch(`${baseUrl.replace(/\/$/, "")}/forms/libreoffice/convert`, {
      method: "POST",
      body: form,
      headers,
      signal: AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS),
    });
  } catch (err) {
    throw new PdfConversionError(`Falha ao contatar o conversor de PDF: ${(err as Error).message}`);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new PdfConversionError(`Conversor de PDF respondeu ${res.status}: ${body.slice(0, 200)}`);
  }
  return Buffer.from(await res.arrayBuffer());
}
