"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { hasFeature, isPaid as isPaidPlan, isPremium as isPremiumPlan } from "@/lib/stripe";

interface ProFeatures {
  customTheme: boolean;
  hideBranding: boolean;
  captcha: boolean;
  advancedAnalytics: boolean;
  prioritySupport: boolean;
  unlimitedResponses: boolean;
}

function featuresForPlan(plan: string): ProFeatures {
  return {
    customTheme: hasFeature(plan, "customTheme"),
    hideBranding: hasFeature(plan, "hideBranding"),
    captcha: hasFeature(plan, "captcha"),
    advancedAnalytics: hasFeature(plan, "advancedAnalytics"),
    prioritySupport: hasFeature(plan, "prioritySupport"),
    unlimitedResponses: isPremiumPlan(plan),
  };
}

export function useProFeatures() {
  const { data: session } = useSession();
  const [plan, setPlan] = useState<string>("free");
  const [loading, setLoading] = useState(true);
  const [features, setFeatures] = useState<ProFeatures>(featuresForPlan("free"));

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
          const userPlan = data.plan || "free";
          setPlan(userPlan);
          setFeatures(featuresForPlan(userPlan));
        }
      } catch (error) {
        console.error("Error fetching plan:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [session]);

  const isPaid = isPaidPlan(plan);
  const isPremium = isPremiumPlan(plan);
  const isFree = plan === "free";

  return {
    plan,
    // Compat: `isPro` significa "tem plano pago" (Plus ou Premium) — gateia as
    // features básicas pagas (remover branding, tema). Use `isPremium` para as
    // features avançadas (CAPTCHA, lógica condicional, parciais, agendamento).
    isPro: isPaid,
    isPaid,
    isPremium,
    isFree,
    loading,
    features,
    hasAccess: (feature: keyof ProFeatures) => features[feature],
  };
}
