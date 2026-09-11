"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@submitin/ui/components/button";
import { Input } from "@submitin/ui/components/input";
import { Label } from "@submitin/ui/components/label";
import { Switch } from "@submitin/ui/components/switch";
import { Badge } from "@submitin/ui/components/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@submitin/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@submitin/ui/components/dialog";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Copy,
  Download,
  ExternalLink,
  FileUp,
  Inbox,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "@/lib/i18n-context";
import { toast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import { fmt, useFieldTypeLabel } from "./shared";
import { PageHeader } from "@/components/page-header";
import { VariablesEditor, type DocField } from "./variables-editor";
import { InvitesCard } from "./invites-card";
import { ShareExtras } from "./share-extras";
import { UnsavedBar } from "./unsaved-bar";
import { FormSettingsCard, type DocumentFormSettings } from "./form-settings-card";

type Props = {
  document: { id: string; name: string; submissions: number };
  form: {
    id: string;
    slug: string;
    published: boolean;
    fields: DocField[];
  };
  template: {
    version: number;
    fileName: string;
    createdAt: string;
    variables: string[];
    missingFonts: string[];
  } | null;
  delivery: { emails: string[]; webhookUrl: string; emailRespondent: boolean; hasEmailField: boolean };
  invites: { id: string; token: string; label: string; usedAt: string | null; createdAt: string }[];
  formSettings: DocumentFormSettings;
  plan: { paid: boolean; top: boolean };
  publicUrl: string;
};

async function requestJson(url: string, init: RequestInit) {
  const res = await fetch(url, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Erro");
  return data;
}

export function DocumentDetailClient({
  document,
  form,
  template,
  delivery,
  invites,
  formSettings,
  plan,
  publicUrl: formPublicUrl,
}: Props) {
  const t = useTranslations("documents");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const fieldTypeLabel = useFieldTypeLabel();

  const [name, setName] = useState(document.name);
  const [editingName, setEditingName] = useState(false);
  const [published, setPublished] = useState(form.published);
  const [publishing, setPublishing] = useState(false);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [fields, setFields] = useState(form.fields);

  useEffect(() => setOrigin(window.location.origin), []);
  const publicUrl = `${origin}/f/${form.slug}`;

  // Dados fixos sem valor saem em branco no PDF (ex.: dados da empresa de um modelo).
  const fixedMissing = fields.filter((f) => f.nature === "fixa" && !f.defaultValue?.trim());
  const fieldKeys = new Set(fields.map((f) => f.variableKey).filter(Boolean));
  const templateKeys = new Set(template?.variables ?? []);
  const keysWithoutField = (template?.variables ?? []).filter(
    (k) => !fieldKeys.has(k) && !(k.endsWith("_extenso") && fieldKeys.has(k.slice(0, -8)))
  );
  const orphanFields = fields.filter((f) => f.variableKey && !templateKeys.has(f.variableKey));

  function fail(err: unknown) {
    toast({
      title: tCommon("error"),
      description: err instanceof Error ? err.message : undefined,
      variant: "destructive",
    });
  }

  async function saveName() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === document.name) {
      setName(document.name);
      setEditingName(false);
      return;
    }
    try {
      await requestJson(`/api/documents/${document.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      setEditingName(false);
      router.refresh();
    } catch (err) {
      fail(err);
    }
  }

  async function togglePublished() {
    setPublishing(true);
    try {
      await requestJson(`/api/documents/${document.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !published }),
      });
      setPublished(!published);
      toast({ title: !published ? t("detail.link.publishedToast") : t("detail.link.unpublishedToast") });
    } catch (err) {
      fail(err);
    } finally {
      setPublishing(false);
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await requestJson(`/api/documents/${document.id}`, { method: "DELETE" });
      toast({ title: t("detail.deleted") });
      router.push("/dashboard/documents");
      router.refresh();
    } catch (err) {
      fail(err);
      setDeleting(false);
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Cabeçalho */}
      {editingName ? (
        <div className="space-y-3">
          <Link
            href="/dashboard/documents"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t("title")}
          </Link>
          <div className="flex items-center gap-2 max-w-xl">
            <Input
              autoFocus
              value={name}
              maxLength={100}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent) => e.key === "Enter" && void saveName()}
              className="text-base font-semibold"
            />
            <Button size="icon" variant="outline" onClick={saveName} aria-label={tCommon("save")}>
              <Check />
            </Button>
          </div>
        </div>
      ) : (
        <PageHeader
          backHref="/dashboard/documents"
          backLabel={t("title")}
          title={name}
          meta={
            <>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-muted-foreground"
                onClick={() => setEditingName(true)}
                aria-label={t("detail.rename")}
              >
                <Pencil className="!size-3.5" />
              </Button>
              <Badge variant={published ? "success" : "secondary"}>
                {published ? t("card.published") : t("card.draft")}
              </Badge>
            </>
          }
          actions={
            <>
              <Link href={`/dashboard/documents/${document.id}/envios`}>
                <Button>
                  <Inbox />
                  {t("detail.submissions")}
                  <span className="rounded bg-background/20 px-1.5 text-xs tabular-nums">
                    {document.submissions}
                  </span>
                </Button>
              </Link>
              <Button
                variant="outline"
                size="icon"
                className="text-muted-foreground hover:text-red-600"
                onClick={() => setShowDelete(true)}
                aria-label={t("detail.delete")}
              >
                <Trash2 />
              </Button>
            </>
          }
        />
      )}

      {/* Link público */}
      <Card>
        <CardHeader>
          <CardTitle>{t("detail.link.title")}</CardTitle>
          <CardDescription>{t("detail.link.desc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!published && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              {t("detail.link.unpublished")}
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-2">
            <Input readOnly value={publicUrl} className="font-mono text-sm" />
            <div className="flex gap-2">
              <Button variant="outline" onClick={copyLink} className="gap-2 flex-1 sm:flex-none">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? t("detail.link.copied") : t("detail.link.copy")}
              </Button>
              {published && (
                <a href={publicUrl} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="icon" aria-label={t("detail.link.open")}>
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </a>
              )}
              <Button
                variant={published ? "outline" : "default"}
                onClick={togglePublished}
                disabled={publishing}
                className="gap-2 flex-1 sm:flex-none"
              >
                {publishing && <Loader2 className="w-4 h-4 animate-spin" />}
                {published ? t("detail.link.unpublish") : t("detail.link.publish")}
              </Button>
            </div>
          </div>
          <ShareExtras url={publicUrl} slug={form.slug} />
        </CardContent>
      </Card>

      <InvitesCard
        formId={form.id}
        slug={form.slug}
        documentName={name}
        fields={fields}
        initialInvites={invites}
      />

      {/* Campos */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>{t("detail.fields.title")}</CardTitle>
            <CardDescription>{t("detail.fields.desc")}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {keysWithoutField.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              {fmt(t("detail.fields.missing"), { keys: keysWithoutField.join(", ") })}
            </div>
          )}
          {fixedMissing.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              {fmt(t("detail.fields.fixedMissingBanner"), { labels: fixedMissing.map((f) => f.label).join(", ") })}
            </div>
          )}
          {orphanFields.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {fmt(t("detail.fields.orphan"), { labels: orphanFields.map((f) => f.label).join(", ") })}
            </p>
          )}
          <VariablesEditor
            formId={form.id}
            fields={fields}
            templateKeys={template?.variables ?? []}
            onChange={setFields}
          />
        </CardContent>
      </Card>

      <FormSettingsCard documentId={document.id} initial={formSettings} plan={plan} publicUrl={formPublicUrl} />

      <DeliveryCard documentId={document.id} initial={delivery} onError={fail} />

      <TemplateCard documentId={document.id} template={template} locale={locale} onError={fail} />

      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("detail.delete")}</DialogTitle>
            <DialogDescription>{t("detail.deleteConfirm")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(false)} disabled={deleting}>
              {tCommon("cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting} className="gap-2">
              {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
              {t("detail.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DeliveryCard({
  documentId,
  initial,
  onError,
}: {
  documentId: string;
  initial: Props["delivery"];
  onError: (err: unknown) => void;
}) {
  const t = useTranslations("documents");
  const [emails, setEmails] = useState(initial.emails);
  const [emailRespondent, setEmailRespondent] = useState(initial.emailRespondent);
  const [newEmail, setNewEmail] = useState("");
  const [webhookUrl, setWebhookUrl] = useState(initial.webhookUrl);
  const [saved, setSaved] = useState({
    emails: initial.emails,
    webhookUrl: initial.webhookUrl,
    emailRespondent: initial.emailRespondent,
  });
  // E-mail digitado e não adicionado também conta como alteração (e entra ao salvar).
  const pendingEmail = newEmail.trim().toLowerCase();
  const dirty =
    Boolean(pendingEmail) ||
    JSON.stringify({ emails, webhookUrl, emailRespondent }) !== JSON.stringify(saved);
  const [saving, setSaving] = useState(false);

  function addEmail() {
    const email = newEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || emails.includes(email)) return;
    setEmails([...emails, email]);
    setNewEmail("");
  }

  async function save() {
    const nextEmails =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pendingEmail) && !emails.includes(pendingEmail)
        ? [...emails, pendingEmail]
        : emails;
    setSaving(true);
    try {
      await requestJson(`/api/documents/${documentId}/delivery`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: nextEmails, webhookUrl, emailRespondent }),
      });
      setEmails(nextEmails);
      setNewEmail("");
      setSaved({ emails: nextEmails, webhookUrl, emailRespondent });
      toast({ title: t("detail.delivery.saved") });
    } catch (err) {
      onError(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("detail.delivery.title")}</CardTitle>
        <CardDescription>{t("detail.delivery.desc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="delivery-email">{t("detail.delivery.emails")}</Label>
          {emails.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("detail.delivery.noEmails")}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {emails.map((email) => (
                <Badge key={email} variant="secondary" className="gap-1 py-1 pl-2.5 pr-1 font-normal">
                  {email}
                  <button
                    type="button"
                    onClick={() => setEmails(emails.filter((e) => e !== email))}
                    className="rounded p-0.5 hover:bg-foreground/10"
                    aria-label={`Remover ${email}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              id="delivery-email"
              type="email"
              value={newEmail}
              placeholder={t("detail.delivery.emailPlaceholder")}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEmail(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addEmail();
                }
              }}
            />
            <Button type="button" variant="outline" onClick={addEmail} className="gap-1.5">
              <Plus className="w-4 h-4" />
              {t("detail.delivery.addEmail")}
            </Button>
          </div>
        </div>
        <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
          <div className="space-y-1">
            <Label htmlFor="delivery-respondent">{t("detail.delivery.respondent")}</Label>
            <p className="text-sm text-muted-foreground">
              {initial.hasEmailField
                ? t("detail.delivery.respondentDesc")
                : t("detail.delivery.respondentNoField")}
            </p>
          </div>
          <Switch
            id="delivery-respondent"
            checked={emailRespondent}
            onCheckedChange={setEmailRespondent}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="delivery-webhook">{t("detail.delivery.webhook")}</Label>
          <Input
            id="delivery-webhook"
            type="url"
            value={webhookUrl}
            placeholder="https://"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWebhookUrl(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">{t("detail.delivery.webhookDesc")}</p>
        </div>
        <UnsavedBar
          dirty={dirty}
          saving={saving}
          onSave={save}
          onDiscard={() => {
            setEmails(saved.emails);
            setWebhookUrl(saved.webhookUrl);
            setEmailRespondent(saved.emailRespondent);
            setNewEmail("");
          }}
          saveLabel={t("detail.delivery.save")}
        />
      </CardContent>
    </Card>
  );
}

function TemplateCard({
  documentId,
  template,
  locale,
  onError,
}: {
  documentId: string;
  template: Props["template"];
  locale: string;
  onError: (err: unknown) => void;
}) {
  const t = useTranslations("documents");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ addedFields: string[]; orphanedFields: string[] } | null>(null);

  async function replace(file: File) {
    setUploading(true);
    setResult(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch(`/api/documents/${documentId}/template`, { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error([data.error, ...(data.details ?? [])].join(" "));
      toast({ title: fmt(t("detail.template.replaced"), { version: data.version }) });
      setResult({ addedFields: data.addedFields, orphanedFields: data.orphanedFields });
      router.refresh();
    } catch (err) {
      onError(err);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("detail.template.title")}</CardTitle>
        <CardDescription>{t("detail.template.replaceDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {template && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="font-medium">{template.fileName}</span>
            <Badge variant="outline">{fmt(t("detail.template.version"), { version: template.version })}</Badge>
            <span className="text-muted-foreground">
              {fmt(t("detail.template.uploadedAt"), {
                date: formatDate(template.createdAt, locale === "en" ? "en-US" : "pt-BR"),
              })}
            </span>
          </div>
        )}
        {template && template.missingFonts.length > 0 && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            {fmt(t("newPage.missingFonts"), { fonts: template.missingFonts.join(", ") })}
          </div>
        )}
        {result && (result.addedFields.length > 0 || result.orphanedFields.length > 0) && (
          <div className="rounded-lg border bg-muted/40 px-3 py-2.5 text-sm space-y-1">
            {result.addedFields.length > 0 && (
              <p>{fmt(t("detail.template.added"), { labels: result.addedFields.join(", ") })}</p>
            )}
            {result.orphanedFields.length > 0 && (
              <p>{fmt(t("detail.template.orphaned"), { labels: result.orphanedFields.join(", ") })}</p>
            )}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {template && (
            <a href={`/api/documents/${documentId}/template`}>
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                {t("detail.template.download")}
              </Button>
            </a>
          )}
          <Button
            variant="outline"
            className="gap-2"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
            {uploading ? t("detail.template.replacing") : t("detail.template.replace")}
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept=".docx"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void replace(file);
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
