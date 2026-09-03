import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: "/cpm-energie-website",
  assetPrefix: "/cpm-energie-website/",
  images: { unoptimized: true },
};

export default nextConfig;
