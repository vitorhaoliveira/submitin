import { processPendingGenerations } from "@/lib/documents/generation";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * GET /api/cron/documents — varredura da fila de documentos (Vercel Cron).
 * A Vercel envia `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }
  const result = await processPendingGenerations();
  return Response.json(result);
}
