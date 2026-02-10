import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@submitin/database";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Get user subscription data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        plan: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        stripeCurrentPeriodEnd: true,
        cancelAtPeriodEnd: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      plan: user.plan,
      stripeCustomerId: user.stripeCustomerId,
      stripeSubscriptionId: user.stripeSubscriptionId,
      stripeCurrentPeriodEnd: user.stripeCurrentPeriodEnd,
      cancelAtPeriodEnd: user.cancelAtPeriodEnd,
    });
  } catch (error) {
    console.error("❌ Error fetching subscription:", error);
    return NextResponse.json(
      { error: "Erro ao buscar assinatura" },
      { status: 500 }
    );
  }
}
