"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "@/lib/i18n-context";
import { Button } from "@form-builder/ui/components/button";
import { Input } from "@form-builder/ui/components/input";
import { Label } from "@form-builder/ui/components/label";
import { Checkbox } from "@form-builder/ui/components/checkbox";
import { RadioGroup, RadioGroupItem } from "@form-builder/ui/components/radio-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@form-builder/ui/components/card";
import { FileText, Loader2, CheckCircle, ArrowRight } from "lucide-react";
import { cn } from "@form-builder/ui/lib/utils";
import { LanguageSwitcher } from "./language-switcher";

interface Field {
  id: string;
  type: string;
  label: string;
  placeholder: string | null;
  required: boolean;
  options: string[] | null;
}

interface Form {
  id: string;
  name: string;
  description: string | null;
  fields: Field[];
}

interface PublicFormProps {
  form: Form;
}

export function PublicForm({ form }: PublicFormProps) {
  const t = useTranslations("publicForm");
  const tCommon = useTranslations("common");
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  function handleChange(fieldId: string, value: string) {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    for (const field of form.fields) {
      if (field.required && !values[field.id]) {
        newErrors[field.id] = t("errors.required");
      }

      if (field.type === "email" && values[field.id]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const emailValue = values[field.id];
        if (emailValue && !emailRegex.test(emailValue)) {
          newErrors[field.id] = t("errors.invalidEmail");
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/forms/${form.id}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t("errors.submitFailed"));
      }

      setIsSubmitted(true);
    } catch (error) {
      setErrors({
        _form: error instanceof Error ? error.message : t("errors.submitFailed"),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center animate-fade-in-up">
          <CardContent className="pt-12 pb-8">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">{t("success.title")}</h2>
            <p className="text-muted-foreground mb-8">
              {t("success.subtitle")}
            </p>
            <Button onClick={() => window.location.reload()} variant="outline">
              {t("success.another")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center animate-fade-in-up">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <span className="font-semibold">{tCommon("appName")}</span>
          </Link>
        </div>

        {/* Form */}
        <Card className="animate-fade-in-up animation-delay-100">
          <CardHeader>
            <CardTitle className="text-2xl">{form.name}</CardTitle>
            {form.description && (
              <CardDescription className="text-base">{form.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {form.fields.map((field, index) => (
                <div
                  key={field.id}
                  className="space-y-2 animate-fade-in-up"
                  style={{ animationDelay: `${(index + 1) * 50}ms` }}
                >
                  <Label
                    htmlFor={field.id}
                    className={cn(
                      "flex items-center gap-1",
                      errors[field.id] && "text-destructive"
                    )}
                  >
                    {field.label}
                    {field.required && <span className="text-destructive">*</span>}
                  </Label>

                  {field.type === "text" && (
                    <Input
                      id={field.id}
                      placeholder={field.placeholder || undefined}
                      value={values[field.id] || ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(field.id, e.target.value)}
                      className={cn(errors[field.id] && "border-destructive")}
                    />
                  )}

                  {field.type === "email" && (
                    <Input
                      id={field.id}
                      type="email"
                      placeholder={field.placeholder || "your@email.com"}
                      value={values[field.id] || ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(field.id, e.target.value)}
                      className={cn(errors[field.id] && "border-destructive")}
                    />
                  )}

                  {field.type === "number" && (
                    <Input
                      id={field.id}
                      type="number"
                      placeholder={field.placeholder || undefined}
                      value={values[field.id] || ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(field.id, e.target.value)}
                      className={cn(errors[field.id] && "border-destructive")}
                    />
                  )}

                  {field.type === "date" && (
                    <Input
                      id={field.id}
                      type="date"
                      value={values[field.id] || ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(field.id, e.target.value)}
                      className={cn(errors[field.id] && "border-destructive")}
                    />
                  )}

                  {field.type === "select" && field.options && (
                    <RadioGroup
                      value={values[field.id] || ""}
                      onValueChange={(value) => handleChange(field.id, value)}
                    >
                      {field.options.map((option) => (
                        <div key={option} className="flex items-center space-x-2">
                          <RadioGroupItem value={option} id={`${field.id}-${option}`} />
                          <Label
                            htmlFor={`${field.id}-${option}`}
                            className="font-normal cursor-pointer"
                          >
                            {option}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}

                  {field.type === "checkbox" && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={field.id}
                        checked={values[field.id] === "true"}
                        onCheckedChange={(checked) =>
                          handleChange(field.id, checked ? "true" : "false")
                        }
                      />
                      <Label htmlFor={field.id} className="font-normal cursor-pointer">
                        {field.placeholder || tCommon("yes")}
                      </Label>
                    </div>
                  )}

                  {errors[field.id] && (
                    <p className="text-sm text-destructive">{errors[field.id]}</p>
                  )}
                </div>
              ))}

              {errors._form && (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive">{errors._form}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    {t("submitting")}
                  </>
                ) : (
                  <>
                    {t("submit")}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground animate-fade-in-up animation-delay-200">
          {t("poweredBy")}{" "}
          <Link href="/" className="text-primary hover:underline">
            {tCommon("appName")}
          </Link>
        </p>
      </div>
    </div>
  );
}
