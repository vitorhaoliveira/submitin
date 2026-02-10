import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@submitin/database";
import { resetPasswordSchema } from "@/lib/validations";

const SALT_ROUNDS = 12;
const RESET_PREFIX = "pwd-reset:";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos. Verifique a nova senha." },
        { status: 400 }
      );
    }

    const { token, newPassword } = parsed.data;

    const verification = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (
      !verification ||
      verification.expires < new Date() ||
      !verification.identifier.startsWith(RESET_PREFIX)
    ) {
      return NextResponse.json(
        { error: "Link inválido ou expirado. Solicite um novo link." },
        { status: 400 }
      );
    }

    const email = verification.identifier.slice(RESET_PREFIX.length);
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, password: true },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "Link inválido ou expirado. Solicite um novo link." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      }),
      prisma.verificationToken.delete({
        where: { token },
      }),
    ]);

    return NextResponse.json(
      { message: "Senha redefinida com sucesso.", redirectUrl: "/login" },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ [ResetPassword] Erro:", error);
    return NextResponse.json(
      { error: "Link inválido ou expirado. Solicite um novo link." },
      { status: 400 }
    );
  }
}
