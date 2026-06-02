"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "@/lib/i18n-context";
import { Loader2 } from "lucide-react";
import { readGuestDraft, clearGuestDraft, isClaimableDraft } from "@/lib/guest-draft";

/**
 * Detecta um rascunho criado no construtor sem login (/criar) e, após o usuário
 * autenticar, cria o formulário de verdade e abre o construtor. Montado uma vez
 * no layout do dashboard.
 */
export function ClaimGuestDraft() {
  const router = useRouter();
  const { status } = useSession();
  const t = useTranslations("guest");
  const [claiming, setClaiming] = useState(false);
  const ran = useRef(false);

  useEffect(() => {
    // Só reivindica quando o usuário está autenticado (evita apagar o rascunho do visitante)
    if (status !== "authenticated" || ran.current) return;
    ran.current = true;

    const draft = readGuestDraft();
    // Só reivindica rascunhos intencionais (salvar/publicar como visitante) e
    // dentro da validade. Rascunhos antigos ou apenas auto-salvos são descartados
    // silenciosamente — evita "salvar formulário" sem o usuário ter pedido.
    if (!isClaimableDraft(draft)) {
      if (draft) clearGuestDraft();
      return;
    }

    setClaiming(true);
    (async () => {
      try {
        const res = await fetch("/api/forms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: (draft.name || "Meu formulário").slice(0, 100),
            description: draft.description?.slice(0, 500) || undefined,
          }),
        });
        if (!res.ok) throw new Error("create failed");
        const form = await res.json();

        for (const f of draft.fields) {
          await fetch(`/api/forms/${form.id}/fields`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: f.type,
              label: f.label,
              placeholder: f.placeholder,
              required: f.required ?? false,
              options: f.options,
            }),
          });
        }

        clearGuestDraft();
        router.replace(`/dashboard/forms/${form.id}`);
      } catch {
        // Em caso de falha, descarta o rascunho e mantém o usuário no dashboard
        clearGuestDraft();
        setClaiming(false);
      }
    })();
  }, [status, router]);

  if (!claiming) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-background/90 backdrop-blur-sm">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{t("claiming")}</p>
    </div>
  );
}
