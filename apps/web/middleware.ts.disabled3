import createMiddleware from "next-intl/middleware";

const intlMiddleware = createMiddleware({
  locales: ["pt", "en"],
  defaultLocale: "pt",
  localePrefix: "never",
});

export default intlMiddleware;

export const config = {
  matcher: ["/", "/((?!api|_next|_vercel|.*\\..*).*)"],
};

