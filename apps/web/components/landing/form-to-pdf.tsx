import { getTranslations } from "@/lib/i18n";
import { ArrowRight, Check, FileText, Paperclip } from "lucide-react";
import { CurlyArrow } from "./doodles";

/**
 * Mockup do hero: celular com o formulário preenchido → documento PDF pronto,
 * com a notificação de e-mail por cima. Só HTML/CSS, sem imagens.
 */
export async function FormToPdf() {
  const t = await getTranslations("landing");

  return (
    // Palco com tamanho fixo; no celular é reduzido por escala (mantém a composição).
    <div className="relative mx-auto h-[288px] w-[336px] overflow-hidden sm:h-[480px] sm:w-[560px] sm:overflow-visible">
      <div className="absolute left-0 top-0 h-[480px] w-[560px] origin-top-left scale-[0.6] sm:scale-100">
        {/* Celular com o formulário */}
        <div className="absolute left-0 top-6 w-[230px] rounded-[2rem] border-[6px] border-foreground bg-background shadow-xl -rotate-3">
          <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-foreground/15" />
          <div className="p-4 space-y-3">
            <p className="font-display text-base font-semibold">{t("mock.formTitle")}</p>
            {[
              [t("mock.student"), t("mock.studentValue")],
              [t("mock.cpf"), t("mock.cpfValue")],
              [t("mock.fee"), `R$ ${t("mock.feeValue")}`],
            ].map(([label, value]) => (
              <div key={label} className="space-y-1">
                <p className="text-[10px] font-medium text-muted-foreground">{label}</p>
                <div className="flex items-center justify-between rounded-md border px-2 py-1.5 text-xs">
                  <span className="truncate">{value}</span>
                  <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                </div>
              </div>
            ))}
            <div className="flex items-center justify-center gap-1 rounded-full bg-foreground py-2 text-xs font-medium text-background">
              {t("mock.send")}
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>
        </div>

        <CurlyArrow className="absolute left-[40%] top-2 w-24 text-pop" />

        {/* Documento PDF */}
        <div className="absolute right-0 top-16 w-[300px] rounded-lg border bg-background p-5 shadow-xl rotate-2">
          <div className="flex items-center justify-between border-b pb-3 mb-3">
            <span className="text-[10px] font-semibold tracking-widest uppercase">
              {t("mock.docTitle")}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
              <Check className="w-3 h-3" />
              {t("mock.ready")}
            </span>
          </div>
          <div className="space-y-2.5 text-[11px] leading-relaxed text-muted-foreground">
            <p>
              {t("mock.docLine1")}:{" "}
              <mark className="rounded bg-brand-soft px-1 font-medium text-brand">
                {t("mock.studentValue")}
              </mark>
            </p>
            <p>
              {t("mock.docLine2")}:{" "}
              <mark className="rounded bg-brand-soft px-1 font-medium text-brand">
                {t("mock.cpfValue")}
              </mark>
            </p>
            <p>
              {t("mock.docLine3")}:{" "}
              <mark className="rounded bg-brand-soft px-1 font-medium text-brand">
                R$ {t("mock.feeValue")}
              </mark>{" "}
              <span className="italic">({t("mock.feeWords")})</span>
            </p>
            <div className="space-y-1.5 pt-1">
              <div className="h-1.5 w-full rounded bg-muted" />
              <div className="h-1.5 w-11/12 rounded bg-muted" />
              <div className="h-1.5 w-4/5 rounded bg-muted" />
            </div>
            <div className="flex justify-between pt-5">
              <div className="w-24 border-t border-foreground/40" />
              <div className="w-24 border-t border-foreground/40" />
            </div>
          </div>
        </div>

        {/* Notificação de e-mail */}
        <div className="absolute right-10 bottom-2 w-[260px] rounded-xl border bg-background p-3 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 shrink-0 rounded-md bg-brand flex items-center justify-center">
              <FileText className="w-4 h-4 text-brand-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold">{t("mock.emailFrom")}</p>
              <p className="text-[11px] text-muted-foreground truncate">{t("mock.emailSubject")}</p>
              <span className="mt-1.5 inline-flex max-w-full items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px]">
                <Paperclip className="w-3 h-3 shrink-0" />
                <span className="truncate">{t("mock.attachment")}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
