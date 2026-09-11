import { prisma } from "@submitin/database";
import { auth } from "@/lib/auth";
import { scheduleGeneration } from "@/lib/documents/generation";

export const maxDuration = 60;

/** POST /api/documents/generations/[id]/retry — reprocessa uma geração com falha/limite. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Não autorizado" }, { status: 401 });

  const { count } = await prisma.documentGeneration.updateMany({
    where: { id, status: { in: ["falha", "limite"] }, document: { userId: session.user.id } },
    data: { status: "recebida", error: null },
  });
  if (count === 0) {
    return Response.json({ error: "Envio não encontrado ou já em processamento." }, { status: 409 });
  }

  scheduleGeneration(id);
  return Response.json({ success: true });
}
