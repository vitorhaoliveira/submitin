"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "@/lib/i18n-context";
import { Button } from "@form-builder/ui/components/button";
import { Input } from "@form-builder/ui/components/input";
import { Card, CardContent, CardHeader, CardTitle } from "@form-builder/ui/components/card";
import { Badge } from "@form-builder/ui/components/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@form-builder/ui/components/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@form-builder/ui/components/dialog";
import {
  FileText,
  MessageSquare,
  Plus,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Copy,
  Search,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
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
}

export function FormsGrid({ forms: initialForms }: FormsGridProps) {
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

  const filteredForms = forms.filter((form) =>
    form.name.toLowerCase().includes(search.toLowerCase())
  );

  async function copyLink(slug: string) {
    const url = `${window.location.origin}/f/${slug}`;
    await navigator.clipboard.writeText(url);
    toast({
      title: t("linkCopied"),
      description: t("linkCopiedDesc"),
    });
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Link href="/dashboard/forms/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            {tDashboard("createForm")}
          </Button>
        </Link>
      </div>

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
        <Card className="text-center py-16">
          <CardContent>
            <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-xl mb-2">{tDashboard("noForms.title")}</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {tDashboard("noForms.subtitle")}
            </p>
            <Link href="/dashboard/forms/new">
              <Button size="lg" className="gap-2">
                <Plus className="w-4 h-4" />
                {t("createFirst")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : filteredForms.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">{tCommon("noResults")}</h3>
            <p className="text-muted-foreground">
              {t("noResultsFor")} &quot;{search}&quot;
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredForms.map((form, index) => (
            <Card
              key={form.id}
              className="group animate-fade-in-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/dashboard/forms/${form.id}`}
                    className="flex-1 min-w-0"
                  >
                    <CardTitle className="text-lg truncate hover:text-primary transition-colors">
                      {form.name}
                    </CardTitle>
                  </Link>
                  <div className="flex items-center gap-2">
                    <Badge variant={form.published ? "success" : "secondary"}>
                      {form.published ? tDashboard("formCard.published") : tDashboard("formCard.draft")}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => router.push(`/dashboard/forms/${form.id}`)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          {tCommon("edit")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => router.push(`/dashboard/forms/${form.id}/responses`)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          {t("viewResponses")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => copyLink(form.slug)}>
                          <Copy className="w-4 h-4 mr-2" />
                          {t("copyLink")}
                        </DropdownMenuItem>
                        {form.published && (
                          <DropdownMenuItem asChild>
                            <a
                              href={`/f/${form.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
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
                  </div>
                </div>
                {form.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {form.description}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      {form._count.responses}
                    </span>
                    <span>{form._count.fields} {t("fields")}</span>
                  </div>
                  <span>{formatRelativeDate(form.updatedAt)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
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
