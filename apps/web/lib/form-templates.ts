import type { FieldType } from "./validations";

export interface TemplateField {
  type: FieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
}

export interface FormTemplate {
  /** id estável (usado em analytics / chave React) */
  id: string;
  /** nome do ícone lucide, resolvido na UI */
  icon: string;
  name: string;
  description: string;
  fields: TemplateField[];
}

type Locale = "pt" | "en";

const TEMPLATES_PT: FormTemplate[] = [
  {
    id: "contact",
    icon: "MessageSquare",
    name: "Formulário de contato",
    description: "Receba mensagens e dúvidas de visitantes do seu site.",
    fields: [
      { type: "text", label: "Nome", placeholder: "Seu nome", required: true },
      { type: "email", label: "Email", placeholder: "voce@email.com", required: true },
      { type: "phone", label: "Telefone / WhatsApp", placeholder: "(11) 99999-9999" },
      { type: "textarea", label: "Mensagem", placeholder: "Como podemos ajudar?", required: true },
    ],
  },
  {
    id: "event",
    icon: "CalendarDays",
    name: "Inscrição de evento",
    description: "Colete inscrições e confirmações de presença.",
    fields: [
      { type: "text", label: "Nome completo", placeholder: "Seu nome", required: true },
      { type: "email", label: "Email", placeholder: "voce@email.com", required: true },
      { type: "phone", label: "Telefone", placeholder: "(11) 99999-9999", required: true },
      { type: "number", label: "Quantas pessoas?", placeholder: "1" },
      {
        type: "select",
        label: "Restrição alimentar",
        required: true,
        options: ["Nenhuma", "Vegetariano", "Vegano", "Sem glúten"],
      },
    ],
  },
  {
    id: "satisfaction",
    icon: "Star",
    name: "Pesquisa de satisfação",
    description: "Saiba o que seus clientes acharam do atendimento.",
    fields: [
      { type: "rating", label: "Como você avalia sua experiência?", required: true },
      { type: "textarea", label: "O que podemos melhorar?", placeholder: "Sua opinião" },
      {
        type: "select",
        label: "Você nos recomendaria?",
        required: true,
        options: ["Com certeza", "Talvez", "Não"],
      },
      { type: "email", label: "Email (opcional)", placeholder: "voce@email.com" },
    ],
  },
  {
    id: "order",
    icon: "ShoppingBag",
    name: "Pedido / Orçamento",
    description: "Receba pedidos e solicitações de orçamento.",
    fields: [
      { type: "text", label: "Nome", placeholder: "Seu nome", required: true },
      { type: "phone", label: "WhatsApp", placeholder: "(11) 99999-9999", required: true },
      {
        type: "select",
        label: "O que você precisa?",
        required: true,
        options: ["Produto", "Serviço", "Orçamento"],
      },
      { type: "textarea", label: "Detalhes do pedido", placeholder: "Descreva o que você precisa" },
      { type: "email", label: "Email", placeholder: "voce@email.com" },
    ],
  },
  {
    id: "waitlist",
    icon: "ListChecks",
    name: "Lista de espera",
    description: "Capte interessados antes do lançamento.",
    fields: [
      { type: "text", label: "Nome", placeholder: "Seu nome", required: true },
      { type: "email", label: "Email", placeholder: "voce@email.com", required: true },
    ],
  },
];

const TEMPLATES_EN: FormTemplate[] = [
  {
    id: "contact",
    icon: "MessageSquare",
    name: "Contact form",
    description: "Receive messages and questions from your website visitors.",
    fields: [
      { type: "text", label: "Name", placeholder: "Your name", required: true },
      { type: "email", label: "Email", placeholder: "you@email.com", required: true },
      { type: "phone", label: "Phone / WhatsApp", placeholder: "+1 555 000 0000" },
      { type: "textarea", label: "Message", placeholder: "How can we help?", required: true },
    ],
  },
  {
    id: "event",
    icon: "CalendarDays",
    name: "Event registration",
    description: "Collect registrations and RSVPs.",
    fields: [
      { type: "text", label: "Full name", placeholder: "Your name", required: true },
      { type: "email", label: "Email", placeholder: "you@email.com", required: true },
      { type: "phone", label: "Phone", placeholder: "+1 555 000 0000", required: true },
      { type: "number", label: "How many people?", placeholder: "1" },
      {
        type: "select",
        label: "Dietary restriction",
        required: true,
        options: ["None", "Vegetarian", "Vegan", "Gluten-free"],
      },
    ],
  },
  {
    id: "satisfaction",
    icon: "Star",
    name: "Satisfaction survey",
    description: "Find out what your customers think of your service.",
    fields: [
      { type: "rating", label: "How do you rate your experience?", required: true },
      { type: "textarea", label: "What can we improve?", placeholder: "Your feedback" },
      {
        type: "select",
        label: "Would you recommend us?",
        required: true,
        options: ["Definitely", "Maybe", "No"],
      },
      { type: "email", label: "Email (optional)", placeholder: "you@email.com" },
    ],
  },
  {
    id: "order",
    icon: "ShoppingBag",
    name: "Order / Quote",
    description: "Receive orders and quote requests.",
    fields: [
      { type: "text", label: "Name", placeholder: "Your name", required: true },
      { type: "phone", label: "WhatsApp", placeholder: "+1 555 000 0000", required: true },
      {
        type: "select",
        label: "What do you need?",
        required: true,
        options: ["Product", "Service", "Quote"],
      },
      { type: "textarea", label: "Order details", placeholder: "Describe what you need" },
      { type: "email", label: "Email", placeholder: "you@email.com" },
    ],
  },
  {
    id: "waitlist",
    icon: "ListChecks",
    name: "Waitlist",
    description: "Capture interested people before launch.",
    fields: [
      { type: "text", label: "Name", placeholder: "Your name", required: true },
      { type: "email", label: "Email", placeholder: "you@email.com", required: true },
    ],
  },
];

export function getFormTemplates(locale: Locale): FormTemplate[] {
  return locale === "en" ? TEMPLATES_EN : TEMPLATES_PT;
}
