import { prisma } from "@submitin/database";
import { getObject, PDF_MIME } from "@/lib/storage";
import { verifyPreviewToken } from "@/lib/documents/service";

/** GET /api/public/previews/[id]/pdf?token=... — PDF do preview (expira em 2h). */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = new URL(request.url).searchParams.get("token");
  if (!verifyPreviewToken(id, token)) return Response.json({ error: "Link inválido." }, { status: 403 });

  const preview = await prisma.documentPreview.findUnique({
    where: { id },
    select: { pdfKey: true, expiresAt: true },
  });
  if (!preview?.pdfKey || preview.expiresAt < new Date()) {
    return Response.json({ error: "Pré-visualização expirada. Revise de novo." }, { status: 404 });
  }

  const file = await getObject(preview.pdfKey);
  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": PDF_MIME,
      "Content-Disposition": `inline; filename="previa.pdf"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
