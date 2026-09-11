/**
 * Modelos prontos: páginas públicas /modelos/[slug] e "Usar este modelo".
 * O .docx de cada um fica em public/modelos/[slug].docx (gerado por
 * packages/documents/scripts/make-models.ts) — as chaves abaixo precisam bater.
 */

export type ModelFieldOverride = {
  label?: string;
  type?: "text" | "textarea" | "select";
  options?: string[];
  required?: boolean;
};

export type DocumentModel = {
  slug: string;
  title: string;
  /** Segmento, para agrupar e para o texto "feito para". */
  segment: string;
  /** Uma frase: o que é e para que serve (meta description e card). */
  summary: string;
  /** Parágrafos da página. */
  intro: string[];
  /** Quando usar (lista curta). */
  uses: string[];
  /** Dados da empresa: viram valor fixo (preenchidos uma vez, não perguntados ao cliente). */
  companyKeys: string[];
  /** Ajustes de pergunta/tipo sobre o que o nome da variável já deduz. */
  fields: Record<string, ModelFieldOverride>;
  /** Respostas de exemplo (preenchem o formulário da página com um clique). */
  sample: Record<string, string>;
};

const YES_NO = ["Sim", "Não"];

export const DOCUMENT_MODELS: DocumentModel[] = [
  {
    slug: "contrato-de-matricula",
    title: "Contrato de matrícula",
    segment: "Escolas e cursos",
    summary:
      "Modelo de contrato de prestação de serviços educacionais: o responsável preenche um link e a escola recebe o contrato em PDF, com valor por extenso e data.",
    intro: [
      "O contrato de matrícula formaliza a relação entre a escola (ou curso) e o responsável financeiro pelo aluno: quem são as partes, qual curso, valor, vencimento e regras de cancelamento.",
      "Com o Submitin, o responsável preenche os dados pelo celular e o contrato chega pronto em PDF — com CPF validado, mensalidade por extenso e data de assinatura automática.",
    ],
    uses: [
      "Matrícula e rematrícula de alunos",
      "Cursos livres, idiomas, música, reforço escolar",
      "Colônia de férias e atividades extracurriculares",
    ],
    companyKeys: ["nome_escola", "cnpj_escola", "endereco_escola", "cidade_escola"],
    fields: {
      nome_escola: { label: "Nome da escola" },
      cnpj_escola: { label: "CNPJ da escola" },
      endereco_escola: { label: "Endereço da escola" },
      cidade_escola: { label: "Cidade da escola" },
      nome_responsavel: { label: "Nome do responsável financeiro" },
      endereco_responsavel: { label: "Endereço do responsável" },
      data_nascimento_aluno: { label: "Data de nascimento do aluno" },
      turno: { label: "Turno", type: "select", options: ["Manhã", "Tarde", "Noite"] },
      data_inicio: { label: "Início das aulas" },
      valor_mensalidade: { label: "Valor da mensalidade" },
      dia_vencimento: { label: "Dia de vencimento da mensalidade" },
      autoriza_uso_de_imagem: { label: "Autoriza o uso da imagem do aluno?" },
      observacoes: { label: "Observações", required: false },
    },
    sample: {
      nome_escola: "Escola Horizonte de Idiomas",
      cnpj_escola: "12.345.678/0001-95",
      endereco_escola: "Rua das Palmeiras, 340 – Centro",
      cidade_escola: "Campinas/SP",
      nome_responsavel: "Carla Almeida Ramos",
      cpf_responsavel: "391.552.810-28",
      endereco_responsavel: "Av. Conceição, 1250, apto 72 – Jardim Paulista",
      cep_responsavel: "13330-120",
      telefone_responsavel: "(19) 98812-4477",
      email_responsavel: "carla.ramos@exemplo.com.br",
      nome_aluno: "Beatriz Almeida Ramos",
      data_nascimento_aluno: "2014-03-14",
      curso: "Inglês Intermediário",
      turno: "Tarde",
      data_inicio: "2027-02-01",
      valor_mensalidade: "389,90",
      dia_vencimento: "10",
      autoriza_uso_de_imagem: "Sim",
      observacoes: "Aluna com alergia a amendoim.",
    },
  },
  {
    slug: "ficha-de-anamnese",
    title: "Ficha de anamnese",
    segment: "Clínicas e estética",
    summary:
      "Modelo de ficha de anamnese: o paciente preenche o histórico de saúde antes da consulta e a clínica recebe a ficha pronta em PDF, com declaração e LGPD.",
    intro: [
      "A ficha de anamnese reúne o histórico de saúde do paciente — alergias, medicamentos, doenças preexistentes e cirurgias — antes de um atendimento ou procedimento.",
      "Mande o link na confirmação do agendamento: o paciente preenche com calma em casa e a ficha já chega em PDF, organizada e com a declaração de veracidade.",
    ],
    uses: [
      "Clínicas de estética e dermatologia",
      "Fisioterapia, nutrição e odontologia",
      "Estúdios de tatuagem, micropigmentação e massagem",
    ],
    companyKeys: ["nome_clinica", "cnpj_clinica", "endereco_clinica", "cidade_clinica"],
    fields: {
      nome_clinica: { label: "Nome da clínica" },
      cnpj_clinica: { label: "CNPJ da clínica" },
      endereco_clinica: { label: "Endereço da clínica" },
      cidade_clinica: { label: "Cidade da clínica" },
      nome_paciente: { label: "Nome completo" },
      cpf_paciente: { label: "CPF" },
      data_nascimento_paciente: { label: "Data de nascimento" },
      profissao_paciente: { label: "Profissão" },
      telefone_paciente: { label: "Telefone" },
      email_paciente: { label: "E-mail" },
      queixa_principal: { label: "Qual o motivo da consulta?", type: "textarea" },
      alergias: { label: "Tem alergias? Quais?", type: "textarea" },
      medicamentos_em_uso: { label: "Usa algum medicamento? Quais?", type: "textarea" },
      doencas_preexistentes: { label: "Tem alguma doença preexistente?", type: "textarea" },
      cirurgias_anteriores: { label: "Já fez alguma cirurgia?", type: "textarea" },
      gestante: {
        label: "Está gestante ou amamentando?",
        type: "select",
        options: ["Não", "Sim", "Não se aplica"],
      },
      observacoes: { label: "Algo mais que devemos saber?", required: false },
      autoriza_uso_de_imagem: { label: "Autoriza o uso de fotos de antes e depois?" },
    },
    sample: {
      nome_clinica: "Clínica Bem Viver",
      cnpj_clinica: "12.345.678/0001-95",
      endereco_clinica: "Rua Harmonia, 88 – Vila Madalena",
      cidade_clinica: "São Paulo/SP",
      nome_paciente: "Mariana Costa Lima",
      cpf_paciente: "391.552.810-28",
      data_nascimento_paciente: "1991-07-22",
      profissao_paciente: "Arquiteta",
      telefone_paciente: "(11) 98877-6655",
      email_paciente: "mariana.lima@exemplo.com.br",
      queixa_principal: "Manchas no rosto após o verão.",
      alergias: "Dipirona.",
      medicamentos_em_uso: "Nenhum.",
      doencas_preexistentes: "Nenhuma.",
      cirurgias_anteriores: "Apendicectomia em 2015.",
      gestante: "Não",
      observacoes: "",
      autoriza_uso_de_imagem: "Não",
    },
  },
  {
    slug: "termo-de-adesao-academia",
    title: "Termo de adesão de academia",
    segment: "Academias e estúdios",
    summary:
      "Modelo de termo de adesão e responsabilidade para academias: plano, valor, vencimento, saúde, uso de imagem e cancelamento — preenchido pelo aluno, entregue em PDF.",
    intro: [
      "O termo de adesão registra o plano escolhido pelo aluno, o valor e o vencimento, além da declaração de saúde, das regras de uso e da política de cancelamento.",
      "O aluno preenche no celular na recepção (ou antes de chegar) e a academia recebe o termo pronto em PDF — com o contato de emergência sempre à mão.",
    ],
    uses: [
      "Academias e boxes de treino",
      "Estúdios de pilates, dança, yoga e lutas",
      "Personal trainers e assessorias esportivas",
    ],
    companyKeys: ["nome_academia", "cnpj_academia", "endereco_academia", "cidade_academia"],
    fields: {
      nome_academia: { label: "Nome da academia" },
      cnpj_academia: { label: "CNPJ da academia" },
      endereco_academia: { label: "Endereço da academia" },
      cidade_academia: { label: "Cidade da academia" },
      nome_aluno: { label: "Nome completo" },
      cpf_aluno: { label: "CPF" },
      data_nascimento_aluno: { label: "Data de nascimento" },
      endereco_aluno: { label: "Endereço" },
      telefone_aluno: { label: "Telefone" },
      email_aluno: { label: "E-mail" },
      nome_contato_emergencia: { label: "Contato de emergência (nome)" },
      telefone_contato_emergencia: { label: "Contato de emergência (telefone)" },
      plano: { label: "Plano", type: "select", options: ["Mensal", "Trimestral", "Semestral", "Anual"] },
      valor_plano: { label: "Valor do plano" },
      dia_vencimento: { label: "Dia de vencimento" },
      observacoes_saude: { label: "Restrições ou condições de saúde", required: false },
      autoriza_uso_de_imagem: { label: "Autoriza o uso da sua imagem nas redes sociais?" },
    },
    sample: {
      nome_academia: "Studio Movimento",
      cnpj_academia: "12.345.678/0001-95",
      endereco_academia: "Av. Brasil, 1500 – Centro",
      cidade_academia: "Curitiba/PR",
      nome_aluno: "Rafael Souza Pinto",
      cpf_aluno: "391.552.810-28",
      data_nascimento_aluno: "1996-11-03",
      endereco_aluno: "Rua XV de Novembro, 210 – Centro",
      telefone_aluno: "(41) 99123-4567",
      email_aluno: "rafael.pinto@exemplo.com.br",
      nome_contato_emergencia: "Ana Souza Pinto",
      telefone_contato_emergencia: "(41) 99876-5432",
      plano: "Trimestral",
      valor_plano: "299,00",
      dia_vencimento: "5",
      observacoes_saude: "Lesão antiga no joelho direito.",
      autoriza_uso_de_imagem: "Sim",
    },
  },
  {
    slug: "contrato-de-prestacao-de-servicos",
    title: "Contrato de prestação de serviços",
    segment: "Prestadores de serviço",
    summary:
      "Modelo de contrato de prestação de serviços: o cliente preenche seus dados, o serviço e o valor saem por extenso e o contrato chega pronto em PDF.",
    intro: [
      "O contrato de prestação de serviços define quem contrata, o que será feito, o prazo, o valor e a forma de pagamento — o básico para evitar mal-entendidos com o cliente.",
      "Envie o link junto com o orçamento aprovado: o cliente confere e preenche os próprios dados, e você recebe o contrato em PDF com o valor por extenso.",
    ],
    uses: [
      "Fotógrafos, designers, agências e freelancers",
      "Reformas, manutenção e instalação",
      "Consultorias, eventos e serviços em geral",
    ],
    companyKeys: ["nome_prestador", "cnpj_prestador", "endereco_prestador", "cidade_prestador"],
    fields: {
      nome_prestador: { label: "Nome da empresa" },
      cnpj_prestador: { label: "CNPJ da empresa" },
      endereco_prestador: { label: "Endereço da empresa" },
      cidade_prestador: { label: "Cidade da empresa" },
      nome_cliente: { label: "Nome completo" },
      cpf_cliente: { label: "CPF" },
      endereco_cliente: { label: "Endereço" },
      cep_cliente: { label: "CEP" },
      telefone_cliente: { label: "Telefone" },
      email_cliente: { label: "E-mail" },
      descricao_servico: { label: "Descrição do serviço" },
      data_entrega: { label: "Data de entrega" },
      valor_servico: { label: "Valor total do serviço" },
      forma_pagamento: {
        label: "Forma de pagamento",
        type: "select",
        options: ["Pix", "Boleto", "Cartão de crédito", "Transferência bancária"],
      },
      observacoes: { label: "Observações", required: false },
    },
    sample: {
      nome_prestador: "Estúdio Clique Fotografia",
      cnpj_prestador: "12.345.678/0001-95",
      endereco_prestador: "Rua das Flores, 45 – Savassi",
      cidade_prestador: "Belo Horizonte/MG",
      nome_cliente: "Lucas Andrade Ferreira",
      cpf_cliente: "391.552.810-28",
      endereco_cliente: "Rua Pernambuco, 1000 – Funcionários",
      cep_cliente: "30130-150",
      telefone_cliente: "(31) 98765-4321",
      email_cliente: "lucas.ferreira@exemplo.com.br",
      descricao_servico: "Cobertura fotográfica de casamento (8 horas), com 400 fotos editadas entregues em galeria online.",
      data_entrega: "2027-03-20",
      valor_servico: "4800,00",
      forma_pagamento: "Pix",
      observacoes: "",
    },
  },
  {
    slug: "autorizacao-de-uso-de-imagem",
    title: "Autorização de uso de imagem",
    segment: "Qualquer negócio",
    summary:
      "Modelo de termo de autorização de uso de imagem: a pessoa escolhe onde autoriza (redes sociais, site, impressos) e por quanto tempo, e o termo chega em PDF.",
    intro: [
      "O termo de autorização de uso de imagem registra o consentimento de quem aparece em fotos e vídeos da sua empresa — e onde esse material pode ser usado.",
      "Em vez de um papel assinado que se perde, a pessoa escolhe cada canal no celular e você guarda o termo em PDF, com data e prazo da autorização.",
    ],
    uses: [
      "Eventos, escolas e academias",
      "Clínicas (antes e depois) e salões",
      "Ensaios, campanhas e depoimentos de clientes",
    ],
    companyKeys: ["nome_empresa", "cnpj_empresa", "cidade_empresa"],
    fields: {
      nome_empresa: { label: "Nome da empresa" },
      cnpj_empresa: { label: "CNPJ da empresa" },
      cidade_empresa: { label: "Cidade da empresa" },
      nome_autorizante: { label: "Seu nome completo" },
      cpf_autorizante: { label: "Seu CPF" },
      telefone_autorizante: { label: "Telefone" },
      email_autorizante: { label: "E-mail" },
      nome_menor: { label: "Nome do menor (se a autorização for para uma criança)", required: false },
      autoriza_redes_sociais: { label: "Autoriza o uso nas redes sociais?", options: YES_NO },
      autoriza_site: { label: "Autoriza o uso no site?", options: YES_NO },
      autoriza_material_impresso: { label: "Autoriza o uso em material impresso?", options: YES_NO },
      prazo_autorizacao: {
        label: "Por quanto tempo?",
        type: "select",
        options: ["1 ano", "2 anos", "5 anos", "Prazo indeterminado"],
      },
    },
    sample: {
      nome_empresa: "Buffet Alegria",
      cnpj_empresa: "12.345.678/0001-95",
      cidade_empresa: "Recife/PE",
      nome_autorizante: "Juliana Moura Santos",
      cpf_autorizante: "391.552.810-28",
      telefone_autorizante: "(81) 99988-7766",
      email_autorizante: "juliana.santos@exemplo.com.br",
      nome_menor: "Pedro Moura Santos",
      autoriza_redes_sociais: "Sim",
      autoriza_site: "Sim",
      autoriza_material_impresso: "Não",
      prazo_autorizacao: "2 anos",
    },
  },
];

export function findModel(slug: string | null | undefined): DocumentModel | null {
  return DOCUMENT_MODELS.find((m) => m.slug === slug) ?? null;
}

export function modelFilePath(slug: string): string {
  return `/modelos/${slug}.docx`;
}
