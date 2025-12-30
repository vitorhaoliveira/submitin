import { defaultLocale } from "@/i18n/config";

type Messages = Record<string, any>;

let cachedMessages: Messages | null = null;

export async function getMessages(): Promise<Messages> {
  if (cachedMessages) {
    return cachedMessages;
  }
  
  const messages = (await import(`@/messages/${defaultLocale}.json`)).default;
  cachedMessages = messages;
  return messages;
}

export async function getTranslations(namespace?: string) {
  const messages = await getMessages();
  
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

