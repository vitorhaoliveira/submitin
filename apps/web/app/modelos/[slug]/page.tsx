import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, Download, FileText } from "lucide-react";
import { Button } from "@submitin/ui/components/button";
import { buildMetadata, getBaseUrl } from "@/lib/seo";
import { DOCUMENT_MODELS, findModel, modelFilePath } from "@/lib/templates/catalog";
import { modelFields } from "@/lib/templates/model-fields";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingFooter } from "@/components/landing/landing-footer";
import { ModelDemo } from "@/components/templates/model-demo";

export function generateStaticParams() {
  return DOCUMENT_MODELS.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const model = findModel(slug);
  if (!model) return {};
  return buildMetadata({
    title: `Modelo de ${model.title.toLowerCase()} grátis`,
    description: model.summary,
    path: `/modelos/${model.slug}`,
    keywords: [`modelo de ${model.title.toLowerCase()}`, model.title.toLowerCase(), "modelo word", "pdf", model.segment.toLowerCase()],
  });
}

export default async function ModelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const model = findModel(slug);
  if (!model) notFound();

  const fields = await modelFields(model);
  const useHref = `/dashboard/documents/new?modelo=${model.slug}`;
  const others = DOCUMENT_MODELS.filter((m) => m.slug !== model.slug);
  const baseUrl = getBaseUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DigitalDocument",
    name: `Modelo de ${model.title.toLowerCase()}`,
    description: model.summary,
    url: `${baseUrl}/modelos/${model.slug}`,
    encodingFormat: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    isAccessibleForFree: true,
    inLanguage: "pt-BR",
  };

  return (
    <div className="flex min-h-screen flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <LandingHeader />

      <main className="flex-1">
        <section className="container mx-auto grid gap-10 px-4 pt-12 pb-10 md:pt-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div>
            <nav className="text-sm text-muted-foreground" aria-label="Você está em">
              <Link href="/modelos" className="hover:text-foreground">
                Modelos
              </Link>{" "}
              / <span>{model.segment}</span>
            </nav>
            <h1 className="mt-4 font-display text-4xl font-bold tracking-tight [text-wrap:balance] md:text-5xl">
              Modelo de {model.title.toLowerCase()}
            </h1>
            <div className="mt-5 max-w-xl space-y-4 text-lg leading-relaxed text-muted-foreground">
              {model.intro.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href={useHref}>
                  Usar este modelo <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#testar">Testar agora</a>
              </Button>
            </div>
          </div>

          <aside className="space-y-5 rounded-3xl border bg-muted/40 p-6 sm:p-8">
            <div>
              <p className="text-sm font-semibold">Feito para</p>
              <ul className="mt-3 space-y-2">
                {model.uses.map((u) => (
                  <li key={u} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    {u}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold">
                {fields.filter((f) => !f.company && f.nature !== "automatica").length} perguntas para o cliente
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {fields
                  .filter((f) => !f.company && f.nature !== "automatica")
                  .map((f) => f.label)
                  .slice(0, 8)
                  .join(" · ")}
                …
              </p>
            </div>
            <a
              href={modelFilePath(model.slug)}
              download
              className="inline-flex items-center gap-2 text-sm font-medium text-brand hover:underline"
            >
              <Download className="h-4 w-4" />
              Baixar o modelo em Word (.docx)
            </a>
          </aside>
        </section>

        <section id="testar" className="container mx-auto scroll-mt-20 px-4 pb-16">
          <div className="mx-auto max-w-4xl">
            <ModelDemo slug={model.slug} fields={fields} sample={model.sample} useHref={useHref} />
          </div>
        </section>

        <section className="container mx-auto px-4 pb-16">
          <div className="mx-auto max-w-4xl rounded-2xl border bg-background p-6 text-sm leading-relaxed text-muted-foreground">
            <p className="font-semibold text-foreground">Sobre este modelo</p>
            <p className="mt-2">
              Este é um modelo de exemplo, com texto genérico. Revise as cláusulas com um advogado e adapte à realidade
              do seu negócio antes de usar. No Submitin, você pode trocar o texto no Word quando quiser: as variáveis
              entre chaves duplas, como {"{{nome_aluno}}"}, viram as perguntas do formulário.
            </p>
          </div>
        </section>

        <section className="border-t bg-muted/30">
          <div className="container mx-auto px-4 py-16">
            <h2 className="font-display text-2xl font-bold tracking-tight">Outros modelos</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {others.map((m) => (
                <Link
                  key={m.slug}
                  href={`/modelos/${m.slug}`}
                  className="group rounded-2xl border bg-background p-5 transition-colors hover:border-brand"
                >
                  <FileText className="h-5 w-5 text-brand" />
                  <p className="mt-3 font-display font-semibold group-hover:text-brand">{m.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{m.segment}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
