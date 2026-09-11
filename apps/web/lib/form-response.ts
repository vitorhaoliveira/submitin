import { prisma } from "@submitin/database";
import { sendEmail } from "@submitin/email";
import { NewResponseEmail } from "@submitin/email/templates/new-response";
import { ResponseConfirmationEmail } from "@submitin/email/templates/response-confirmation";
import {
  sanitizeFormValues,
  isValidEmail,
  MAX_FIELD_VALUE_LENGTH,
} from "@/lib/security";
import { computeVisibleFieldIds, parseVisibility } from "@/lib/field-visibility";
import { getFormAvailability } from "@/lib/form-availability";
import { validateMaskedField } from "@submitin/documents/input";
import { parseCurrency } from "@submitin/documents/format";
import { enqueueDocumentGeneration } from "@/lib/documents/generation";
import { activeTemplateKeys, resolveNatures } from "@/lib/documents/natures";
import { monthlyResponseQuotaReached } from "@/lib/response-quota";

const MASKED_FIELD_ERRORS = {
  invalidCpf: "CPF inválido",
  invalidCnpj: "CNPJ inválido",
  invalidCep: "CEP inválido",
} as const;

type FormField = {
  id: string;
  label: string;
  type: string;
  required: boolean;
  visibility?: unknown;
  /** Documentos: pergunta | fixa | pre_preenchida | automatica. */
  nature?: string;
  defaultValue?: string | null;
  variableKey?: string | null;
};

type ClaimedInvite = { id: string };

/** Valores do link personalizado ({ fieldId: valor }), se o token for válido e não usado. */
export async function findUsableInvite(formId: string, token: string) {
  const invite = await prisma.formInvite.findUnique({ where: { token } });
  if (!invite || invite.formId !== formId) {
    throw { status: 404, message: "Link inválido. Peça um novo link a quem te enviou." };
  }
  if (invite.usedAt) {
    throw { status: 410, message: "Este link já foi usado. Peça um novo link a quem te enviou." };
  }
  return { id: invite.id, values: (invite.values ?? {}) as Record<string, string> };
}

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
  userId: string;
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
 * Valida o envio e monta os valores a gravar (respostas + fixas, automáticas e
 * pré-preenchidas). Usado pelo envio e pelo preview do documento, que precisam
 * validar exatamente igual. Lança { status, message } em caso de erro.
 */
export async function prepareSubmission(
  form: FormWithRelations,
  valuesByFieldId: Record<string, string>,
  inviteToken?: string | null
) {
  // Documento: limite é de documentos/mês (na geração). Formulário avulso: respostas/mês do plano.
  const document = await prisma.document.findUnique({
    where: { formId: form.id },
    select: { templates: { orderBy: { version: "desc" }, take: 1, select: { variables: true } } },
  });
  if (!document) {
    const owner = await prisma.user.findUnique({ where: { id: form.userId }, select: { plan: true } });
    if (await monthlyResponseQuotaReached(form.userId, owner?.plan)) {
      throw {
        status: 403,
        message: "Este formulário atingiu o limite de respostas do mês. Tente novamente mais tarde.",
      };
    }
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

  // Só os campos perguntados vêm do respondente; fixa, automática e pré-preenchida
  // (pelo link) são definidas aqui e não podem ser sobrescritas.
  const invite = inviteToken ? await findUsableInvite(form.id, inviteToken) : null;
  const { locked, askedIds } = resolveNatures(
    form.fields,
    invite?.values,
    new Date(),
    activeTemplateKeys(document?.templates[0]?.variables)
  );
  const clientValues = sanitizeFormValues(valuesByFieldId);
  for (const id of Object.keys(clientValues)) if (!askedIds.has(id)) delete clientValues[id];
  const lockedValues = sanitizeFormValues(locked);
  const values = { ...clientValues, ...lockedValues };
  const lockedIds = new Set(Object.keys(lockedValues));
  const validFieldIds = new Set(form.fields.map((f) => f.id));

  // Lógica condicional: campos ocultos não são validados nem persistidos.
  const visibleIds = computeVisibleFieldIds(
    form.fields.map((f) => ({ id: f.id, visibility: parseVisibility(f.visibility) })),
    values
  );

  for (const field of form.fields) {
    // Só valida o que o respondente preenche.
    if (!visibleIds.has(field.id) || !askedIds.has(field.id)) continue;

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

    const maskedError = value ? validateMaskedField(field.type, value) : null;
    if (maskedError) {
      throw {
        status: 400,
        message: `${MASKED_FIELD_ERRORS[maskedError]} no campo "${field.label}"`,
      };
    }

    if (field.type === "day" && value && !/^(0?[1-9]|[12]\d|3[01])$/.test(value.trim())) {
      throw { status: 400, message: `Informe um dia entre 1 e 31 no campo "${field.label}"` };
    }

    if (field.type === "percent" && value && !/^\d+([.,]\d+)?%?$/.test(value.trim())) {
      throw { status: 400, message: `Percentual inválido no campo "${field.label}"` };
    }

    if (field.type === "currency" && value && parseCurrency(value) === null) {
      throw { status: 400, message: `Valor inválido no campo "${field.label}"` };
    }
  }

  const fieldValuesCreate = Object.entries(values)
    .filter(
      ([fieldId, value]) =>
        value && validFieldIds.has(fieldId) && (visibleIds.has(fieldId) || lockedIds.has(fieldId))
    )
    .map(([fieldId, value]) => ({ fieldId, value: String(value) }));

  return { invite, values, fieldValuesCreate };
}

/**
 * Valida e cria uma resposta no formulário; envia emails e webhook se configurados.
 * valuesByFieldId deve ter chaves = id dos campos do form.
 */
export async function createFormResponse(
  form: FormWithRelations,
  valuesByFieldId: Record<string, string>,
  /** Se enviado, converte a resposta parcial deste id em completa (sem duplicar). */
  partialId?: string | null,
  /** Token do link personalizado (campos já preenchidos pela empresa). */
  inviteToken?: string | null,
  /** Preview do documento que o respondente conferiu (reaproveitado na geração). */
  previewId?: string | null
) {
  const { invite, values, fieldValuesCreate } = await prepareSubmission(
    form,
    valuesByFieldId,
    inviteToken
  );

  // Link de uso único: reclama antes de gravar; libera se a gravação falhar.
  let claimed: ClaimedInvite | null = null;
  if (invite) {
    const { count } = await prisma.formInvite.updateMany({
      where: { id: invite.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    if (count === 0) {
      throw { status: 410, message: "Este link já foi usado. Peça um novo link a quem te enviou." };
    }
    claimed = { id: invite.id };
  }

  // Se há uma parcial deste lead, converte em completa (substitui os valores)
  // em vez de criar uma nova resposta — evita lead duplicado.
  const existingPartial = partialId
    ? await prisma.response.findFirst({
        where: { id: partialId, formId: form.id, partial: true },
        select: { id: true },
      })
    : null;

  let response;
  try {
    response = existingPartial
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
  } catch (err) {
    if (claimed) {
      await prisma.formInvite
        .update({ where: { id: claimed.id }, data: { usedAt: null } })
        .catch(() => {});
    }
    throw err;
  }

  if (claimed) {
    await prisma.formInvite.update({
      where: { id: claimed.id },
      data: { responseId: response.id },
    });
  }

  // Formulário de documento: a entrega (e-mail com PDF + webhook) acontece após a
  // geração assíncrona do documento, não aqui.
  const generation = await enqueueDocumentGeneration(form.id, response.id, previewId);
  if (generation) return response;

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
