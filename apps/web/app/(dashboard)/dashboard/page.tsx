import { auth } from "@/lib/auth";
import { prisma } from "@submitin/database";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getLocaleFromCookie, getTranslations } from "@/lib/i18n";
import { Button } from "@submitin/ui/components/button";
import { ArrowRight, ChevronRight, FileCheck2, FileText, Plus } from "lucide-react";
import { formatRelativeDate } from "@/lib/utils";

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

  const [responseCount, forms] = await Promise.all([
    prisma.response.count({
      where: { form: { userId: session.user.id } },
    }),
    prisma.form.findMany({
      where: { userId: session.user.id },
      include: { _count: { select: { responses: true, fields: true } } },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const publishedCount = forms.filter((f) => f.published).length;
  const draftCount = forms.length - publishedCount;
  const firstName = (session.user.name || session.user.email?.split("@")[0] || "").split(" ")[0];
  const recentForms = forms.slice(0, 6);

  const stats = [
    { label: t("stats.totalForms"), value: forms.length },
    { label: t("stats.publishedForms"), value: publishedCount },
    { label: t("stats.totalResponses"), value: responseCount },
    { label: t("stats.drafts"), value: draftCount },
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
          <h1 className="text-2xl font-semibold tracking-tight">
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

      {/* Formulários recentes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium">{t("title")}</h2>
          {forms.length > 0 && (
            <Link
              href="/dashboard/forms"
              className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              {t("seeAll")}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {forms.length === 0 ? (
          <div className="rounded-xl border border-dashed py-14 px-6 text-center">
            <p className="font-medium">{t("noForms.title")}</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">{t("noForms.subtitle")}</p>
            <Link href="/dashboard/forms/new" className="inline-block mt-5">
              <Button variant="outline">
                <Plus />
                {t("createForm")}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border divide-y">
            {recentForms.map((form) => (
              <Link
                key={form.id}
                href={`/dashboard/forms/${form.id}`}
                className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/50"
              >
                <span
                  className={`shrink-0 w-2 h-2 rounded-full ${form.published ? "bg-emerald-500" : "bg-zinc-300"}`}
                  title={form.published ? t("formCard.published") : t("formCard.draft")}
                />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{form.name}</span>
                <span className="hidden sm:inline text-sm text-muted-foreground tabular-nums">
                  {form._count.responses} {t("formCard.responses")}
                </span>
                <span className="hidden md:inline w-28 text-right text-sm text-muted-foreground">
                  {formatRelativeDate(form.updatedAt, locale)}
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
