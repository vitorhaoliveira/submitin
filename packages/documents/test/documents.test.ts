import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import PizZip from "pizzip";
import { Document, Packer, Paragraph, TextRun } from "docx";
import {
  buildVariables,
  convertDocxToPdf,
  currencyToWords,
  detectFonts,
  detectMissingFonts,
  formatValue,
  inferFieldType,
  isValidCnpj,
  isValidCpf,
  mergeTemplate,
  normalizeVariableKey,
  parseCurrency,
  parseTemplate,
  TemplateError,
} from "../src";

const fixture = readFileSync(join(import.meta.dirname, "fixtures/contrato-matricula.docx"));
const answers = JSON.parse(
  readFileSync(join(import.meta.dirname, "fixtures/contrato-matricula.answers.json"), "utf8")
) as Record<string, string>;

async function docxWith(...paragraphs: string[]): Promise<Buffer> {
  const doc = new Document({
    sections: [{ children: paragraphs.map((t) => new Paragraph({ children: [new TextRun(t)] })) }],
  });
  return Packer.toBuffer(doc);
}

function xmlText(docx: Buffer): string {
  const zip = new PizZip(docx);
  return zip
    .file(/^word\/(document|header\d*|footer\d*)\.xml$/)
    .map((f) => f.asText().replace(/<[^>]+>/g, ""))
    .join("\n");
}

describe("variáveis", () => {
  test("normaliza chaves", () => {
    assert.equal(normalizeVariableKey(" Nome do Aluno "), "nome_do_aluno");
    assert.equal(normalizeVariableKey("Endereço"), "endereco");
    assert.equal(normalizeVariableKey("cpf-responsável"), "cpf_responsavel");
    assert.equal(normalizeVariableKey("VALOR__TOTAL"), "valor_total");
  });

  test("infere tipo pelo nome", () => {
    assert.equal(inferFieldType("cpf_responsavel"), "cpf");
    assert.equal(inferFieldType("cnpj_empresa"), "cnpj");
    assert.equal(inferFieldType("email_responsavel"), "email");
    assert.equal(inferFieldType("e_mail"), "email");
    assert.equal(inferFieldType("celular"), "phone");
    assert.equal(inferFieldType("cep"), "cep");
    assert.equal(inferFieldType("data_nascimento"), "date");
    assert.equal(inferFieldType("valor_mensalidade"), "currency");
    assert.equal(inferFieldType("observacoes"), "textarea");
    assert.equal(inferFieldType("nome_candidato"), "text"); // não casa "data"
    assert.equal(inferFieldType("dia_vencimento"), "text"); // dia do mês
  });

  test("deduplica e ignora *_extenso derivado", () => {
    const vars = buildVariables(["nome", "Nome", "valor", "valor_extenso", "outro_extenso"]);
    assert.deepEqual(
      vars.map((v) => v.key),
      ["nome", "valor", "outro_extenso"]
    );
    assert.deepEqual(
      vars.map((v) => v.order),
      [0, 1, 2]
    );
  });
});

describe("validação", () => {
  test("CPF", () => {
    assert.ok(isValidCpf("529.982.247-25"));
    assert.ok(isValidCpf("52998224725"));
    assert.ok(!isValidCpf("529.982.247-24"));
    assert.ok(!isValidCpf("111.111.111-11"));
    assert.ok(!isValidCpf("123"));
  });

  test("CNPJ", () => {
    assert.ok(isValidCnpj("12.345.678/0001-95"));
    assert.ok(isValidCnpj("11222333000181"));
    assert.ok(!isValidCnpj("11.222.333/0001-80"));
    assert.ok(!isValidCnpj("00000000000000"));
  });
});

describe("formatação", () => {
  test("moeda aceita formatos brasileiros e internacionais", () => {
    assert.equal(parseCurrency("1234.56"), 1234.56);
    assert.equal(parseCurrency("1.234,56"), 1234.56);
    assert.equal(parseCurrency("R$ 1.234,56"), 1234.56);
    assert.equal(parseCurrency("150"), 150);
    assert.equal(parseCurrency("abc"), null);
    assert.equal(formatValue("currency", "1234.5"), "R$ 1.234,50");
  });

  test("datas, CPF, CNPJ, CEP e telefone", () => {
    assert.equal(formatValue("date", "2027-02-01"), "01/02/2027");
    assert.equal(formatValue("date", "01/02/2027"), "01/02/2027");
    assert.equal(formatValue("cpf", "52998224725"), "529.982.247-25");
    assert.equal(formatValue("cnpj", "11222333000181"), "11.222.333/0001-81");
    assert.equal(formatValue("cep", "13073001"), "13073-001");
    assert.equal(formatValue("phone", "19991234567"), "(19) 99123-4567");
    assert.equal(formatValue("phone", "1932345678"), "(19) 3234-5678");
  });

  test("valor por extenso", () => {
    assert.equal(currencyToWords(1), "um real");
    assert.equal(currencyToWords(0.01), "um centavo");
    assert.equal(currencyToWords(100), "cem reais");
    assert.equal(currencyToWords(101), "cento e um reais");
    assert.equal(currencyToWords(389.9), "trezentos e oitenta e nove reais e noventa centavos");
    assert.equal(currencyToWords(1000), "mil reais");
    assert.equal(currencyToWords(1500), "mil e quinhentos reais");
    assert.equal(currencyToWords(1234.56), "mil duzentos e trinta e quatro reais e cinquenta e seis centavos");
    assert.equal(currencyToWords(21000), "vinte e um mil reais");
    assert.equal(currencyToWords(1_000_000), "um milhão de reais");
    assert.equal(currencyToWords(2_000_001), "dois milhões e um reais");
  });
});

describe("template", () => {
  test("extrai variáveis do contrato (corpo, tabela, rodapé, runs quebrados)", () => {
    const { variables, unsupportedTags } = parseTemplate(fixture);
    const keys = variables.map((v) => v.key);
    assert.equal(keys.length, 17);
    assert.equal(new Set(keys).size, keys.length);
    for (const key of ["nome_responsavel", "nome_aluno", "endereco", "numero_contrato", "data_assinatura"]) {
      assert.ok(keys.includes(key), `faltou ${key}`);
    }
    assert.ok(!keys.includes("valor_mensalidade_extenso"));
    assert.deepEqual(unsupportedTags, []);
  });

  test("mescla preservando o documento e formata valores", () => {
    const { variables } = parseTemplate(fixture);
    const text = xmlText(mergeTemplate(fixture, variables, answers));
    assert.ok(!text.includes("{{"), "sobrou variável sem substituir");
    assert.ok(text.includes("Mariana Souza de Almeida"));
    assert.ok(text.includes("529.982.247-25"));
    assert.ok(text.includes("R$ 389,90"));
    assert.ok(text.includes("trezentos e oitenta e nove reais e noventa centavos"));
    assert.ok(text.includes("01/02/2027"));
    assert.ok(text.includes("2027-0142"), "variável do rodapé");
  });

  test("resposta ausente vira vazio, não 'undefined'", async () => {
    const docx = await docxWith("Olá {{nome}}, CPF {{cpf}}.");
    const { variables } = parseTemplate(docx);
    const text = xmlText(mergeTemplate(docx, variables, { nome: "Ana" }));
    assert.ok(text.includes("Olá Ana, CPF ."));
  });

  test("tag sem fechamento gera erro legível", async () => {
    const docx = await docxWith("Nome: {{nome", "CPF: {{cpf}}");
    assert.throws(
      () => parseTemplate(docx),
      (err: unknown) => err instanceof TemplateError && err.details.some((d) => d.includes("fechamento"))
    );
  });

  test("documento sem variáveis", async () => {
    const docx = await docxWith("Sem nada aqui.");
    assert.throws(() => parseTemplate(docx), TemplateError);
  });

  test("arquivo que não é .docx", () => {
    assert.throws(() => parseTemplate(Buffer.from("não sou um zip")), TemplateError);
  });
});

describe("fontes", () => {
  test("detecta fontes usadas e as ausentes no conversor", async () => {
    assert.ok(detectFonts(fixture).includes("Calibri"));
    assert.deepEqual(detectMissingFonts(fixture), []);

    const doc = new Document({
      sections: [{ children: [new Paragraph({ children: [new TextRun({ text: "{{x}}", font: "Century Gothic" })] })] }],
    });
    assert.deepEqual(detectMissingFonts(await Packer.toBuffer(doc)), ["Century Gothic"]);
  });
});

describe("pdf", { skip: !process.env.GOTENBERG_URL && "defina GOTENBERG_URL para testar a conversão" }, () => {
  test("converte o contrato mesclado em PDF", async () => {
    const { variables } = parseTemplate(fixture);
    const pdf = await convertDocxToPdf(mergeTemplate(fixture, variables, answers));
    assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
  });
});
