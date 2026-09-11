import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { DOCUMENT_MODELS } from "@/lib/templates/catalog";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingFooter } from "@/components/landing/landing-footer";

export async function generateMetadata() {
  return buildMetadata({
    title: "Modelos de documentos grátis",
    description:
      "Modelos prontos de contrato de matrícula, ficha de anamnese, termo de academia, contrato de prestação de serviços e autorização de uso de imagem. Teste online e gere o PDF.",
    path: "/modelos",
    keywords: ["modelos de documentos", "modelo de contrato", "modelo word grátis", "gerar pdf"],
  });
}

export default function ModelsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <LandingHeader />
      <main className="flex-1">
        <section className="container mx-auto px-4 pt-16 pb-10 text-center md:pt-24">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand">Modelos</p>
          <h1 className="mx-auto mt-3 max-w-3xl font-display text-4xl font-bold tracking-tight [text-wrap:balance] md:text-6xl">
            Modelos prontos para testar agora
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground [text-wrap:balance]">
            Preencha como se fosse o seu cliente e veja o PDF sair na hora. Gostou? Use com a marca da sua empresa.
          </p>
        </section>

        <section className="container mx-auto px-4 pb-24">
          <div className="mx-auto grid max-w-5xl gap-5 sm:grid-cols-2">
            {DOCUMENT_MODELS.map((m, i) => (
              <Link
                key={m.slug}
                href={`/modelos/${m.slug}`}
                className={`group flex flex-col rounded-3xl border bg-background p-6 transition-all hover:-translate-y-0.5 hover:border-brand hover:shadow-lg hover:shadow-brand/10 ${
                  // Número ímpar de modelos: o último ocupa a linha inteira.
                  i === DOCUMENT_MODELS.length - 1 && DOCUMENT_MODELS.length % 2 === 1 ? "sm:col-span-2" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                    <FileText className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{m.segment}</span>
                </div>
                <h2 className="mt-4 font-display text-2xl font-bold group-hover:text-brand">{m.title}</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{m.summary}</p>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-brand">
                  Testar o modelo <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
          <p className="mt-10 text-center text-sm text-muted-foreground">
            Tem o seu próprio contrato no Word?{" "}
            <Link href="/dashboard/documents/new" className="font-medium text-brand hover:underline">
              Suba o seu arquivo
            </Link>{" "}
            — funciona com qualquer documento.
          </p>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
