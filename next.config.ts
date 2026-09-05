import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: "/cpm-energie-website",
  images: { unoptimized: true },
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@/lib/bill-analysis-v3": path.resolve(__dirname, "lib/bill-analysis-smart.ts"),
    };
    return config;
  },
};

export default nextConfig;
