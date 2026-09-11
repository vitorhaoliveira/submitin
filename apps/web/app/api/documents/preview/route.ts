import { auth } from "@/lib/auth";
import { documentErrorResponse, readTemplateUpload } from "@/lib/documents/service";

/**
 * POST /api/documents/preview (multipart: file)
 * Analisa o .docx sem salvar nada: variáveis detectadas, fontes ausentes e tags não suportadas.
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return Response.json({ error: "Não autorizado" }, { status: 401 });

    const { variables, unsupportedTags, missingFonts, fileName } = await readTemplateUpload(
      await request.formData()
    );
    return Response.json({ fileName, variables, unsupportedTags, missingFonts });
  } catch (err) {
    return documentErrorResponse(err, "Erro ao analisar o documento");
  }
}
