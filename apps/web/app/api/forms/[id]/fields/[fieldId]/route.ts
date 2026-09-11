import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, Prisma } from "@submitin/database";
import { z } from "zod";
import { createFieldSchema } from "@/lib/validations";

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

const fillSchema = z.object({
  filledBy: z.enum(["client", "company"]).optional(),
  defaultValue: z.string().max(2000).nullable().optional(),
});

/** PATCH — define quem preenche o campo e o valor fixo da empresa. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fieldId: string }> }
) {
  const { id, fieldId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const parsed = fillSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const { count } = await prisma.field.updateMany({
    where: { id: fieldId, formId: id, form: { userId: session.user.id } },
    data: {
      ...(parsed.data.filledBy && { filledBy: parsed.data.filledBy }),
      ...(parsed.data.defaultValue !== undefined && {
        defaultValue: parsed.data.defaultValue?.trim() || null,
      }),
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
