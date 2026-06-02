import { auth } from "@/lib/auth";
import { prisma } from "@submitin/database";
import { redirect, notFound } from "next/navigation";
import { ResponsesTable } from "@/components/responses-table";

export const metadata = {
  title: "Respostas",
};

export default async function ResponsesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const [form, dbUser, responses] = await Promise.all([
    prisma.form.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        fields: {
          orderBy: { order: "asc" },
        },
      },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true },
    }),
    prisma.response.findMany({
      where: { formId: id },
      include: {
        fieldValues: {
          include: {
            field: true,
          },
        },
      },
      orderBy: { submittedAt: "desc" },
    }),
  ]);

  if (!form) {
    notFound();
  }

  // Separa respostas completas (tabela principal) de parciais (leads PRO).
  const completeResponses = responses.filter((r) => !r.partial);
  const partialResponses = responses
    .filter((r) => r.partial)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

  return (
    <ResponsesTable
      form={form}
      responses={completeResponses}
      partials={partialResponses}
      isPro={dbUser?.plan === "pro"}
    />
  );
}
