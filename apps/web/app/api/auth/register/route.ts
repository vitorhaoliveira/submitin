export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@submitin/database";
import { registerSchema } from "@/lib/validations";
import { checkRateLimit, getClientIP } from "@/lib/security";

const SALT_ROUNDS = 12;

export async function POST(request: NextRequest) {
  try {
    // Rate limiting por IP
    const clientIP = getClientIP(request);
    const rateLimit = checkRateLimit(`register:${clientIP}`, 5, 60000); // 5 tentativas por minuto

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Muitas tentativas. Aguarde um momento." },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Validação com Zod
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      return NextResponse.json(
        { error: "Dados inválidos", details: errors },
        { status: 400 }
      );
    }

    const { email, password, name } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Verifica se o email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Este email já está cadastrado. Faça login ou use \"Esqueci a senha\"." },
        { status: 400 }
      );
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Cria o usuário
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        name: name?.trim() || null,
        emailVerified: new Date(), // Considera verificado pois cadastrou com senha
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    return NextResponse.json(
      { message: "Conta criada com sucesso!", user },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ [Register] Erro ao criar usuário:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
