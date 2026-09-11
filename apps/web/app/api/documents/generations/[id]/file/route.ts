import { prisma } from "@submitin/database";
import { auth } from "@/lib/auth";
import { getObject, DOCX_MIME, PDF_MIME } from "@/lib/storage";
import { documentFileName, responseIdentifier } from "@/lib/documents/service";

/** GET /api/documents/generations/[id]/file?format=pdf|docx[&inline=1] — download do documento gerado. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Não autorizado" }, { status: 401 });

  const url = new URL(request.url);
  const format = url.searchParams.get("format") === "docx" ? "docx" : "pdf";

  const generation = await prisma.documentGeneration.findFirst({
    where: { id, status: "concluida", document: { userId: session.user.id } },
    include: {
      document: { include: { form: { include: { fields: true } } } },
      response: { include: { fieldValues: true } },
    },
  });
  const key = format === "pdf" ? generation?.pdfKey : generation?.docxKey;
  if (!generation || !key) return Response.json({ error: "Documento não encontrado." }, { status: 404 });

  const identifier = responseIdentifier(generation.document.form.fields, generation.response.fieldValues);
  const fileName = `${documentFileName(generation.document.name, identifier)}.${format}`;
  const disposition = url.searchParams.get("inline") === "1" && format === "pdf" ? "inline" : "attachment";

  const file = await getObject(key);
  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": format === "pdf" ? PDF_MIME : DOCX_MIME,
      "Content-Disposition": `${disposition}; filename="${fileName}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
