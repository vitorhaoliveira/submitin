import { auth } from "@/lib/auth";
import { prisma } from "@submitin/database";
import { redirect, notFound } from "next/navigation";
import { FormBuilder } from "@/components/form-builder";

export const metadata = {
  title: "Editar Formulário",
};

export default async function FormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const form = await prisma.form.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    include: {
      fields: {
        orderBy: { order: "asc" },
      },
      settings: true,
    },
  });

  if (!form) {
    notFound();
  }

  // Transform JsonValue options to string[] | null and include all settings
  const transformedForm = {
    id: form.id,
    slug: form.slug,
    name: form.name,
    description: form.description,
    published: form.published,
    createdAt: form.createdAt,
    updatedAt: form.updatedAt,
    userId: form.userId,
    fields: form.fields.map((field: (typeof form.fields)[number]) => ({
      id: field.id,
      type: field.type,
      label: field.label,
      placeholder: field.placeholder,
      required: field.required,
      order: field.order,
      formId: field.formId,
      options: Array.isArray(field.options) ? (field.options as string[]) : null,
    })),
    // Include all settings fields for Pro features
    settings: form.settings
      ? {
          id: form.settings.id,
          notifyEmail: form.settings.notifyEmail,
          notifyEmails: form.settings.notifyEmails,
          webhookUrl: form.settings.webhookUrl,
          allowMultipleResponses: form.settings.allowMultipleResponses ?? false,
          captchaEnabled: form.settings.captchaEnabled,
          captchaProvider: form.settings.captchaProvider,
          captchaSiteKey: form.settings.captchaSiteKey,
          captchaSecretKey: form.settings.captchaSecretKey,
          hideBranding: form.settings.hideBranding,
          customTheme: form.settings.customTheme as {
            primaryColor?: string;
            backgroundColor?: string;
            cardBackground?: string;
            textColor?: string;
            accentColor?: string;
            borderRadius?: "none" | "sm" | "md" | "lg" | "xl" | "full";
          } | null,
        }
      : null,
  };

  return <FormBuilder form={transformedForm} />;
}
