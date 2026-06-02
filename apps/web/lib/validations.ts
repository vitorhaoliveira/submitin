import { z } from "zod";

export const fieldTypes = [
  "text",
  "textarea",
  "email",
  "phone",
  "number",
  "date",
  "select",
  "checkbox",
  "rating",
] as const;

export type FieldType = (typeof fieldTypes)[number];

export const fieldTypeLabels: Record<FieldType, string> = {
  text: "Texto",
  textarea: "Texto Longo",
  email: "Email",
  phone: "Telefone",
  number: "Número",
  date: "Data",
  select: "Múltipla Escolha",
  checkbox: "Checkbox",
  rating: "Avaliação (Estrelas)",
};

export const createFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  description: z.string().max(500, "Descrição muito longa").optional(),
});

export const updateFormSchema = createFormSchema.extend({
  published: z.boolean().optional(),
});

// Lógica condicional (PRO): exibir campo conforme a resposta de outro.
export const visibilitySchema = z.object({
  fieldId: z.string().min(1),
  operator: z.enum(["equals", "not_equals"]),
  value: z.string().max(200),
});

export const createFieldSchema = z
  .object({
    type: z.enum(fieldTypes),
    label: z.string().min(1, "Label é obrigatório").max(100, "Label muito longo"),
    placeholder: z
      .string()
      .max(100, "Placeholder muito longo")
      .optional()
      .nullable()
      .transform((v) => v ?? undefined),
    required: z.boolean().default(false),
    options: z
      .array(z.string())
      .optional()
      .nullable()
      .transform((opts) => {
        // Filtra opções vazias ou que contêm apenas espaços; null vira undefined
        if (opts == null) return undefined;
        const filtered = opts.filter((opt) => opt.trim() !== "");
        return filtered.length > 0 ? filtered : undefined;
      }),
    visibility: visibilitySchema
      .optional()
      .nullable()
      .transform((v) => v ?? undefined),
  })
  .refine(
    (data) => {
      // Se for select, precisa ter pelo menos uma opção válida
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

// ==========================================
// CUSTOM THEME
// ==========================================

export const customThemeSchema = z.object({
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida")
    .optional(),
  backgroundColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida")
    .optional(),
  cardBackground: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida")
    .optional(),
  textColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida")
    .optional(),
  accentColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida")
    .optional(),
  borderRadius: z.enum(["none", "sm", "md", "lg", "xl", "full"]).optional(),
});

export type CustomTheme = z.infer<typeof customThemeSchema>;

// ==========================================
// FORM SETTINGS (inclui campos PRO)
// ==========================================

export const captchaProviders = ["turnstile", "hcaptcha"] as const;
export type CaptchaProvider = (typeof captchaProviders)[number];

export const formSettingsSchema = z.object({
  // Notificações
  notifyEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  notifyEmails: z
    .array(z.string().email("Email inválido"))
    .max(10, "Máximo de 10 emails")
    .optional()
    .default([]),
  webhookUrl: z.string().url("URL inválida").optional().or(z.literal("")),

  allowMultipleResponses: z.boolean().optional().default(false),

  // Apresentação: modo conversacional (uma pergunta por vez)
  conversational: z.boolean().optional().default(false),

  // PRO: Agendamento e limites (datas como ISO string ou "")
  opensAt: z.string().optional().or(z.literal("")).nullable(),
  closesAt: z.string().optional().or(z.literal("")).nullable(),
  maxResponses: z.coerce.number().int().min(1).max(1000000).optional().nullable(),
  closedMessage: z.string().max(500, "Mensagem muito longa").optional().or(z.literal("")),
  capturePartials: z.boolean().optional().default(false),

  // Página de obrigado (tela de sucesso)
  thankYouTitle: z.string().max(100, "Título muito longo").optional().or(z.literal("")),
  thankYouMessage: z.string().max(500, "Mensagem muito longa").optional().or(z.literal("")),
  thankYouRedirectUrl: z.string().url("URL inválida").optional().or(z.literal("")),

  // Email de confirmação ao respondente
  confirmationEmail: z.boolean().optional().default(false),

  // PRO: Anti-spam / CAPTCHA
  captchaEnabled: z.boolean().optional().default(false),
  captchaProvider: z.enum(captchaProviders).optional().or(z.literal("")),
  captchaSiteKey: z.string().max(100).optional().or(z.literal("")),
  captchaSecretKey: z.string().max(100).optional().or(z.literal("")),

  // PRO: Branding
  hideBranding: z.boolean().optional().default(false),

  // PRO: Custom Theme
  customTheme: customThemeSchema.optional().nullable(),
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

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Senha atual é obrigatória"),
    newPassword: passwordSchema,
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "A nova senha deve ser diferente da atual",
    path: ["newPassword"],
  });

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token inválido"),
  newPassword: passwordSchema,
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
