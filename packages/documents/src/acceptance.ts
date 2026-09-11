import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

/** Declaração que o respondente marca na revisão (gravada junto com o aceite). */
export const ACCEPTANCE_STATEMENT =
  "Li este documento, confirmo que os dados que informei são verdadeiros e aceito seus termos, assinando-o eletronicamente.";

export type AcceptanceRecord = {
  documentName: string;
  /** Código de verificação (aparece também no link de verificação). */
  verificationCode: string;
  verifyUrl: string;
  acceptedAt: Date;
  statement: string;
  ip?: string | null;
  userAgent?: string | null;
  email?: string | null;
  cpf?: string | null;
  identifier?: string | null;
  /** SHA-256 dos dados mesclados no documento (template + respostas). */
  contentHash: string;
  companyName?: string | null;
};

const INK = rgb(0.09, 0.09, 0.11);
const MUTED = rgb(0.42, 0.42, 0.47);
const LINE = rgb(0.88, 0.88, 0.91);
const INDIGO = rgb(0.31, 0.275, 0.898);
const SOFT = rgb(0.957, 0.957, 0.992);

// Fontes padrão do PDF usam WinAnsi: troca o que não cabe (emoji etc.) por "?".
const WIN_ANSI_EXTRA = new Set("€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ");
function safe(text: string): string {
  return Array.from(text.normalize("NFC"))
    .map((ch) => {
      const code = ch.codePointAt(0)!;
      if (code === 10) return " ";
      return (code >= 32 && code <= 126) || (code >= 160 && code <= 255) || WIN_ANSI_EXTRA.has(ch) ? ch : "?";
    })
    .join("");
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of safe(text).split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      line = candidate;
      continue;
    }
    if (line) lines.push(line);
    // Palavra maior que a linha (hash, user agent): quebra por caractere.
    let rest = word;
    while (font.widthOfTextAtSize(rest, size) > maxWidth) {
      let cut = rest.length;
      while (cut > 1 && font.widthOfTextAtSize(rest.slice(0, cut), size) > maxWidth) cut--;
      lines.push(rest.slice(0, cut));
      rest = rest.slice(cut);
    }
    line = rest;
  }
  if (line) lines.push(line);
  return lines;
}

function formatBrazil(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

/**
 * Acrescenta ao fim do PDF a página "Registro de aceite eletrônico"
 * (assinatura eletrônica simples): quem, quando, de onde e o quê foi aceito.
 */
export async function appendAcceptancePage(pdf: Buffer | Uint8Array, record: AcceptanceRecord): Promise<Buffer> {
  const doc = await PDFDocument.load(pdf);
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const mono = await doc.embedFont(StandardFonts.Courier);

  const first = doc.getPages()[0];
  const { width, height } = first ? first.getSize() : { width: 595.28, height: 841.89 };
  const page: PDFPage = doc.addPage([width, height]);
  const margin = 56;
  const contentWidth = width - margin * 2;
  let y = height - margin;

  const text = (value: string, x: number, size: number, font: PDFFont, color = INK) => {
    page.drawText(safe(value), { x, y, size, font, color });
  };

  // Cabeçalho
  page.drawRectangle({ x: margin, y: y - 2, width: 28, height: 3, color: INDIGO });
  y -= 22;
  text("REGISTRO DE ACEITE ELETRÔNICO", margin, 9, bold, INDIGO);
  y -= 26;
  for (const line of wrap(record.documentName, bold, 18, contentWidth)) {
    text(line, margin, 18, bold);
    y -= 24;
  }
  if (record.companyName) {
    text(record.companyName, margin, 10, regular, MUTED);
    y -= 14;
  }
  y -= 14;

  // Linhas rótulo / valor
  const labelWidth = 150;
  const valueWidth = contentWidth - labelWidth;
  const rows: Array<[string, string | null | undefined, PDFFont?]> = [
    ["Aceito em", `${formatBrazil(record.acceptedAt)} (horário de Brasília)`],
    ["E-mail informado", record.email],
    ["CPF informado", record.cpf],
    ["Identificação", record.identifier],
    ["Endereço IP", record.ip],
    ["Navegador", record.userAgent],
    ["Código de verificação", record.verificationCode, mono],
    ["Impressão digital do conteúdo (SHA-256)", record.contentHash, mono],
  ];
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.6, color: LINE });
  for (const [label, value, font] of rows) {
    if (!value) continue;
    const valueFont = font ?? regular;
    const size = font ? 8.5 : 10;
    const labelLines = wrap(label, regular, 9, labelWidth - 12);
    const valueLines = wrap(value, valueFont, size, valueWidth);
    const rowTop = y - 16;
    let ly = rowTop;
    for (const l of labelLines) {
      page.drawText(l, { x: margin, y: ly, size: 9, font: regular, color: MUTED });
      ly -= 12;
    }
    let vy = rowTop;
    for (const l of valueLines) {
      page.drawText(l, { x: margin + labelWidth, y: vy, size, font: valueFont, color: INK });
      vy -= size + 3.5;
    }
    y = Math.min(ly, vy) - 8;
    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.6, color: LINE });
  }

  // Declaração aceita
  y -= 22;
  text("Declaração aceita", margin, 9, bold, MUTED);
  y -= 10;
  const statementLines = wrap(`“${record.statement}”`, regular, 11, contentWidth - 28);
  const boxHeight = statementLines.length * 15 + 20;
  page.drawRectangle({ x: margin, y: y - boxHeight, width: contentWidth, height: boxHeight, color: SOFT });
  page.drawRectangle({ x: margin, y: y - boxHeight, width: 3, height: boxHeight, color: INDIGO });
  let sy = y - 22;
  for (const line of statementLines) {
    page.drawText(line, { x: margin + 16, y: sy, size: 11, font: regular, color: INK });
    sy -= 15;
  }
  y -= boxHeight + 28;

  // Verificação + nota legal
  for (const line of wrap(
    `Para conferir se um arquivo é idêntico ao original, acesse ${record.verifyUrl}`,
    regular,
    9.5,
    contentWidth
  )) {
    text(line, margin, 9.5, regular);
    y -= 13;
  }
  y -= 6;
  for (const line of wrap(
    "Aceite registrado pelo Submitin como assinatura eletrônica simples (Lei nº 14.063/2020), com data, hora, endereço IP e navegador de quem confirmou o documento.",
    regular,
    8.5,
    contentWidth
  )) {
    text(line, margin, 8.5, regular, MUTED);
    y -= 11.5;
  }

  return Buffer.from(await doc.save());
}
