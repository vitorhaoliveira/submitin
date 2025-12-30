import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  transpilePackages: ["@form-builder/ui", "@form-builder/database", "@form-builder/email"],
};

export default withNextIntl(nextConfig);

