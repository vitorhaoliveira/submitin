import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@form-builder/database";
import { createFieldSchema } from "@/lib/validations";
import { MAX_FIELDS_PER_FORM } from "@/lib/security";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const form = await prisma.form.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        fields: true,
      },
    });

    if (!form) {
      return NextResponse.json({ error: "Formulário não encontrado" }, { status: 404 });
    }

    // Verifica limite de campos por formulário
    if (form.fields.length >= MAX_FIELDS_PER_FORM) {
      return NextResponse.json(
        { error: `Limite de campos atingido. Máximo de ${MAX_FIELDS_PER_FORM} campos por formulário.` },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createFieldSchema.parse(body);

    const maxOrder = form.fields.reduce((max, f) => Math.max(max, f.order), -1);

    const field = await prisma.field.create({
      data: {
        ...validatedData,
        options: validatedData.options ? validatedData.options : undefined,
        order: maxOrder + 1,
        formId: id,
      },
    });

    return NextResponse.json(field, { status: 201 });
  } catch (error) {
    console.error("Error creating field:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao criar campo" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const body = await request.json();
    const { fields } = body as { fields: { id: string; order: number }[] };

    // Update field orders
    await prisma.$transaction(
      fields.map((field) =>
        prisma.field.update({
          where: { id: field.id },
          data: { order: field.order },
        })
      )
    );

    const updatedFields = await prisma.field.findMany({
      where: { formId: id },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(updatedFields);
  } catch (error) {
    console.error("Error reordering fields:", error);
    return NextResponse.json({ error: "Erro ao reordenar campos" }, { status: 500 });
  }
}
