import type { FieldType } from "./validations";

/** Chave do rascunho do construtor sem login (localStorage). */
export const GUEST_DRAFT_KEY = "submitin_guest_draft";

/** Janela em que um rascunho pendente ainda é reivindicado após o cadastro. */
export const GUEST_DRAFT_CLAIM_TTL_MS = 24 * 60 * 60 * 1000; // 24h

export interface DraftField {
  type: FieldType;
  label: string;
  placeholder?: string | null;
  required: boolean;
  options?: string[] | null;
}

export interface GuestDraft {
  name: string;
  description?: string | null;
  fields: DraftField[];
  /** Momento do último save (ms). Usado para expirar rascunhos antigos. */
  savedAt?: number;
  /**
   * Só fica `true` quando o visitante REALMENTE tentou salvar/publicar
   * (ação intencional). Rascunhos apenas auto-salvos enquanto edita NÃO são
   * reivindicados no login — evita "salvar" um form que o usuário nunca quis.
   */
  pendingClaim?: boolean;
}

/**
 * Auto-save do construtor visitante. Mantém o rascunho atualizado, mas NÃO
 * marca como pronto para reivindicar (preserva o flag já existente, se houver).
 */
export function saveGuestDraft(draft: GuestDraft) {
  try {
    const existing = readGuestDraft();
    const payload: GuestDraft = {
      ...draft,
      savedAt: Date.now(),
      pendingClaim: draft.pendingClaim ?? existing?.pendingClaim ?? false,
    };
    localStorage.setItem(GUEST_DRAFT_KEY, JSON.stringify(payload));
  } catch {
    /* storage indisponível */
  }
}

/**
 * Marca o rascunho como intencional (chamado ao salvar/publicar como visitante).
 * A partir daqui ele será reivindicado uma única vez após o cadastro/login.
 */
export function saveGuestDraftForClaim(draft: GuestDraft) {
  try {
    const payload: GuestDraft = {
      ...draft,
      savedAt: Date.now(),
      pendingClaim: true,
    };
    localStorage.setItem(GUEST_DRAFT_KEY, JSON.stringify(payload));
  } catch {
    /* storage indisponível */
  }
}

export function readGuestDraft(): GuestDraft | null {
  try {
    const raw = localStorage.getItem(GUEST_DRAFT_KEY);
    return raw ? (JSON.parse(raw) as GuestDraft) : null;
  } catch {
    return null;
  }
}

/** True somente para rascunhos intencionais e dentro da janela de validade. */
export function isClaimableDraft(draft: GuestDraft | null): draft is GuestDraft {
  return (
    !!draft &&
    Array.isArray(draft.fields) &&
    draft.fields.length > 0 &&
    draft.pendingClaim === true &&
    typeof draft.savedAt === "number" &&
    Date.now() - draft.savedAt < GUEST_DRAFT_CLAIM_TTL_MS
  );
}

export function clearGuestDraft() {
  try {
    localStorage.removeItem(GUEST_DRAFT_KEY);
  } catch {
    /* ignore */
  }
}
