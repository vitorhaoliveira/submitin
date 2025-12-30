import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@form-builder/database";
import { updateFormSchema } from "@/lib/validations";

export async function GET(
  _request: NextRequest,
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
        fields: {
          orderBy: { order: "asc" },
        },
        settings: true,
        _count: {
          select: { responses: true },
        },
      },
    });

    if (!form) {
      return NextResponse.json({ error: "Formulário não encontrado" }, { status: 404 });
    }

    return NextResponse.json(form);
  } catch (error) {
    console.error("Error fetching form:", error);
    return NextResponse.json({ error: "Erro ao buscar formulário" }, { status: 500 });
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

    const existingForm = await prisma.form.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingForm) {
      return NextResponse.json({ error: "Formulário não encontrado" }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = updateFormSchema.parse(body);

    const form = await prisma.form.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json(form);
  } catch (error) {
    console.error("Error updating form:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao atualizar formulário" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const existingForm = await prisma.form.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingForm) {
      return NextResponse.json({ error: "Formulário não encontrado" }, { status: 404 });
    }

    await prisma.form.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting form:", error);
    return NextResponse.json({ error: "Erro ao excluir formulário" }, { status: 500 });
  }
}
