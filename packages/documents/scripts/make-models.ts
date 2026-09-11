/**
 * Gera os modelos prontos (.docx) publicados em apps/web/public/modelos/.
 * Textos genéricos de exemplo — a página de cada modelo avisa para revisar com um advogado.
 * As variáveis precisam bater com apps/web/lib/templates/catalog.ts.
 *
 * Uso: pnpm --filter @submitin/documents exec tsx scripts/make-models.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
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
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

const FONT = "Calibri";
const OUT = join(import.meta.dirname, "../../../apps/web/public/modelos");

// Texto com **negrito** simples: "Eu, **{{nome}}**, ..." vira runs.
function runs(text: string, size = 22): TextRun[] {
  return text.split(/(\*\*[^*]+\*\*)/).filter(Boolean).map((part) =>
    part.startsWith("**")
      ? new TextRun({ text: part.slice(2, -2), bold: true, font: FONT, size })
      : new TextRun({ text: part, font: FONT, size })
  );
}

const para = (text: string, opts: { after?: number; align?: "center" | "justify" | "right" } = {}) =>
  new Paragraph({
    children: runs(text),
    alignment:
      opts.align === "center"
        ? AlignmentType.CENTER
        : opts.align === "right"
          ? AlignmentType.RIGHT
          : AlignmentType.JUSTIFIED,
    spacing: { after: opts.after ?? 140, line: 300 },
  });

const title = (text: string) =>
  new Paragraph({
    children: [new TextRun({ text, bold: true, font: FONT, size: 28 })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 280 },
  });

const section = (text: string) =>
  new Paragraph({
    children: [new TextRun({ text, bold: true, font: FONT, size: 22, color: "1F3A8A" })],
    spacing: { before: 220, after: 100 },
  });

const cell = (text: string, header = false) =>
  new TableCell({
    width: { size: header ? 35 : 65, type: WidthType.PERCENTAGE },
    shading: header ? { fill: "F1F5F9" } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [
      new Paragraph({ children: [new TextRun({ text, font: FONT, size: 20, bold: header })] }),
    ],
  });

/** Tabela rótulo → valor (ficha de dados). */
const dataTable = (rows: Array<[string, string]>) =>
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(([label, value]) => new TableRow({ children: [cell(label, true), cell(value)] })),
  });

/** Linha de assinatura (borda superior) com nome e documento embaixo. */
const signature = (name: string, detail: string) => [
  new Paragraph({ spacing: { before: 560 }, children: [] }),
  new Paragraph({
    border: { top: { style: BorderStyle.SINGLE, size: 6, color: "333333", space: 4 } },
    alignment: AlignmentType.CENTER,
    indent: { left: 1800, right: 1800 },
    children: [new TextRun({ text: name, bold: true, font: FONT, size: 20 })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: detail, font: FONT, size: 18, color: "555555" })],
  }),
];

function build(opts: {
  company: string; // chave do nome da empresa
  companyLine: string; // linha abaixo do nome no cabeçalho
  body: Array<Paragraph | Table>;
}) {
  return new Document({
    styles: { default: { document: { run: { font: FONT, size: 22 } } } },
    sections: [
      {
        properties: { page: { margin: { top: 1300, bottom: 1100, left: 1300, right: 1300 } } },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: `{{${opts.company}}}`, bold: true, font: FONT, size: 24 })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "999999", space: 6 } },
                children: [new TextRun({ text: opts.companyLine, font: FONT, size: 16, color: "555555" })],
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
                  new TextRun({ text: "Página ", font: FONT, size: 16, color: "777777" }),
                  new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16, color: "777777" }),
                  new TextRun({ text: " de ", font: FONT, size: 16, color: "777777" }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, size: 16, color: "777777" }),
                ],
              }),
            ],
          }),
        },
        children: opts.body,
      },
    ],
  });
}

const MODELS: Record<string, Document> = {
  // 1. Escolas e cursos
  "contrato-de-matricula": build({
    company: "nome_escola",
    companyLine: "CNPJ {{cnpj_escola}} · {{endereco_escola}}",
    body: [
      title("CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS"),
      section("1. Das partes"),
      para(
        "**CONTRATADA:** {{nome_escola}}, inscrita no CNPJ sob o nº {{cnpj_escola}}, com sede em {{endereco_escola}}."
      ),
      para(
        "**CONTRATANTE:** {{nome_responsavel}}, inscrito(a) no CPF sob o nº {{cpf_responsavel}}, residente em {{endereco_responsavel}}, CEP {{cep_responsavel}}, telefone {{telefone_responsavel}}, e-mail {{email_responsavel}}, na qualidade de responsável financeiro(a) pelo(a) aluno(a) indicado(a) abaixo."
      ),
      section("2. Do aluno e do curso"),
      dataTable([
        ["Aluno(a)", "{{nome_aluno}}"],
        ["Data de nascimento", "{{data_nascimento_aluno}}"],
        ["Curso", "{{curso}}"],
        ["Turno", "{{turno}}"],
        ["Início das aulas", "{{data_inicio}}"],
      ]),
      section("3. Do valor e da forma de pagamento"),
      para(
        "Pelos serviços educacionais, o CONTRATANTE pagará à CONTRATADA mensalidades de **{{valor_mensalidade}}** ({{valor_mensalidade_extenso}}), com vencimento todo dia **{{dia_vencimento}}** de cada mês."
      ),
      para(
        "O atraso no pagamento sujeitará o CONTRATANTE a multa de 2% (dois por cento) sobre o valor devido, acrescida de juros de 1% (um por cento) ao mês, calculados proporcionalmente aos dias de atraso."
      ),
      section("4. Das obrigações"),
      para(
        "A CONTRATADA se obriga a ministrar o curso contratado conforme seu calendário e plano pedagógico. O CONTRATANTE se obriga a efetuar os pagamentos nas datas acordadas e a zelar pela frequência e conduta do(a) aluno(a)."
      ),
      section("5. Do uso de imagem"),
      para(
        "Autorização do CONTRATANTE para o uso da imagem do(a) aluno(a) em materiais institucionais e redes sociais da CONTRATADA, sem fins comerciais diretos: **{{autoriza_uso_de_imagem}}**."
      ),
      section("6. Da rescisão"),
      para(
        "Este contrato poderá ser rescindido por qualquer das partes mediante aviso prévio de 30 (trinta) dias, por escrito, sem prejuízo das mensalidades vencidas até a data da rescisão."
      ),
      section("7. Observações"),
      para("{{observacoes}}"),
      para(
        "E, por estarem de acordo, as partes firmam o presente contrato em {{cidade_escola}}, {{data_assinatura_extenso}}.",
        { after: 200 }
      ),
      ...signature("{{nome_responsavel}}", "CPF {{cpf_responsavel}} · CONTRATANTE"),
      ...signature("{{nome_escola}}", "CNPJ {{cnpj_escola}} · CONTRATADA"),
    ],
  }),

  // 2. Clínicas e estética
  "ficha-de-anamnese": build({
    company: "nome_clinica",
    companyLine: "CNPJ {{cnpj_clinica}} · {{endereco_clinica}}",
    body: [
      title("FICHA DE ANAMNESE"),
      section("1. Identificação do paciente"),
      dataTable([
        ["Nome", "{{nome_paciente}}"],
        ["CPF", "{{cpf_paciente}}"],
        ["Data de nascimento", "{{data_nascimento_paciente}}"],
        ["Profissão", "{{profissao_paciente}}"],
        ["Telefone", "{{telefone_paciente}}"],
        ["E-mail", "{{email_paciente}}"],
      ]),
      section("2. Histórico de saúde"),
      dataTable([
        ["Motivo da consulta", "{{queixa_principal}}"],
        ["Alergias", "{{alergias}}"],
        ["Medicamentos em uso", "{{medicamentos_em_uso}}"],
        ["Doenças preexistentes", "{{doencas_preexistentes}}"],
        ["Cirurgias anteriores", "{{cirurgias_anteriores}}"],
        ["Gestante ou amamentando", "{{gestante}}"],
        ["Outras observações", "{{observacoes}}"],
      ]),
      section("3. Declaração"),
      para(
        "Declaro que as informações acima são verdadeiras e completas, e que fui orientado(a) a comunicar à {{nome_clinica}} qualquer alteração no meu estado de saúde. Estou ciente de que a omissão de informações pode comprometer a segurança dos procedimentos."
      ),
      para(
        "Autorizo o uso de registros fotográficos de antes e depois para acompanhamento clínico e divulgação, preservada a minha identidade: **{{autoriza_uso_de_imagem}}**."
      ),
      para(
        "Os dados deste formulário são tratados pela {{nome_clinica}} exclusivamente para o atendimento, nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018)."
      ),
      para("{{cidade_clinica}}, {{data_assinatura_extenso}}.", { after: 200 }),
      ...signature("{{nome_paciente}}", "CPF {{cpf_paciente}} · Paciente"),
    ],
  }),

  // 3. Academias e estúdios
  "termo-de-adesao-academia": build({
    company: "nome_academia",
    companyLine: "CNPJ {{cnpj_academia}} · {{endereco_academia}}",
    body: [
      title("TERMO DE ADESÃO E RESPONSABILIDADE"),
      section("1. Dados do aluno"),
      dataTable([
        ["Nome", "{{nome_aluno}}"],
        ["CPF", "{{cpf_aluno}}"],
        ["Data de nascimento", "{{data_nascimento_aluno}}"],
        ["Endereço", "{{endereco_aluno}}"],
        ["Telefone", "{{telefone_aluno}}"],
        ["E-mail", "{{email_aluno}}"],
        ["Contato de emergência", "{{nome_contato_emergencia}} · {{telefone_contato_emergencia}}"],
      ]),
      section("2. Do plano contratado"),
      para(
        "O ALUNO adere ao plano **{{plano}}** da {{nome_academia}}, no valor de **{{valor_plano}}** ({{valor_plano_extenso}}), com vencimento todo dia **{{dia_vencimento}}**."
      ),
      section("3. Da saúde e da responsabilidade"),
      para(
        "O ALUNO declara estar apto(a) à prática de atividades físicas e compromete-se a apresentar atestado médico quando solicitado. Informa as seguintes restrições ou condições de saúde: {{observacoes_saude}}"
      ),
      para(
        "O ALUNO assume a responsabilidade por seguir as orientações dos profissionais, utilizar corretamente os equipamentos e comunicar imediatamente qualquer desconforto durante os treinos."
      ),
      section("4. Das regras de uso"),
      para(
        "O ALUNO compromete-se a respeitar o regulamento interno, os horários de funcionamento e as normas de higiene e convivência. O acesso é pessoal e intransferível."
      ),
      section("5. Do uso de imagem"),
      para(
        "Autorização do ALUNO para o uso de sua imagem em fotos e vídeos feitos nas dependências da {{nome_academia}}, para divulgação em redes sociais: **{{autoriza_uso_de_imagem}}**."
      ),
      section("6. Do cancelamento"),
      para(
        "O cancelamento deve ser solicitado com antecedência mínima de 30 (trinta) dias da próxima cobrança. Valores referentes a períodos já utilizados não são reembolsáveis."
      ),
      para("{{cidade_academia}}, {{data_assinatura_extenso}}.", { after: 200 }),
      ...signature("{{nome_aluno}}", "CPF {{cpf_aluno}} · ALUNO(A)"),
      ...signature("{{nome_academia}}", "CNPJ {{cnpj_academia}}"),
    ],
  }),

  // 4. Prestadores de serviço
  "contrato-de-prestacao-de-servicos": build({
    company: "nome_prestador",
    companyLine: "CNPJ {{cnpj_prestador}} · {{endereco_prestador}}",
    body: [
      title("CONTRATO DE PRESTAÇÃO DE SERVIÇOS"),
      section("1. Das partes"),
      para(
        "**CONTRATADA:** {{nome_prestador}}, inscrita no CNPJ sob o nº {{cnpj_prestador}}, com sede em {{endereco_prestador}}."
      ),
      para(
        "**CONTRATANTE:** {{nome_cliente}}, inscrito(a) no CPF sob o nº {{cpf_cliente}}, residente em {{endereco_cliente}}, CEP {{cep_cliente}}, telefone {{telefone_cliente}}, e-mail {{email_cliente}}."
      ),
      section("2. Do objeto"),
      para("A CONTRATADA prestará ao CONTRATANTE os seguintes serviços:"),
      para("{{descricao_servico}}"),
      section("3. Do prazo"),
      para(
        "Os serviços serão entregues até **{{data_entrega}}**, podendo o prazo ser prorrogado mediante acordo entre as partes ou por atraso no envio de informações pelo CONTRATANTE."
      ),
      section("4. Do valor e do pagamento"),
      para(
        "Pelos serviços, o CONTRATANTE pagará o valor total de **{{valor_servico}}** ({{valor_servico_extenso}}), por meio de **{{forma_pagamento}}**, conforme combinado entre as partes."
      ),
      section("5. Das obrigações"),
      para(
        "A CONTRATADA se obriga a executar os serviços com qualidade e dentro do prazo. O CONTRATANTE se obriga a fornecer as informações necessárias e a efetuar o pagamento na forma acordada."
      ),
      section("6. Da rescisão"),
      para(
        "O contrato poderá ser rescindido por qualquer das partes, mediante aviso por escrito, sendo devidos os valores proporcionais aos serviços já executados."
      ),
      section("7. Observações"),
      para("{{observacoes}}"),
      para(
        "E, por estarem de acordo, as partes firmam o presente contrato em {{cidade_prestador}}, {{data_assinatura_extenso}}.",
        { after: 200 }
      ),
      ...signature("{{nome_cliente}}", "CPF {{cpf_cliente}} · CONTRATANTE"),
      ...signature("{{nome_prestador}}", "CNPJ {{cnpj_prestador}} · CONTRATADA"),
    ],
  }),

  // 5. Qualquer segmento
  "autorizacao-de-uso-de-imagem": build({
    company: "nome_empresa",
    companyLine: "CNPJ {{cnpj_empresa}}",
    body: [
      title("TERMO DE AUTORIZAÇÃO DE USO DE IMAGEM"),
      para(
        "Eu, **{{nome_autorizante}}**, inscrito(a) no CPF sob o nº {{cpf_autorizante}}, telefone {{telefone_autorizante}}, e-mail {{email_autorizante}}, autorizo a **{{nome_empresa}}**, inscrita no CNPJ sob o nº {{cnpj_empresa}}, a utilizar a minha imagem — ou a do(a) menor sob minha responsabilidade, {{nome_menor}} — captada em fotos e vídeos, nos canais indicados abaixo:"
      ),
      dataTable([
        ["Redes sociais", "{{autoriza_redes_sociais}}"],
        ["Site da empresa", "{{autoriza_site}}"],
        ["Material impresso", "{{autoriza_material_impresso}}"],
        ["Prazo da autorização", "{{prazo_autorizacao}}"],
      ]),
      para(""),
      para(
        "A presente autorização é concedida a título gratuito, sem fins comerciais diretos, e abrange o uso em todo o território nacional pelo prazo indicado acima."
      ),
      para(
        "Estou ciente de que posso revogar esta autorização a qualquer momento, mediante comunicação por escrito à {{nome_empresa}}, sem efeito sobre materiais já publicados até a data da revogação."
      ),
      para(
        "Os dados pessoais informados neste termo serão tratados nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018)."
      ),
      para("{{cidade_empresa}}, {{data_assinatura_extenso}}.", { after: 200 }),
      ...signature("{{nome_autorizante}}", "CPF {{cpf_autorizante}}"),
    ],
  }),
};

mkdirSync(OUT, { recursive: true });
for (const [slug, doc] of Object.entries(MODELS)) {
  const buffer = await Packer.toBuffer(doc);
  writeFileSync(join(OUT, `${slug}.docx`), buffer);
  console.log(`✓ ${slug}.docx (${(buffer.length / 1024).toFixed(1)} KB)`);
}
