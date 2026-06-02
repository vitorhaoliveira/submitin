import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@submitin/database";
import {
  sanitizeFormValues,
  checkRateLimit,
  getClientIP,
} from "@/lib/security";
import { hasContactValue } from "@/lib/partial-response";

/**
 * POST — salva/atualiza uma resposta PARCIAL (lead que começou mas não enviou).
 * Público. Só persiste se o dono ativou `capturePartials` e houver um contato
 * (email/telefone) preenchido. Idempotente via `partialId` retornado.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Rate limit: até 20 saves de rascunho por minuto por IP
    const clientIP = getClientIP(request);
    const rl = checkRateLimit(`partial:${id}:${clientIP}`, 20, 60000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Muitas requisições." }, { status: 429 });
    }

    const form = await prisma.form.findFirst({
      where: { id, published: true },
      include: { fields: { select: { id: true, type: true } }, settings: true },
    });

    if (!form) {
      return NextResponse.json({ error: "Formulário não encontrado" }, { status: 404 });
    }

    // Só captura parciais se o dono ativou (feature PRO controlada no settings)
    if (!form.settings?.capturePartials) {
      return NextResponse.json({ skipped: true }, { status: 200 });
    }

    const body = await request.json();
    const rawValues = body?.values as Record<string, string> | undefined;
    const partialId = typeof body?.partialId === "string" ? body.partialId : null;

    if (!rawValues || typeof rawValues !== "object") {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const values = sanitizeFormValues(rawValues);

    // Só vale a pena salvar se já houver um contato (email/telefone)
    if (!hasContactValue(form.fields, values)) {
      return NextResponse.json({ skipped: true }, { status: 200 });
    }

    const validFieldIds = new Set(form.fields.map((f) => f.id));
    const entries = Object.entries(values).filter(
      ([fieldId, value]) => value && validFieldIds.has(fieldId)
    );

    // Atualiza a parcial existente (substitui os valores) ou cria uma nova.
    if (partialId) {
      const existing = await prisma.response.findFirst({
        where: { id: partialId, formId: id, partial: true },
        select: { id: true },
      });
      if (existing) {
        await prisma.$transaction([
          prisma.fieldValue.deleteMany({ where: { responseId: partialId } }),
          prisma.response.update({
            where: { id: partialId },
            data: {
              fieldValues: {
                create: entries.map(([fieldId, value]) => ({ fieldId, value: String(value) })),
              },
            },
          }),
        ]);
        return NextResponse.json({ partialId }, { status: 200 });
      }
    }

    const created = await prisma.response.create({
      data: {
        formId: id,
        partial: true,
        fieldValues: {
          create: entries.map(([fieldId, value]) => ({ fieldId, value: String(value) })),
        },
      },
      select: { id: true },
    });

    return NextResponse.json({ partialId: created.id }, { status: 201 });
  } catch (error) {
    console.error("❌ [PartialResponse] Erro:", error);
    return NextResponse.json({ error: "Erro ao salvar rascunho" }, { status: 500 });
  }
}
