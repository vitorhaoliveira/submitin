import { prisma } from "@submitin/database";
import { auth } from "@/lib/auth";
import { generateSlug } from "@/lib/utils";
import { MAX_FIELDS_PER_FORM } from "@/lib/security";
import { putObject, DOCX_MIME } from "@/lib/storage";
import {
  documentErrorResponse,
  HttpError,
  readTemplateUpload,
  templateFileKey,
} from "@/lib/documents/service";

/**
 * POST /api/documents (multipart: file, name?)
 * Cria o documento: formulário gerado (um campo por variável) + template v1.
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return Response.json({ error: "Não autorizado" }, { status: 401 });
    const userId: string = session.user.id;

    // Documentos não contam no limite de formulários: o limite é de PDFs gerados/mês.
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { email: true },
    });

    const formData = await request.formData();
    const upload = await readTemplateUpload(formData);
    if (upload.variables.length > MAX_FIELDS_PER_FORM) {
      throw new HttpError(
        422,
        `O documento tem ${upload.variables.length} variáveis; o máximo é ${MAX_FIELDS_PER_FORM}.`
      );
    }

    const rawName = String(formData.get("name") ?? "").trim();
    const name = (rawName || upload.fileName.replace(/\.docx$/i, "")).slice(0, 100);

    const document = await prisma.document.create({
      data: {
        name,
        user: { connect: { id: userId } },
        form: {
          create: {
            name,
            slug: generateSlug(),
            userId,
            fields: {
              create: upload.variables.map((v) => ({
                type: v.type,
                label: v.label,
                required: v.required,
                order: v.order,
                variableKey: v.key,
                nature: v.nature,
                ...(v.options && { options: v.options }),
              })),
            },
            // Entrega padrão: e-mail do dono (editável na tela do documento).
            settings: { create: { notifyEmails: [user.email] } },
          },
        },
      },
    });

    const fileKey = templateFileKey(userId, document.id, 1);
    try {
      await putObject(fileKey, upload.buffer, DOCX_MIME);
    } catch (err) {
      await prisma.form.delete({ where: { id: document.formId } });
      throw err;
    }

    await prisma.documentTemplate.create({
      data: {
        documentId: document.id,
        version: 1,
        fileKey,
        fileName: upload.fileName,
        fileSize: upload.buffer.length,
        variables: upload.variables.map((v) => v.key),
        missingFonts: upload.missingFonts,
      },
    });

    return Response.json({ id: document.id, formId: document.formId }, { status: 201 });
  } catch (err) {
    return documentErrorResponse(err, "Erro ao criar documento");
  }
}
