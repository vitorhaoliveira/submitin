import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@submitin/database";

/**
 * Exclui uma resposta individual. Só o dono do formulário pode excluir.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; responseId: string }> }
) {
  try {
    const { id, responseId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autorizado. Faça login para continuar." },
        { status: 401 }
      );
    }

    // Garante que o formulário pertence ao usuário logado
    const form = await prisma.form.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true },
    });
    if (!form) {
      return NextResponse.json({ error: "Formulário não encontrado." }, { status: 404 });
    }

    // Garante que a resposta pertence a esse formulário
    const response = await prisma.response.findFirst({
      where: { id: responseId, formId: id },
      select: { id: true },
    });
    if (!response) {
      return NextResponse.json({ error: "Resposta não encontrada." }, { status: 404 });
    }

    await prisma.response.delete({ where: { id: responseId } });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("❌ [DeleteResponse] Erro:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
