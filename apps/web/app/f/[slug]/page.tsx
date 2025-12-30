import { prisma } from "@form-builder/database";
import { notFound } from "next/navigation";
import { PublicForm } from "@/components/public-form";

interface PublicFormPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PublicFormPageProps) {
  const { slug } = await params;
  const form = await prisma.form.findUnique({
    where: { slug },
    select: { name: true, description: true },
  });

  if (!form) return { title: "Formulário não encontrado" };

  return {
    title: form.name,
    description: form.description || `Preencha o formulário ${form.name}`,
  };
}

export default async function PublicFormPage({ params }: PublicFormPageProps) {
  const { slug } = await params;
  const form = await prisma.form.findFirst({
    where: {
      slug,
      published: true,
    },
    include: {
      fields: {
        orderBy: { order: "asc" },
      },
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

  return <PublicForm form={transformedForm} />;
}
