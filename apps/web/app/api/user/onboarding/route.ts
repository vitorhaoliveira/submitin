import { prisma } from "@submitin/database";
import { auth } from "@/lib/auth";

/** POST /api/user/onboarding { dismissed: boolean } — oculta/mostra o checklist do painel. */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Não autorizado" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  await prisma.user.update({
    where: { id: session.user.id },
    data: { onboardingDismissedAt: body?.dismissed === false ? null : new Date() },
  });
  return Response.json({ success: true });
}
