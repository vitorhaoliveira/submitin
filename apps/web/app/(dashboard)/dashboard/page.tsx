import { auth } from "@/lib/auth";
import { prisma } from "@submitin/database";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getLocaleFromCookie, getTranslations } from "@/lib/i18n";
import { Button } from "@submitin/ui/components/button";
import { ArrowRight, ChevronRight, FileCheck2, FileText, Plus } from "lucide-react";
import { formatRelativeShort } from "@/lib/utils";
import { OnboardingChecklist, type OnboardingStep } from "@/components/onboarding-checklist";
import { monthlyDocumentUsage } from "@/lib/documents/service";

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const t = await getTranslations("dashboard");
  const tDocs = await getTranslations("documents");
  const locale = await getLocaleFromCookie();

  const userId: string = session.user.id;
  // Formulários de documento aparecem só como documentos.
  const regularForms = { userId, document: { is: null } };
  const [responseCount, forms, documents, generatedThisMonth] = await Promise.all([
    prisma.response.count({ where: { form: regularForms, partial: false } }),
    prisma.form.findMany({
      where: regularForms,
      include: { _count: { select: { responses: { where: { partial: false } } } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.document.findMany({
      where: { userId },
      include: {
        form: { select: { published: true, slug: true } },
        _count: { select: { generations: true } },
        generations: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    monthlyDocumentUsage(userId),
  ]);

  // Primeiros passos: da conta nova até o primeiro PDF.
  const [owner, firstPdfCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { brandName: true, brandLogoKey: true, onboardingDismissedAt: true },
    }),
    prisma.documentGeneration.count({ where: { status: "concluida", document: { userId } } }),
  ]);
  const firstDoc = documents[documents.length - 1] ?? null; // o mais antigo
  const publishedDoc = documents.find((d) => d.form.published) ?? null;
  const onboardingSteps: OnboardingStep[] = [
    {
      key: "document",
      title: "Crie seu primeiro documento",
      description: "Suba o Word que você já usa ou comece por um modelo pronto.",
      done: documents.length > 0,
      cta: "Criar documento",
      href: "/dashboard/documents/new",
    },
    {
      key: "brand",
      title: "Coloque sua marca",
      description: "Logo e nome da empresa no topo do formulário e no e-mail do cliente.",
      done: Boolean(owner?.brandName || owner?.brandLogoKey),
      cta: "Adicionar marca",
      href: "/dashboard/account#marca",
    },
    {
      key: "publish",
      title: "Publique o link",
      description: "Deixe o formulário no ar e copie o link para mandar pelo WhatsApp ou pôr no site.",
      done: Boolean(publishedDoc),
      cta: "Abrir documento",
      href: firstDoc ? `/dashboard/documents/${firstDoc.id}` : null,
    },
    {
      key: "pdf",
      title: "Receba o primeiro PDF",
      description: "Preencha o link você mesmo, como teste: o PDF chega no seu e-mail em segundos.",
      done: firstPdfCount > 0,
      cta: "Testar o link",
      href: publishedDoc ? `/f/${publishedDoc.form.slug}` : null,
      external: true,
    },
  ];
  const showOnboarding = !owner?.onboardingDismissedAt;

  const firstName = (session.user.name || session.user.email?.split("@")[0] || "").split(" ")[0];
  const recentForms = forms.slice(0, 5);
  const recentDocuments = documents.slice(0, 5);

  const stats = [
    { label: t("stats.documents"), value: documents.length },
    { label: t("stats.generatedThisMonth"), value: generatedThisMonth },
    { label: t("stats.totalForms"), value: forms.length },
    { label: t("stats.totalResponses"), value: responseCount },
  ];

  const shortcuts = [
    { href: "/dashboard/forms/new", icon: FileText, title: t("quickStart"), desc: t("quickStartDesc") },
    { href: "/dashboard/documents/new", icon: FileCheck2, title: tDocs("new"), desc: tDocs("subtitle") },
  ];

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {t("greeting")}
            {firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t("overview")}</p>
        </div>
        <Link href="/dashboard/forms/new">
          <Button>
            <Plus />
            {t("createForm")}
          </Button>
        </Link>
      </div>

      {showOnboarding && <OnboardingChecklist steps={onboardingSteps} />}

      {/* Números */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px overflow-hidden rounded-xl border bg-border">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-background p-5">
            <p className="text-sm text-muted-foreground truncate">{stat.label}</p>
            <p className="text-2xl font-semibold mt-1 tabular-nums">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Atalhos */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {shortcuts.map(({ href, icon: Icon, title, desc }) => (
          <Link
            key={href}
            href={href}
            className="group flex min-w-0 items-center gap-4 rounded-xl border p-4 transition-colors hover:bg-muted/50"
          >
            <div className="w-9 h-9 shrink-0 rounded-md bg-brand-soft text-brand flex items-center justify-center">
              <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{title}</p>
              <p className="text-sm text-muted-foreground truncate">{desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Documentos recentes */}
        <RecentList
          title={tDocs("title")}
          seeAllHref="/dashboard/documents"
          seeAllLabel={t("seeAll")}
          empty={
            <>
              <p className="font-medium">{tDocs("empty.title")}</p>
              <p className="text-sm text-muted-foreground mt-1">{tDocs("empty.description")}</p>
              <Link href="/dashboard/documents/new" className="inline-block mt-5">
                <Button variant="outline">
                  <Plus />
                  {tDocs("new")}
                </Button>
              </Link>
            </>
          }
          items={recentDocuments.map((doc) => ({
            id: doc.id,
            href: `/dashboard/documents/${doc.id}`,
            name: doc.name,
            published: doc.form.published,
            meta: `${doc._count.generations} ${doc._count.generations === 1 ? tDocs("card.submission") : tDocs("card.submissions")}`,
            date: formatRelativeShort(doc.generations[0]?.createdAt ?? doc.updatedAt, locale),
          }))}
          publishedLabel={t("formCard.published")}
          draftLabel={t("formCard.draft")}
        />

        {/* Formulários recentes */}
        <RecentList
          title={t("title")}
          seeAllHref="/dashboard/forms"
          seeAllLabel={t("seeAll")}
          empty={
            <>
              <p className="font-medium">{t("noForms.title")}</p>
              <p className="text-sm text-muted-foreground mt-1">{t("noForms.subtitle")}</p>
              <Link href="/dashboard/forms/new" className="inline-block mt-5">
                <Button variant="outline">
                  <Plus />
                  {t("createForm")}
                </Button>
              </Link>
            </>
          }
          items={recentForms.map((form) => ({
            id: form.id,
            href: `/dashboard/forms/${form.id}`,
            name: form.name,
            published: form.published,
            meta: `${form._count.responses} ${form._count.responses === 1 ? t("formCard.response") : t("formCard.responses")}`,
            date: formatRelativeShort(form.updatedAt, locale),
          }))}
          publishedLabel={t("formCard.published")}
          draftLabel={t("formCard.draft")}
        />
      </div>
    </div>
  );
}

function RecentList({
  title,
  seeAllHref,
  seeAllLabel,
  empty,
  items,
  publishedLabel,
  draftLabel,
}: {
  title: string;
  seeAllHref: string;
  seeAllLabel: string;
  empty: React.ReactNode;
  items: { id: string; href: string; name: string; published: boolean; meta: string; date: string }[];
  publishedLabel: string;
  draftLabel: string;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium">{title}</h2>
        {items.length > 0 && (
          <Link
            href={seeAllHref}
            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            {seeAllLabel}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed py-10 px-6 text-center">{empty}</div>
      ) : (
        <div className="rounded-xl border divide-y">
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/50"
            >
              <span
                className={`shrink-0 w-2 h-2 rounded-full ${item.published ? "bg-emerald-500" : "bg-zinc-300"}`}
                title={item.published ? publishedLabel : draftLabel}
              />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{item.name}</span>
              <span className="hidden sm:inline text-sm text-muted-foreground tabular-nums whitespace-nowrap">
                {item.meta}
              </span>
              <span className="hidden md:inline shrink-0 min-w-[5.5rem] text-right text-sm text-muted-foreground whitespace-nowrap">
                {item.date}
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
