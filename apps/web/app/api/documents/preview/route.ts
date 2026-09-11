import { auth } from "@/lib/auth";
import { checkRateLimit, getClientIP } from "@/lib/security";
import { documentErrorResponse, readTemplateUpload } from "@/lib/documents/service";

/**
 * POST /api/documents/preview (multipart: file)
 * Analisa o .docx sem salvar nada: variáveis detectadas, fontes ausentes e tags não suportadas.
 * Aberto a visitantes (montar antes de cadastrar), com limite por IP.
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    const key = session?.user?.id ? `doc-preview:${session.user.id}` : `doc-preview:${getClientIP(request)}`;
    if (!checkRateLimit(key, session?.user?.id ? 30 : 10, 60_000).allowed) {
      return Response.json({ error: "Muitas tentativas. Aguarde um momento." }, { status: 429 });
    }

    const { variables, unsupportedTags, missingFonts, fileName } = await readTemplateUpload(
      await request.formData()
    );
    return Response.json({ fileName, variables, unsupportedTags, missingFonts });
  } catch (err) {
    return documentErrorResponse(err, "Erro ao analisar o documento");
  }
}
