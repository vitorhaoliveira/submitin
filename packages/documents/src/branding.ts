import { PDFDocument, PDFString, StandardFonts, rgb } from "pdf-lib";

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

  for (const page of doc.getPages()) {
    const { width } = page.getSize();
    const x = width - textWidth - 18;
    const y = 10;
    page.drawText(text, { x, y, size, font, color: rgb(0.55, 0.55, 0.6) });

    const link = doc.context.register(
      doc.context.obj({
        Type: "Annot",
        Subtype: "Link",
        Rect: [x, y - 2, x + textWidth, y + size + 2],
        Border: [0, 0, 0],
        A: { Type: "Action", S: "URI", URI: PDFString.of(options.url) },
      })
    );
    page.node.addAnnot(link);
  }

  return Buffer.from(await doc.save());
}
