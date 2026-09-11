import { redirect } from "next/navigation";
import { prisma } from "@submitin/database";
import { auth } from "@/lib/auth";
import { maxDocumentsPerMonthFor } from "@/lib/stripe";
import { monthlyDocumentUsage } from "@/lib/documents/service";
import { DocumentsList } from "@/components/documents/documents-list";

export const metadata = {
  title: "Documentos",
};

export default async function DocumentsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId: string = session.user.id;

  const [user, documents, usage] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { plan: true } }),
    prisma.document.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        form: { select: { published: true, slug: true } },
        _count: { select: { generations: true } },
        generations: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
      },
    }),
    monthlyDocumentUsage(userId),
  ]);

  const failedCounts = await prisma.documentGeneration.groupBy({
    by: ["documentId"],
    where: { document: { userId }, status: { in: ["falha", "limite"] } },
    _count: { _all: true },
  });
  const failedByDocument = new Map(failedCounts.map((f) => [f.documentId, f._count._all]));

  return (
    <DocumentsList
      usage={usage}
      limit={maxDocumentsPerMonthFor(user?.plan)}
      documents={documents.map((d) => ({
        id: d.id,
        name: d.name,
        published: d.form.published,
        slug: d.form.slug,
        submissions: d._count.generations,
        failed: failedByDocument.get(d.id) ?? 0,
        lastSubmissionAt: d.generations[0]?.createdAt.toISOString() ?? null,
      }))}
    />
  );
}
