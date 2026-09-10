import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  ...(isGitHubPages
    ? {
        output: "export" as const,
        basePath: "/cpm-energie-website",
        assetPrefix: "/cpm-energie-website/",
      }
    : {}),
  env: {
    NEXT_PUBLIC_GITHUB_PAGES: isGitHubPages ? "true" : "false",
  },
  trailingSlash: true,
  images: { unoptimized: true },
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
