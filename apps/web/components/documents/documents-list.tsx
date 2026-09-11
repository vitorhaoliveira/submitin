"use client";

import Link from "next/link";
import { Button } from "@submitin/ui/components/button";
import { Badge } from "@submitin/ui/components/badge";
import { AlertTriangle, Braces, ChevronRight, Plus, Share2, Upload } from "lucide-react";
import { useLocale, useTranslations } from "@/lib/i18n-context";
import { formatRelativeDate } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
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
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <Link href="/dashboard/documents/new">
            <Button>
              <Plus />
              {t("new")}
            </Button>
          </Link>
        }
      />

      <div className="flex items-center gap-3 max-w-md">
        {!unlimited && (
          <div className="h-1.5 w-32 shrink-0 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full ${usagePct >= 100 ? "bg-amber-500" : "bg-foreground"}`}
              style={{ width: `${usagePct}%` }}
            />
          </div>
        )}
        <p className="text-sm text-muted-foreground tabular-nums">
          {unlimited ? fmt(t("usageUnlimited"), { used: usage }) : fmt(t("usage"), { used: usage, limit })}
        </p>
      </div>

      {documents.length === 0 ? (
        <div className="rounded-xl border border-dashed px-6 py-14">
          <div className="max-w-2xl mx-auto text-center">
            <p className="font-medium">{t("empty.title")}</p>
            <p className="text-sm text-muted-foreground mt-1">{t("empty.description")}</p>
            <ol className="mt-8 grid gap-3 sm:grid-cols-3 text-left">
              {[
                { icon: Braces, text: t("empty.step1") },
                { icon: Upload, text: t("empty.step2") },
                { icon: Share2, text: t("empty.step3") },
              ].map(({ icon: Icon, text }, i) => (
                <li key={i} className="rounded-lg border bg-background p-4 space-y-3">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <Icon className="w-4 h-4" />
                    <span className="text-xs tabular-nums">0{i + 1}</span>
                  </div>
                  <p className="text-sm">{text}</p>
                </li>
              ))}
            </ol>
            <Link href="/dashboard/documents/new" className="inline-block mt-8">
              <Button>
                <Upload />
                {t("new")}
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">{t("table.name")}</th>
                <th className="hidden sm:table-cell px-4 py-2.5 font-medium">{t("table.status")}</th>
                <th className="px-4 py-2.5 font-medium text-right">{t("table.submissions")}</th>
                <th className="hidden md:table-cell px-4 py-2.5 font-medium text-right whitespace-nowrap">{t("table.last")}</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {documents.map((doc) => (
                <tr key={doc.id} className="relative transition-colors hover:bg-muted/40">
                  <td className="px-4 py-3 max-w-0 w-full">
                    <Link href={`/dashboard/documents/${doc.id}`} className="block truncate font-medium after:absolute after:inset-0">
                      {doc.name}
                    </Link>
                    {doc.failed > 0 && (
                      <span className="mt-0.5 flex items-center gap-1 text-xs text-amber-700">
                        <AlertTriangle className="w-3 h-3" />
                        {doc.failed} {t("card.failed")}
                      </span>
                    )}
                  </td>
                  <td className="hidden sm:table-cell px-4 py-3 whitespace-nowrap">
                    <Badge variant={doc.published ? "success" : "secondary"}>
                      {doc.published ? t("card.published") : t("card.draft")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{doc.submissions}</td>
                  <td className="hidden md:table-cell px-4 py-3 text-right whitespace-nowrap text-muted-foreground">
                    {doc.lastSubmissionAt ? formatRelativeDate(doc.lastSubmissionAt, locale) : "—"}
                  </td>
                  <td className="pr-3 py-3 text-right">
                    <ChevronRight className="w-4 h-4 text-muted-foreground inline" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
