import { notFound, redirect } from "next/navigation";
import { prisma } from "@submitin/database";
import { auth } from "@/lib/auth";
import { DocumentDetailClient } from "@/components/documents/document-detail-client";

export const metadata = {
  title: "Documento",
};

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const document = await prisma.document.findFirst({
    where: { id, userId: session.user.id },
    include: {
      templates: { orderBy: { version: "desc" }, take: 1 },
      form: {
        include: {
          fields: { orderBy: { order: "asc" } },
          settings: { select: { notifyEmail: true, notifyEmails: true, webhookUrl: true } },
        },
      },
      _count: { select: { generations: true } },
    },
  });
  const invites = document
    ? await prisma.formInvite.findMany({
        where: { formId: document.formId },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: { id: true, token: true, label: true, usedAt: true, createdAt: true },
      })
    : [];
  if (!document) notFound();

  const template = document.templates[0];
  const { form } = document;
  const emails = [
    ...new Set(
      [form.settings?.notifyEmail, ...(form.settings?.notifyEmails ?? [])].filter(
        (e): e is string => Boolean(e)
      )
    ),
  ];

  return (
    <DocumentDetailClient
      document={{
        id: document.id,
        name: document.name,
        submissions: document._count.generations,
      }}
      form={{
        id: form.id,
        slug: form.slug,
        published: form.published,
        fields: form.fields.map((f) => ({
          id: f.id,
          label: f.label,
          type: f.type,
          required: f.required,
          variableKey: f.variableKey,
          nature: (["pergunta", "fixa", "pre_preenchida", "automatica"].includes(f.nature)
            ? f.nature
            : "pergunta") as "pergunta" | "fixa" | "pre_preenchida" | "automatica",
          defaultValue: f.defaultValue,
          helpText: f.helpText,
          options: Array.isArray(f.options) ? (f.options as string[]) : null,
        })),
      }}
      invites={invites.map((i) => ({
        ...i,
        usedAt: i.usedAt?.toISOString() ?? null,
        createdAt: i.createdAt.toISOString(),
      }))}
      template={
        template
          ? {
              version: template.version,
              fileName: template.fileName,
              createdAt: template.createdAt.toISOString(),
              variables: template.variables,
              missingFonts: template.missingFonts,
            }
          : null
      }
      delivery={{ emails, webhookUrl: form.settings?.webhookUrl ?? "" }}
    />
  );
}
