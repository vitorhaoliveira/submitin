import type { NextConfig } from "next";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { PrismaPlugin } = require("@prisma/nextjs-monorepo-workaround-plugin");

const nextConfig: NextConfig = {
  transpilePackages: ["@submitin/ui", "@submitin/database", "@submitin/email", "@submitin/config"],

  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins = config.plugins ?? [];
      config.plugins.push(new PrismaPlugin());
    }
    return config;
  },
};

export default nextConfig;
