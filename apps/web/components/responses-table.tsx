"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "@/lib/i18n-context";
import { Button } from "@form-builder/ui/components/button";
import { Input } from "@form-builder/ui/components/input";
import { Badge } from "@form-builder/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@form-builder/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@form-builder/ui/components/dialog";
import {
  ArrowLeft,
  Download,
  Search,
  Eye,
  MessageSquare,
  ExternalLink,
  Copy,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatDate, formatRelativeDate } from "@/lib/utils";

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
  fieldValues: FieldValue[];
}

interface Form {
  id: string;
  name: string;
  slug: string;
  fields: Field[];
}

interface ResponsesTableProps {
  form: Form;
  responses: Response[];
}

export function ResponsesTable({ form, responses }: ResponsesTableProps) {
  const t = useTranslations("responses");
  const tCommon = useTranslations("common");
  const tDashboard = useTranslations("dashboard");
  const [search, setSearch] = useState("");
  const [selectedResponse, setSelectedResponse] = useState<Response | null>(null);

  const filteredResponses = responses.filter((response) =>
    response.fieldValues.some((fv) =>
      fv.value.toLowerCase().includes(search.toLowerCase())
    )
  );

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

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${form.name.replace(/[^a-z0-9]/gi, "_")}_responses.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "CSV exported!",
      description: `${responses.length} responses exported successfully.`,
    });
  }

  async function copyLink() {
    const url = `${window.location.origin}/f/${form.slug}`;
    await navigator.clipboard.writeText(url);
    toast({ title: tCommon("copied") });
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
          <Button variant="outline" size="icon" onClick={copyLink}>
            <Copy className="w-4 h-4" />
          </Button>
          <Link href={`/f/${form.slug}`} target="_blank">
            <Button variant="outline" size="icon">
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
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{tDashboard("stats.totalResponses")}</CardDescription>
            <CardTitle className="text-4xl">{responses.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{tDashboard("formCard.fields")}</CardDescription>
            <CardTitle className="text-4xl">{form.fields.length}</CardTitle>
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
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedResponse(response)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
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
        onOpenChange={(open) => !open && setSelectedResponse(null)}
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
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
