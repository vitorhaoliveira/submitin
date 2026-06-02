import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createCheckoutSession, priceIdForPlan, normalizePlan, isPaid } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));

    // Aceita { plan: "plus" | "premium" }. O price ID é resolvido no servidor
    // a partir do plano — nunca confiar no price ID vindo do client.
    const requestedPlan = normalizePlan(body.plan);

    if (!isPaid(requestedPlan)) {
      return NextResponse.json({ error: "Plano inválido" }, { status: 400 });
    }

    const priceId = priceIdForPlan(requestedPlan);

    if (!priceId) {
      return NextResponse.json(
        { error: `Price ID do plano "${requestedPlan}" não configurado no servidor` },
        { status: 500 }
      );
    }

    const checkoutUrl = await createCheckoutSession({
      userId: session.user.id,
      userEmail: session.user.email,
      priceId,
    });

    if (!checkoutUrl) {
      return NextResponse.json(
        { error: "Falha ao criar sessão de checkout" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: checkoutUrl });
  } catch (error) {
    console.error("❌ Error creating checkout session:", error);
    return NextResponse.json(
      {
        error: `Falha ao criar checkout: ${
          error instanceof Error ? error.message : "Erro desconhecido"
        }`,
      },
      { status: 500 }
    );
  }
}
