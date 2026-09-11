import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@submitin/database";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/security";
import { deleteObjects, putObject } from "@/lib/storage";
import { brandLogoUrl, detectLogoType, MAX_BRAND_NAME, MAX_LOGO_BYTES } from "@/lib/branding";

/**
 * PUT /api/user/branding — multipart: name, logo (arquivo, opcional), removeLogo ("1").
 * Logo: PNG, JPG ou WebP até 1 MB.
 */
export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const userId = session.user.id;

  if (!checkRateLimit(`branding:${userId}`, 10, 60_000).allowed) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde um momento." }, { status: 429 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const name = String(formData.get("name") ?? "").trim();
  if (name.length > MAX_BRAND_NAME) {
    return NextResponse.json({ error: `Nome muito longo (máximo ${MAX_BRAND_NAME}).` }, { status: 400 });
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { brandLogoKey: true },
  });
  let logoKey = user.brandLogoKey;

  const logo = formData.get("logo");
  if (logo instanceof File && logo.size > 0) {
    if (logo.size > MAX_LOGO_BYTES) {
      return NextResponse.json({ error: "Logo muito grande (máximo 1 MB)." }, { status: 400 });
    }
    const buffer = Buffer.from(await logo.arrayBuffer());
    const type = detectLogoType(buffer);
    if (!type) {
      return NextResponse.json({ error: "Envie o logo em PNG, JPG ou WebP." }, { status: 400 });
    }
    logoKey = `branding/${userId}/${randomUUID()}.${type.ext}`;
    await putObject(logoKey, buffer, type.mime);
  } else if (formData.get("removeLogo") === "1") {
    logoKey = null;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { brandName: name || null, brandLogoKey: logoKey },
  });
  if (user.brandLogoKey && user.brandLogoKey !== logoKey) {
    await deleteObjects([user.brandLogoKey]).catch(() => {});
  }

  return NextResponse.json({ name: name || null, logoUrl: brandLogoUrl(userId, logoKey) });
}
