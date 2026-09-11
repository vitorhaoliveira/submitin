"use client";

import { useEffect, useState } from "react";
import { Button } from "@submitin/ui/components/button";
import { Input } from "@submitin/ui/components/input";
import { Label } from "@submitin/ui/components/label";
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
import { Check, Copy, Link2, Loader2, MessageCircle, Plus, Trash2 } from "lucide-react";
import { maskInput } from "@submitin/documents/input";
import { useLocale, useTranslations } from "@/lib/i18n-context";
import { toast } from "@/hooks/use-toast";
import { formatRelativeDate } from "@/lib/utils";
import { fmt } from "./shared";
import type { DocField } from "./variables-editor";

type Invite = { id: string; token: string; label: string; usedAt: string | null; createdAt: string };

/**
 * Links personalizados: a empresa preenche os campos dela para um cliente
 * específico e envia um link de uso único.
 */
export function InvitesCard({
  formId,
  slug,
  documentName,
  fields,
  initialInvites,
}: {
  formId: string;
  slug: string;
  documentName: string;
  fields: DocField[];
  initialInvites: Invite[];
}) {
  const t = useTranslations("documents");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const [invites, setInvites] = useState(initialInvites);
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<Invite | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => setOrigin(window.location.origin), []);
  const companyFields = fields.filter((f) => f.nature === "pre_preenchida");
  const linkFor = (token: string) => `${origin}/f/${slug}?c=${token}`;

  function openDialog() {
    // Começa com os valores fixos; a empresa ajusta o que for específico do cliente.
    setValues(Object.fromEntries(companyFields.map((f) => [f.id, f.defaultValue ?? ""])));
    setLabel("");
    setCreated(null);
    setOpen(true);
  }

  async function create() {
    setCreating(true);
    try {
      const res = await fetch(`/api/forms/${formId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, values }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setInvites([data, ...invites]);
      setCreated(data);
    } catch (err) {
      toast({
        title: tCommon("error"),
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  }

  async function copy(invite: Invite) {
    await navigator.clipboard.writeText(linkFor(invite.token));
    setCopiedId(invite.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function whatsappUrl(invite: Invite) {
    const text = fmt(t("detail.invites.whatsappText"), { name: invite.label, document: documentName });
    return `https://wa.me/?text=${encodeURIComponent(`${text} ${linkFor(invite.token)}`)}`;
  }

  async function remove(invite: Invite) {
    const res = await fetch(`/api/forms/${formId}/invites/${invite.id}`, { method: "DELETE" });
    if (res.ok) setInvites(invites.filter((i) => i.id !== invite.id));
    else toast({ title: t("detail.invites.deleteError"), variant: "destructive" });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>{t("detail.invites.title")}</CardTitle>
          <CardDescription>{t("detail.invites.desc")}</CardDescription>
        </div>
        <Button onClick={openDialog} className="shrink-0">
          <Plus />
          <span className="hidden sm:inline">{t("detail.invites.new")}</span>
        </Button>
      </CardHeader>
      <CardContent>
        {companyFields.length === 0 && (
          <p className="mb-3 rounded-lg border border-dashed px-3 py-2.5 text-sm text-muted-foreground">
            {t("detail.invites.noCompanyFields")}
          </p>
        )}
        {invites.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("detail.invites.empty")}</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {invites.map((invite) => (
              <li key={invite.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5 text-sm">
                <Link2 className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="font-medium min-w-0 truncate">{invite.label}</span>
                {invite.usedAt ? (
                  <Badge variant="success">
                    {fmt(t("detail.invites.used"), { when: formatRelativeDate(invite.usedAt, locale) })}
                  </Badge>
                ) : (
                  <Badge variant="secondary">{t("detail.invites.pending")}</Badge>
                )}
                {!invite.usedAt && (
                  <div className="ml-auto flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => copy(invite)}>
                      {copiedId === invite.id ? <Check /> : <Copy />}
                      {copiedId === invite.id ? t("detail.link.copied") : t("detail.link.copy")}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                      <a href={whatsappUrl(invite)} target="_blank" rel="noreferrer" aria-label="WhatsApp">
                        <MessageCircle />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-red-600"
                      onClick={() => remove(invite)}
                      aria-label={t("detail.invites.delete")}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          {created ? (
            <>
              <DialogHeader>
                <DialogTitle>{t("detail.invites.createdTitle")}</DialogTitle>
                <DialogDescription>
                  {fmt(t("detail.invites.createdDesc"), { name: created.label })}
                </DialogDescription>
              </DialogHeader>
              <Input readOnly value={linkFor(created.token)} className="font-mono text-xs" />
              <DialogFooter className="gap-2 sm:gap-2">
                <Button variant="outline" onClick={() => copy(created)}>
                  {copiedId === created.id ? <Check /> : <Copy />}
                  {copiedId === created.id ? t("detail.link.copied") : t("detail.link.copy")}
                </Button>
                <Button asChild>
                  <a href={whatsappUrl(created)} target="_blank" rel="noreferrer">
                    <MessageCircle />
                    {t("detail.invites.sendWhatsapp")}
                  </a>
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>{t("detail.invites.new")}</DialogTitle>
                <DialogDescription>{t("detail.invites.dialogDesc")}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="invite-label">{t("detail.invites.label")}</Label>
                  <Input
                    id="invite-label"
                    value={label}
                    maxLength={120}
                    placeholder={t("detail.invites.labelPlaceholder")}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLabel(e.target.value)}
                  />
                </div>
                {companyFields.map((field) => (
                  <div key={field.id} className="space-y-1.5">
                    <Label htmlFor={`invite-${field.id}`}>{field.label}</Label>
                    <Input
                      id={`invite-${field.id}`}
                      type={field.type === "date" ? "date" : "text"}
                      value={values[field.id] ?? ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setValues({ ...values, [field.id]: maskInput(field.type, e.target.value) })
                      }
                    />
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">{t("detail.invites.singleUse")}</p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)} disabled={creating}>
                  {tCommon("cancel")}
                </Button>
                <Button onClick={create} disabled={creating || !label.trim()}>
                  {creating && <Loader2 className="animate-spin" />}
                  {t("detail.invites.create")}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
