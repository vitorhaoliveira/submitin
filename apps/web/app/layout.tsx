import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { I18nProvider } from "@/lib/i18n-context";
import { defaultLocale } from "@/i18n/config";
import { cookies } from "next/headers";
import { getDefaultMetadataForLocale } from "@/lib/seo";
import { getLocaleFromCookie } from "@/lib/i18n";
import "./globals.css";
import { Toaster } from "@/components/toaster";
import { SessionProvider } from "@/components/session-provider";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromCookie();
  return getDefaultMetadataForLocale(locale);
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f172a",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get locale from cookie or use default
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("NEXT_LOCALE")?.value;
  const locale = (localeCookie === "pt" || localeCookie === "en" ? localeCookie : defaultLocale) as typeof defaultLocale;

  // Load messages for the locale
  const messages = (await import(`@/messages/${locale}.json`)).default;

  return (
    <html lang={locale} className="dark">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased min-h-screen bg-gradient-radial`}
      >
        <SessionProvider>
          <I18nProvider initialLocale={locale} initialMessages={messages}>
            {children}
            <Toaster />
          </I18nProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
