import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Dynamic import to avoid build-time initialization issues
async function getHandlers() {
  const { handlers } = await import("@/lib/auth");
  return handlers;
}

export async function GET(request: NextRequest) {
  try {
    const handlers = await getHandlers();
    return handlers.GET(request);
  } catch (error) {
    console.error("❌ [NextAuth GET] Erro ao processar requisição:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const handlers = await getHandlers();
    return handlers.POST(request);
  } catch (error) {
    console.error("❌ [NextAuth POST] Erro ao processar requisição:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
