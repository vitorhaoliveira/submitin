import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@submitin/database";
import { AccountClient } from "./account-client";
import { brandLogoUrl } from "@/lib/branding";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const [user, formCount, publishedCount, responseCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        createdAt: true,
        brandName: true,
        brandLogoKey: true,
      },
    }),
    prisma.form.count({ where: { userId: session.user.id, document: { is: null } } }),
    prisma.form.count({ where: { userId: session.user.id, published: true, document: { is: null } } }),
    prisma.response.count({ where: { form: { userId: session.user.id } } }),
  ]);

  if (!user) {
    redirect("/login");
  }

  return (
    <AccountClient
      profile={{
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        createdAt: user.createdAt.toISOString(),
      }}
      usage={{ forms: formCount, published: publishedCount, responses: responseCount }}
      brand={{ name: user.brandName, logoUrl: brandLogoUrl(user.id, user.brandLogoKey) }}
    />
  );
}
