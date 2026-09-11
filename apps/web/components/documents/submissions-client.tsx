"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@submitin/ui/components/button";
import { Input } from "@submitin/ui/components/input";
import { Card, CardContent } from "@submitin/ui/components/card";
import { ArrowLeft, Download, FileText, Inbox, Loader2, RotateCw, Search } from "lucide-react";
import { useLocale, useTranslations } from "@/lib/i18n-context";
import { toast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import { DocumentStatusBadge, fmt } from "./shared";

type Row = {
  id: string;
  createdAt: string;
  status: string;
  error: string | null;
  identifier: string;
  templateVersion: number;
  hasFile: boolean;
};

type Filters = { q: string; from: string; to: string; status: string };

const STATUSES = ["concluida", "falha", "limite", "processando", "recebida"];
const AUTO_REFRESH_MS = 4000;

export function SubmissionsClient({
  document,
  filters,
  rows,
  page,
  pages,
  total,
}: {
  document: { id: string; name: string; slug: string };
  filters: Filters;
  rows: Row[];
  page: number;
  pages: number;
  total: number;
}) {
  const t = useTranslations("documents");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [form, setForm] = useState<Filters>(filters);
  const [retrying, setRetrying] = useState<string | null>(null);

  // Sincroniza o formulário só quando os filtros aplicados mudam (não a cada refresh).
  const filtersKey = JSON.stringify(filters);
  useEffect(() => setForm(filters), [filtersKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Documento aparece em segundos: atualiza enquanto houver itens na fila.
  const hasPending = rows.some((r) => r.status === "recebida" || r.status === "processando");
  useEffect(() => {
    if (!hasPending) return;
    const timer = setInterval(() => router.refresh(), AUTO_REFRESH_MS);
    return () => clearInterval(timer);
  }, [hasPending, router]);

  function navigate(next: Partial<Filters> & { page?: number }) {
    const params = new URLSearchParams();
    // Paginação mantém os filtros aplicados; "Filtrar" aplica o que está no formulário.
    const merged = { ...(next.page ? filters : form), ...next };
    for (const key of ["q", "from", "to", "status"] as const) {
      if (merged[key]) params.set(key, merged[key]);
    }
    if (next.page && next.page > 1) params.set("page", String(next.page));
    router.push(`${pathname}${params.size ? `?${params}` : ""}`);
  }

  async function retry(id: string) {
    setRetrying(id);
    try {
      const res = await fetch(`/api/documents/generations/${id}/retry`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error);
      toast({ title: t("submissions.retried") });
      router.refresh();
    } catch (err) {
      toast({
        title: tCommon("error"),
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setRetrying(null);
    }
  }

  const hasFilters = Boolean(filters.q || filters.from || filters.to || filters.status);
  const dateLocale = locale === "en" ? "en-US" : "pt-BR";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/documents/${document.id}`}>
          <Button variant="ghost" size="icon" aria-label={document.name}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("submissions.title")}</h1>
          <p className="text-muted-foreground truncate">
            {fmt(t("submissions.subtitle"), { name: document.name })}
          </p>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          navigate({});
        }}
        className="flex flex-col lg:flex-row gap-2"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={form.q}
            placeholder={t("submissions.search")}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, q: e.target.value })}
            className="pl-9"
          />
        </div>
        <div className="grid grid-cols-2 sm:flex gap-2">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="shrink-0">{t("submissions.from")}</span>
            <Input
              type="date"
              value={form.from}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, from: e.target.value })}
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="shrink-0">{t("submissions.to")}</span>
            <Input
              type="date"
              value={form.to}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, to: e.target.value })}
            />
          </label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            aria-label={t("submissions.status")}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">{t("submissions.allStatuses")}</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`status.${s}`)}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              {t("submissions.filter")}
            </Button>
            {hasFilters && (
              <Button type="button" variant="ghost" onClick={() => router.push(pathname)}>
                {t("submissions.clear")}
              </Button>
            )}
          </div>
        </div>
      </form>

      {rows.length === 0 ? (
        <Card className="text-center py-14">
          <CardContent>
            <Inbox className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {hasFilters ? t("submissions.noResults") : t("submissions.empty")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{fmt(t("submissions.total"), { count: total })}</span>
            {hasPending && (
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {t("submissions.autoRefresh")}
              </span>
            )}
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">{t("submissions.date")}</th>
                    <th className="px-4 py-3 font-medium">{t("submissions.identifier")}</th>
                    <th className="px-4 py-3 font-medium">{t("submissions.status")}</th>
                    <th className="px-4 py-3 font-medium text-right">{t("submissions.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-t align-top">
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                        {formatDate(row.createdAt, dateLocale)}
                      </td>
                      <td className="px-4 py-3 min-w-[10rem]">
                        <span className="font-medium">{row.identifier || "—"}</span>
                        {row.error && row.status !== "concluida" && (
                          <p className="mt-1 text-xs text-destructive/90 max-w-md">{row.error}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <DocumentStatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {row.hasFile && (
                            <>
                              <a href={`/api/documents/generations/${row.id}/file?format=pdf`}>
                                <Button size="sm" className="gap-1.5">
                                  <Download className="w-3.5 h-3.5" />
                                  {t("submissions.download")}
                                </Button>
                              </a>
                              <a
                                href={`/api/documents/generations/${row.id}/file?format=docx`}
                                className="hidden sm:block"
                              >
                                <Button size="sm" variant="outline" className="gap-1.5">
                                  <FileText className="w-3.5 h-3.5" />
                                  {t("submissions.downloadDocx")}
                                </Button>
                              </a>
                            </>
                          )}
                          {(row.status === "falha" || row.status === "limite") && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5"
                              disabled={retrying === row.id}
                              onClick={() => retry(row.id)}
                            >
                              {retrying === row.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <RotateCw className="w-3.5 h-3.5" />
                              )}
                              {t("submissions.retry")}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {pages > 1 && (
            <div className="flex items-center justify-between gap-2">
              <Button variant="outline" disabled={page <= 1} onClick={() => navigate({ page: page - 1 })}>
                {t("submissions.previous")}
              </Button>
              <span className="text-sm text-muted-foreground">
                {fmt(t("submissions.page"), { page, pages })}
              </span>
              <Button variant="outline" disabled={page >= pages} onClick={() => navigate({ page: page + 1 })}>
                {t("submissions.next")}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
