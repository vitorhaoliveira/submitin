"use client";

import Link from "next/link";
import { Button } from "@submitin/ui/components/button";
import { Badge } from "@submitin/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@submitin/ui/components/card";
import { AlertTriangle, Braces, FileCheck2, Inbox, Plus, Share2, Upload } from "lucide-react";
import { useLocale, useTranslations } from "@/lib/i18n-context";
import { formatRelativeDate } from "@/lib/utils";
import { fmt } from "./shared";

type DocumentItem = {
  id: string;
  name: string;
  published: boolean;
  slug: string;
  submissions: number;
  failed: number;
  lastSubmissionAt: string | null;
};

export function DocumentsList({
  documents,
  usage,
  limit,
}: {
  documents: DocumentItem[];
  usage: number;
  limit: number;
}) {
  const t = useTranslations("documents");
  const locale = useLocale();
  const unlimited = limit === -1;
  const usagePct = unlimited ? 0 : Math.min(100, (usage / Math.max(1, limit)) * 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Link href="/dashboard/documents/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            {t("new")}
          </Button>
        </Link>
      </div>

      <div className="max-w-md space-y-1.5">
        <p className="text-sm text-muted-foreground">
          {unlimited
            ? fmt(t("usageUnlimited"), { used: usage })
            : fmt(t("usage"), { used: usage, limit })}
        </p>
        {!unlimited && (
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full ${usagePct >= 100 ? "bg-amber-500" : "bg-primary"}`}
              style={{ width: `${usagePct}%` }}
            />
          </div>
        )}
      </div>

      {documents.length === 0 ? (
        <Card className="py-12">
          <CardContent className="max-w-2xl mx-auto text-center space-y-8">
            <div>
              <FileCheck2 className="w-14 h-14 mx-auto text-primary mb-4" />
              <h3 className="font-semibold text-xl mb-2">{t("empty.title")}</h3>
              <p className="text-muted-foreground">{t("empty.description")}</p>
            </div>
            <ol className="grid gap-4 sm:grid-cols-3 text-left">
              {[
                { icon: Braces, text: t("empty.step1") },
                { icon: Upload, text: t("empty.step2") },
                { icon: Share2, text: t("empty.step3") },
              ].map(({ icon: Icon, text }, i) => (
                <li key={i} className="rounded-xl border bg-muted/30 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-primary">
                    <span className="text-xs font-semibold">{i + 1}</span>
                    <Icon className="w-4 h-4" />
                  </div>
                  <p className="text-sm">{text}</p>
                </li>
              ))}
            </ol>
            <Link href="/dashboard/documents/new">
              <Button size="lg" className="gap-2">
                <Upload className="w-4 h-4" />
                {t("new")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc, index) => (
            <Card
              key={doc.id}
              className="animate-fade-in-up transition-all hover:-translate-y-0.5 hover:border-primary/30"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/dashboard/documents/${doc.id}`} className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate hover:text-primary transition-colors">
                      {doc.name}
                    </CardTitle>
                  </Link>
                  <Badge variant={doc.published ? "success" : "secondary"}>
                    {doc.published ? t("card.published") : t("card.draft")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Inbox className="w-4 h-4" />
                    <strong className="text-foreground">{doc.submissions}</strong> {t("card.submissions")}
                  </span>
                  {doc.failed > 0 && (
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="w-4 h-4" />
                      {doc.failed} {t("card.failed")}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {doc.lastSubmissionAt
                    ? fmt(t("card.lastSubmission"), {
                        date: formatRelativeDate(doc.lastSubmissionAt, locale),
                      })
                    : t("card.noSubmissions")}
                </p>
                <div className="flex gap-2">
                  <Link href={`/dashboard/documents/${doc.id}/envios`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      {t("card.viewSubmissions")}
                    </Button>
                  </Link>
                  <Link href={`/dashboard/documents/${doc.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      {t("card.manage")}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
