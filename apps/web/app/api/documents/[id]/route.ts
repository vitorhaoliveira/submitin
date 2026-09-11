import { prisma } from "@submitin/database";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { documentErrorResponse, HttpError } from "@/lib/documents/service";

type Params = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  published: z.boolean().optional(),
});

/** PATCH /api/documents/[id] — renomeia e/ou publica o documento (e o formulário). */
export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) return Response.json({ error: "Não autorizado" }, { status: 401 });

    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) throw new HttpError(400, "Dados inválidos.");
    const { name, published } = parsed.data;

    const document = await prisma.document.findFirst({ where: { id, userId: session.user.id } });
    if (!document) throw new HttpError(404, "Documento não encontrado.");

    await prisma.$transaction([
      prisma.document.update({ where: { id }, data: name ? { name } : { updatedAt: new Date() } }),
      prisma.form.update({ where: { id: document.formId }, data: { name, published } }),
    ]);
    return Response.json({ success: true });
  } catch (err) {
    return documentErrorResponse(err, "Erro ao atualizar documento");
  }
}

/** DELETE /api/documents/[id] — remove documento, formulário, respostas e envios. */
export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) return Response.json({ error: "Não autorizado" }, { status: 401 });

    const document = await prisma.document.findFirst({ where: { id, userId: session.user.id } });
    if (!document) throw new HttpError(404, "Documento não encontrado.");

    // Cascata: form → document → templates/gerações.
    await prisma.form.delete({ where: { id: document.formId } });
    return Response.json({ success: true });
  } catch (err) {
    return documentErrorResponse(err, "Erro ao excluir documento");
  }
}
