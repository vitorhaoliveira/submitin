import { after } from "next/server";
import { prisma } from "@submitin/database";
import { sendEmail } from "@submitin/email";
import { DocumentReadyEmail } from "@submitin/email/templates/document-ready";
import { DocumentLimitEmail } from "@submitin/email/templates/document-limit";
import { DocumentCopyEmail } from "@submitin/email/templates/document-copy";
import { DocumentUsageWarningEmail } from "@submitin/email/templates/document-usage-warning";
import { USAGE_WARNING_RATIO } from "@/lib/usage";
import { brandLogoUrl } from "@/lib/branding";
import { isValidEmail } from "@/lib/security";
import {
  ACCEPTANCE_STATEMENT,
  appendAcceptancePage,
  PdfConversionError,
  TemplateError,
} from "@submitin/documents";
import { createHash } from "node:crypto";
import { documentDataHash, renderDocument } from "./render";
import { deleteObjects, getObject, putObject, DOCX_MIME, PDF_MIME } from "@/lib/storage";
import { hasFeature, maxDocumentsPerMonthFor } from "@/lib/stripe";
import {
  appBaseUrl,
  verifyDocumentUrl,
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
/** Aceite eletrônico feito na revisão (IP e navegador de quem confirmou). */
export type AcceptanceInput = { ip: string | null; userAgent: string | null };

export async function enqueueDocumentGeneration(
  formId: string,
  responseId: string,
  previewId?: string | null,
  acceptance?: AcceptanceInput | null
) {
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
    create: {
      documentId: document.id,
      templateId: template.id,
      responseId,
      previewId: previewId ?? null,
      ...(acceptance && {
        acceptedAt: new Date(),
        acceptanceIp: acceptance.ip?.slice(0, 64) ?? null,
        acceptanceUserAgent: acceptance.userAgent?.slice(0, 400) ?? null,
        acceptanceStatement: ACCEPTANCE_STATEMENT,
      }),
    },
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

export function userFacingError(err: unknown): string {
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
          user: {
            select: {
              id: true,
              email: true,
              plan: true,
              documentLimitNotifiedAt: true,
              brandName: true,
              brandLogoKey: true,
            },
          },
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
  const branded = !hasFeature(user.plan, "hideBranding");
  let pdf: Buffer;
  let pdfKey: string;
  let docxKey: string;
  let pdfSha256: string;
  try {
    // O respondente conferiu este mesmo documento no preview? Reaproveita o arquivo
    // (uma conversão por envio). Qualquer diferença nos dados gera de novo.
    const hash = documentDataHash(template.id, variables, answers, branded);
    const preview = generation.previewId
      ? await prisma.documentPreview.findFirst({
          where: { id: generation.previewId, documentId: document.id, templateId: template.id },
        })
      : null;

    let docx: Buffer;
    if (preview && preview.dataHash === hash) {
      [pdf, docx] = await Promise.all([getObject(preview.pdfKey), getObject(preview.docxKey)]);
    } else {
      ({ pdf, docx } = await renderDocument({ template, variables, answers, branded }));
    }

    // Aceite eletrônico: página de registro no fim do PDF (fora do preview,
    // que continua sendo a mesma conversão).
    if (generation.acceptedAt) {
      pdf = await appendAcceptancePage(pdf, {
        documentName: document.name,
        companyName: user.brandName,
        verificationCode: generation.accessToken,
        verifyUrl: verifyDocumentUrl(generation.accessToken),
        acceptedAt: generation.acceptedAt,
        statement: generation.acceptanceStatement ?? ACCEPTANCE_STATEMENT,
        ip: generation.acceptanceIp,
        userAgent: generation.acceptanceUserAgent,
        email: respondentEmailFrom(form.fields, response.fieldValues),
        cpf: firstValueOfType(form.fields, response.fieldValues, "cpf"),
        identifier: responseIdentifier(form.fields, response.fieldValues),
        contentHash: hash,
      });
    }
    pdfSha256 = createHash("sha256").update(pdf).digest("hex");

    // Chave inclui a tentativa: arquivos gerados nunca são sobrescritos.
    // (O preview é temporário; o definitivo ganha cópia própria.)
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
    data: { status: "concluida", pdfKey, docxKey, pdfSha256, completedAt: new Date(), error: null },
  });

  // Chegou a 80% dos documentos do mês: avisa antes que o limite trave os PDFs.
  if (limit !== -1) {
    const used = await monthlyDocumentUsage(user.id);
    if (used >= Math.ceil(limit * USAGE_WARNING_RATIO) && used < limit) {
      await notifyUsageWarning(user.id, user.email, used, limit);
    }
  }

  // Entrega (best-effort): falha de e-mail/webhook não invalida o documento gerado.
  const identifier = responseIdentifier(form.fields, response.fieldValues);
  const fileName = `${documentFileName(document.name, identifier)}.pdf`;
  const companyEmails = deliveryEmails(form.settings);
  const respondentEmail = document.emailRespondent
    ? respondentEmailFrom(form.fields, response.fieldValues)
    : null;
  await Promise.allSettled([
    respondentEmail && !companyEmails.includes(respondentEmail)
      ? deliverCopyToRespondent({
          to: respondentEmail,
          replyTo: companyEmails.length > 0 ? companyEmails : [user.email],
          documentName: document.name,
          brandName: user.brandName,
          brandLogoUrl: brandLogoUrl(user.id, user.brandLogoKey),
          pdf,
          fileName,
        })
      : null,
    deliverByEmail({
      to: companyEmails,
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
      pdfSha256,
      verifyUrl: verifyDocumentUrl(generation.accessToken),
      acceptance: generation.acceptedAt
        ? {
            acceptedAt: generation.acceptedAt,
            ip: generation.acceptanceIp,
            userAgent: generation.acceptanceUserAgent,
            statement: generation.acceptanceStatement,
          }
        : null,
      fileName,
      values: answers,
    }),
  ]);
}

/** Primeiro valor respondido de um tipo de campo (ex.: CPF para o registro de aceite). */
function firstValueOfType(
  fields: { id: string; type: string; order: number }[],
  fieldValues: { fieldId: string; value: string }[],
  type: string
): string | null {
  const valueByField = new Map(fieldValues.map((fv) => [fv.fieldId, fv.value.trim()]));
  const field = [...fields].sort((a, b) => a.order - b.order).find((f) => f.type === type && valueByField.get(f.id));
  return field ? valueByField.get(field.id)! : null;
}

/** E-mail de quem preencheu: primeiro campo de e-mail respondido no formulário. */
function respondentEmailFrom(
  fields: { id: string; type: string; order: number }[],
  fieldValues: { fieldId: string; value: string }[]
): string | null {
  const valueByField = new Map(fieldValues.map((fv) => [fv.fieldId, fv.value.trim()]));
  const field = [...fields]
    .sort((a, b) => a.order - b.order)
    .find((f) => f.type === "email" && isValidEmail(valueByField.get(f.id) ?? ""));
  return field ? valueByField.get(field.id)!.toLowerCase() : null;
}

async function deliverCopyToRespondent(input: {
  to: string;
  replyTo: string[];
  documentName: string;
  brandName: string | null;
  brandLogoUrl: string | null;
  pdf: Buffer;
  fileName: string;
}) {
  await sendEmail({
    to: input.to,
    replyTo: input.replyTo,
    fromName: input.brandName ?? undefined,
    subject: `Sua cópia: ${input.documentName}`,
    react: DocumentCopyEmail({
      documentName: input.documentName,
      brandName: input.brandName ?? undefined,
      brandLogoUrl: input.brandLogoUrl ? `${appBaseUrl()}${input.brandLogoUrl}` : undefined,
      fileName: input.fileName,
    }),
    attachments: [{ filename: input.fileName, content: input.pdf }],
  }).catch((err) => console.error(`[documents] cópia para o respondente falhou:`, err));
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

const MONTHS = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

/** Aviso de 80% do plano: no máximo um por mês. Nunca lança. */
async function notifyUsageWarning(userId: string, email: string, used: number, limit: number) {
  try {
    const { count } = await prisma.user.updateMany({
      where: {
        id: userId,
        OR: [{ documentUsageWarnedAt: null }, { documentUsageWarnedAt: { lt: startOfMonth() } }],
      },
      data: { documentUsageWarnedAt: new Date() },
    });
    if (count === 0) return;
    const next = new Date(startOfMonth());
    next.setMonth(next.getMonth() + 1);
    await sendEmail({
      to: email,
      subject: `Você já usou ${used} de ${limit} documentos deste mês`,
      react: DocumentUsageWarningEmail({
        used,
        limit,
        resetsOn: `1º de ${MONTHS[next.getMonth()]}`,
        billingUrl: `${appBaseUrl()}/dashboard/billing`,
      }),
    });
  } catch (err) {
    console.error("[documents] aviso de 80% falhou:", err);
  }
}

/** Apaga previews expirados (linhas + arquivos). */
export async function cleanupExpiredPreviews() {
  const expired = await prisma.documentPreview.findMany({
    where: { expiresAt: { lt: new Date() } },
    take: 200,
    select: { id: true, pdfKey: true, docxKey: true },
  });
  if (expired.length === 0) return 0;
  try {
    await deleteObjects(expired.flatMap((p) => [p.pdfKey, p.docxKey]));
  } catch (err) {
    console.error("[documents] limpeza de previews:", err);
    return 0;
  }
  await prisma.documentPreview.deleteMany({ where: { id: { in: expired.map((p) => p.id) } } });
  return expired.length;
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
