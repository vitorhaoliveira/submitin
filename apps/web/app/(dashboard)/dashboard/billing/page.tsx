import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BillingClient } from "./billing-client";

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return <BillingClient />;
}
