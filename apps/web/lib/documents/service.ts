import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@submitin/database";
import {
  detectMissingFonts,
  parseTemplate,
  TemplateError,
  type DocumentFieldType,
  type DocumentVariable,
} from "@submitin/documents";

export const DOCUMENT_STATUSES = ["recebida", "processando", "concluida", "falha", "limite"] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export const MAX_TEMPLATE_BYTES = 10 * 1024 * 1024;

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details: string[] = []
  ) {
    super(message);
  }
}

export function appBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.AUTH_URL || "http://localhost:3000").replace(
    /\/$/,
    ""
  );
}

// ---------------------------------------------------------------------------
// Upload do template
// ---------------------------------------------------------------------------

export type ParsedUpload = {
  buffer: Buffer;
  fileName: string;
  variables: DocumentVariable[];
  unsupportedTags: string[];
  missingFonts: string[];
};

/** Lê e valida o .docx enviado em multipart (campo "file"). */
export async function readTemplateUpload(formData: FormData): Promise<ParsedUpload> {
  const file = formData.get("file");
  if (!(file instanceof File)) throw new HttpError(400, "Envie um arquivo .docx.");
  if (!file.name.toLowerCase().endsWith(".docx")) {
    throw new HttpError(
      400,
      "Formato não suportado. Salve o arquivo no Word como .docx (Documento do Word)."
    );
  }
  if (file.size > MAX_TEMPLATE_BYTES) throw new HttpError(400, "Arquivo muito grande (máximo 10 MB).");

  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const { variables, unsupportedTags } = parseTemplate(buffer);
    return {
      buffer,
      fileName: file.name,
      variables,
      unsupportedTags,
      missingFonts: detectMissingFonts(buffer),
    };
  } catch (err) {
    if (err instanceof TemplateError) throw new HttpError(422, err.message, err.details);
    throw err;
  }
}

export function templateFileKey(userId: string, documentId: string, version: number): string {
  return `templates/${userId}/${documentId}/v${version}-${Date.now()}.docx`;
}

// ---------------------------------------------------------------------------
// Respostas → dados do template
// ---------------------------------------------------------------------------

type FieldLike = { id: string; type: string; label: string; order: number; variableKey: string | null };
type FieldValueLike = { fieldId: string; value: string };

const DOCUMENT_FIELD_TYPES = new Set<string>([
  "text", "textarea", "email", "phone", "cpf", "cnpj", "cep", "date", "currency",
]);

export function toDocumentFieldType(fieldType: string): DocumentFieldType {
  return DOCUMENT_FIELD_TYPES.has(fieldType) ? (fieldType as DocumentFieldType) : "text";
}

/** Monta variáveis (chave + tipo do campo atual) e respostas por chave de variável. */
export function templateInputFromResponse(
  templateKeys: string[],
  fields: FieldLike[],
  fieldValues: FieldValueLike[]
) {
  const valueByField = new Map(fieldValues.map((fv) => [fv.fieldId, fv.value]));
  const fieldByKey = new Map(
    fields.filter((f) => f.variableKey).map((f) => [f.variableKey as string, f])
  );

  const variables = templateKeys.map((key) => ({
    key,
    type: toDocumentFieldType(fieldByKey.get(key)?.type ?? "text"),
  }));
  const answers: Record<string, string> = {};
  for (const key of templateKeys) {
    const field = fieldByKey.get(key);
    let value = field ? (valueByField.get(field.id) ?? "") : "";
    if (field?.type === "checkbox") value = value === "true" ? "Sim" : "Não";
    answers[key] = value;
  }
  return { variables, answers };
}

/** Identificador da submissão na tela de Envios: primeiro campo de texto preenchido. */
export function responseIdentifier(fields: FieldLike[], fieldValues: FieldValueLike[]): string {
  const valueByField = new Map(fieldValues.map((fv) => [fv.fieldId, fv.value]));
  const ordered = [...fields].sort((a, b) => a.order - b.order);
  const firstText = ordered.find((f) => f.type === "text" && valueByField.get(f.id)?.trim());
  const fallback = ordered.find((f) => valueByField.get(f.id)?.trim());
  return (valueByField.get((firstText ?? fallback)?.id ?? "") ?? "").slice(0, 120);
}

export function safeFileName(...parts: string[]): string {
  return (
    parts
      .filter(Boolean)
      .join("_")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^\w\s.-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 100) || "documento"
  );
}

// ---------------------------------------------------------------------------
// Link público do PDF (webhook): token HMAC, sem expiração — PDF é imutável.
// ---------------------------------------------------------------------------

function tokenFor(generationId: string): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET não configurado.");
  return createHmac("sha256", secret).update(`document-pdf:${generationId}`).digest("base64url");
}

export function publicPdfUrl(generationId: string): string {
  return `${appBaseUrl()}/api/public/documents/${generationId}/pdf?token=${tokenFor(generationId)}`;
}

export function verifyPdfToken(generationId: string, token: string | null): boolean {
  if (!token) return false;
  const expected = Buffer.from(tokenFor(generationId));
  const received = Buffer.from(token);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

// ---------------------------------------------------------------------------
// Consumo do plano
// ---------------------------------------------------------------------------

export function startOfMonth(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** Documentos gerados com sucesso no mês corrente (falha não conta). */
export function monthlyDocumentUsage(userId: string): Promise<number> {
  return prisma.documentGeneration.count({
    where: {
      status: "concluida",
      completedAt: { gte: startOfMonth() },
      document: { userId },
    },
  });
}

/** Converte erros das rotas de documentos em JSON ({ error, details }). */
export function documentErrorResponse(err: unknown, fallback: string): Response {
  if (err instanceof HttpError) {
    return Response.json({ error: err.message, details: err.details }, { status: err.status });
  }
  console.error(`[documents] ${fallback}:`, err);
  return Response.json({ error: fallback }, { status: 500 });
}
