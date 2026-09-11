import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://cpm-energie.de";
  return [
    "/",
    "/ersparnisrechner",
    "/tarifrechner",
    "/so-funktionierts",
    "/ueber-mich",
    "/kontakt",
    "/kontakt/rechnung",
    "/impressum",
    "/datenschutz",
  ].map((path) => ({
    url: `${base}${path}/`,
    changeFrequency: path === "/tarifrechner" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path === "/tarifrechner" ? 0.9 : 0.7,
  }));
}
