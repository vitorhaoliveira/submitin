import { prisma } from "@submitin/database";
import { auth } from "@/lib/auth";
import { MAX_FIELDS_PER_FORM } from "@/lib/security";
import { getObject, putObject, DOCX_MIME } from "@/lib/storage";
import {
  documentErrorResponse,
  HttpError,
  readTemplateUpload,
  safeFileName,
  templateFileKey,
} from "@/lib/documents/service";

type Params = { params: Promise<{ id: string }> };

async function findOwnedDocument(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new HttpError(401, "Não autorizado");
  const document = await prisma.document.findFirst({
    where: { id, userId: session.user.id },
    include: {
      templates: { orderBy: { version: "desc" }, take: 1 },
      form: { include: { fields: true } },
    },
  });
  if (!document) throw new HttpError(404, "Documento não encontrado.");
  return { document, userId: session.user.id as string };
}

/** GET /api/documents/[id]/template — baixa o .docx da versão atual. */
export async function GET(_request: Request, { params }: Params) {
  try {
    const { document } = await findOwnedDocument((await params).id);
    const template = document.templates[0];
    if (!template) throw new HttpError(404, "Template não encontrado.");

    const file = await getObject(template.fileKey);
    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": DOCX_MIME,
        "Content-Disposition": `attachment; filename="${safeFileName(document.name)}-v${template.version}.docx"`,
      },
    });
  } catch (err) {
    return documentErrorResponse(err, "Erro ao baixar template");
  }
}

/**
 * POST /api/documents/[id]/template (multipart: file)
 * Substitui o template criando nova versão. Documentos já emitidos não mudam.
 * Variáveis novas viram campos; campos de variáveis removidas são mantidos
 * (preservam respostas antigas) e retornados em `orphanedFields`.
 */
export async function POST(request: Request, { params }: Params) {
  try {
    const { document, userId } = await findOwnedDocument((await params).id);
    const upload = await readTemplateUpload(await request.formData());

    const existingKeys = new Set(document.form.fields.map((f) => f.variableKey).filter(Boolean));
    const newVariables = upload.variables.filter((v) => !existingKeys.has(v.key));
    if (document.form.fields.length + newVariables.length > MAX_FIELDS_PER_FORM) {
      throw new HttpError(422, `O formulário passaria de ${MAX_FIELDS_PER_FORM} campos.`);
    }

    const version = (document.templates[0]?.version ?? 0) + 1;
    const fileKey = templateFileKey(userId, document.id, version);
    await putObject(fileKey, upload.buffer, DOCX_MIME);

    const maxOrder = Math.max(-1, ...document.form.fields.map((f) => f.order));
    await prisma.$transaction([
      prisma.documentTemplate.create({
        data: {
          documentId: document.id,
          version,
          fileKey,
          fileName: upload.fileName,
          fileSize: upload.buffer.length,
          variables: upload.variables.map((v) => v.key),
          missingFonts: upload.missingFonts,
        },
      }),
      prisma.field.createMany({
        data: newVariables.map((v, i) => ({
          formId: document.formId,
          type: v.type,
          label: v.label,
          required: v.required,
          order: maxOrder + 1 + i,
          variableKey: v.key,
          filledBy: v.filledBy,
        })),
      }),
      prisma.document.update({ where: { id: document.id }, data: { updatedAt: new Date() } }),
    ]);

    const templateKeys = new Set(upload.variables.map((v) => v.key));
    return Response.json({
      version,
      addedFields: newVariables.map((v) => v.label),
      orphanedFields: document.form.fields
        .filter((f) => f.variableKey && !templateKeys.has(f.variableKey))
        .map((f) => f.label),
      missingFonts: upload.missingFonts,
      unsupportedTags: upload.unsupportedTags,
    });
  } catch (err) {
    return documentErrorResponse(err, "Erro ao substituir template");
  }
}
