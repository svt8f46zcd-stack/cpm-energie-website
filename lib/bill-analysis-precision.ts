import { analyzeBill, type BillAnalysisField, type BillAnalysisResult } from "@/lib/bill-analysis-v3";

type RawField = { value: string | number | null; confidence: BillAnalysisField["confidence"]; source: BillAnalysisField["source"] };

const empty = (): RawField => ({ value: null, confidence: "unknown", source: "not_detected" });
const make = (value: string | number | null, confidence: BillAnalysisField["confidence"] = "high"): RawField =>
  value === null || value === "" ? empty() : { value, confidence, source: "document" };

function normalize(s: string) {
  return s.replace(/\u00a0/g, " ").replace(/[‐‑‒–—]/g, "-").replace(/\s+/g, " ").trim();
}

function number(raw: string) {
  let s = raw.replace(/\s/g, "").replace(/[^0-9,.-]/g, "");
  if (!s) return null;
  const comma = s.lastIndexOf(",");
  const dot = s.lastIndexOf(".");
  if (comma >= 0 && dot >= 0) s = comma > dot ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  else if (comma >= 0) s = s.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}\.\d{3}$/.test(s)) s = s.replace(".", "");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function setHigh(result: BillAnalysisResult, key: keyof BillAnalysisResult, value: string | number | null) {
  if (value !== null && value !== "") result[key] = make(value, "high");
}

function extractProvider(text: string) {
  const patterns: Array<[RegExp, string]> = [
    [/ENTEGA/i, "ENTEGA"], [/e\.?\s*o\.?\s*n\b/i, "E.ON"], [/goldgas/i, "goldgas"], [/enbw/i, "EnBW"],
    [/vattenfall/i, "Vattenfall"], [/mainova/i, "Mainova"], [/rheinen?ergie/i, "RheinEnergie"], [/süwag/i, "Süwag"],
    [/eprimo/i, "eprimo"], [/naturstrom/i, "Naturstrom"], [/lichtblick/i, "LichtBlick"],
  ];
  return patterns.find(([p]) => p.test(text))?.[1] ?? null;
}

function extractTariff(text: string) {
  const patterns = [
    /Tarif\s*:\s*([^\n]{3,100}?)(?=\s+Z[äa]hlernummer|\s+Marktlokations|\s+Ihr aktueller|$)/i,
    /Produkt\s*:\s*([^\n]{3,100}?)(?=\s+Z[äa]hlernummer|\s+Marktlokations|$)/i,
    /Tarif\s+([^\n]{3,100}?)(?=\s+Z[äa]hlernummer|\s+Marktlokations|$)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m?.[1]) return normalize(m[1]).replace(/[.,;:]$/, "");
  }
  return null;
}

function extractOverviewPrice(text: string, label: "Arbeitspreis" | "Grundpreis") {
  const compact = normalize(text);
  const overview = compact.match(/Ihr aktueller Preis[^.]{0,900}/i)?.[0] ?? compact;
  const labelIndex = overview.search(new RegExp(label, "i"));
  if (labelIndex < 0) return null;
  const window = overview.slice(labelIndex, labelIndex + 260);
  if (label === "Arbeitspreis") {
    const ct = window.match(/(\d{1,3}(?:[.,]\d{1,3})?)\s*(?:ct|c|cent)\s*\/\s*kWh/i);
    if (ct) return number(ct[1]);
    const eur = window.match(/(\d{1,3}(?:[.,]\d{1,4})?)\s*(?:€|EUR)\s*\/\s*kWh/i);
    if (eur) { const n = number(eur[1]); return n === null ? null : n * 100; }
  } else {
    const eur = window.match(/(\d{1,5}(?:[.,]\d{1,3})?)\s*(?:€|EUR)\s*\/\s*(?:Jahr|a)\b/i);
    if (eur) return number(eur[1]);
  }
  return null;
}

function extractConsumption(text: string) {
  const compact = normalize(text);
  const patterns = [
    /Gesamtverbrauch\s*\([^)]*\)\s*([0-9.]{3,8}(?:,[0-9]+)?)\s*kWh/i,
    /Gesamtverbrauch[^0-9]{0,80}([0-9.]{3,8}(?:,[0-9]+)?)\s*kWh/i,
    /Jahresverbrauch[^0-9]{0,80}([0-9.]{3,8}(?:,[0-9]+)?)\s*kWh/i,
  ];
  for (const p of patterns) {
    const m = compact.match(p);
    const n = m ? number(m[1]) : null;
    if (n !== null && n >= 300 && n <= 100000) return n;
  }
  return null;
}

function extractBillingPeriod(text: string) {
  const matches = [...text.matchAll(/(\d{1,2}[./]\d{1,2}[./]\d{2,4})\s*(?:-|bis)\s*(\d{1,2}[./]\d{1,2}[./]\d{2,4})/g)];
  if (!matches.length) return null;
  const toDate = (s: string) => {
    const [d, m, y0] = s.replace(/\//g, ".").split(".").map(Number);
    return new Date(y0 < 100 ? y0 + 2000 : y0, m - 1, d).getTime();
  };
  matches.sort((a, b) => Math.abs(toDate(b[2]) - toDate(b[1])) - Math.abs(toDate(a[2]) - toDate(a[1])));
  return `${matches[0][1].replace(/\//g, ".")} - ${matches[0][2].replace(/\//g, ".")}`;
}

async function getPdfText(file: File) {
  const dynamicImport = new Function("u", "return import(u)") as (u: string) => Promise<any>;
  const pdf = await dynamicImport("https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.54/build/pdf.mjs");
  const doc = await pdf.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= Math.min(12, doc.numPages); i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    pages.push((content.items as any[]).map(x => typeof x?.str === "string" ? x.str : "").join(" "));
  }
  return pages.join("\n");
}

async function readText(file: File) {
  if (file.type !== "application/pdf") return "";
  try { return await getPdfText(file); } catch { return ""; }
}

export async function analyzeBillPrecise(file: File): Promise<BillAnalysisResult> {
  const result = await analyzeBill(file);
  const text = await readText(file);
  if (!text.trim()) return result;

  const provider = extractProvider(text);
  if (provider) setHigh(result, "provider", provider);
  const tariff = extractTariff(text);
  if (tariff) setHigh(result, "tariffName", tariff);
  const consumption = extractConsumption(text);
  if (consumption !== null) setHigh(result, "annualConsumptionKwh", consumption);
  const work = extractOverviewPrice(text, "Arbeitspreis");
  if (work !== null && work >= 5 && work <= 100) setHigh(result, "workPriceCtPerKwh", work);
  const base = extractOverviewPrice(text, "Grundpreis");
  if (base !== null && base >= 20 && base <= 5000) setHigh(result, "basePriceEurPerYear", base);
  const period = extractBillingPeriod(text);
  if (period) setHigh(result, "billingPeriod", period);
  return result;
}

export const analyzeBill = analyzeBillPrecise;
