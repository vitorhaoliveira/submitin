import { auth } from "@/lib/auth";
import { prisma } from "@submitin/database";
import { redirect } from "next/navigation";
import { FormsGrid } from "@/components/forms-grid";

export const metadata = {
  title: "Formulários",
};

export default async function FormsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });

  const forms = await prisma.form.findMany({
    // Formulários gerados por documentos aparecem só em Documentos.
    where: { userId: session.user.id, document: { is: null } },
    include: {
      _count: {
        select: { responses: true, fields: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return <FormsGrid forms={forms} userPlan={user?.plan || "free"} />;
}

