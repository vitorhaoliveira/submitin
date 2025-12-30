import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@form-builder/database";
import { formSettingsSchema } from "@/lib/validations";

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
    const validatedData = formSettingsSchema.parse(body);

    const settings = await prisma.formSettings.upsert({
      where: { formId: id },
      update: {
        notifyEmail: validatedData.notifyEmail || null,
        webhookUrl: validatedData.webhookUrl || null,
      },
      create: {
        formId: id,
        notifyEmail: validatedData.notifyEmail || null,
        webhookUrl: validatedData.webhookUrl || null,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error updating settings:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao atualizar configurações" }, { status: 500 });
  }
}
