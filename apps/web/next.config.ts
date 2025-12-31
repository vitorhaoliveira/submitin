import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  transpilePackages: [
    "@submitin/ui",
    "@submitin/database",
    "@submitin/email",
    "@submitin/config",
  ],

  outputFileTracingRoot: path.join(__dirname, "../.."),
};

export default nextConfig;
