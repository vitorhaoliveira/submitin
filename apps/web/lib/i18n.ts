import { defaultLocale, type Locale } from "@/i18n/config";
import { cookies } from "next/headers";

export type Messages = Record<string, any>;

const messageCache: Record<Locale, Messages | null> = {
  pt: null,
  en: null,
};

export async function getLocaleFromCookie(): Promise<Locale> {
  try {
    const cookieStore = await cookies();
    const localeCookie = cookieStore.get("NEXT_LOCALE")?.value;
    const locale = (localeCookie === "pt" || localeCookie === "en" ? localeCookie : defaultLocale) as Locale;
    return locale;
  } catch (error) {
    // If cookies() fails, return default locale
    return defaultLocale;
  }
}

export async function getMessages(locale?: Locale): Promise<Messages> {
  const targetLocale = locale || (await getLocaleFromCookie());
  
  if (messageCache[targetLocale]) {
    return messageCache[targetLocale]!;
  }
  
  const messages = (await import(`@/messages/${targetLocale}.json`)).default;
  messageCache[targetLocale] = messages;
  return messages;
}

export async function getTranslations(namespace?: string) {
  const locale = await getLocaleFromCookie();
  const messages = await getMessages(locale);
  
  return (key: string): string => {
    if (namespace) {
      // Access nested keys like "nav.login" in namespace "landing"
      const namespaceMessages = messages[namespace] as Record<string, any> | undefined;
      if (namespaceMessages) {
        const keys = key.split(".");
        let value: any = namespaceMessages;
        for (const k of keys) {
          value = value?.[k];
          if (value === undefined) break;
        }
        return typeof value === "string" ? value : key;
      }
    }
    
    // Try nested access from root (e.g., "landing.nav.login")
    const keys = key.split(".");
    let value: any = messages;
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) break;
    }
    
    return typeof value === "string" ? value : key;
  };
}

