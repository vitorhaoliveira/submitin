import { after } from "next/server";
import { warmUpConverter } from "@submitin/documents";

// Um aquecimento por instância a cada 60 s basta (o Cloud Run fica de pé ~15 min).
let lastWarmUp = 0;

/**
 * POST /api/warmup — chamado ao abrir um formulário de documento ou a página de
 * um modelo: acorda o conversor de PDF antes do clique em "revisar"/"gerar".
 */
export async function POST() {
  if (Date.now() - lastWarmUp > 60_000) {
    lastWarmUp = Date.now();
    after(() => warmUpConverter());
  }
  return new Response(null, { status: 204 });
}
