/**
 * Gera um contrato de matrícula realista para testes de fidelidade:
 * cabeçalho, rodapé com numeração, tabela, negrito, texto justificado, 2 páginas,
 * e variáveis "bagunçadas" como o Word produz (quebradas em vários runs,
 * com espaços e acentos, repetidas, no cabeçalho/rodapé).
 *
 * Uso: pnpm tsx scripts/make-fixture.ts
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

const FONT = "Calibri";

const p = (runs: (string | TextRun)[], opts: { bold?: boolean; align?: (typeof AlignmentType)[keyof typeof AlignmentType]; spacingAfter?: number } = {}) =>
  new Paragraph({
    alignment: opts.align ?? AlignmentType.JUSTIFIED,
    spacing: { after: opts.spacingAfter ?? 160, line: 300 },
    children: runs.map((r) => (typeof r === "string" ? new TextRun({ text: r, bold: opts.bold }) : r)),
  });

const b = (text: string) => new TextRun({ text, bold: true });

const heading = (text: string) =>
  new Paragraph({
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true, size: 24 })],
  });

const border = { style: BorderStyle.SINGLE, size: 4, color: "808080" };
const cellBorders = { top: border, bottom: border, left: border, right: border };

const row = (label: string, value: (string | TextRun)[]) =>
  new TableRow({
    children: [
      new TableCell({
        width: { size: 35, type: WidthType.PERCENTAGE },
        borders: cellBorders,
        shading: { type: ShadingType.CLEAR, fill: "E8EEF7", color: "auto" },
        children: [new Paragraph({ children: [b(label)] })],
      }),
      new TableCell({
        width: { size: 65, type: WidthType.PERCENTAGE },
        borders: cellBorders,
        children: [new Paragraph({ children: value.map((v) => (typeof v === "string" ? new TextRun(v) : v)) })],
      }),
    ],
  });

const doc = new Document({
  styles: { default: { document: { run: { font: FONT, size: 22 } } } },
  sections: [
    {
      properties: { page: { margin: { top: 1700, bottom: 1400, left: 1440, right: 1440 } } },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "ESCOLA DE IDIOMAS HORIZONTE", bold: true, size: 28, color: "1F3864" })],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: "1F3864", space: 4 } },
              children: [new TextRun({ text: "CNPJ 12.345.678/0001-95 · Rua das Flores, 100 · Campinas/SP", size: 18, color: "595959" })],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: "Contrato nº ", size: 16 }),
                // variável no rodapé
                new TextRun({ text: "{{numero_contrato}}", size: 16, bold: true }),
                new TextRun({ text: " — Página ", size: 16 }),
                new TextRun({ children: [PageNumber.CURRENT], size: 16 }),
                new TextRun({ text: " de ", size: 16 }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16 }),
              ],
            }),
          ],
        }),
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 240 },
          children: [new TextRun({ text: "CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS", bold: true, size: 26 })],
        }),

        heading("1. DAS PARTES"),
        p([
          "Pelo presente instrumento particular, de um lado ",
          b("ESCOLA DE IDIOMAS HORIZONTE LTDA"),
          ", doravante denominada CONTRATADA, e de outro lado ",
          // Variável quebrada em 3 runs, como o Word faz após correção ortográfica
          new TextRun({ text: "{{", bold: true }),
          new TextRun({ text: "nome_", bold: true }),
          new TextRun({ text: "responsavel}}", bold: true }),
          ", portador(a) do CPF nº ",
          new TextRun("{{cpf_responsavel}}"),
          ", residente em ",
          new TextRun("{{ Endereço }}"), // espaços + acento → endereco
          ", CEP {{cep}}, telefone {{telefone_responsavel}}, e-mail {{email_responsavel}}, doravante denominado(a) CONTRATANTE, responsável financeiro pelo(a) aluno(a) abaixo qualificado(a), têm entre si justo e contratado o que segue.",
        ]),

        heading("2. DADOS DO ALUNO"),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            row("Nome do aluno", [new TextRun({ text: "{{nome_" }), new TextRun({ text: "aluno}}" })]),
            row("Data de nascimento", ["{{data_nascimento_aluno}}"]),
            row("Curso", ["{{curso}}"]),
            row("Turma / horário", ["{{turma}}"]),
            row("Início das aulas", ["{{data_inicio}}"]),
          ],
        }),
        new Paragraph({ spacing: { after: 120 }, children: [] }),

        heading("3. DO OBJETO"),
        p([
          "O presente contrato tem por objeto a prestação de serviços educacionais pela CONTRATADA ao aluno ",
          b("{{nome_aluno}}"), // repetida
          ", no curso de {{curso}}, conforme calendário escolar, carga horária e plano pedagógico vigentes, os quais o CONTRATANTE declara conhecer e aceitar.",
        ]),

        heading("4. DO VALOR E FORMA DE PAGAMENTO"),
        p([
          "Pelos serviços contratados, o CONTRATANTE pagará à CONTRATADA mensalidades no valor de ",
          b("{{valor_mensalidade}}"),
          " (",
          new TextRun({ text: "{{valor_mensalidade_extenso}}", italics: true }),
          "), com vencimento todo dia ",
          b("{{dia_vencimento}}"),
          " de cada mês, além da taxa de matrícula de {{valor_matricula}}, paga no ato da assinatura.",
        ]),
        p([
          "Parágrafo único. O atraso no pagamento sujeitará o CONTRATANTE à multa de 2% (dois por cento) sobre o valor da parcela, acrescida de juros de mora de 1% (um por cento) ao mês, calculados pro rata die, nos termos do Código de Defesa do Consumidor.",
        ]),

        heading("5. DA VIGÊNCIA E RESCISÃO"),
        p([
          "Este contrato vigorará a partir de {{data_inicio}} pelo prazo do semestre letivo, podendo ser rescindido por qualquer das partes mediante aviso prévio de 30 (trinta) dias, por escrito. A desistência após o início das aulas não desobriga o CONTRATANTE do pagamento das parcelas vencidas até a data da comunicação formal.",
        ]),
        p([
          "Em caso de rescisão imotivada pelo CONTRATANTE, não haverá devolução da taxa de matrícula, que se destina a cobrir custos administrativos, material didático inicial e reserva de vaga na turma.",
        ]),

        heading("6. DO USO DE IMAGEM"),
        p([
          "O CONTRATANTE autoriza, a título gratuito, o uso da imagem do aluno em fotos e vídeos de atividades pedagógicas, para divulgação institucional da CONTRATADA em seus canais oficiais, sem qualquer ônus, pelo prazo de vigência deste contrato.",
        ]),

        heading("7. OBSERVAÇÕES"),
        p(["{{observacoes}}"]),

        heading("8. DO FORO"),
        p([
          "As partes elegem o foro da Comarca de Campinas/SP para dirimir quaisquer dúvidas oriundas do presente contrato, renunciando a qualquer outro, por mais privilegiado que seja.",
        ]),
        p(["E, por estarem assim justas e contratadas, as partes assinam o presente em duas vias de igual teor."]),
        p(["Campinas, {{data_assinatura}}."], { align: AlignmentType.RIGHT, spacingAfter: 720 }),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
          },
          rows: [
            new TableRow({
              children: ["CONTRATADA", "{{nome_responsavel}}"].map(
                (name) =>
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun("______________________________")] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [b(name)] }),
                    ],
                  })
              ),
            }),
          ],
        }),
      ],
    },
  ],
});

const outDir = join(import.meta.dirname, "..", "test", "fixtures");
mkdirSync(outDir, { recursive: true });
const buffer = await Packer.toBuffer(doc);
writeFileSync(join(outDir, "contrato-matricula.docx"), buffer);
console.log("ok →", join(outDir, "contrato-matricula.docx"));
