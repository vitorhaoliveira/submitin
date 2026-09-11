import { customAlphabet } from "nanoid";

/** Contato de suporte (WhatsApp/ligação). Formato tel: para links. */
export const SUPPORT_PHONE_TEL = "tel:+5511991019367";
/** Número formatado para exibição: (11) 99101-9367 */
export const SUPPORT_PHONE_DISPLAY = "(11) 99101-9367";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 8);

export function generateSlug(): string {
  return nanoid();
}

export function formatDate(date: Date | string, locale = "pt-BR"): string {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatRelativeDate(date: Date | string, locale = "pt"): string {
  const now = new Date();
  const target = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - target.getTime()) / 1000);

  const isPt = locale === "pt";
  
  if (diffInSeconds < 60) return isPt ? "agora mesmo" : "just now";
  if (diffInSeconds < 3600) {
    const mins = Math.floor(diffInSeconds / 60);
    return isPt ? `há ${mins} min` : `${mins} min ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return isPt ? `há ${hours} h` : `${hours} h ago`;
  }
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return isPt ? `há ${days} dias` : `${days} days ago`;
  }
  
  return formatDate(date, locale === "pt" ? "pt-BR" : "en-US");
}

/** Como formatRelativeDate, mas datas antigas saem curtas ("2 jun." / "2 jun. 2025"), sem hora — para listas. */
export function formatRelativeShort(date: Date | string, locale = "pt"): string {
  const target = new Date(date);
  if (Date.now() - target.getTime() < 604800_000) return formatRelativeDate(target, locale);
  const sameYear = target.getFullYear() === new Date().getFullYear();
  return new Intl.DateTimeFormat(locale === "pt" ? "pt-BR" : "en-US", {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
    timeZone: "America/Sao_Paulo",
  })
    .format(target)
    .replace(/ de /g, " ");
}

