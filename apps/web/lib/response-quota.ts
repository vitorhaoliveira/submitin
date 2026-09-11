import { prisma } from "@submitin/database";
import { maxResponsesPerMonthFor } from "@/lib/stripe";
import { startOfMonth } from "@/lib/documents/service";

/**
 * Respostas/mês do plano, somando os formulários avulsos da conta (documentos
 * têm limite próprio: documentos/mês). Parciais não contam.
 */
export async function monthlyResponseQuotaReached(
  userId: string,
  plan: string | null | undefined
): Promise<boolean> {
  const limit = maxResponsesPerMonthFor(plan);
  if (limit === -1) return false;
  const count = await prisma.response.count({
    where: {
      partial: false,
      submittedAt: { gte: startOfMonth() },
      form: { userId, document: { is: null } },
    },
  });
  return count >= limit;
}
