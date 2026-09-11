import { auth } from "@/lib/auth";
import { checkRateLimit, getClientIP } from "@/lib/security";
import { documentErrorResponse, readTemplateUpload } from "@/lib/documents/service";
import { findModel } from "@/lib/templates/catalog";
import { applyModelOverrides } from "@/lib/templates/model-fields";

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

    const formData = await request.formData();
    const { variables, unsupportedTags, missingFonts, fileName } = await readTemplateUpload(formData);
    // Modelo pronto: mostra as perguntas e naturezas como vão ficar.
    const model = findModel(String(formData.get("modelo") ?? ""));
    return Response.json({
      fileName,
      variables: model ? applyModelOverrides(model, variables) : variables,
      unsupportedTags,
      missingFonts,
    });
  } catch (err) {
    return documentErrorResponse(err, "Erro ao analisar o documento");
  }
}
