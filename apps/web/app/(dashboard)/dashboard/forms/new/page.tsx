"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Button } from "@form-builder/ui/components/button";
import { Input } from "@form-builder/ui/components/input";
import { Label } from "@form-builder/ui/components/label";
import { Textarea } from "@form-builder/ui/components/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@form-builder/ui/components/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { createFormSchema, type CreateFormInput } from "@/lib/validations";

export default function NewFormPage() {
  const router = useRouter();
  const t = useTranslations("newForm");
  const tCommon = useTranslations("common");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateFormInput>({
    resolver: zodResolver(createFormSchema),
  });

  async function onSubmit(data: CreateFormInput) {
    setIsLoading(true);
    try {
      const response = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error();

      const form = await response.json();
      toast({
        title: tCommon("success"),
      });
      router.push(`/dashboard/forms/${form.id}`);
    } catch {
      toast({
        title: tCommon("error"),
        description: t("createError"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/forms">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("nameLabel")} *</Label>
              <Input
                id="name"
                placeholder={t("namePlaceholder")}
                {...register("name")}
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t("descLabel")}</Label>
              <Textarea
                id="description"
                placeholder={t("descPlaceholder")}
                {...register("description")}
                disabled={isLoading}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Link href="/dashboard/forms">
                <Button type="button" variant="outline" disabled={isLoading}>
                  {tCommon("cancel")}
                </Button>
              </Link>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    {t("creating")}
                  </>
                ) : (
                  t("create")
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
