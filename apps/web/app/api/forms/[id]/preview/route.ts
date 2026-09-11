import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@submitin/database";
import { checkRateLimit, getClientIP, sanitizeFormValues } from "@/lib/security";
import { prepareSubmission } from "@/lib/form-response";
import { hasFeature, maxDocumentsPerMonthFor } from "@/lib/stripe";
import { documentDataHash, renderDocument } from "@/lib/documents/render";
import {
  monthlyDocumentUsage,
  previewPdfPath,
  templateInputFromResponse,
} from "@/lib/documents/service";
import { putObject, DOCX_MIME, PDF_MIME } from "@/lib/storage";
import { userFacingError } from "@/lib/documents/generation";

export const maxDuration = 60;

/** Preview fica disponível por 2h; se o respondente confirmar nesse prazo, vira o definitivo. */
const PREVIEW_TTL_MS = 2 * 60 * 60_000;

/**
 * POST /api/forms/[id]/preview — gera o documento com as respostas para o
 * respondente conferir antes de enviar. Mesma validação do envio; nada é gravado
 * como resposta. Body: { values, inviteToken? } → { previewId, pdfUrl }.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Conversão é cara: limite mais apertado que o envio.
  const rateLimit = checkRateLimit(`preview:${id}:${getClientIP(request)}`, 6, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde um momento." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rateLimit.resetIn / 1000)) } }
    );
  }

  const form = await prisma.form.findFirst({
    where: { id, published: true },
    include: {
      fields: true,
      settings: true,
      _count: { select: { responses: { where: { partial: false } } } },
      document: {
        include: {
          templates: { orderBy: { version: "desc" }, take: 1 },
          user: { select: { id: true, plan: true } },
        },
      },
    },
  });
  const document = form?.document;
  const template = document?.templates[0];
  if (!form || !document || !template) {
    return NextResponse.json({ error: "Documento não encontrado." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const rawValues = body?.values;
  if (!rawValues || typeof rawValues !== "object") {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
  const inviteToken = typeof body?.inviteToken === "string" ? body.inviteToken : null;

  let fieldValues: { fieldId: string; value: string }[];
  try {
    ({ fieldValuesCreate: fieldValues } = await prepareSubmission(
      form,
      sanitizeFormValues(rawValues as Record<string, string>),
      inviteToken
    ));
  } catch (err) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json(
      { error: e.message ?? "Erro ao validar respostas." },
      { status: e.status ?? 500 }
    );
  }

  // Plano sem saldo: não gera preview; o envio segue e a empresa é avisada.
  const limit = maxDocumentsPerMonthFor(document.user.plan);
  if (limit !== -1 && (await monthlyDocumentUsage(document.user.id)) >= limit) {
    return NextResponse.json({ skipped: "limit" });
  }

  const { variables, answers } = templateInputFromResponse(template.variables, form.fields, fieldValues);
  const branded = !hasFeature(document.user.plan, "hideBranding");
  const dataHash = documentDataHash(template.id, variables, answers, branded);

  // Voltou, não mudou nada e revisou de novo: reaproveita.
  const existing = await prisma.documentPreview.findFirst({
    where: { documentId: document.id, templateId: template.id, dataHash, expiresAt: { gt: new Date() } },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ previewId: existing.id, pdfUrl: previewPdfPath(existing.id) });
  }

  try {
    const { pdf, docx } = await renderDocument({ template, variables, answers, branded });
    const previewId = randomUUID();
    const base = `previews/${document.userId}/${document.id}/${previewId}`;
    await Promise.all([
      putObject(`${base}.pdf`, pdf, PDF_MIME),
      putObject(`${base}.docx`, docx, DOCX_MIME),
    ]);
    const preview = await prisma.documentPreview.create({
      data: {
        id: previewId,
        documentId: document.id,
        templateId: template.id,
        dataHash,
        pdfKey: `${base}.pdf`,
        docxKey: `${base}.docx`,
        expiresAt: new Date(Date.now() + PREVIEW_TTL_MS),
      },
    });
    return NextResponse.json({ previewId: preview.id, pdfUrl: previewPdfPath(preview.id) });
  } catch (err) {
    console.error(`[documents] preview do formulário ${id} falhou:`, err);
    return NextResponse.json({ error: userFacingError(err) }, { status: 502 });
  }
}
