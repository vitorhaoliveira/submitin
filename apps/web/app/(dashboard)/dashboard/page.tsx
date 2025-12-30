import { auth } from "@/lib/auth";
import { prisma } from "@submitin/database";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "@/lib/i18n";
import { Button } from "@submitin/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@submitin/ui/components/card";
import { FileText, MessageSquare, TrendingUp, Plus, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const t = await getTranslations("dashboard");

  const [formCount, responseCount, recentForms] = await Promise.all([
    prisma.form.count({
      where: { userId: session.user.id },
    }),
    prisma.response.count({
      where: {
        form: { userId: session.user.id },
      },
    }),
    prisma.form.findMany({
      where: { userId: session.user.id },
      include: {
        _count: {
          select: { responses: true },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            {session.user.name || session.user.email}
          </p>
        </div>
        <Link href="/dashboard/forms/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            {t("createForm")}
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("stats.totalForms")}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("stats.totalResponses")}</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{responseCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("stats.publishedForms")}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formCount > 0 ? Math.round(responseCount / formCount) : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Forms */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">{t("title")}</h2>
          <Link href="/dashboard/forms">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {recentForms.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">{t("noForms.title")}</h3>
              <p className="text-muted-foreground mb-4">
                {t("noForms.subtitle")}
              </p>
              <Link href="/dashboard/forms/new">
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  {t("createForm")}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentForms.map((form: (typeof recentForms)[number]) => (
              <Link key={form.id} href={`/dashboard/forms/${form.id}`}>
                <Card className="cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg truncate">{form.name}</CardTitle>
                      <div
                        className={`w-2 h-2 rounded-full ${
                          form.published ? "bg-emerald-500" : "bg-muted"
                        }`}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        {form._count.responses} {t("formCard.responses")}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
