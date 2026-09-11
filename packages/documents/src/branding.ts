import { PDFDocument, PDFString, StandardFonts, rgb } from "pdf-lib";

// Marca balão-folha no grid 48×48 (mesma geometria de apps/web/components/logo.tsx).
const MARK = {
  shape:
    "M11 5h20.5L43 16.5V33a7 7 0 0 1-7 7H21.5l-8.6 6.3c-.9.6-2.1-.1-1.9-1.2l.9-5.1H11a7 7 0 0 1-7-7V12a7 7 0 0 1 7-7Z",
  fold: "M31.5 5v8.5a3 3 0 0 0 3 3H43Z",
  lines: "M13 19h13a2 2 0 0 1 0 4H13a2 2 0 0 1 0-4ZM13 27h20a2 2 0 0 1 0 4H13a2 2 0 0 1 0-4Z",
};
const INDIGO = rgb(0.31, 0.275, 0.898); // #4F46E5
const MAGENTA = rgb(0.945, 0.153, 0.733); // #F127BB

/**
 * Marca discreta e clicável no rodapé de cada página (plano grátis).
 * Aplicada no PDF já convertido — não altera o layout do .docx.
 */
export async function stampBranding(
  pdf: Buffer | Uint8Array,
  options: { text?: string; url: string }
): Promise<Buffer> {
  const doc = await PDFDocument.load(pdf);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const text = options.text ?? "Gerado com Submitin";
  const size = 7;
  const textWidth = font.widthOfTextAtSize(text, size);
  const markSize = 9;
  const markScale = markSize / 48;
  const gap = 3;

  for (const page of doc.getPages()) {
    const { width } = page.getSize();
    const x = width - textWidth - 18;
    const y = 10;
    const markX = x - gap - markSize;
    // drawSvgPath usa coordenadas SVG (y para baixo) a partir do canto superior esquerdo.
    const markTop = y + markSize - 1.5;
    const opts = { x: markX, y: markTop, scale: markScale };
    page.drawSvgPath(MARK.shape, { ...opts, color: INDIGO });
    page.drawSvgPath(MARK.fold, { ...opts, color: MAGENTA });
    page.drawSvgPath(MARK.lines, { ...opts, color: rgb(1, 1, 1) });
    page.drawText(text, { x, y, size, font, color: rgb(0.55, 0.55, 0.6) });

    const link = doc.context.register(
      doc.context.obj({
        Type: "Annot",
        Subtype: "Link",
        Rect: [markX, y - 2, x + textWidth, y + size + 2],
        Border: [0, 0, 0],
        A: { Type: "Action", S: "URI", URI: PDFString.of(options.url) },
      })
    );
    page.node.addAnnot(link);
  }

  return Buffer.from(await doc.save());
}
