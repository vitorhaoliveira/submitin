import { cn } from "@submitin/ui/lib/utils";

/**
 * Marca do Submitin: balão de mensagem com o canto de folha dobrado
 * ("o cliente responde um link, você recebe o documento").
 * Geometria no grid 48×48; mantenha em sincronia com app/icon.svg,
 * app/apple-icon.svg e o carimbo do PDF (packages/documents/src/branding.ts).
 */
export const LOGO_PATHS = {
  shape:
    "M11 5h20.5L43 16.5V33a7 7 0 0 1-7 7H21.5l-8.6 6.3c-.9.6-2.1-.1-1.9-1.2l.9-5.1H11a7 7 0 0 1-7-7V12a7 7 0 0 1 7-7Z",
  fold: "M31.5 5v8.5a3 3 0 0 0 3 3H43Z",
};

export function LogoMark({
  className,
  variant = "color",
}: {
  className?: string;
  /** color: índigo sobre fundo claro · inverse: branco sobre fundo índigo/escuro */
  variant?: "color" | "inverse";
}) {
  const shape = variant === "inverse" ? "#ffffff" : "hsl(var(--brand))";
  const detail = variant === "inverse" ? "hsl(var(--brand))" : "#ffffff";
  return (
    <svg viewBox="0 0 48 48" className={cn("shrink-0", className)} aria-hidden>
      <path fill={shape} d={LOGO_PATHS.shape} />
      <path fill="hsl(var(--pop))" d={LOGO_PATHS.fold} />
      <rect x="11" y="19" width="17" height="4" rx="2" fill={detail} />
      <rect x="11" y="27" width="24" height="4" rx="2" fill={detail} />
    </svg>
  );
}

/** Marca + nome "submitin*". */
export function Logo({
  className,
  markClassName = "w-8 h-8",
  textClassName = "text-xl",
  showText = true,
}: {
  className?: string;
  markClassName?: string;
  textClassName?: string;
  showText?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2 min-w-0", className)}>
      <LogoMark className={markClassName} />
      {showText && (
        <span className={cn("font-display font-bold tracking-tight truncate", textClassName)}>
          submitin<span className="text-pop">*</span>
        </span>
      )}
    </span>
  );
}
