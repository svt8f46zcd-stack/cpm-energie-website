import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  // Build root-relative files, then publish an exact /cpm-energie-website/
  // mirror for the GitHub Pages project site.
  basePath: "",
  images: { unoptimized: true },
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
