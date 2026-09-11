import { NextRequest, NextResponse } from "next/server";
import {
  convertDocxToPdf,
  isoDateInBrazil,
  mergeTemplate,
  stampBranding,
  type DocumentFieldType,
} from "@submitin/documents";
import { validateMaskedField } from "@submitin/documents/input";
import { checkRateLimit, getClientIP, sanitizeFormValues } from "@/lib/security";
import { findModel } from "@/lib/templates/catalog";
import { applyModelOverrides, readModelDocx } from "@/lib/templates/model-fields";
import { parseTemplate } from "@submitin/documents";
import { appBaseUrl } from "@/lib/documents/service";
import { PDF_MIME } from "@/lib/storage";

export const maxDuration = 60;

const MASK_ERRORS = { invalidCpf: "CPF inválido", invalidCnpj: "CNPJ inválido", invalidCep: "CEP inválido" } as const;

/**
 * POST /api/modelos/[slug]/demo — PDF de amostra do modelo com os dados digitados
 * na página pública. Nada é salvo; com selo do Submitin. Limite por IP.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const model = findModel(slug);
  if (!model) return NextResponse.json({ error: "Modelo não encontrado." }, { status: 404 });

  if (!checkRateLimit(`model-demo:${getClientIP(request)}`, 5, 60_000).allowed) {
    return NextResponse.json(
      { error: "Você gerou vários exemplos seguidos. Aguarde um minuto e tente de novo." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const values = sanitizeFormValues((body?.values ?? {}) as Record<string, string>);

  const docx = await readModelDocx(model.slug);
  const fields = applyModelOverrides(model, parseTemplate(docx).variables);

  const answers: Record<string, string> = {};
  for (const field of fields) {
    if (field.nature === "automatica") {
      answers[field.key] = isoDateInBrazil(new Date());
      continue;
    }
    const value = (values[field.key] ?? "").slice(0, 1000);
    const error = validateMaskedField(field.type, value);
    if (error) {
      return NextResponse.json({ error: `${MASK_ERRORS[error]} em "${field.label}".` }, { status: 400 });
    }
    answers[field.key] = value;
  }

  try {
    const variables = fields.map((f) => ({
      key: f.key,
      type: (f.type === "select" ? "text" : f.type) as DocumentFieldType,
    }));
    const merged = mergeTemplate(docx, variables, answers);
    const pdf = await stampBranding(await convertDocxToPdf(merged, { filename: `${model.slug}.docx` }), {
      url: `${appBaseUrl()}/modelos/${model.slug}?ref=pdf`,
    });
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": PDF_MIME,
        "Content-Disposition": `inline; filename="${model.slug}-exemplo.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error(`[modelos] demo ${slug} falhou:`, err);
    return NextResponse.json(
      { error: "Não conseguimos gerar o PDF agora. Tente de novo em instantes." },
      { status: 502 }
    );
  }
}
