import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const isGitHubPages = process.env.GITHUB_PAGES === "true";

export default function robots(): MetadataRoute.Robots {
  if (isGitHubPages) {
    return {
      rules: { userAgent: "*", disallow: "/" },
    };
  }

  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://cpm-energie.de/sitemap.xml",
  };
}
