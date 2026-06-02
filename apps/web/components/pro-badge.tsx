"use client";

import { Crown } from "lucide-react";
import { Badge } from "@submitin/ui/components/badge";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

const PLAN_LABEL: Record<string, string> = {
  free: "Grátis",
  plus: "Plus",
  premium: "Premium",
};

export function ProBadge() {
  const { data: session } = useSession();
  const [plan, setPlan] = useState<string>("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlan = async () => {
      if (!session?.user) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/user/subscription");
        if (response.ok) {
          const data = await response.json();
          setPlan(data.plan || "free");
        }
      } catch (error) {
        console.error("Error fetching plan:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [session]);

  if (loading || !session?.user) {
    return null;
  }

  const isPaid = plan === "plus" || plan === "premium";

  if (!isPaid) {
    return (
      <Badge variant="outline" className="text-xs">
        {PLAN_LABEL.free}
      </Badge>
    );
  }

  return (
    <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-xs">
      <Crown className="h-3 w-3 mr-1" />
      {PLAN_LABEL[plan] ?? "Plus"}
    </Badge>
  );
}
