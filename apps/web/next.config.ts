import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@submitin/ui", "@submitin/database", "@submitin/email", "@submitin/config"],
};

export default nextConfig;

