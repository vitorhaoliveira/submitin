import PizZip from "pizzip";

/**
 * Fontes instaladas no conversor (imagem em infra/gotenberg), incluindo equivalentes
 * métricos: Carlito ≈ Calibri, Caladea ≈ Cambria, Liberation ≈ Arial/Times/Courier.
 * Fonte fora desta lista é substituída pelo LibreOffice e pode alterar quebras de linha.
 */
export const SUPPORTED_FONTS = new Set(
  [
    // Métricas compatíveis (substituição transparente)
    "Calibri", "Calibri Light", "Cambria", "Arial", "Times New Roman", "Courier New",
    "Helvetica", "Times",
    // ttf-mscorefonts-installer
    "Andale Mono", "Arial Black", "Comic Sans MS", "Georgia", "Impact",
    "Trebuchet MS", "Verdana", "Webdings",
    // Instaladas diretamente
    "Carlito", "Caladea", "Liberation Sans", "Liberation Serif", "Liberation Mono",
    "DejaVu Sans", "DejaVu Serif", "DejaVu Sans Mono", "Noto Sans", "Noto Serif",
    "Open Sans", "Roboto", "Lato", "Montserrat",
    // Símbolos
    "Symbol", "Wingdings",
  ].map((f) => f.toLowerCase())
);

const FONT_ATTR = /<w:rFonts\b[^>]*>/g;
const ATTR_VALUE = /w:(?:ascii|hAnsi|cs|eastAsia)="([^"]+)"/g;
const THEME_LATIN = /<a:(?:majorFont|minorFont)>[\s\S]*?<a:latin typeface="([^"]*)"/g;

/** Fontes efetivamente usadas no texto (estilos, corpo, cabeçalhos, rodapés e tema). */
export function detectFonts(buffer: Buffer | Uint8Array): string[] {
  const zip = new PizZip(buffer);
  const fonts = new Set<string>();
  const files = zip.file(/^word\/(document|styles|header\d*|footer\d*|numbering)\.xml$/);
  for (const file of files) {
    const xml = file.asText();
    for (const tag of xml.match(FONT_ATTR) ?? []) {
      for (const m of tag.matchAll(ATTR_VALUE)) fonts.add(m[1]!);
    }
  }
  const theme = zip.file(/^word\/theme\/theme\d*\.xml$/)[0]?.asText();
  if (theme) for (const m of theme.matchAll(THEME_LATIN)) if (m[1]) fonts.add(m[1]);
  return [...fonts].sort();
}

/** Fontes do documento que o conversor não tem — avisar o usuário no upload. */
export function detectMissingFonts(buffer: Buffer | Uint8Array): string[] {
  return detectFonts(buffer).filter((f) => !SUPPORTED_FONTS.has(f.toLowerCase()));
}
