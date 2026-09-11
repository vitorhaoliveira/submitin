import { auth } from "@/lib/auth";
import { NewDocumentClient } from "@/components/documents/new-document-client";

export const metadata = {
  title: "Novo documento",
};

export default async function NewDocumentPage({
  searchParams,
}: {
  searchParams: Promise<{ claim?: string }>;
}) {
  const session = await auth();
  const { claim } = await searchParams;
  // Visitante monta o documento antes de criar conta; cadastro vem para salvar.
  if (!session?.user?.id) return <NewDocumentClient isGuest />;
  return <NewDocumentClient claim={claim === "1"} />;
}
