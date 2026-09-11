import { prisma } from "@submitin/database";
import { sendEmail } from "@submitin/email";
import { ResponseLimitEmail } from "@submitin/email/templates/response-limit";
import { maxResponsesPerMonthFor } from "@/lib/stripe";
import { appBaseUrl, startOfMonth } from "@/lib/documents/service";

export type ResponseQuota = { limit: number; used: number; reached: boolean };

/**
 * Respostas/mês do plano, somando os formulários avulsos da conta (documentos
 * têm limite próprio: documentos/mês). Parciais não contam. limit -1 = ilimitado.
 */
export async function responseQuota(userId: string, plan: string | null | undefined): Promise<ResponseQuota> {
  const limit = maxResponsesPerMonthFor(plan);
  if (limit === -1) return { limit, used: 0, reached: false };
  const used = await prisma.response.count({
    where: {
      partial: false,
      submittedAt: { gte: startOfMonth() },
      form: { userId, document: { is: null } },
    },
  });
  return { limit, used, reached: used >= limit };
}

export async function monthlyResponseQuotaReached(
  userId: string,
  plan: string | null | undefined
): Promise<boolean> {
  return (await responseQuota(userId, plan)).reached;
}

const MONTHS = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

/** Avisa o dono da conta, no máximo uma vez por mês. Nunca lança. */
export async function notifyResponseLimitReached(userId: string, limit: number): Promise<void> {
  try {
    // Marca antes de enviar para não duplicar em rajadas de envios.
    const { count } = await prisma.user.updateMany({
      where: {
        id: userId,
        OR: [{ responseLimitNotifiedAt: null }, { responseLimitNotifiedAt: { lt: startOfMonth() } }],
      },
      data: { responseLimitNotifiedAt: new Date() },
    });
    if (count === 0) return;

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (!user?.email) return;
    const next = new Date(startOfMonth());
    next.setMonth(next.getMonth() + 1);
    await sendEmail({
      to: user.email,
      subject: "Seus formulários atingiram o limite de respostas do mês",
      react: ResponseLimitEmail({
        limit,
        resetsOn: `1º de ${MONTHS[next.getMonth()]}`,
        billingUrl: `${appBaseUrl()}/dashboard/billing`,
      }),
    });
  } catch (err) {
    console.error("[forms] aviso de limite de respostas falhou:", err);
  }
}
