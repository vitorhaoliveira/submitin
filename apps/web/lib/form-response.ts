import { prisma } from "@submitin/database";
import { sendEmail } from "@submitin/email";
import { NewResponseEmail } from "@submitin/email/templates/new-response";
import { ResponseConfirmationEmail } from "@submitin/email/templates/response-confirmation";
import {
  sanitizeFormValues,
  isValidEmail,
  MAX_FIELD_VALUE_LENGTH,
  MAX_RESPONSES_PER_FORM,
} from "@/lib/security";
import { computeVisibleFieldIds, parseVisibility } from "@/lib/field-visibility";
import { getFormAvailability } from "@/lib/form-availability";

type FormField = {
  id: string;
  label: string;
  type: string;
  required: boolean;
  visibility?: unknown;
};

type FormWithRelations = {
  id: string;
  name: string;
  fields: FormField[];
  settings: {
    notifyEmail: string | null;
    notifyEmails: string[];
    webhookUrl: string | null;
    confirmationEmail?: boolean | null;
    thankYouMessage?: string | null;
    opensAt?: Date | string | null;
    closesAt?: Date | string | null;
    maxResponses?: number | null;
    closedMessage?: string | null;
  } | null;
  _count: { responses: number };
};

/**
 * Mapeia valores enviados por nome/label do campo (ex.: Framer, integrações)
 * para o formato interno (fieldId → value). Comparação por label normalizada
 * (trim + lowercase) para tolerar diferenças de capitalização e espaços.
 */
export function mapValuesByLabelToFieldIds(
  fields: FormField[],
  rawValues: Record<string, string>
): Record<string, string> {
  const normalizedToFieldId = new Map<string, string>();
  for (const field of fields) {
    const key = field.label.trim().toLowerCase();
    if (!normalizedToFieldId.has(key)) {
      normalizedToFieldId.set(key, field.id);
    }
  }

  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(rawValues)) {
    const normalized = String(key).trim().toLowerCase();
    const fieldId = normalizedToFieldId.get(normalized);
    if (fieldId && value !== undefined && value !== null) {
      result[fieldId] = String(value).trim();
    }
  }
  return result;
}

/**
 * Valida e cria uma resposta no formulário; envia emails e webhook se configurados.
 * valuesByFieldId deve ter chaves = id dos campos do form.
 */
export async function createFormResponse(
  form: FormWithRelations,
  valuesByFieldId: Record<string, string>,
  /** Se enviado, converte a resposta parcial deste id em completa (sem duplicar). */
  partialId?: string | null
) {
  if (form._count.responses >= MAX_RESPONSES_PER_FORM) {
    throw { status: 403, message: "Este formulário atingiu o limite máximo de respostas." };
  }

  // PRO: Agendamento e limites — bloqueia envio fora da janela/limite definidos.
  const availability = getFormAvailability(form.settings, form._count.responses);
  if (!availability.isOpen) {
    const message =
      availability.reason === "scheduled"
        ? "Este formulário ainda não está aceitando respostas."
        : form.settings?.closedMessage || "Este formulário não está mais aceitando respostas.";
    throw { status: 403, message };
  }

  const values = sanitizeFormValues(valuesByFieldId);
  const validFieldIds = new Set(form.fields.map((f) => f.id));

  // Lógica condicional: campos ocultos não são validados nem persistidos.
  const visibleIds = computeVisibleFieldIds(
    form.fields.map((f) => ({ id: f.id, visibility: parseVisibility(f.visibility) })),
    values
  );

  for (const field of form.fields) {
    if (!visibleIds.has(field.id)) continue;

    const value = values[field.id];

    if (field.required && !value) {
      throw { status: 400, message: `Campo "${field.label}" é obrigatório` };
    }

    if (value && value.length > MAX_FIELD_VALUE_LENGTH) {
      throw { status: 400, message: `Campo "${field.label}" excede o tamanho máximo` };
    }

    if (field.type === "email" && value && !isValidEmail(value)) {
      throw { status: 400, message: `Email inválido no campo "${field.label}"` };
    }
  }

  const fieldValuesCreate = Object.entries(values)
    .filter(([fieldId, value]) => value && validFieldIds.has(fieldId) && visibleIds.has(fieldId))
    .map(([fieldId, value]) => ({ fieldId, value: String(value) }));

  // Se há uma parcial deste lead, converte em completa (substitui os valores)
  // em vez de criar uma nova resposta — evita lead duplicado.
  const existingPartial = partialId
    ? await prisma.response.findFirst({
        where: { id: partialId, formId: form.id, partial: true },
        select: { id: true },
      })
    : null;

  const response = existingPartial
    ? await prisma.$transaction(async (tx) => {
        await tx.fieldValue.deleteMany({ where: { responseId: existingPartial.id } });
        return tx.response.update({
          where: { id: existingPartial.id },
          data: {
            partial: false,
            submittedAt: new Date(),
            fieldValues: { create: fieldValuesCreate },
          },
          include: { fieldValues: true },
        });
      })
    : await prisma.response.create({
        data: {
          formId: form.id,
          fieldValues: { create: fieldValuesCreate },
        },
        include: { fieldValues: true },
      });

  const emailsToNotify: string[] = [];
  if (form.settings?.notifyEmail) {
    emailsToNotify.push(form.settings.notifyEmail);
  }
  if (form.settings?.notifyEmails?.length) {
    for (const email of form.settings.notifyEmails) {
      if (email && !emailsToNotify.includes(email)) emailsToNotify.push(email);
    }
  }

  if (emailsToNotify.length > 0) {
    const baseUrl = process.env.AUTH_URL || "http://localhost:3000";
    const emailPromises = emailsToNotify.map(async (email) => {
      try {
        await sendEmail({
          to: email,
          subject: `Nova resposta em ${form.name}`,
          react: NewResponseEmail({
            formName: form.name,
            formUrl: `${baseUrl}/dashboard/forms/${form.id}/responses`,
            responseCount: form._count.responses + 1,
            submittedAt: new Date().toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            }),
          }),
        });
        return { email, success: true };
      } catch (err) {
        console.error(`Falha ao enviar email para ${email}:`, err);
        return { email, success: false };
      }
    });
    await Promise.allSettled(emailPromises);
  }

  // Email de confirmação ao respondente (se ativado e houver um campo de email preenchido)
  if (form.settings?.confirmationEmail) {
    const emailField = form.fields.find((f) => f.type === "email");
    const respondentEmail = emailField ? values[emailField.id] : undefined;
    if (respondentEmail && isValidEmail(respondentEmail)) {
      try {
        await sendEmail({
          to: respondentEmail,
          subject: `Recebemos sua resposta — ${form.name}`,
          react: ResponseConfirmationEmail({
            formName: form.name,
            customMessage: form.settings.thankYouMessage || undefined,
            submittedAt: new Date().toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            }),
          }),
        });
      } catch (err) {
        console.error(`Falha ao enviar confirmação para ${respondentEmail}:`, err);
      }
    }
  }

  if (form.settings?.webhookUrl) {
    try {
      await fetch(form.settings.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formId: form.id,
          formName: form.name,
          responseId: response.id,
          submittedAt: response.submittedAt,
          values,
        }),
      });
    } catch (err) {
      console.error("Falha ao enviar webhook:", err);
    }
  }

  return response;
}
