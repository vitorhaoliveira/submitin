import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { NewDocumentClient } from "@/components/documents/new-document-client";

export const metadata = {
  title: "Novo documento",
};

export default async function NewDocumentPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return <NewDocumentClient />;
}
