import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@submitin/database";
import { Logo } from "@/components/logo";
import { VerifyFile } from "./verify-file";

export const metadata: Metadata = {
  title: "Verificar documento",
  robots: { index: false, follow: false },
};

function formatBrazil(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "long",
    timeStyle: "medium",
  }).format(date);
}

/** a***@dominio.com — confirma quem aceitou sem expor o e-mail inteiro. */
function maskEmail(email: string | null): string | null {
  if (!email) return null;
  const [user, domain] = email.split("@");
  if (!user || !domain) return null;
  return `${user[0]}${"*".repeat(Math.max(2, user.length - 1))}@${domain}`;
}

/**
 * /v/[token] — verificação pública de um documento gerado: confere se um PDF é
 * idêntico ao entregue (SHA-256 calculado no navegador; o arquivo não é enviado).
 */
export default async function VerifyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const generation = await prisma.documentGeneration.findUnique({
    where: { accessToken: token },
    select: {
      status: true,
      pdfSha256: true,
      completedAt: true,
      acceptedAt: true,
      document: {
        select: { name: true, user: { select: { brandName: true } }, form: { select: { fields: true } } },
      },
      response: { select: { fieldValues: { select: { fieldId: true, value: true } } } },
    },
  });
  if (!generation || generation.status !== "concluida" || !generation.pdfSha256 || !generation.completedAt) {
    notFound();
  }

  const emailField = generation.document.form.fields
    .filter((f) => f.type === "email")
    .sort((a, b) => a.order - b.order)
    .find((f) => generation.response.fieldValues.some((v) => v.fieldId === f.id && v.value.trim()));
  const email = emailField
    ? generation.response.fieldValues.find((v) => v.fieldId === emailField.id)?.value.trim() ?? null
    : null;

  const rows: Array<[string, string | null]> = [
    ["Documento", generation.document.name],
    ["Empresa", generation.document.user.brandName],
    ["Gerado em", formatBrazil(generation.completedAt)],
    ["Aceite eletrônico", generation.acceptedAt ? formatBrazil(generation.acceptedAt) : "Não registrado"],
    ["E-mail de quem aceitou", generation.acceptedAt ? maskEmail(email) : null],
  ];

  return (
    <main className="min-h-screen bg-muted/40 px-4 py-12">
      <div className="mx-auto max-w-xl space-y-6">
        <Logo />
        <div className="rounded-2xl border bg-background p-6 shadow-sm sm:p-8 space-y-6">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand">Verificação de documento</p>
            <h1 className="font-display text-2xl font-bold tracking-tight">Documento registrado no Submitin</h1>
            <p className="text-sm text-muted-foreground">
              Este código corresponde a um documento gerado e entregue pelo Submitin.
            </p>
          </div>

          <dl className="divide-y rounded-xl border text-sm">
            {rows
              .filter(([, v]) => v)
              .map(([label, value]) => (
                <div key={label} className="grid gap-1 px-4 py-3 sm:grid-cols-[11rem_1fr]">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-medium [overflow-wrap:anywhere]">{value}</dd>
                </div>
              ))}
            <div className="grid gap-1 px-4 py-3 sm:grid-cols-[11rem_1fr]">
              <dt className="text-muted-foreground">Impressão digital (SHA-256)</dt>
              <dd className="font-mono text-xs [overflow-wrap:anywhere]">{generation.pdfSha256}</dd>
            </div>
          </dl>

          <VerifyFile expectedSha256={generation.pdfSha256} />
        </div>
        <p className="text-center text-xs text-muted-foreground">
          O arquivo escolhido é conferido no seu navegador e não é enviado a nenhum servidor.
        </p>
      </div>
    </main>
  );
}
