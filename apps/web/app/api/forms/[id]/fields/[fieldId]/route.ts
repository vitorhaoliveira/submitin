import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, Prisma } from "@submitin/database";
import { z } from "zod";
import { createFieldSchema, fieldTypes } from "@/lib/validations";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fieldId: string }> }
) {
  try {
    const { id, fieldId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const form = await prisma.form.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!form) {
      return NextResponse.json({ error: "Formulário não encontrado" }, { status: 404 });
    }

    const existingField = await prisma.field.findFirst({
      where: {
        id: fieldId,
        formId: id,
      },
    });

    if (!existingField) {
      return NextResponse.json({ error: "Campo não encontrado" }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = createFieldSchema.parse(body);

    const field = await prisma.field.update({
      where: { id: fieldId },
      data: {
        ...validatedData,
        options: validatedData.options ? validatedData.options : undefined,
        // DbNull limpa a regra (SQL NULL); valor presente grava a regra
        visibility: validatedData.visibility ?? Prisma.DbNull,
      },
    });

    return NextResponse.json(field);
  } catch (error) {
    console.error("Error updating field:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao atualizar campo" }, { status: 500 });
  }
}

const variableSchema = z.object({
  nature: z.enum(["pergunta", "fixa", "pre_preenchida", "automatica"]).optional(),
  defaultValue: z.string().max(2000).nullable().optional(),
  helpText: z.string().max(300).nullable().optional(),
  label: z.string().trim().min(1).max(200).optional(),
  type: z.enum(fieldTypes).optional(),
  required: z.boolean().optional(),
  options: z.array(z.string().trim().min(1).max(200)).max(50).nullable().optional(),
});

/** PATCH — ajusta uma variável do documento (natureza, tipo, opções, ajuda, valor fixo). */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fieldId: string }> }
) {
  const { id, fieldId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const parsed = variableSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
  const d = parsed.data;
  if (d.type === "select" && d.options !== undefined && (!d.options || d.options.length === 0)) {
    return NextResponse.json({ error: "Informe ao menos uma opção." }, { status: 400 });
  }

  const { count } = await prisma.field.updateMany({
    where: { id: fieldId, formId: id, form: { userId: session.user.id } },
    data: {
      ...(d.nature && { nature: d.nature }),
      ...(d.defaultValue !== undefined && { defaultValue: d.defaultValue?.trim() || null }),
      ...(d.helpText !== undefined && { helpText: d.helpText?.trim() || null }),
      ...(d.label && { label: d.label }),
      ...(d.type && { type: d.type }),
      ...(d.required !== undefined && { required: d.required }),
      ...(d.options !== undefined && { options: d.options ?? Prisma.DbNull }),
    },
  });
  if (count === 0) {
    return NextResponse.json({ error: "Campo não encontrado" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; fieldId: string }> }
) {
  try {
    const { id, fieldId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const form = await prisma.form.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!form) {
      return NextResponse.json({ error: "Formulário não encontrado" }, { status: 404 });
    }

    await prisma.field.delete({
      where: { id: fieldId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting field:", error);
    return NextResponse.json({ error: "Erro ao excluir campo" }, { status: 500 });
  }
}
