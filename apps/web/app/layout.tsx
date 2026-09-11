import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Bricolage_Grotesque } from "next/font/google";
import { I18nProvider } from "@/lib/i18n-context";
import { defaultLocale } from "@/i18n/config";
import { cookies } from "next/headers";
import { getDefaultMetadataForLocale } from "@/lib/seo";
import { getLocaleFromCookie } from "@/lib/i18n";
import "./globals.css";
import { Toaster } from "@/components/toaster";
import { SessionProvider } from "@/components/session-provider";
import { Analytics } from "@vercel/analytics/next";

// Fonte display (títulos): grotesca com personalidade.
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromCookie();
  return getDefaultMetadataForLocale(locale);
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
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
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} ${display.variable} font-sans antialiased min-h-screen bg-background`}
      >
        <SessionProvider>
          <I18nProvider initialLocale={locale} initialMessages={messages}>
            {children}
            <Toaster />
            <Analytics />
          </I18nProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
