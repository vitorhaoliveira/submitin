import { auth } from "@/lib/auth";
import { NewDocumentClient } from "@/components/documents/new-document-client";
import { findModel } from "@/lib/templates/catalog";

export const metadata = {
  title: "Novo documento",
};

export default async function NewDocumentPage({
  searchParams,
}: {
  searchParams: Promise<{ claim?: string; modelo?: string }>;
}) {
  const session = await auth();
  const { claim, modelo } = await searchParams;
  const model = findModel(modelo);
  const fromModel = model ? { slug: model.slug, title: model.title } : null;
  // Visitante monta o documento antes de criar conta; cadastro vem para salvar.
  if (!session?.user?.id) return <NewDocumentClient isGuest model={fromModel} />;
  return <NewDocumentClient claim={claim === "1"} model={fromModel} />;
}
