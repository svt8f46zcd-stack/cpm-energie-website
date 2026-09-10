import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const isGitHubPages = process.env.GITHUB_PAGES === "true";

export default function sitemap(): MetadataRoute.Sitemap {
  if (isGitHubPages) return [];

  const base = "https://cpm-energie.de";
  return [
    "/",
    "/ersparnisrechner",
    "/so-funktionierts",
    "/ueber-mich",
    "/kontakt",
    "/impressum",
    "/datenschutz",
  ].map((path) => ({
    url: `${base}${path}/`,
    changeFrequency: "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
