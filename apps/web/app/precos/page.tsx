import Link from "next/link";
import { ArrowRight, Check, CreditCard, FileCheck2, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@submitin/ui/components/button";
import { getLocaleFromCookie } from "@/lib/i18n";
import { buildMetadata, getBaseUrl } from "@/lib/seo";
import { PLANS, SOLD_PLANS } from "@/lib/stripe";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingFooter } from "@/components/landing/landing-footer";
import { PlanComparisonTable } from "@/components/plan-comparison";
import { PricingCards } from "@/components/pricing-cards";

export async function generateMetadata() {
  const locale = await getLocaleFromCookie();
  return buildMetadata({
    title: "Preços",
    description:
      "Comece grátis, sem cartão. Planos Pro e Ilimitado para quem gera contratos, fichas e termos em PDF a partir do próprio Word.",
    path: "/precos",
    keywords: ["preço", "planos", "gerador de contrato", "formulário para PDF", "Submitin"],
    locale: locale === "en" ? "en" : "pt_BR",
  });
}

// Como a cobrança funciona — regras reais do produto (ver lib/documents/generation.ts).
const RULES = [
  {
    icon: FileCheck2,
    title: "Só conta documento gerado",
    text: "O limite considera os PDFs gerados com sucesso no mês. Envio que falhou não conta.",
  },
  {
    icon: RefreshCw,
    title: "Renova todo dia 1º",
    text: "O contador zera no começo de cada mês. Documento não usado não acumula.",
  },
  {
    icon: ShieldCheck,
    title: "Estourou? Nada se perde",
    text: "As respostas continuam chegando e ficam salvas. Os PDFs saem assim que você fizer o upgrade, direto da tela de Envios. E você recebe um aviso por e-mail quando isso acontecer.",
  },
  {
    icon: CreditCard,
    title: "Cancele quando quiser",
    text: "Pelo próprio painel, sem multa nem fidelidade. O plano continua até o fim do período já pago.",
  },
];

const FAQ = [
  {
    q: "Preciso de cartão para começar?",
    a: "Não. O plano Grátis não pede cartão e não expira. Você só informa um cartão se decidir assinar o Pro ou o Ilimitado.",
  },
  {
    q: "O que é o selo do plano Grátis?",
    a: "Uma marca pequena “Gerado com Submitin” no rodapé das páginas do PDF. Nos planos pagos o PDF sai limpo, só com a identidade da sua empresa.",
  },
  {
    q: "Posso trocar de plano depois?",
    a: "Sim, a qualquer momento pelo painel. A diferença é cobrada ou creditada de forma proporcional aos dias restantes do mês.",
  },
  {
    q: "Como é feito o pagamento?",
    a: "Assinatura mensal no cartão de crédito, processada pelo Stripe. O Submitin não vê nem guarda os dados do seu cartão.",
  },
  {
    q: "Como funciona o plano anual?",
    a: "Você paga 10 meses e usa 12 — dois meses de graça. O limite de documentos continua sendo por mês e renova todo dia 1º. Se cancelar, o plano segue até o fim do ano já pago.",
  },
  {
    q: "Também posso criar formulários comuns?",
    a: "Sim. Todos os planos incluem formulários avulsos (sem documento): 5 no Grátis, 20 no Pro e ilimitados no Ilimitado, cada um com o seu limite de respostas por mês.",
  },
  {
    q: "E se eu precisar de mais de 200 documentos só em alguns meses?",
    a: "Hoje o próximo passo é o Ilimitado. Se o seu volume é sazonal (como a época de matrículas), fale com a gente pelo suporte, que ajudamos a encontrar o melhor formato.",
  },
];

export default async function PricingPage() {
  const baseUrl = getBaseUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Submitin",
    description: "Seu Word vira formulário e o PDF chega pronto.",
    url: `${baseUrl}/precos`,
    offers: SOLD_PLANS.map((key) => ({
      "@type": "Offer",
      name: PLANS[key].name,
      price: String(PLANS[key].price),
      priceCurrency: "BRL",
      url: `${baseUrl}/precos`,
    })),
  };

  return (
    <div className="flex min-h-screen flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <LandingHeader />

      <main className="flex-1">
        {/* Abertura */}
        <section className="container mx-auto px-4 pt-16 pb-12 text-center md:pt-24">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand">Preços</p>
          <h1 className="mx-auto mt-3 max-w-3xl font-display text-4xl font-bold tracking-tight [text-wrap:balance] md:text-6xl">
            Você paga pelos documentos que gera.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground [text-wrap:balance]">
            Comece grátis, sem cartão. Suba de plano quando o volume crescer — e cancele quando quiser.
          </p>
        </section>

        {/* Planos */}
        <section className="container mx-auto px-4 pb-20" aria-label="Planos">
          <PricingCards />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Preços em reais, cobrados no cartão (mensal ou anual). Sem taxa de adesão.
          </p>
        </section>

        {/* Como a cobrança funciona */}
        <section className="border-y bg-muted/40">
          <div className="container mx-auto px-4 py-20">
            <h2 className="text-center font-display text-3xl font-bold tracking-tight md:text-4xl">
              Como a cobrança funciona
            </h2>
            <div className="mx-auto mt-12 grid max-w-5xl gap-8 sm:grid-cols-2">
              {RULES.map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold">{title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparação */}
        <section className="container mx-auto px-4 py-20">
          <h2 className="text-center font-display text-3xl font-bold tracking-tight md:text-4xl">
            Compare os planos
          </h2>
          <div className="mx-auto mt-10 max-w-5xl overflow-hidden rounded-2xl border bg-background">
            <PlanComparisonTable />
          </div>
        </section>

        {/* Perguntas */}
        <section className="container mx-auto px-4 pb-24">
          <h2 className="text-center font-display text-3xl font-bold tracking-tight md:text-4xl">
            Perguntas sobre planos
          </h2>
          <div className="mx-auto mt-10 max-w-3xl divide-y rounded-2xl border">
            {FAQ.map((item) => (
              <details key={item.q} className="group p-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg font-semibold">
                  {item.q}
                  <span className="text-muted-foreground transition-transform group-open:rotate-45" aria-hidden>
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
              </details>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Button asChild size="lg">
              <Link href="/dashboard/documents/new">
                Começar grátis <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <p className="mt-3 text-sm text-muted-foreground">Sem cartão. Leva menos de um minuto.</p>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
