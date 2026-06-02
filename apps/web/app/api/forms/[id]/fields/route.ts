import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@submitin/database";
import { createFieldSchema } from "@/lib/validations";
import { MAX_FIELDS_PER_FORM } from "@/lib/security";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
        {
          error: `Limite de campos atingido. Máximo de ${MAX_FIELDS_PER_FORM} campos por formulário.`,
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    console.log("Creating field with data:", JSON.stringify(body, null, 2));

    const validatedData = createFieldSchema.parse(body);

    const maxOrder = form.fields.reduce(
      (max: number, f: (typeof form.fields)[number]) => Math.max(max, f.order),
      -1
    );

    // Para campos de múltipla escolha (select), garantir que options seja um array válido
    const optionsData =
      validatedData.type === "select" && validatedData.options
        ? validatedData.options.filter((opt: string) => opt.trim() !== "")
        : undefined;

    const field = await prisma.field.create({
      data: {
        type: validatedData.type,
        label: validatedData.label,
        placeholder: validatedData.placeholder || null,
        required: validatedData.required,
        options: optionsData,
        visibility: validatedData.visibility ?? undefined,
        order: maxOrder + 1,
        formId: id,
      },
    });

    console.log("Field created successfully:", field.id);
    return NextResponse.json(field, { status: 201 });
  } catch (error) {
    console.error("Error creating field:", error);

    if (error instanceof Error && error.name === "ZodError") {
      const zodError = error as unknown as { errors: Array<{ path: string[]; message: string }> };
      console.error("Validation errors:", zodError.errors);
      return NextResponse.json(
        {
          error: "Dados inválidos",
          details: zodError.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Erro ao criar campo",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
      fields.map((field: { id: string; order: number }) =>
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
