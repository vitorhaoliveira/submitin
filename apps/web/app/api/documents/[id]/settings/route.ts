import { prisma, Prisma } from "@submitin/database";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { customThemeSchema, captchaProviders } from "@/lib/validations";
import { isPaid, isPremium } from "@/lib/stripe";
import { documentErrorResponse, HttpError } from "@/lib/documents/service";

const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();

// Tudo opcional: grava só o que veio (não mexe na entrega — e-mails/webhook).
const settingsSchema = z.object({
  description: optionalText(500),
  requireAcceptance: z.boolean().optional(),
  conversational: z.boolean().optional(),
  thankYouTitle: optionalText(100),
  thankYouMessage: optionalText(500),
  thankYouRedirectUrl: z.string().trim().url("URL de redirecionamento inválida").or(z.literal("")).nullable().optional(),
  // Pro
  hideBranding: z.boolean().optional(),
  customTheme: customThemeSchema.nullable().optional(),
  // Ilimitado
  opensAt: z.string().datetime({ offset: true }).or(z.literal("")).nullable().optional(),
  closesAt: z.string().datetime({ offset: true }).or(z.literal("")).nullable().optional(),
  maxResponses: z.number().int().min(1).max(1_000_000).nullable().optional(),
  closedMessage: optionalText(500),
  captchaEnabled: z.boolean().optional(),
  captchaProvider: z.enum(captchaProviders).nullable().optional(),
  captchaSiteKey: optionalText(100),
  captchaSecretKey: optionalText(100),
});

const PRO_KEYS = ["hideBranding", "customTheme"] as const;
const TOP_KEYS = [
  "opensAt",
  "closesAt",
  "maxResponses",
  "closedMessage",
  "captchaEnabled",
  "captchaProvider",
  "captchaSiteKey",
  "captchaSecretKey",
] as const;

/**
 * PATCH /api/documents/[id]/settings — aparência e comportamento do formulário do
 * documento. Recursos pagos são validados pelo plano no servidor.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) return Response.json({ error: "Não autorizado" }, { status: 401 });

    const parsed = settingsSchema.safeParse(await request.json());
    if (!parsed.success) throw new HttpError(400, parsed.error.errors[0]?.message ?? "Dados inválidos.");
    const input = parsed.data;

    const [document, user] = await Promise.all([
      prisma.document.findFirst({ where: { id, userId: session.user.id }, select: { formId: true } }),
      prisma.user.findUniqueOrThrow({ where: { id: session.user.id }, select: { plan: true } }),
    ]);
    if (!document) throw new HttpError(404, "Documento não encontrado.");

    if (!isPaid(user.plan) && PRO_KEYS.some((k) => input[k] !== undefined && input[k] !== null && input[k] !== false)) {
      throw new HttpError(403, "Tema e remoção do rodapé fazem parte do plano Pro.");
    }
    if (!isPremium(user.plan) && TOP_KEYS.some((k) => input[k] !== undefined && input[k] !== null && input[k] !== "" && input[k] !== false)) {
      throw new HttpError(403, "Prazo, limite de envios e anti-spam fazem parte do plano Ilimitado.");
    }
    if (input.captchaEnabled && (!input.captchaProvider || !input.captchaSiteKey || !input.captchaSecretKey)) {
      throw new HttpError(400, "Para ativar o anti-spam, informe o provedor e as duas chaves.");
    }

    const toDate = (v: string | null | undefined) => (v === undefined ? undefined : v ? new Date(v) : null);
    const blankToNull = (v: string | null | undefined) => (v === undefined ? undefined : v || null);

    const settings: Prisma.FormSettingsUncheckedUpdateInput = {
      conversational: input.conversational,
      thankYouTitle: blankToNull(input.thankYouTitle),
      thankYouMessage: blankToNull(input.thankYouMessage),
      thankYouRedirectUrl: blankToNull(input.thankYouRedirectUrl),
      hideBranding: input.hideBranding,
      customTheme:
        input.customTheme === undefined ? undefined : input.customTheme === null ? Prisma.DbNull : input.customTheme,
      opensAt: toDate(input.opensAt),
      closesAt: toDate(input.closesAt),
      maxResponses: input.maxResponses,
      closedMessage: blankToNull(input.closedMessage),
      captchaEnabled: input.captchaEnabled,
      captchaProvider: blankToNull(input.captchaProvider),
      captchaSiteKey: blankToNull(input.captchaSiteKey),
      captchaSecretKey: blankToNull(input.captchaSecretKey),
    };

    await prisma.$transaction([
      prisma.formSettings.upsert({
        where: { formId: document.formId },
        update: settings,
        create: { ...(settings as Prisma.FormSettingsUncheckedCreateInput), formId: document.formId },
      }),
      ...(input.description !== undefined
        ? [prisma.form.update({ where: { id: document.formId }, data: { description: input.description || null } })]
        : []),
      ...(input.requireAcceptance !== undefined
        ? [prisma.document.update({ where: { id }, data: { requireAcceptance: input.requireAcceptance } })]
        : []),
    ]);
    return Response.json({ success: true });
  } catch (err) {
    return documentErrorResponse(err, "Erro ao salvar as configurações");
  }
}
