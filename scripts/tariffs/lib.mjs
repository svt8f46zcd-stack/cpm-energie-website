import fs from "node:fs/promises";
import path from "node:path";

export const USER_AGENT = "CPM-Energie-TariffBot/1.0 (+https://cpm-energie.de)";
const BLOCKED_AGB_PATTERNS = [
  /automatisierte(?:n|r|s)?\s+(?:zugriff|abfragen|auslesen|abruf)/i,
  /automated\s+(?:access|requests|scraping|crawling)/i,
  /scrap(?:ing|er)/i,
  /crawler/i,
  /bots?\b/i,
  /robot(?:s|er)?\b/i,
];

export async function fetchText(url, options = {}) {
  const response = await fetch(url, {
    redirect: "follow",
    headers: { "user-agent": USER_AGENT, accept: options.accept || "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" },
    signal: AbortSignal.timeout(options.timeoutMs || 25000),
  });
  if (!response.ok) throw new Error(`HTTP_${response.status} ${url}`);
  return response.text();
}

export function htmlToText(html) {
  return html
    .replace(/<script[\\s\\S]*?<\\/script>/gi, " ")
    .replace(/<style[\\s\\S]*?<\\/style>/gi, " ")
    .replace(/<noscript[\\s\\S]*?<\\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&euro;/gi, "€")
    .replace(/&#8364;/gi, "€")
    .replace(/&amp;/gi, "&")
    .replace(/\\s+/g, " ")
    .trim();
}

function numberFrom(value) {
  if (!value) return null;
  const cleaned = value.replace(/\\s/g, "").replace(/[^0-9,.]/g, "");
  if (!cleaned) return null;
  const comma = cleaned.lastIndexOf(",");
  const dot = cleaned.lastIndexOf(".");
  let normalized = cleaned;
  if (comma >= 0 && dot >= 0) normalized = comma > dot ? cleaned.replace(/\\./g, "").replace(",", ".") : cleaned.replace(/,/g, "");
  else if (comma >= 0) normalized = cleaned.replace(",", ".");
  else if (/^\\d{1,3}(?:\\.\\d{3})+$/.test(cleaned)) normalized = cleaned.replace(/\\./g, "");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function findNear(text, label, regex, maxDistance = 900) {
  const matches = [];
  const re = new RegExp(label.source, label.flags.includes("g") ? label.flags : `${label.flags}g`);
  let match;
  while ((match = re.exec(text))) {
    const window = text.slice(match.index, match.index + maxDistance);
    const hit = window.match(regex);
    if (hit) matches.push(numberFrom(hit[1]));
  }
  return matches.filter((n) => n !== null);
}

export function extractPrices(text, energy) {
  const normalized = text.replace(/\\u00a0/g, " ");
  const workCandidates = findNear(
    normalized,
    /(?:Arbeitspreis|Verbrauchspreis|Verbrauchskosten|Preis\\s*pro\\s*kWh)/i,
    /([0-9]{1,3}(?:[,.][0-9]{1,3})?)\\s*(?:ct|cent|€-cent)\\s*(?:\\/|pro)?\\s*kWh/i,
  ).filter((n) => n >= 5 && n <= 100);
  const baseCandidates = findNear(
    normalized,
    /(?:Grundpreis|Grundgebühr|Fixkosten)/i,
    /([0-9]{1,5}(?:[,.][0-9]{1,2})?)\\s*(?:€|EUR)\\s*(?:\\/\\s*(?:Monat|Jahr)|pro\\s+(?:Monat|Jahr)|jährlich|monatlich)/i,
  ).filter((n) => n >= 1 && n <= 10000);

  const workPriceCt = workCandidates.length ? workCandidates[0] : null;
  let basePriceYear = null;
  if (baseCandidates.length) {
    const raw = baseCandidates[0];
    const context = normalized.match(new RegExp(`(?:Grundpreis|Grundgebühr|Fixkosten)[\\s\\S]{0,180}?${raw.toString().replace(".", "\\.")}`, "i"));
    basePriceYear = context && /Monat|monatlich/i.test(context[0]) ? raw * 12 : raw;
  }
  if (workPriceCt === null || basePriceYear === null) return null;
  return { energyType: energy, workPriceCt: Number(workPriceCt.toFixed(3)), basePriceYear: Number(basePriceYear.toFixed(2)) };
}

export function extractValidDate(text) {
  const dates = [...text.matchAll(/(?:gültig|gültig ab|Preisstand|Stand)[^\\d]{0,30}(\\d{1,2})[.\\/]?(\\d{1,2})?[.\\/]?(20\\d{2})/gi)];
  if (!dates.length) return null;
  const m = dates[0];
  const month = m[2] ? String(Number(m[2])).padStart(2, "0") : "01";
  const day = m[2] ? String(Number(m[1])).padStart(2, "0") : "01";
  return `${m[3]}-${month}-${day}`;
}

export async function checkCompliance(provider) {
  const robotsUrl = new URL("/robots.txt", provider.baseUrl).toString();
  const result = { robotsUrl, robotsAllowed: false, robotsFetched: false, agbUrl: provider.agbUrl, agbFetched: false, agbNoExplicitAutomationBan: false, eligible: false, reason: null };
  try {
    const robots = await fetchText(robotsUrl, { accept: "text/plain,*/*" });
    result.robotsFetched = true;
    const blocks = robots.split(/\\n/).map((line) => line.trim());
    let applies = false;
    let disallowAll = false;
    for (const line of blocks) {
      const [rawKey, rawValue = ""] = line.split(":", 2);
      const key = rawKey?.trim().toLowerCase();
      const value = rawValue.trim();
      if (key === "user-agent") applies = value === "*" || /cpm-energie/i.test(value);
      if (applies && key === "disallow" && (value === "/" || value === "/*")) disallowAll = true;
    }
    result.robotsAllowed = !disallowAll;
  } catch (error) {
    result.reason = `robots_error:${error.message}`;
    return result;
  }
  try {
    const agb = await fetchText(provider.agbUrl, { accept: "text/html,application/pdf,*/*" });
    result.agbFetched = true;
    const text = htmlToText(agb);
    result.agbNoExplicitAutomationBan = !BLOCKED_AGB_PATTERNS.some((pattern) => pattern.test(text));
  } catch (error) {
    result.reason = `agb_error:${error.message}`;
    return result;
  }
  result.eligible = result.robotsAllowed && result.agbNoExplicitAutomationBan;
  if (!result.eligible && !result.reason) result.reason = "robots_or_agb_blocked";
  return result;
}

export function normalizeOffer(provider, energy, prices, text, sourceUrl, compliance) {
  const now = new Date().toISOString();
  return {
    id: `${provider.id}-${energy}-${new Date().toISOString().slice(0, 10)}`,
    provider: provider.name,
    providerId: provider.id,
    tariffName: provider.tariffNames?.[energy] || `${provider.name} Referenztarif`,
    energyType: energy,
    workPriceCt: prices.workPriceCt,
    basePriceYear: prices.basePriceYear,
    minConsumptionKwh: energy === "strom" ? 500 : 1000,
    maxConsumptionKwh: energy === "strom" ? 100000 : 100000,
    availability: "nationwide_unverified",
    validFrom: extractValidDate(text),
    sourceUrl,
    sourceLabel: `${provider.name} öffentliche Preisseite`,
    retrievedAt: now,
    compliance,
    dataQuality: "scraped_public_source",
    disclaimer: "Unverbindliche Beispielrechnung. PLZ-spezifische Verfügbarkeit und Vertragsbedingungen müssen vor Abschluss bestätigt werden.",
  };
}

export async function writeJson(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\\n`, "utf8");
}
