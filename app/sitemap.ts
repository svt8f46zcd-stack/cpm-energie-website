import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://svt8f46zcd-stack.github.io/cpm-energie-website";
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
