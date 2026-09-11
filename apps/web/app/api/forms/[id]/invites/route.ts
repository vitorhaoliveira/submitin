import { NextRequest, NextResponse } from "next/server";
import { customAlphabet } from "nanoid";
import { z } from "zod";
import { prisma } from "@submitin/database";
import { auth } from "@/lib/auth";
import { MAX_FIELD_VALUE_LENGTH } from "@/lib/security";

// Token do link: curto o bastante para WhatsApp, longo o bastante para não ser adivinhado.
const newToken = customAlphabet("abcdefghijkmnpqrstuvwxyz23456789", 12);

const createSchema = z.object({
  label: z.string().trim().min(1, "Informe o nome do cliente").max(120),
  values: z.record(z.string().max(MAX_FIELD_VALUE_LENGTH)).default({}),
});

async function ownedForm(formId: string, userId: string) {
  return prisma.form.findFirst({
    where: { id: formId, userId },
    select: { id: true, fields: { select: { id: true, nature: true } } },
  });
}

/** GET /api/forms/[id]/invites — links personalizados mais recentes. */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!(await ownedForm(id, session.user.id))) {
    return NextResponse.json({ error: "Formulário não encontrado" }, { status: 404 });
  }

  const invites = await prisma.formInvite.findMany({
    where: { formId: id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, token: true, label: true, usedAt: true, createdAt: true },
  });
  return NextResponse.json(invites);
}

/**
 * POST /api/forms/[id]/invites — cria um link de uso único com os campos da
 * empresa já preenchidos para um cliente. Body: { label, values: { fieldId: valor } }
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const form = await ownedForm(id, session.user.id);
  if (!form) return NextResponse.json({ error: "Formulário não encontrado" }, { status: 404 });

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  // Só campos pré-preenchidos entram no link; valores vazios são descartados.
  const companyIds = new Set(form.fields.filter((f) => f.nature === "pre_preenchida").map((f) => f.id));
  const values = Object.fromEntries(
    Object.entries(parsed.data.values)
      .map(([fieldId, value]) => [fieldId, value.trim()] as const)
      .filter(([fieldId, value]) => companyIds.has(fieldId) && value)
  );

  const invite = await prisma.formInvite.create({
    data: { formId: id, token: newToken(), label: parsed.data.label, values },
    select: { id: true, token: true, label: true, usedAt: true, createdAt: true },
  });
  return NextResponse.json(invite, { status: 201 });
}
