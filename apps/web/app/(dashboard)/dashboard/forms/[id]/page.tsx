import { auth } from "@/lib/auth";
import { prisma } from "@form-builder/database";
import { redirect, notFound } from "next/navigation";
import { FormBuilder } from "@/components/form-builder";

export const metadata = {
  title: "Editar Formulário",
};

export default async function FormPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
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

  // Transform JsonValue options to string[] | null
  const transformedForm = {
    ...form,
    fields: form.fields.map((field: (typeof form.fields)[number]) => ({
      id: field.id,
      type: field.type,
      label: field.label,
      placeholder: field.placeholder,
      required: field.required,
      order: field.order,
      formId: field.formId,
      options: Array.isArray(field.options) 
        ? (field.options as string[])
        : null,
    })),
  };

  return <FormBuilder form={transformedForm} />;
}
