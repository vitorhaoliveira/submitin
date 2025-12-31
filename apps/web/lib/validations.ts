import { z } from "zod";

export const fieldTypes = [
  "text",
  "email",
  "number",
  "date",
  "select",
  "checkbox",
] as const;

export type FieldType = (typeof fieldTypes)[number];

export const fieldTypeLabels: Record<FieldType, string> = {
  text: "Texto",
  email: "Email",
  number: "Número",
  date: "Data",
  select: "Múltipla Escolha",
  checkbox: "Checkbox",
};

export const createFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  description: z.string().max(500, "Descrição muito longa").optional(),
});

export const updateFormSchema = createFormSchema.extend({
  published: z.boolean().optional(),
});

export const createFieldSchema = z
  .object({
    type: z.enum(fieldTypes),
    label: z.string().min(1, "Label é obrigatório").max(100, "Label muito longo"),
    placeholder: z.string().max(100, "Placeholder muito longo").optional(),
    required: z.boolean().default(false),
    options: z.array(z.string()).optional(),
  })
  .refine(
    (data) => {
      // Se for select, precisa ter pelo menos uma opção
      if (data.type === "select") {
        return data.options && data.options.length > 0;
      }
      return true;
    },
    {
      message: "Campos de múltipla escolha precisam de pelo menos uma opção",
      path: ["options"],
    }
  );

export const formSettingsSchema = z.object({
  notifyEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  webhookUrl: z.string().url("URL inválida").optional().or(z.literal("")),
});

export type CreateFormInput = z.infer<typeof createFormSchema>;
export type UpdateFormInput = z.infer<typeof updateFormSchema>;
export type CreateFieldInput = z.infer<typeof createFieldSchema>;
export type FormSettingsInput = z.infer<typeof formSettingsSchema>;

// ==========================================
// AUTENTICAÇÃO
// ==========================================

export const passwordSchema = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .regex(/[A-Z]/, "Deve conter letra maiúscula")
  .regex(/[0-9]/, "Deve conter número")
  .regex(/[!@#$%^&*(),.?":{}|<>]/, "Deve conter caractere especial");

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: passwordSchema,
  name: z.string().min(2, "Nome muito curto").max(100, "Nome muito longo").optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

