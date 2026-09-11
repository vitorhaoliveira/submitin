import { notFound, redirect } from "next/navigation";
import { prisma, type Prisma } from "@submitin/database";
import { formatCnpj, formatCpf, onlyDigits } from "@submitin/documents";
import { auth } from "@/lib/auth";
import { DOCUMENT_STATUSES, responseIdentifier } from "@/lib/documents/service";
import { SubmissionsClient } from "@/components/documents/submissions-client";

export const metadata = {
  title: "Envios",
};

const PAGE_SIZE = 25;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

type SearchParams = { q?: string; from?: string; to?: string; status?: string; page?: string };

/** Data do filtro (dd do calendário) no fuso de Brasília. */
function brDate(value: string | undefined, endOfDay = false): Date | undefined {
  if (!value || !DATE_RE.test(value)) return undefined;
  const date = new Date(`${value}T00:00:00-03:00`);
  if (endOfDay) date.setDate(date.getDate() + 1);
  return date;
}

export default async function SubmissionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ id }, filters] = await Promise.all([params, searchParams]);
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const document = await prisma.document.findFirst({
    where: { id, userId: session.user.id },
    include: { form: { select: { id: true, slug: true, fields: true } } },
  });
  if (!document) notFound();

  const q = filters.q?.trim().slice(0, 100) ?? "";
  const status = DOCUMENT_STATUSES.find((s) => s === filters.status);
  const from = brDate(filters.from);
  const to = brDate(filters.to, true);
  const page = Math.max(1, Number.parseInt(filters.page ?? "1", 10) || 1);

  // CPF/CNPJ ficam salvos com máscara: busca também pela versão formatada.
  const digits = onlyDigits(q);
  const searchTerms = [q];
  if (digits.length === 11) searchTerms.push(formatCpf(digits));
  if (digits.length === 14) searchTerms.push(formatCnpj(digits));

  const where: Prisma.DocumentGenerationWhereInput = {
    documentId: id,
    ...(status && { status }),
    ...((from || to) && { createdAt: { ...(from && { gte: from }), ...(to && { lt: to }) } }),
    ...(q && {
      response: {
        fieldValues: {
          some: { OR: searchTerms.map((term) => ({ value: { contains: term, mode: "insensitive" as const } })) },
        },
      },
    }),
  };

  const [total, generations] = await Promise.all([
    prisma.documentGeneration.count({ where }),
    prisma.documentGeneration.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { response: { include: { fieldValues: true } }, template: { select: { version: true } } },
    }),
  ]);

  return (
    <SubmissionsClient
      document={{ id: document.id, name: document.name, slug: document.form.slug }}
      filters={{ q, from: filters.from ?? "", to: filters.to ?? "", status: status ?? "" }}
      page={page}
      pages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
      total={total}
      rows={generations.map((g) => ({
        id: g.id,
        createdAt: g.createdAt.toISOString(),
        status: g.status,
        error: g.error,
        identifier: responseIdentifier(document.form.fields, g.response.fieldValues),
        templateVersion: g.template.version,
        hasFile: Boolean(g.pdfKey),
      }))}
    />
  );
}
