import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { NextIntlClientProvider } from "next-intl";
import { defaultLocale } from "@/i18n/config";
import "./globals.css";
import { Toaster } from "@/components/toaster";

export const metadata: Metadata = {
  title: {
    default: "Form Builder",
    template: "%s | Form Builder",
  },
  description:
    "Crie formulários personalizados, compartilhe links públicos e colete respostas facilmente.",
  keywords: ["form builder", "formulários", "forms", "pesquisa", "survey"],
  authors: [{ name: "Vitor Hugo" }],
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.svg",
  },
};

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
  // Load messages directly without middleware
  const messages = (await import(`@/messages/${defaultLocale}.json`)).default;

  return (
    <html lang={defaultLocale} className="dark">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased min-h-screen bg-gradient-radial`}
      >
        <NextIntlClientProvider messages={messages} locale={defaultLocale}>
          {children}
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

