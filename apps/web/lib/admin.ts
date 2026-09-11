import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";

/** Admins = e-mails em ADMIN_EMAILS (separados por vírgula). Só quem tem acesso à Vercel altera. */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase());
}

/** Para páginas admin: quem não é admin recebe 404 (a área nem "existe" para os outros). */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email || !isAdminEmail(session.user.email)) notFound();
  return session;
}
