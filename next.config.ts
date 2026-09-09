import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  // The same GitHub Pages artifact is served on both the custom domain and
  // the repository URL. Keep the build root-relative, then create a
  // /cpm-energie-website/ mirror in the deployment step for the project URL.
  basePath: "",
  images: { unoptimized: true },
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
