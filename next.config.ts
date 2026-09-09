import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  // This deployment is intentionally dedicated to the GitHub Pages
  // project URL: /cpm-energie-website/.
  basePath: "/cpm-energie-website",
  images: { unoptimized: true },
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
