"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "@/lib/i18n-context";
import { Button } from "@submitin/ui/components/button";
import { Input } from "@submitin/ui/components/input";
import { Badge } from "@submitin/ui/components/badge";
import { maxFormsFor } from "@/lib/stripe";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@submitin/ui/components/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@submitin/ui/components/dialog";
import {
  FileText,
  Plus,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Copy,
  CopyPlus,
  Search,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/page-header";
import { formatRelativeDate } from "@/lib/utils";

interface Form {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    responses: number;
    fields: number;
  };
}

interface FormsGridProps {
  forms: Form[];
  userPlan: string;
}

export function FormsGrid({ forms: initialForms, userPlan }: FormsGridProps) {
  const router = useRouter();
  const t = useTranslations("formsGrid");
  const tCommon = useTranslations("common");
  const tDashboard = useTranslations("dashboard");
  const [forms, setForms] = useState(initialForms);
  const [search, setSearch] = useState("");
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; form: Form | null }>({
    open: false,
    form: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  const filteredForms = forms.filter((form) =>
    form.name.toLowerCase().includes(search.toLowerCase())
  );

  const maxForms = maxFormsFor(userPlan);
  const isUnlimited = maxForms === -1;
  const formsRemaining = isUnlimited ? null : Math.max(0, maxForms - forms.length);
  const canCreateForm = isUnlimited || forms.length < maxForms;

  async function copyLink(slug: string) {
    const url = `${window.location.origin}/f/${slug}`;
    await navigator.clipboard.writeText(url);
    toast({
      title: t("linkCopied"),
      description: t("linkCopiedDesc"),
    });
  }

  async function copyIntegrationUrl(slug: string) {
    const url = `${window.location.origin}/api/public/forms/${slug}/responses`;
    await navigator.clipboard.writeText(url);
    toast({
      title: t("linkCopied"),
      description: t("integrationUrlCopiedDesc"),
    });
  }

  async function handleDuplicate(form: Form) {
    setDuplicatingId(form.id);
    try {
      const response = await fetch(`/api/forms/${form.id}/duplicate`, { method: "POST" });
      if (!response.ok) throw new Error();
      const newForm: Form = await response.json();
      setForms((prev) => [newForm, ...prev]);
      toast({ title: t("formDuplicated"), description: t("formDuplicatedDesc") });
    } catch {
      toast({
        title: tCommon("error"),
        description: t("duplicateError"),
        variant: "destructive",
      });
    } finally {
      setDuplicatingId(null);
    }
  }

  async function handleDelete() {
    if (!deleteDialog.form) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/forms/${deleteDialog.form.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error();

      setForms(forms.filter((f) => f.id !== deleteDialog.form?.id));
      toast({
        title: t("formDeleted"),
        description: t("formDeletedDesc"),
      });
    } catch {
      toast({
        title: tCommon("error"),
        description: t("deleteError"),
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialog({ open: false, form: null });
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={
          <>
            {t("subtitle")}
            {!isUnlimited && (
              <span className="ml-2 text-xs text-muted-foreground tabular-nums">
                · {forms.length}/{maxForms}
              </span>
            )}
          </>
        }
        actions={
          canCreateForm ? (
            <Link href="/dashboard/forms/new">
              <Button>
                <Plus />
                {tDashboard("createForm")}
              </Button>
            </Link>
          ) : (
            <Link href="/dashboard/billing">
              <Button>{t("upgrade")}</Button>
            </Link>
          )
        }
      />

      {forms.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {forms.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 px-6 text-center">
          <FileText className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium">{tDashboard("noForms.title")}</p>
          <p className="text-sm text-muted-foreground mt-1 mb-5 max-w-md mx-auto">
            {tDashboard("noForms.subtitle")}
          </p>
          <Link href="/dashboard/forms/new">
            <Button>
              <Plus />
              {t("createFirst")}
            </Button>
          </Link>
        </div>
      ) : filteredForms.length === 0 ? (
        <div className="rounded-xl border py-12 text-center">
          <p className="font-medium">{tCommon("noResults")}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {t("noResultsFor")} &quot;{search}&quot;
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">{t("colName")}</th>
                <th className="hidden sm:table-cell px-4 py-2.5 font-medium">{t("colStatus")}</th>
                <th className="hidden md:table-cell px-4 py-2.5 font-medium text-right">{t("colResponses")}</th>
                <th className="hidden lg:table-cell px-4 py-2.5 font-medium text-right">{t("colUpdated")}</th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredForms.map((form) => (
                <tr key={form.id} className="group transition-colors hover:bg-muted/40">
                  <td className="px-4 py-3 max-w-0 w-full">
                    <Link href={`/dashboard/forms/${form.id}`} className="block min-w-0">
                      <span className="block truncate font-medium">{form.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {form.description || `${form._count.fields} ${t("fields")}`}
                      </span>
                    </Link>
                  </td>
                  <td className="hidden sm:table-cell px-4 py-3 whitespace-nowrap">
                    <Badge variant={form.published ? "success" : "secondary"}>
                      {form.published ? tDashboard("formCard.published") : tDashboard("formCard.draft")}
                    </Badge>
                  </td>
                  <td className="hidden md:table-cell px-4 py-3 text-right tabular-nums text-muted-foreground">
                    {form._count.responses}
                  </td>
                  <td className="hidden lg:table-cell px-4 py-3 text-right whitespace-nowrap text-muted-foreground">
                    {formatRelativeDate(form.updatedAt)}
                  </td>
                  <td className="px-2 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={tCommon("edit")}>
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/forms/${form.id}`)}>
                          <Edit className="w-4 h-4 mr-2" />
                          {tCommon("edit")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/forms/${form.id}/responses`)}>
                          <Eye className="w-4 h-4 mr-2" />
                          {t("viewResponses")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => copyLink(form.slug)}>
                          <Copy className="w-4 h-4 mr-2" />
                          {t("copyLink")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => copyIntegrationUrl(form.slug)}>
                          <Copy className="w-4 h-4 mr-2" />
                          {t("copyIntegrationUrl")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDuplicate(form)}
                          disabled={duplicatingId === form.id}
                        >
                          {duplicatingId === form.id ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <CopyPlus className="w-4 h-4 mr-2" />
                          )}
                          {t("duplicate")}
                        </DropdownMenuItem>
                        {form.published && (
                          <DropdownMenuItem asChild>
                            <a href={`/f/${form.slug}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4 mr-2" />
                              {t("openForm")}
                            </a>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteDialog({ open: true, form })}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          {tCommon("delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Dialog */}
      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open: boolean) => setDeleteDialog({ open, form: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteTitle")}</DialogTitle>
            <DialogDescription>
              {t("deleteConfirm")} &quot;{deleteDialog.form?.name}&quot;? {t("deleteWarning")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, form: null })}
              disabled={isDeleting}
            >
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
