import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@form-builder/database";
import { createFormSchema } from "@/lib/validations";
import { generateSlug } from "@/lib/utils";
import { MAX_FORMS_PER_USER } from "@/lib/security";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const forms = await prisma.form.findMany({
      where: { userId: session.user.id },
      include: {
        _count: {
          select: { responses: true, fields: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(forms);
  } catch (error) {
    console.error("Error fetching forms:", error);
    return NextResponse.json({ error: "Erro ao buscar formulários" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verifica limite de formulários por usuário
    const formCount = await prisma.form.count({
      where: { userId: session.user.id },
    });

    if (formCount >= MAX_FORMS_PER_USER) {
      return NextResponse.json(
        { 
          error: `Limite de formulários atingido. Máximo de ${MAX_FORMS_PER_USER} formulários por conta.`,
          code: "LIMIT_REACHED",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createFormSchema.parse(body);

    const form = await prisma.form.create({
      data: {
        ...validatedData,
        slug: generateSlug(),
        userId: session.user.id,
      },
    });

    return NextResponse.json(form, { status: 201 });
  } catch (error) {
    console.error("Error creating form:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao criar formulário" }, { status: 500 });
  }
}

