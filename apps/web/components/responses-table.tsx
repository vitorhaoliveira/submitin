"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "@/lib/i18n-context";
import { Button } from "@submitin/ui/components/button";
import { Input } from "@submitin/ui/components/input";
import { Badge } from "@submitin/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@submitin/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@submitin/ui/components/dialog";
import {
  ArrowLeft,
  Download,
  Search,
  Eye,
  MessageSquare,
  ExternalLink,
  Copy,
  Trash2,
  Loader2,
  TrendingUp,
  RefreshCw,
  UserPlus,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatDate, formatRelativeDate } from "@/lib/utils";
import { ResponseCharts } from "./response-charts";

interface Field {
  id: string;
  label: string;
  type: string;
}

interface FieldValue {
  id: string;
  value: string;
  field: Field;
}

interface Response {
  id: string;
  submittedAt: Date;
  updatedAt?: Date;
  fieldValues: FieldValue[];
}

interface Form {
  id: string;
  name: string;
  slug: string;
  fields: Field[];
  views: number;
}

interface ResponsesTableProps {
  form: Form;
  responses: Response[];
  partials?: Response[];
  isPro: boolean;
}

export function ResponsesTable({ form, responses: initialResponses, partials = [], isPro }: ResponsesTableProps) {
  const router = useRouter();
  const t = useTranslations("responses");
  const tCommon = useTranslations("common");
  const tDashboard = useTranslations("dashboard");
  const [responses, setResponses] = useState(initialResponses);
  const [search, setSearch] = useState("");
  const [selectedResponse, setSelectedResponse] = useState<Response | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Response | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredResponses = responses.filter((response) =>
    response.fieldValues.some((fv) =>
      fv.value.toLowerCase().includes(search.toLowerCase())
    )
  );

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/forms/${form.id}/responses/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setResponses((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setSelectedResponse((cur) => (cur?.id === deleteTarget.id ? null : cur));
      toast({ title: t("responseDeleted") });
      router.refresh();
    } catch {
      toast({
        title: tCommon("error"),
        description: t("deleteError"),
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  }

  function exportCSV() {
    if (responses.length === 0) {
      toast({
        title: t("noResponses.title"),
        variant: "destructive",
      });
      return;
    }

    const headers = ["ID", t("table.submittedAt"), ...form.fields.map((f) => f.label)];
    const rows = responses.map((response) => {
      const valueMap = new Map(
        response.fieldValues.map((fv) => [fv.field.id, fv.value])
      );
      return [
        response.id,
        formatDate(response.submittedAt),
        ...form.fields.map((f) => valueMap.get(f.id) || ""),
      ];
    });

    // Escapa célula para CSV: neutraliza fórmulas (CSV injection) e aspas/quebras.
    const escapeCell = (raw: string) => {
      let cell = String(raw ?? "");
      if (/^[=+\-@\t\r]/.test(cell)) cell = `'${cell}`;
      return `"${cell.replace(/"/g, '""')}"`;
    };

    const csvContent = [
      headers.map(escapeCell).join(","),
      ...rows.map((row) => row.map(escapeCell).join(",")),
    ].join("\r\n");

    // BOM para o Excel reconhecer UTF-8 (acentos não quebram).
    const blob = new Blob(["﻿" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `${form.name.replace(/[^a-z0-9]/gi, "_")}_${stamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: t("exportSuccess"),
      description: t("exportSuccessDesc").replace("{count}", String(responses.length)),
    });
  }

  async function copyLink() {
    const url = `${window.location.origin}/f/${form.slug}`;
    await navigator.clipboard.writeText(url);
    toast({ title: tCommon("copied") });
  }

  const [isRefreshing, setIsRefreshing] = useState(false);

  function handleRefresh() {
    // router.refresh() re-executa o server component (busca views/respostas novas).
    setIsRefreshing(true);
    router.refresh();
    // Curto feedback visual; o refresh do servidor é rápido e não tem callback.
    setTimeout(() => setIsRefreshing(false), 800);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/forms/${form.id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
            <p className="text-muted-foreground">{form.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title={t("refresh")}
            aria-label={t("refresh")}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="outline" size="icon" onClick={copyLink} title={t("copyLink")}>
            <Copy className="w-4 h-4" />
          </Button>
          <Link href={`/f/${form.slug}`} target="_blank">
            <Button variant="outline" size="icon" title={t("openForm")}>
              <ExternalLink className="w-4 h-4" />
            </Button>
          </Link>
          <Button onClick={exportCSV} className="gap-2">
            <Download className="w-4 h-4" />
            {t("exportCSV")}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{tDashboard("stats.totalResponses")}</CardDescription>
            <CardTitle className="text-4xl tabular-nums">{responses.length}</CardTitle>
          </CardHeader>
        </Card>

        {/* Visualizações (PRO) */}
        <Card className={!isPro ? "relative overflow-hidden" : undefined}>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              {t("analytics.views")}
              {!isPro && <Badge variant="secondary" className="text-[10px]">PRO</Badge>}
            </CardDescription>
            <CardTitle className="text-4xl tabular-nums">
              {isPro ? form.views : "—"}
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Taxa de conversão (PRO) */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              {t("analytics.conversion")}
              {!isPro && <Badge variant="secondary" className="text-[10px]">PRO</Badge>}
            </CardDescription>
            <CardTitle className="text-4xl tabular-nums">
              {isPro
                ? `${form.views > 0 ? Math.min(100, Math.round((responses.length / form.views) * 100)) : 0}%`
                : "—"}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("table.submittedAt")}</CardDescription>
            <CardTitle className="text-2xl">
              {responses.length > 0 && responses[0]?.submittedAt
                ? formatRelativeDate(responses[0].submittedAt)
                : "—"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* CTA de upgrade para liberar analytics (apenas Free) */}
      {!isPro && (
        <Card className="overflow-hidden border-primary/20 bg-brand-soft">
          <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 shrink-0 rounded-xl bg-brand-gradient text-white flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold">{t("analytics.upgradeTitle")}</p>
                <p className="text-sm text-muted-foreground">{t("analytics.upgradeDesc")}</p>
              </div>
            </div>
            <Link href="/dashboard/billing" className="shrink-0">
              <Button>{t("analytics.upgradeCta")}</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Respostas parciais (leads que não concluíram) — PRO */}
      {isPro && partials.length > 0 && (
        <Card className="border-amber-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <UserPlus className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              {t("partials.title")}
              <Badge variant="secondary" className="text-xs">{partials.length}</Badge>
            </CardTitle>
            <CardDescription>{t("partials.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {partials.map((p) => {
                const valueMap = new Map(p.fieldValues.map((fv) => [fv.field.id, fv.value]));
                // Mostra o 1º contato (email/phone) + o 1º outro valor preenchido
                const contact = form.fields.find(
                  (f) => (f.type === "email" || f.type === "phone") && valueMap.get(f.id)
                );
                const filled = form.fields.filter((f) => valueMap.get(f.id)?.trim());
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedResponse(p)}
                    className="w-full flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5 text-left hover:bg-muted/50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {contact ? valueMap.get(contact.id) : t("partials.anonymous")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {filled.length}/{form.fields.length} {t("table.fieldsFilled")}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {p.updatedAt ? formatRelativeDate(p.updatedAt) : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      {responses.length > 0 && <ResponseCharts fields={form.fields} responses={responses} />}

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>{t("title")}</CardTitle>
            {responses.length > 0 && (
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={tCommon("search")}
                  value={search}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {responses.length === 0 ? (
            <div className="text-center py-16">
              <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-xl mb-2">{t("noResponses.title")}</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {t("noResponses.subtitle")}
              </p>
              <Button onClick={copyLink} variant="outline" className="gap-2">
                <Copy className="w-4 h-4" />
                {tCommon("copy")}
              </Button>
            </div>
          ) : filteredResponses.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">{tCommon("noResults")}</h3>
              <p className="text-muted-foreground">
                &quot;{search}&quot;
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                      #
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                      {t("table.submittedAt")}
                    </th>
                    {form.fields.slice(0, 3).map((field) => (
                      <th
                        key={field.id}
                        className="text-left py-3 px-4 font-medium text-muted-foreground"
                      >
                        {field.label}
                      </th>
                    ))}
                    {form.fields.length > 3 && (
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        ...
                      </th>
                    )}
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                      {t("table.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResponses.map((response, index) => {
                    const valueMap = new Map(
                      response.fieldValues.map((fv) => [fv.field.id, fv.value])
                    );
                    return (
                      <tr
                        key={response.id}
                        className="border-b border-border/50 hover:bg-muted/50 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono text-sm text-muted-foreground">
                          {responses.length - index}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm">
                            {formatRelativeDate(response.submittedAt)}
                          </span>
                        </td>
                        {form.fields.slice(0, 3).map((field) => (
                          <td key={field.id} className="py-3 px-4">
                            <span className="text-sm truncate max-w-[200px] block">
                              {valueMap.get(field.id) || (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </span>
                          </td>
                        ))}
                        {form.fields.length > 3 && (
                          <td className="py-3 px-4">
                            <Badge variant="secondary">
                              +{form.fields.length - 3}
                            </Badge>
                          </td>
                        )}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedResponse(response)}
                              aria-label={tCommon("view")}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-destructive"
                              onClick={() => setDeleteTarget(response)}
                              aria-label={tCommon("delete")}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Response Detail Dialog */}
      <Dialog
        open={!!selectedResponse}
        onOpenChange={(open: boolean) => !open && setSelectedResponse(null)}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>
              {t("table.submittedAt")}{" "}
              {selectedResponse && formatDate(selectedResponse.submittedAt)}
            </DialogDescription>
          </DialogHeader>
          {selectedResponse && (
            <>
              <div className="space-y-4">
                {form.fields.map((field) => {
                  const fieldValue = selectedResponse.fieldValues.find(
                    (fv) => fv.field.id === field.id
                  );
                  return (
                    <div key={field.id} className="space-y-1">
                      <label className="text-sm font-medium text-muted-foreground">
                        {field.label}
                      </label>
                      <p className="text-base">
                        {fieldValue?.value || (
                          <span className="text-muted-foreground italic">—</span>
                        )}
                      </p>
                    </div>
                  );
                })}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setDeleteTarget(selectedResponse)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {tCommon("delete")}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmação de exclusão */}
      <Dialog open={!!deleteTarget} onOpenChange={(open: boolean) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteTitle")}</DialogTitle>
            <DialogDescription>{t("deleteConfirm")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
              {tCommon("cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {t("deleting")}
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  {tCommon("delete")}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
