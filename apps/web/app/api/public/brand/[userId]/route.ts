import { prisma } from "@submitin/database";
import { getObject } from "@/lib/storage";
import { logoMimeFromKey } from "@/lib/branding";

/** GET /api/public/brand/[userId]?v=... — logo da conta (público, exibido nos formulários). */
export async function GET(_request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { brandLogoKey: true } });
  if (!user?.brandLogoKey) return new Response(null, { status: 404 });

  const file = await getObject(user.brandLogoKey);
  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": logoMimeFromKey(user.brandLogoKey),
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
