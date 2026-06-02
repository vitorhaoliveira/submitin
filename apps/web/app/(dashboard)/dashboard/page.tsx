import { auth } from "@/lib/auth";
import { prisma } from "@submitin/database";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "@/lib/i18n";
import { Button } from "@submitin/ui/components/button";
import { Card, CardContent } from "@submitin/ui/components/card";
import {
  FileText,
  MessageSquare,
  TrendingUp,
  Plus,
  ArrowRight,
  FileEdit,
  Sparkles,
} from "lucide-react";

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const t = await getTranslations("dashboard");

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
    { label: t("stats.totalForms"), value: forms.length, icon: FileText, tint: "bg-primary/10 text-primary" },
    { label: t("stats.publishedForms"), value: publishedCount, icon: TrendingUp, tint: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
    { label: t("stats.totalResponses"), value: responseCount, icon: MessageSquare, tint: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
    { label: t("stats.drafts"), value: draftCount, icon: FileEdit, tint: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  ];

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {t("greeting")}
            {firstName ? (
              <>
                , <span className="text-gradient">{firstName}</span>
              </>
            ) : (
              ""
            )}
          </h1>
          <p className="text-muted-foreground mt-1">{t("overview")}</p>
        </div>
        <Link href="/dashboard/forms/new">
          <Button size="lg">
            <Plus className="w-4 h-4" />
            {t("createForm")}
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground truncate">{stat.label}</p>
                    <p className="text-2xl sm:text-3xl font-bold mt-1 tabular-nums">{stat.value}</p>
                  </div>
                  <div className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center ${stat.tint}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {forms.length === 0 ? (
        /* Empty state premium */
        <Card className="overflow-hidden border-primary/20 bg-brand-soft">
          <CardContent className="flex flex-col items-center text-center gap-4 py-14 px-6">
            <div className="w-14 h-14 rounded-2xl bg-brand-gradient text-white flex items-center justify-center shadow-sm shadow-primary/30">
              <Sparkles className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{t("noForms.title")}</h3>
              <p className="text-muted-foreground max-w-md">{t("noForms.subtitle")}</p>
            </div>
            <Link href="/dashboard/forms/new">
              <Button size="lg">
                <Plus className="w-4 h-4" />
                {t("createForm")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Quick start banner */}
          <Card className="overflow-hidden border-primary/20 bg-brand-soft">
            <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 shrink-0 rounded-xl bg-brand-gradient text-white flex items-center justify-center shadow-sm shadow-primary/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold">{t("quickStart")}</h3>
                  <p className="text-sm text-muted-foreground">{t("quickStartDesc")}</p>
                </div>
              </div>
              <Link href="/dashboard/forms/new" className="shrink-0">
                <Button>
                  {t("createForm")}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent forms */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{t("title")}</h2>
              <Link
                href="/dashboard/forms"
                className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1"
              >
                {t("seeAll")}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recentForms.map((form) => (
                <Link key={form.id} href={`/dashboard/forms/${form.id}`}>
                  <Card className="h-full transition-all hover:-translate-y-0.5 hover:border-primary/30">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <h3 className="font-semibold truncate group-hover:text-primary">{form.name}</h3>
                        <span
                          className={`shrink-0 mt-1 w-2 h-2 rounded-full ${
                            form.published ? "bg-emerald-500" : "bg-muted-foreground/40"
                          }`}
                          title={form.published ? t("formCard.published") : t("formCard.draft")}
                        />
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <MessageSquare className="w-4 h-4" />
                          {form._count.responses} {t("formCard.responses")}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <FileText className="w-4 h-4" />
                          {form._count.fields} {t("formCard.fields")}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
