import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://cpm-energie.de";
  return ["/", "/ersparnisrechner", "/so-funktionierts", "/ueber-mich", "/kontakt", "/impressum", "/datenschutz"].map((path) => ({ url: `${base}${path}`, changeFrequency: "monthly", priority: path === "/" ? 1 : 0.7 }));
}
