"use client";

import { useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "@/lib/i18n-context";
import { Button } from "@submitin/ui/components/button";
import { Input } from "@submitin/ui/components/input";
import { Label } from "@submitin/ui/components/label";
import { Textarea } from "@submitin/ui/components/textarea";
import { Switch } from "@submitin/ui/components/switch";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@submitin/ui/components/select";
import { Separator } from "@submitin/ui/components/separator";
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Eye,
  Settings,
  Copy,
  ExternalLink,
  Loader2,
  Save,
  Type,
  Mail,
  Hash,
  Calendar,
  List,
  CheckSquare,
  Share2,
  Code2,
  Link2,
  Check,
  Upload,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { fieldTypes, type FieldType, type CreateFieldInput } from "@/lib/validations";
import { ThemeEditor } from "./theme-editor";
import { type CustomTheme } from "@/lib/theme-utils";
import { useProFeatures } from "@/hooks/use-pro-features";

interface Field {
  id: string;
  type: string;
  label: string;
  placeholder: string | null;
  required: boolean;
  order: number;
  options: string[] | null;
}

interface FormSettings {
  id: string;
  notifyEmail: string | null;
  notifyEmails: string[];
  webhookUrl: string | null;
  allowMultipleResponses: boolean;
  captchaEnabled: boolean;
  captchaProvider: string | null;
  captchaSiteKey: string | null;
  captchaSecretKey: string | null;
  hideBranding: boolean;
  customTheme: CustomTheme | null;
}

interface Form {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  published: boolean;
  fields: Field[];
  settings: FormSettings | null;
}

interface FormBuilderProps {
  form: Form;
}

const fieldTypeIcons: Record<FieldType, React.ReactNode> = {
  text: <Type className="w-4 h-4" />,
  email: <Mail className="w-4 h-4" />,
  number: <Hash className="w-4 h-4" />,
  date: <Calendar className="w-4 h-4" />,
  select: <List className="w-4 h-4" />,
  checkbox: <CheckSquare className="w-4 h-4" />,
};

export function FormBuilder({ form: initialForm }: FormBuilderProps) {
  const router = useRouter();
  const t = useTranslations("formBuilder");
  const tCommon = useTranslations("common");
  const { isPro, loading: loadingPlan } = useProFeatures();
  const [form, setForm] = useState(initialForm);
  const [fields, setFields] = useState<Field[]>(initialForm.fields);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingField, setIsAddingField] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAddField, setShowAddField] = useState(false);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [newField, setNewField] = useState<CreateFieldInput>({
    type: "text",
    label: "",
    placeholder: "",
    required: false,
    options: [],
  });
  const [settings, setSettings] = useState({
    notifyEmail: initialForm.settings?.notifyEmail || "",
    notifyEmails: initialForm.settings?.notifyEmails || [],
    webhookUrl: initialForm.settings?.webhookUrl || "",
    allowMultipleResponses: initialForm.settings?.allowMultipleResponses ?? false,
    captchaEnabled: initialForm.settings?.captchaEnabled || false,
    captchaProvider: initialForm.settings?.captchaProvider || "",
    captchaSiteKey: initialForm.settings?.captchaSiteKey || "",
    captchaSecretKey: initialForm.settings?.captchaSecretKey || "",
    hideBranding: initialForm.settings?.hideBranding || false,
    customTheme: initialForm.settings?.customTheme || null,
  });
  const [newEmail, setNewEmail] = useState("");
  const [showShare, setShowShare] = useState(false);
  const [embedSize, setEmbedSize] = useState<"small" | "medium" | "large">("medium");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const embedSizes = {
    small: { width: "100%", height: "400px" },
    medium: { width: "100%", height: "600px" },
    large: { width: "100%", height: "800px" },
  };

  const fieldTypeLabels: Record<FieldType, string> = {
    text: t("fieldTypes.text"),
    email: t("fieldTypes.email"),
    number: t("fieldTypes.number"),
    date: t("fieldTypes.date"),
    select: t("fieldTypes.select"),
    checkbox: t("fieldTypes.checkbox"),
  };

  function getPublicUrl() {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/f/${form.slug}`;
  }

  function getEmbedCode() {
    const url = getPublicUrl();
    const size = embedSizes[embedSize];
    return `<iframe src="${url}" width="${size.width}" height="${size.height}" frameborder="0" style="border: none; border-radius: 8px;"></iframe>`;
  }

  async function copyToClipboard(text: string, field: string) {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast({
      title: t("linkCopied"),
      description: field === "link" ? t("linkCopiedDesc") : t("codeCopiedDesc"),
    });
  }

  async function handleSaveForm() {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/forms/${form.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          published: form.published,
        }),
      });

      if (!response.ok) throw new Error();

      toast({
        title: t("formSaved"),
        description: form.published ? t("formSavedPublished") : t("formSavedDraft"),
      });
      router.refresh();
    } catch {
      toast({
        title: tCommon("error"),
        description: t("formSaveError"),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePublishToggle() {
    const newPublished = !form.published;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/forms/${form.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          published: newPublished,
        }),
      });

      if (!response.ok) throw new Error();

      setForm((prev) => ({ ...prev, published: newPublished }));
      toast({
        title: t("formSaved"),
        description: newPublished ? t("formSavedPublished") : t("formSavedDraft"),
      });
      router.refresh();
    } catch {
      toast({
        title: tCommon("error"),
        description: t("formSaveError"),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAddField() {
    if (!newField.label.trim()) {
      toast({
        title: tCommon("error"),
        description: t("fieldNameRequired"),
        variant: "destructive",
      });
      return;
    }

    if (newField.type === "select" && (!newField.options || newField.options.length === 0)) {
      toast({
        title: tCommon("error"),
        description: t("optionsRequired"),
        variant: "destructive",
      });
      return;
    }

    setIsAddingField(true);
    try {
      const fieldData = {
        ...newField,
        options: newField.type === "select" ? newField.options : undefined,
      };

      const response = await fetch(`/api/forms/${form.id}/fields`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fieldData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || t("fieldAddError"));
      }

      const field = await response.json();
      setFields([...fields, field]);
      setShowAddField(false);
      setNewField({
        type: "text",
        label: "",
        placeholder: "",
        required: false,
        options: [],
      });
      toast({ title: t("fieldAdded") });
    } catch (error) {
      toast({
        title: tCommon("error"),
        description: error instanceof Error ? error.message : t("fieldAddError"),
        variant: "destructive",
      });
    } finally {
      setIsAddingField(false);
    }
  }

  async function handleUpdateField() {
    if (!editingField) return;

    try {
      const response = await fetch(`/api/forms/${form.id}/fields/${editingField.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: editingField.type,
          label: editingField.label,
          placeholder: editingField.placeholder,
          required: editingField.required,
          options: editingField.options,
        }),
      });

      if (!response.ok) throw new Error();

      const updatedField = await response.json();
      setFields(fields.map((f) => (f.id === updatedField.id ? updatedField : f)));
      setEditingField(null);
      toast({ title: t("fieldUpdated") });
    } catch {
      toast({
        title: tCommon("error"),
        description: t("fieldUpdateError"),
        variant: "destructive",
      });
    }
  }

  async function handleDeleteField(fieldId: string) {
    try {
      const response = await fetch(`/api/forms/${form.id}/fields/${fieldId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error();

      setFields(fields.filter((f) => f.id !== fieldId));
      toast({ title: t("fieldRemoved") });
    } catch {
      toast({
        title: tCommon("error"),
        description: t("fieldRemoveError"),
        variant: "destructive",
      });
    }
  }

  async function handleSaveSettings() {
    try {
      const response = await fetch(`/api/forms/${form.id}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error();

      setShowSettings(false);
      toast({ title: t("settingsSaved") });
    } catch {
      toast({
        title: tCommon("error"),
        description: t("settingsSaveError"),
        variant: "destructive",
      });
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/forms">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Input
                value={form.name}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setForm({ ...form, name: e.target.value })
                }
                className="text-2xl font-bold h-auto p-0 border-0 bg-transparent focus-visible:ring-0"
              />
              <Badge variant={form.published ? "success" : "secondary"}>
                {form.published ? t("status.published") : t("status.draft")}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground font-mono">/f/{form.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setShowSettings(true)}>
            <Settings className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={() => setShowShare(true)} className="gap-2">
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">{t("share")}</span>
          </Button>
          {form.published && (
            <Link href={`/f/${form.slug}`} target="_blank">
              <Button variant="outline" size="icon">
                <ExternalLink className="w-4 h-4" />
              </Button>
            </Link>
          )}
          <Link href={`/dashboard/forms/${form.id}/responses`}>
            <Button variant="outline" className="gap-2">
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">{t("responses")}</span>
            </Button>
          </Link>
          <Button
            variant={form.published ? "outline" : "default"}
            onClick={handlePublishToggle}
            disabled={isSaving}
            className="gap-2"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              {form.published ? t("unpublishButton") : t("publishButton")}
            </span>
          </Button>
          <Button onClick={handleSaveForm} disabled={isSaving} className="gap-2">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span className="hidden sm:inline">{tCommon("save")}</span>
          </Button>
        </div>
      </div>

      {/* Form Info */}
      <Card>
        <CardHeader>
          <CardTitle>{t("info")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t("description")}</Label>
            <Textarea
              placeholder={t("descriptionPlaceholder")}
              value={form.description || ""}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t("publishForm")}</Label>
              <p className="text-sm text-muted-foreground">{t("publishDesc")}</p>
            </div>
            <Switch
              checked={form.published}
              onCheckedChange={(checked: boolean) => setForm({ ...form, published: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Fields */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t("fields")}</CardTitle>
            <CardDescription>{t("fieldsDesc")}</CardDescription>
          </div>
          <Button onClick={() => setShowAddField(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            {t("addField")}
          </Button>
        </CardHeader>
        <CardContent>
          {fields.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Plus className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{t("noFields")}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {fields.map((field) => (
                <div
                  key={field.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
                >
                  <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                  <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                    {fieldTypeIcons[field.type as FieldType]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{field.label}</span>
                      {field.required && (
                        <Badge variant="outline" className="text-xs">
                          {tCommon("required")}
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {fieldTypeLabels[field.type as FieldType]}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditingField(field)}
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDeleteField(field.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Field Dialog */}
      <Dialog open={showAddField} onOpenChange={setShowAddField}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("addFieldTitle")}</DialogTitle>
            <DialogDescription>{t("addFieldDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("fieldType")}</Label>
              <Select
                value={newField.type}
                onValueChange={(value: string) =>
                  setNewField({
                    ...newField,
                    type: value as FieldType,
                    options:
                      value === "select" ? (newField.options?.length ? newField.options : []) : [],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fieldTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        {fieldTypeIcons[type]}
                        {fieldTypeLabels[type]}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("fieldName")} *</Label>
              <Input
                placeholder={t("fieldNamePlaceholder")}
                value={newField.label}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setNewField({ ...newField, label: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t("placeholder")}</Label>
              <Input
                placeholder={t("placeholderExample")}
                value={newField.placeholder || ""}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setNewField({ ...newField, placeholder: e.target.value })
                }
              />
            </div>
            {newField.type === "select" && (
              <div className="space-y-2">
                <Label>{t("options")}</Label>
                <Textarea
                  placeholder={t("optionsPlaceholder")}
                  value={(newField.options || []).join("\n")}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                    setNewField({
                      ...newField,
                      options: e.target.value.split("\n"),
                    })
                  }
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <Switch
                id="required"
                checked={newField.required}
                onCheckedChange={(checked: boolean) =>
                  setNewField({ ...newField, required: checked })
                }
              />
              <Label htmlFor="required">{t("requiredField")}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddField(false)}>
              {tCommon("cancel")}
            </Button>
            <Button onClick={handleAddField} disabled={isAddingField}>
              {isAddingField ? <Loader2 className="w-4 h-4 animate-spin" /> : tCommon("add")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Field Dialog */}
      <Dialog
        open={!!editingField}
        onOpenChange={(open: boolean) => !open && setEditingField(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("editFieldTitle")}</DialogTitle>
          </DialogHeader>
          {editingField && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("fieldName")}</Label>
                <Input
                  value={editingField.label}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setEditingField({ ...editingField, label: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{t("placeholder")}</Label>
                <Input
                  value={editingField.placeholder || ""}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setEditingField({ ...editingField, placeholder: e.target.value })
                  }
                />
              </div>
              {editingField.type === "select" && (
                <div className="space-y-2">
                  <Label>{t("options")}</Label>
                  <Textarea
                    value={(editingField.options || []).join("\n")}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                      setEditingField({
                        ...editingField,
                        options: e.target.value.split("\n"),
                      })
                    }
                  />
                </div>
              )}
              <div className="flex items-center gap-2">
                <Switch
                  checked={editingField.required}
                  onCheckedChange={(checked: boolean) =>
                    setEditingField({ ...editingField, required: checked })
                  }
                />
                <Label>{t("requiredField")}</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingField(null)}>
              {tCommon("cancel")}
            </Button>
            <Button onClick={handleUpdateField}>{tCommon("save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("settingsTitle")}</DialogTitle>
            <DialogDescription>{t("settingsDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Notificações */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {t("emailNotifications")}
              </h3>
              <div className="space-y-2">
                <Label>{t("notifyEmail")}</Label>
                <Input
                  type="email"
                  placeholder={t("notifyEmailPlaceholder")}
                  value={settings.notifyEmail}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setSettings({ ...settings, notifyEmail: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">{t("notifyEmailHelp")}</p>
              </div>

              {/* Múltiplos Emails - PRO */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  {t("additionalEmails")}
                  <Badge variant="secondary" className="text-xs">
                    PRO
                  </Badge>
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder={t("additionalEmailsPlaceholder")}
                    value={newEmail}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setNewEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newEmail.trim()) {
                        e.preventDefault();
                        if (!settings.notifyEmails.includes(newEmail.trim())) {
                          setSettings({
                            ...settings,
                            notifyEmails: [...settings.notifyEmails, newEmail.trim()],
                          });
                        }
                        setNewEmail("");
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (newEmail.trim() && !settings.notifyEmails.includes(newEmail.trim())) {
                        setSettings({
                          ...settings,
                          notifyEmails: [...settings.notifyEmails, newEmail.trim()],
                        });
                        setNewEmail("");
                      }
                    }}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {settings.notifyEmails.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {settings.notifyEmails.map((email, index) => (
                      <Badge key={index} variant="secondary" className="gap-1">
                        {email}
                        <button
                          type="button"
                          onClick={() => {
                            setSettings({
                              ...settings,
                              notifyEmails: settings.notifyEmails.filter((_, i) => i !== index),
                            });
                          }}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {t("additionalEmailsHelp")}
                </p>
              </div>
            </div>

            <Separator />

            {/* Comportamento: permitir mais de uma resposta */}
            <div className="space-y-4">
              <h3 className="font-semibold">{t("behaviorSection")}</h3>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t("allowMultipleResponses")}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t("allowMultipleResponsesHelp")}
                  </p>
                </div>
                <Switch
                  checked={settings.allowMultipleResponses}
                  onCheckedChange={(checked: boolean) =>
                    setSettings({ ...settings, allowMultipleResponses: checked })
                  }
                />
              </div>
            </div>

            <Separator />

            {/* Webhook */}
            <div className="space-y-2">
              <Label>{t("webhookUrl")}</Label>
              <Input
                placeholder={t("webhookUrlPlaceholder")}
                value={settings.webhookUrl}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setSettings({ ...settings, webhookUrl: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">{t("webhookUrlHelp")}</p>
            </div>

            <Separator />

            {/* Anti-spam / CAPTCHA - PRO */}
            {!isPro && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg mb-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  🔒 {t("proFeatureLock")}{" "}
                  <a href="/dashboard/billing" className="underline font-medium">{t("proUpgrade")}</a>
                </p>
              </div>
            )}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                🛡️ {t("antiSpam")}
                <Badge variant="secondary" className="text-xs">
                  PRO
                </Badge>
              </h3>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t("enableCaptcha")}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t("enableCaptchaHelp")}
                  </p>
                </div>
                <Switch
                  checked={settings.captchaEnabled}
                  disabled={!isPro}
                  onCheckedChange={(checked: boolean) =>
                    setSettings({ ...settings, captchaEnabled: checked })
                  }
                />
              </div>

              {settings.captchaEnabled && (
                <div className="space-y-4 pl-4 border-l-2 border-border">
                  <div className="space-y-2">
                    <Label>{t("captchaProvider")}</Label>
                    <Select
                      value={settings.captchaProvider}
                      onValueChange={(value: string) =>
                        setSettings({ ...settings, captchaProvider: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("captchaSelectProvider")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="turnstile">
                          {t("captchaTurnstile")}
                        </SelectItem>
                        <SelectItem value="hcaptcha">{t("captchaHcaptcha")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("captchaSiteKey")}</Label>
                    <Input
                      placeholder={t("captchaSiteKeyPlaceholder")}
                      value={settings.captchaSiteKey}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setSettings({ ...settings, captchaSiteKey: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("captchaSecretKey")}</Label>
                    <Input
                      type="password"
                      placeholder={t("captchaSecretKeyPlaceholder")}
                      value={settings.captchaSecretKey}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setSettings({ ...settings, captchaSecretKey: e.target.value })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("captchaGetKeysAt")}{" "}
                      {settings.captchaProvider === "hcaptcha" ? (
                        <a
                          href="https://dashboard.hcaptcha.com"
                          target="_blank"
                          rel="noopener"
                          className="text-primary hover:underline"
                        >
                          dashboard.hcaptcha.com
                        </a>
                      ) : (
                        <a
                          href="https://dash.cloudflare.com/turnstile"
                          target="_blank"
                          rel="noopener"
                          className="text-primary hover:underline"
                        >
                          dash.cloudflare.com/turnstile
                        </a>
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Branding - PRO */}
            {!isPro && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg mb-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  🔒 {t("proFeatureLock")}{" "}
                  <a href="/dashboard/billing" className="underline font-medium">{t("proUpgrade")}</a>
                </p>
              </div>
            )}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                🎨 {t("appearance")}
                <Badge variant="secondary" className="text-xs">
                  PRO
                </Badge>
              </h3>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t("removeLogo")}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t("removeLogoHelp")}
                  </p>
                </div>
                <Switch
                  checked={settings.hideBranding}
                  disabled={!isPro}
                  onCheckedChange={(checked: boolean) =>
                    setSettings({ ...settings, hideBranding: checked })
                  }
                />
              </div>

              {/* Theme Editor */}
              <div className="mt-4">
                <ThemeEditor
                  theme={settings.customTheme}
                  onChange={(theme) => setSettings({ ...settings, customTheme: theme })}
                  isPro={isPro}
                  disabled={!isPro}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              {tCommon("cancel")}
            </Button>
            <Button onClick={handleSaveSettings}>{tCommon("save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={showShare} onOpenChange={setShowShare}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              {t("shareTitle")}
            </DialogTitle>
            <DialogDescription>{t("shareDesc")}</DialogDescription>
          </DialogHeader>

          {!form.published && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
              ⚠️ {t("notPublishedWarning")}
            </div>
          )}

          <div className="space-y-6">
            {/* Link direto */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-primary" />
                <Label className="font-semibold">{t("directLink")}</Label>
              </div>
              <div className="flex gap-2">
                <Input readOnly value={getPublicUrl()} className="font-mono text-sm bg-muted" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(getPublicUrl(), "link")}
                  disabled={!form.published}
                >
                  {copiedField === "link" ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
                <Link href={`/f/${form.slug}`} target="_blank">
                  <Button variant="outline" size="icon" disabled={!form.published}>
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>

            <Separator />

            {/* Código Embed */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-primary" />
                <Label className="font-semibold">{t("embed")}</Label>
              </div>
              <p className="text-sm text-muted-foreground">{t("embedDesc")}</p>

              <div className="flex gap-2">
                <Label className="text-sm text-muted-foreground">{t("embedSize")}</Label>
                <div className="flex gap-1">
                  {(["small", "medium", "large"] as const).map((size) => (
                    <Button
                      key={size}
                      variant={embedSize === size ? "default" : "outline"}
                      size="sm"
                      onClick={() => setEmbedSize(size)}
                      className="text-xs"
                    >
                      {size === "small"
                        ? t("embedSmall")
                        : size === "medium"
                          ? t("embedMedium")
                          : t("embedLarge")}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <Textarea
                  readOnly
                  value={getEmbedCode()}
                  className="font-mono text-xs bg-muted min-h-[100px] pr-12"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(getEmbedCode(), "embed")}
                  disabled={!form.published}
                >
                  {copiedField === "embed" ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                {t("height")} {embedSizes[embedSize].height}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShare(false)}>
              {tCommon("close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
