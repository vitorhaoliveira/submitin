import { prisma } from "@submitin/database";
import { maxDocumentsPerMonthFor } from "@/lib/stripe";
import { monthlyDocumentUsage } from "@/lib/documents/service";

/** Uso do mês para o medidor do painel. limit -1 = ilimitado. */
export type DocumentUsage = { used: number; limit: number };

export async function documentUsageFor(userId: string): Promise<DocumentUsage> {
  const [user, used] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { plan: true } }),
    monthlyDocumentUsage(userId),
  ]);
  return { used, limit: maxDocumentsPerMonthFor(user?.plan) };
}

/** Percentual a partir do qual o medidor fica amarelo e o aviso por e-mail sai. */
export const USAGE_WARNING_RATIO = 0.8;
