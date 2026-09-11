import { prisma } from "@submitin/database";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { documentErrorResponse, HttpError } from "@/lib/documents/service";

const deliverySchema = z.object({
  emails: z.array(z.string().trim().email("E-mail inválido")).max(10, "Máximo de 10 e-mails"),
  webhookUrl: z.string().trim().url("URL inválida").or(z.literal("")),
  emailRespondent: z.boolean().optional(),
});

/**
 * PUT /api/documents/[id]/delivery — configura a entrega do documento gerado.
 * Grava os campos de entrega do FormSettings (e-mails + webhook) e a cópia ao respondente.
 */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) return Response.json({ error: "Não autorizado" }, { status: 401 });

    const parsed = deliverySchema.safeParse(await request.json());
    if (!parsed.success) throw new HttpError(400, parsed.error.errors[0]?.message ?? "Dados inválidos.");

    const document = await prisma.document.findFirst({ where: { id, userId: session.user.id } });
    if (!document) throw new HttpError(404, "Documento não encontrado.");

    const data = {
      notifyEmail: null,
      notifyEmails: [...new Set(parsed.data.emails.map((e) => e.toLowerCase()))],
      webhookUrl: parsed.data.webhookUrl || null,
    };
    if (parsed.data.emailRespondent !== undefined) {
      await prisma.document.update({
        where: { id: document.id },
        data: { emailRespondent: parsed.data.emailRespondent },
      });
    }
    await prisma.formSettings.upsert({
      where: { formId: document.formId },
      update: data,
      create: { formId: document.formId, ...data },
    });
    return Response.json({ success: true });
  } catch (err) {
    return documentErrorResponse(err, "Erro ao salvar entrega");
  }
}
