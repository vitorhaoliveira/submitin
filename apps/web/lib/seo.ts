import type { Metadata } from "next";
import type { Locale } from "@/i18n/config";

const SITE_NAME = "Submitin";

const DEFAULT_PT = {
  description:
    "Crie formulários personalizados, compartilhe com um link e colete respostas facilmente. Sem código, sem complicação.",
  keywords: [
    "formulários online",
    "criar formulário",
    "pesquisa de satisfação",
    "coleta de respostas",
    "form builder",
    "survey",
    "formulário gratuito",
    "Submitin",
  ],
};

const DEFAULT_EN = {
  description:
    "Build custom forms, share with a link and collect responses easily. No code, no hassle.",
  keywords: [
    "online forms",
    "form builder",
    "survey",
    "create form",
    "collect responses",
    "Submitin",
  ],
};

const DEFAULT_DESCRIPTION = DEFAULT_PT.description;
const DEFAULT_KEYWORDS = DEFAULT_PT.keywords;

/**
 * Base URL do site (para canonical, og:image, etc.).
 * Usa AUTH_URL em produção ou NEXT_PUBLIC_APP_URL se definido.
 */
export function getBaseUrl(): string {
  if (typeof process.env.NEXT_PUBLIC_APP_URL === "string" && process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (typeof process.env.AUTH_URL === "string" && process.env.AUTH_URL) {
    return process.env.AUTH_URL.replace(/\/$/, "");
  }
  return "https://submitin.com";
}

export function getSiteName() {
  return SITE_NAME;
}

export function getDefaultDescription() {
  return DEFAULT_DESCRIPTION;
}

export function getDefaultKeywords() {
  return DEFAULT_KEYWORDS;
}

export function getDefaultDescriptionForLocale(locale: Locale): string {
  return locale === "en" ? DEFAULT_EN.description : DEFAULT_PT.description;
}

export function getDefaultKeywordsForLocale(locale: Locale): string[] {
  return locale === "en" ? DEFAULT_EN.keywords : DEFAULT_PT.keywords;
}

/**
 * Metadata padrão do site por idioma (para layout raiz com cookie de locale).
 */
export function getDefaultMetadataForLocale(locale: Locale): Metadata {
  const baseUrl = getBaseUrl();
  const description = getDefaultDescriptionForLocale(locale);
  const keywords = getDefaultKeywordsForLocale(locale);
  const ogLocale = locale === "en" ? "en_US" : "pt_BR";

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: SITE_NAME,
      template: `%s | ${SITE_NAME}`,
    },
    description,
    keywords,
    authors: [{ name: SITE_NAME, url: baseUrl }],
    creator: SITE_NAME,
    applicationName: SITE_NAME,
    referrer: "origin-when-cross-origin",
    icons: {
      icon: "/icon.svg",
      apple: "/apple-icon.svg",
    },
    openGraph: {
      type: "website",
      locale: ogLocale,
      url: baseUrl,
      siteName: SITE_NAME,
      title: SITE_NAME,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_NAME,
      description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
    verification: {},
  };
}

interface BuildMetadataParams {
  title: string;
  description?: string | null;
  keywords?: string[];
  image?: string | null;
  path?: string;
  noIndex?: boolean;
  locale?: string;
}

/**
 * Constrói metadata completa com Open Graph e Twitter.
 */
export function buildMetadata({
  title,
  description,
  keywords = DEFAULT_KEYWORDS,
  image,
  path = "",
  noIndex = false,
  locale = "pt_BR",
}: BuildMetadataParams): Metadata {
  const baseUrl = getBaseUrl();
  const url = path ? `${baseUrl}${path.startsWith("/") ? path : `/${path}`}` : baseUrl;
  const desc = description ?? DEFAULT_DESCRIPTION;
  const imageUrl = image
    ? (image.startsWith("http") ? image : `${baseUrl}${image.startsWith("/") ? image : `/${image}`}`)
    : `${baseUrl}/og.png`;

  const metadata: Metadata = {
    title,
    description: desc,
    keywords: keywords.length ? keywords : undefined,
    authors: [{ name: SITE_NAME, url: baseUrl }],
    openGraph: {
      type: "website",
      locale: locale === "en" || locale === "en_US" ? "en_US" : "pt_BR",
      url,
      siteName: SITE_NAME,
      title,
      description: desc,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: [imageUrl],
    },
    alternates: {
      canonical: url,
    },
  };

  if (noIndex) {
    metadata.robots = {
      index: false,
      follow: false,
      noarchive: true,
    };
  }

  return metadata;
}

/**
 * Metadata padrão do site (layout raiz).
 */
export const defaultMetadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: DEFAULT_KEYWORDS,
  authors: [{ name: SITE_NAME, url: getBaseUrl() }],
  creator: SITE_NAME,
  applicationName: SITE_NAME,
  referrer: "origin-when-cross-origin",
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.svg",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: getBaseUrl(),
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  verification: {
    // Adicione quando tiver: google: "código",
    // yandex: "código",
  },
};
