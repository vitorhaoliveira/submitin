import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BillingClient } from "./billing-client";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; interval?: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  const { plan, interval } = await searchParams;
  // Plano escolhido na página pública de preços (/precos → cadastro → aqui).
  const chosenPlan = plan === "pro" || plan === "unlimited" ? plan : null;
  return <BillingClient chosenPlan={chosenPlan} chosenInterval={interval === "year" ? "year" : "month"} />;
}
