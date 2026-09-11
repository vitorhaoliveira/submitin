import { after } from "next/server";
import { prisma } from "@submitin/database";
import { sendEmail } from "@submitin/email";
import { DocumentReadyEmail } from "@submitin/email/templates/document-ready";
import { DocumentLimitEmail } from "@submitin/email/templates/document-limit";
import {
  convertDocxToPdf,
  mergeTemplate,
  PdfConversionError,
  stampBranding,
  TemplateError,
} from "@submitin/documents";
import { getObject, putObject, DOCX_MIME, PDF_MIME } from "@/lib/storage";
import { hasFeature, maxDocumentsPerMonthFor } from "@/lib/stripe";
import {
  appBaseUrl,
  monthlyDocumentUsage,
  publicPdfUrl,
  responseIdentifier,
  documentFileName,
  startOfMonth,
  templateInputFromResponse,
} from "./service";

/**
 * Fila de geração de documentos, apoiada na tabela document_generations.
 *
 * - A submissão cria a linha como "recebida" e agenda o processamento com `after()`
 *   (roda depois da resposta HTTP, na mesma função).
 * - O cron /api/cron/documents recolhe o que ficou para trás: "recebida" antiga,
 *   "processando" travada (função morreu) e "falha" com tentativas restantes.
 * - Esgotadas as tentativas automáticas, a falha fica visível em Envios com botão
 *   de reprocessar.
 */

export const MAX_AUTO_ATTEMPTS = 3;
/** Após isso, "processando" é considerado travado e pode ser reclamado de novo. */
const STALE_PROCESSING_MS = 2 * 60_000;

/** Cria a geração para uma resposta de formulário-documento e agenda o processamento. */
export async function enqueueDocumentGeneration(formId: string, responseId: string) {
  const document = await prisma.document.findUnique({
    where: { formId },
    select: {
      id: true,
      templates: { orderBy: { version: "desc" }, take: 1, select: { id: true } },
    },
  });
  const template = document?.templates[0];
  if (!document || !template) return null;

  const generation = await prisma.documentGeneration.upsert({
    where: { responseId },
    create: { documentId: document.id, templateId: template.id, responseId },
    update: {},
  });
  scheduleGeneration(generation.id);
  return generation;
}

export function scheduleGeneration(generationId: string) {
  after(() => processDocumentGeneration(generationId));
}

/** Reclama a geração (lock otimista) — evita processamento duplo entre `after` e cron. */
async function claim(generationId: string, allowFailed: boolean): Promise<boolean> {
  const staleBefore = new Date(Date.now() - STALE_PROCESSING_MS);
  const { count } = await prisma.documentGeneration.updateMany({
    where: {
      id: generationId,
      OR: [
        { status: "recebida" },
        { status: "processando", startedAt: { lt: staleBefore } },
        ...(allowFailed ? [{ status: "falha", attempts: { lt: MAX_AUTO_ATTEMPTS } }] : []),
      ],
    },
    data: { status: "processando", startedAt: new Date(), attempts: { increment: 1 }, error: null },
  });
  return count === 1;
}

function userFacingError(err: unknown): string {
  if (err instanceof TemplateError) return [err.message, ...err.details].join(" ");
  if (err instanceof PdfConversionError) return `Falha na conversão para PDF. ${err.message}`;
  return "Erro inesperado ao gerar o documento. Tente reprocessar.";
}

export async function processDocumentGeneration(
  generationId: string,
  { allowFailed = false }: { allowFailed?: boolean } = {}
): Promise<void> {
  if (!(await claim(generationId, allowFailed))) return;

  const generation = await prisma.documentGeneration.findUniqueOrThrow({
    where: { id: generationId },
    include: {
      template: true,
      response: { include: { fieldValues: true } },
      document: {
        include: {
          user: { select: { id: true, email: true, plan: true, documentLimitNotifiedAt: true } },
          form: { include: { fields: true, settings: true } },
        },
      },
    },
  });
  const { document, template, response } = generation;
  const { user, form } = document;

  // Limite do plano: resposta fica salva, documento não é gerado.
  const limit = maxDocumentsPerMonthFor(user.plan);
  if (limit !== -1 && (await monthlyDocumentUsage(user.id)) >= limit) {
    await prisma.documentGeneration.update({
      where: { id: generationId },
      data: {
        status: "limite",
        error: `Limite de ${limit} documentos/mês do plano atingido.`,
        attempts: { decrement: 1 },
      },
    });
    await notifyLimitReached(user, limit);
    return;
  }

  const { variables, answers } = templateInputFromResponse(
    template.variables,
    form.fields,
    response.fieldValues
  );
  let pdf: Buffer;
  let pdfKey: string;
  let docxKey: string;
  try {
    const docx = mergeTemplate(await getObject(template.fileKey), variables, answers);
    pdf = await convertDocxToPdf(docx, { filename: template.fileName });
    if (!hasFeature(user.plan, "hideBranding")) {
      pdf = await stampBranding(pdf, { url: `${appBaseUrl()}/?ref=documento` });
    }

    // Chave inclui a tentativa: arquivos gerados nunca são sobrescritos.
    const base = `generated/${user.id}/${document.id}/${generation.id}-${generation.attempts}`;
    pdfKey = `${base}.pdf`;
    docxKey = `${base}.docx`;
    await Promise.all([putObject(docxKey, docx, DOCX_MIME), putObject(pdfKey, pdf, PDF_MIME)]);
  } catch (err) {
    console.error(`[documents] geração ${generationId} falhou:`, err);
    await prisma.documentGeneration.update({
      where: { id: generationId },
      data: { status: "falha", error: userFacingError(err) },
    });
    return;
  }

  await prisma.documentGeneration.update({
    where: { id: generationId },
    data: { status: "concluida", pdfKey, docxKey, completedAt: new Date(), error: null },
  });

  // Entrega (best-effort): falha de e-mail/webhook não invalida o documento gerado.
  const identifier = responseIdentifier(form.fields, response.fieldValues);
  const fileName = `${documentFileName(document.name, identifier)}.pdf`;
  await Promise.allSettled([
    deliverByEmail({
      to: deliveryEmails(form.settings),
      documentName: document.name,
      documentId: document.id,
      identifier,
      submittedAt: response.submittedAt,
      pdf,
      fileName,
    }),
    deliverByWebhook(form.settings?.webhookUrl, {
      event: "document.generated",
      generationId: generation.id,
      documentId: document.id,
      documentName: document.name,
      formId: form.id,
      responseId: response.id,
      submittedAt: response.submittedAt,
      pdfUrl: publicPdfUrl(generation.id),
      fileName,
      values: answers,
    }),
  ]);
}

function deliveryEmails(settings: { notifyEmail: string | null; notifyEmails: string[] } | null) {
  const emails = [settings?.notifyEmail, ...(settings?.notifyEmails ?? [])].filter(
    (e): e is string => Boolean(e)
  );
  return [...new Set(emails)];
}

async function deliverByEmail(input: {
  to: string[];
  documentName: string;
  documentId: string;
  identifier: string;
  submittedAt: Date;
  pdf: Buffer;
  fileName: string;
}) {
  const submittedAt = input.submittedAt.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
  await Promise.all(
    input.to.map((to) =>
      sendEmail({
        to,
        subject: input.identifier
          ? `${input.documentName} — ${input.identifier}`
          : `Novo documento: ${input.documentName}`,
        react: DocumentReadyEmail({
          documentName: input.documentName,
          identifier: input.identifier || undefined,
          submittedAt,
          submissionsUrl: `${appBaseUrl()}/dashboard/documents/${input.documentId}/envios`,
        }),
        attachments: [{ filename: input.fileName, content: input.pdf }],
      }).catch((err) => console.error(`[documents] e-mail para ${to} falhou:`, err))
    )
  );
}

async function deliverByWebhook(url: string | null | undefined, payload: Record<string, unknown>) {
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err) {
    console.error("[documents] webhook falhou:", err);
  }
}

async function notifyLimitReached(
  user: { id: string; email: string; documentLimitNotifiedAt: Date | null },
  limit: number
) {
  // Um aviso por mês: marca antes de enviar para não duplicar em rajadas.
  const { count } = await prisma.user.updateMany({
    where: {
      id: user.id,
      OR: [{ documentLimitNotifiedAt: null }, { documentLimitNotifiedAt: { lt: startOfMonth() } }],
    },
    data: { documentLimitNotifiedAt: new Date() },
  });
  if (count === 0) return;
  await sendEmail({
    to: user.email,
    subject: "Você atingiu o limite de documentos do mês",
    react: DocumentLimitEmail({ limit, billingUrl: `${appBaseUrl()}/dashboard/billing` }),
  }).catch((err) => console.error("[documents] aviso de limite falhou:", err));
}

/** Varredura do cron: processa o que o `after()` não concluiu. */
export async function processPendingGenerations(budgetMs = 45_000) {
  const startedAt = Date.now();
  const now = Date.now();
  const pending = await prisma.documentGeneration.findMany({
    where: {
      OR: [
        { status: "recebida", createdAt: { lt: new Date(now - 30_000) } },
        { status: "processando", startedAt: { lt: new Date(now - STALE_PROCESSING_MS) } },
        { status: "falha", attempts: { lt: MAX_AUTO_ATTEMPTS }, updatedAt: { lt: new Date(now - 60_000) } },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: 20,
    select: { id: true },
  });

  let processed = 0;
  for (const { id } of pending) {
    if (Date.now() - startedAt > budgetMs) break;
    await processDocumentGeneration(id, { allowFailed: true });
    processed++;
  }
  return { pending: pending.length, processed };
}
