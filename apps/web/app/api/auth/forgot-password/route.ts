import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@submitin/database";
import { forgotPasswordSchema } from "@/lib/validations";
import { checkRateLimit, getClientIP } from "@/lib/security";
import { sendEmail } from "@submitin/email";
import { ResetPasswordEmail } from "@submitin/email";

const RESET_PREFIX = "pwd-reset:";
const TOKEN_BYTES = 32;
const EXPIRES_HOURS = 1;

function getBaseUrl(): string {
  const url =
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    process.env.BASE_URL;
  if (url) {
    return url.startsWith("http") ? url : `https://${url}`;
  }
  return "http://localhost:3000";
}

export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    const ipLimit = checkRateLimit(`forgot-pwd-ip:${clientIP}`, 10, 3600000); // 10 per hour
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { message: "Se o email existir, você receberá um link para redefinir a senha." },
        { status: 200 }
      );
    }

    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Email inválido." },
        { status: 400 }
      );
    }

    const email = parsed.data.email.toLowerCase().trim();
    const emailLimit = checkRateLimit(`forgot-pwd-email:${email}`, 3, 900000); // 3 per 15 min
    if (!emailLimit.allowed) {
      return NextResponse.json(
        { message: "Se o email existir, você receberá um link para redefinir a senha." },
        { status: 200 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, password: true },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { message: "Se o email existir, você receberá um link para redefinir a senha." },
        { status: 200 }
      );
    }

    const token = crypto.randomBytes(TOKEN_BYTES).toString("hex");
    const expires = new Date(Date.now() + EXPIRES_HOURS * 60 * 60 * 1000);
    const identifier = RESET_PREFIX + email;

    await prisma.verificationToken.create({
      data: { identifier, token, expires },
    });

    const baseUrl = getBaseUrl();
    const resetUrl = `${baseUrl}/login/reset?token=${token}`;

    // Check Resend config before attempting send (so we can log clearly in production)
    if (!process.env.AUTH_RESEND_KEY || !process.env.AUTH_EMAIL_FROM) {
      console.error(
        "❌ [ForgotPassword] Email não enviado: AUTH_RESEND_KEY ou AUTH_EMAIL_FROM não configurados. " +
          "Configure em Vercel → Settings → Environment Variables (Production)."
      );
      await prisma.verificationToken.deleteMany({
        where: { identifier, token },
      });
      return NextResponse.json(
        { message: "Se o email existir, você receberá um link para redefinir a senha." },
        { status: 200 }
      );
    }

    try {
      await sendEmail({
        to: email,
        subject: "Redefinir sua senha - Submitin",
        react: ResetPasswordEmail({
          resetUrl,
          host: baseUrl.replace(/^https?:\/\//, ""),
        }),
      });
      console.log("✅ [ForgotPassword] Email de redefinição enviado para:", email);
    } catch (emailError) {
      const errMsg = emailError instanceof Error ? emailError.message : String(emailError);
      console.error("❌ [ForgotPassword] Erro ao enviar email:", errMsg);
      await prisma.verificationToken.deleteMany({
        where: { identifier, token },
      });
      return NextResponse.json(
        { message: "Se o email existir, você receberá um link para redefinir a senha." },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { message: "Se o email existir, você receberá um link para redefinir a senha." },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ [ForgotPassword] Erro:", error);
    return NextResponse.json(
      { message: "Se o email existir, você receberá um link para redefinir a senha." },
      { status: 200 }
    );
  }
}
