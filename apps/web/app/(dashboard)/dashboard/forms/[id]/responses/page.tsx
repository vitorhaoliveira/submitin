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

  const form = await prisma.form.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    include: {
      fields: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!form) {
    notFound();
  }

  const responses = await prisma.response.findMany({
    where: { formId: id },
    include: {
      fieldValues: {
        include: {
          field: true,
        },
      },
    },
    orderBy: { submittedAt: "desc" },
  });

  return <ResponsesTable form={form} responses={responses} />;
}
