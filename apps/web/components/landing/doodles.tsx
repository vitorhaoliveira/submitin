/**
 * Rabiscos desenhados à mão (SVG inline), no espírito do Tally: traço irregular,
 * pontas arredondadas, cor herdada via `currentColor`. Puramente decorativos.
 */

type DoodleProps = { className?: string };

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** Sublinhado ondulado para destacar uma palavra. Estica na largura do pai. */
export function Squiggle({ className }: DoodleProps) {
  return (
    <svg viewBox="0 0 200 16" preserveAspectRatio="none" className={className} aria-hidden>
      <path
        {...stroke}
        strokeWidth={3.5}
        d="M3 10 C 18 3, 28 15, 44 9 S 70 3, 86 9 S 112 15, 128 8 S 154 2, 170 9 S 190 13, 197 7"
      />
    </svg>
  );
}

export function Sparkle({ className }: DoodleProps) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <path
        {...stroke}
        strokeWidth={2.5}
        d="M20 4 C 21 14, 24 18, 36 20 C 24 22, 21 26, 20 36 C 19 26, 16 22, 4 20 C 16 18, 19 14, 20 4 Z"
      />
    </svg>
  );
}

/** Seta curva, apontando para a direita. */
export function CurlyArrow({ className }: DoodleProps) {
  return (
    <svg viewBox="0 0 120 60" className={className} aria-hidden>
      <path
        {...stroke}
        strokeWidth={2.5}
        d="M6 40 C 22 10, 44 6, 52 24 C 58 38, 40 44, 42 30 C 44 16, 72 12, 110 26"
      />
      <path {...stroke} strokeWidth={2.5} d="M96 16 L 111 26 L 95 34" />
    </svg>
  );
}

/** Balão de fala com "ok!". */
export function OkBubble({ className }: DoodleProps) {
  return (
    <svg viewBox="0 0 90 70" className={className} aria-hidden>
      <path
        {...stroke}
        strokeWidth={2.5}
        d="M14 12 C 34 4, 70 4, 82 18 C 92 32, 78 48, 52 50 C 42 51, 34 50, 26 48 L 12 62 L 18 45 C 4 38, 2 20, 14 12 Z"
      />
      <path
        {...stroke}
        strokeWidth={2.5}
        d="M30 26 C 24 26, 24 36, 30 36 C 36 36, 36 26, 30 26 Z M44 22 L 43 38 M53 25 L 44 31 L 54 38 M62 21 L 61 32 M61 37 L 61 38"
      />
    </svg>
  );
}

/** Folha de documento com dobra e linhas. */
export function PaperDoodle({ className }: DoodleProps) {
  return (
    <svg viewBox="0 0 60 72" className={className} aria-hidden>
      <path {...stroke} strokeWidth={2.5} d="M8 6 L 38 5 L 53 20 L 52 66 L 9 67 Z" />
      <path {...stroke} strokeWidth={2.5} d="M38 5 L 38 20 L 53 20" />
      <path {...stroke} strokeWidth={2} d="M17 32 L 43 31 M17 42 L 44 42 M17 52 L 34 52" />
    </svg>
  );
}

/** Círculo rabiscado em volta de algo. */
export function ScribbleCircle({ className }: DoodleProps) {
  return (
    <svg viewBox="0 0 160 80" preserveAspectRatio="none" className={className} aria-hidden>
      <path
        {...stroke}
        strokeWidth={2.5}
        d="M92 8 C 40 2, 6 18, 8 40 C 10 64, 60 76, 110 70 C 150 64, 160 40, 144 24 C 128 10, 90 6, 60 12"
      />
    </svg>
  );
}

export function Star({ className }: DoodleProps) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <path
        {...stroke}
        strokeWidth={2.5}
        d="M20 4 L 24 15 L 36 15 L 26 23 L 30 35 L 20 28 L 10 35 L 14 23 L 4 15 L 16 15 Z"
      />
    </svg>
  );
}

/** Traço solto, curto. */
export function Dash({ className }: DoodleProps) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <path {...stroke} strokeWidth={3} d="M6 30 L 32 8" />
    </svg>
  );
}
