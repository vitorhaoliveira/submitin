import { prisma } from "@submitin/database";
import { getObject, PDF_MIME } from "@/lib/storage";
import { verifyPdfToken } from "@/lib/documents/service";

/**
 * GET /api/public/documents/[id]/pdf?token=...
 * Link do PDF enviado no webhook. Token HMAC por geração; PDF é imutável.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = new URL(request.url).searchParams.get("token");
  if (!verifyPdfToken(id, token)) return Response.json({ error: "Link inválido." }, { status: 403 });

  const generation = await prisma.documentGeneration.findUnique({
    where: { id },
    select: { status: true, pdfKey: true },
  });
  if (generation?.status !== "concluida" || !generation.pdfKey) {
    return Response.json({ error: "Documento não encontrado." }, { status: 404 });
  }

  const file = await getObject(generation.pdfKey);
  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": PDF_MIME,
      "Content-Disposition": `inline; filename="documento-${id}.pdf"`,
      "Cache-Control": "private, max-age=86400",
    },
  });
}
