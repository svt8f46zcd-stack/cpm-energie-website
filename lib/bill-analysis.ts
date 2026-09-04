export type BillAnalysisField = {
  value: string | number | null;
  confidence: "high" | "medium" | "low" | "unknown";
  source: "document" | "not_detected";
};

export type BillAnalysisResult = {
  energyType: BillAnalysisField;
  provider: BillAnalysisField;
  annualConsumptionKwh: BillAnalysisField;
  workPriceCtPerKwh: BillAnalysisField;
  basePriceEurPerYear: BillAnalysisField;
  monthlyPaymentEur: BillAnalysisField;
  billingPeriod: BillAnalysisField;
  contractEnd: BillAnalysisField;
  cancellationPeriod: BillAnalysisField;
  address: BillAnalysisField;
};

export const BILL_ANALYSIS_FIELDS: Array<keyof BillAnalysisResult> = [
  "energyType", "provider", "annualConsumptionKwh", "workPriceCtPerKwh", "basePriceEurPerYear",
  "monthlyPaymentEur", "billingPeriod", "contractEnd", "cancellationPeriod", "address",
];

export function emptyBillAnalysis(): BillAnalysisResult {
  const empty = (): BillAnalysisField => ({ value: null, confidence: "unknown", source: "not_detected" });
  return {
    energyType: empty(), provider: empty(), annualConsumptionKwh: empty(), workPriceCtPerKwh: empty(),
    basePriceEurPerYear: empty(), monthlyPaymentEur: empty(), billingPeriod: empty(), contractEnd: empty(),
    cancellationPeriod: empty(), address: empty(),
  };
}

declare global { interface Window { Tesseract?: any; } }

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[data-cpm-src="${src}"]`)) return resolve();
    const script = document.createElement("script");
    script.src = src; script.async = true; script.dataset.cpmSrc = src;
    script.onload = () => resolve(); script.onerror = () => reject(new Error("OCR_LIBRARY_LOAD_FAILED"));
    document.head.appendChild(script);
  });
}

async function ocrImage(image: unknown): Promise<string> {
  await loadScript("https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js");
  if (!window.Tesseract) throw new Error("OCR_LIBRARY_LOAD_FAILED");
  const worker = await window.Tesseract.createWorker("deu");
  try {
    const texts: string[] = [];
    for (const mode of ["6", "11"]) {
      await worker.setParameters({ tessedit_pageseg_mode: mode, preserve_interword_spaces: "1" });
      const result = await worker.recognize(image);
      if (result.data.text) texts.push(result.data.text);
    }
    return texts.join("\n");
  } finally { await worker.terminate(); }
}

async function extractText(file: File): Promise<string> {
  if (file.type !== "application/pdf") return ocrImage(file);
  const importer = new Function("url", "return import(url)") as (url: string) => Promise<any>;
  const pdfjs = await importer("https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.54/build/pdf.mjs");
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages = Math.min(pdf.numPages, 6);
  const chunks: string[] = [];
  for (let i = 1; i <= pages; i += 1) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.8 });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;
    await page.render({ canvasContext: ctx, viewport }).promise;
    chunks.push(await ocrImage(canvas));
  }
  return chunks.join("\n");
}

function normalizeOcr(text: string): string {
  return text
    .replace(/\u00a0/g, " ")
    .replace(/\r/g, "")
    .replace(/[|]/g, " ")
    .replace(/[€]/g, " € ")
    .replace(/\bCts?\b/gi, "ct")
    .replace(/kwh/gi, "kWh")
    .replace(/\s+/g, " ");
}

function deNumber(value: string, context?: "currency" | "consumption" | "price"): number | null {
  let s = value.replace(/\s/g, "").replace(/€/g, "").replace(/[^0-9,.-]/g, "");
  if (!s) return null;

  // German OCR frequently drops the decimal comma in euro amounts, e.g. 154,95 -> 15495.
  // Only apply this correction when the surrounding label explicitly describes a euro amount.
  if (context === "currency" && /^\d{4,5}$/.test(s)) {
    const n = Number(s);
    if (n >= 1000 && n <= 999999) return n / 100;
  }

  // German thousands/decimal notation: 15.431,25 -> 15431.25.
  if (s.includes(",")) {
    const normalized = s.replace(/\./g, "").replace(",", ".");
    const n = Number(normalized);
    return Number.isFinite(n) ? n : null;
  }

  // A dot in a consumption value such as 15.431 is a thousands separator.
  if (context === "consumption" && /^\d{1,3}(?:\.\d{3})+$/.test(s)) {
    const n = Number(s.replace(/\./g, ""));
    return Number.isFinite(n) ? n : null;
  }

  const n = Number(s.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function makeField(value: string | number | null, confidence: BillAnalysisField["confidence"] = "medium"): BillAnalysisField {
  return value === null || value === "" ? { value: null, confidence: "unknown", source: "not_detected" } : { value, confidence, source: "document" };
}

function findNumber(text: string, patterns: Array<{ pattern: RegExp; context?: "currency" | "consumption" | "price" }>): number | null {
  for (const { pattern, context } of patterns) {
    const m = text.match(pattern);
    if (!m?.[1]) continue;
    const n = deNumber(m[1], context);
    if (n !== null) return n;
  }
  return null;
}

function firstDateRange(text: string): string | null {
  const m = text.match(/(\d{1,2}[.\/]\d{1,2}[.\/]\d{4})\s*(?:-|–|bis)\s*(\d{1,2}[.\/]\d{1,2}[.\/]\d{4})/i);
  return m ? `${m[1].replace(/\//g, ".")} - ${m[2].replace(/\//g, ".")}` : null;
}

function parseAnnualConsumption(clean: string, normalized: string): BillAnalysisField {
  // 1. Strongest signal: explicit annual consumption / annualized wording.
  const explicit = findNumber(clean, [
    { pattern: /(?:jahresverbrauch|jahresverbrauchs?wert)[^\d]{0,260}(\d{1,3}(?:[.]\d{3})+(?:,\d+)?|\d{4,6}(?:,\d+)?)\s*kwh/i, context: "consumption" },
    { pattern: /(?:auf|für)\s+365\s*tage[^\d]{0,260}(\d{1,3}(?:[.]\d{3})+(?:,\d+)?|\d{4,6}(?:,\d+)?)\s*kwh/i, context: "consumption" },
    { pattern: /365\s*tage[^\d]{0,300}(?:hochgerechnet|umgerechnet)[^\d]{0,260}(\d{1,3}(?:[.]\d{3})+(?:,\d+)?|\d{4,6}(?:,\d+)?)\s*kwh/i, context: "consumption" },
    { pattern: /(?:hochgerechnet|umgerechnet)[^\d]{0,300}365\s*tage[^\d]{0,260}(\d{1,3}(?:[.]\d{3})+(?:,\d+)?|\d{4,6}(?:,\d+)?)\s*kwh/i, context: "consumption" },
  ]);
  if (explicit !== null && explicit >= 100 && explicit <= 100000) return makeField(explicit, "high");

  // 2. E.ON often places the annualized value in a chart without repeating “kWh” after it.
  // After “Jahresverbrauch in kWh / auf 365 Tage umgerechnet”, the first plausible value
  // is the customer's annualized value. The next value is commonly a comparison benchmark.
  const marker = normalized.search(/jahresverbrauch\s+in\s+kwh|auf\s+365\s+tage\s+umgerechnet/i);
  if (marker >= 0) {
    const context = normalized.slice(marker, marker + 900);
    const candidates = [...context.matchAll(/\b(\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d{4,6}(?:,\d+)?)\b/g)]
      .map(m => deNumber(m[1], "consumption"))
      .filter((n): n is number => n !== null && n >= 500 && n <= 100000);
    if (candidates.length) return makeField(candidates[0], "high");
  }

  // 3. Conservative fallback: only accept a clearly annualized value, never a random kWh amount.
  const idx = normalized.search(/jahresverbrauch|365\s+tage|hochgerechnet|umgerechnet/i);
  if (idx >= 0) {
    const context = normalized.slice(idx, idx + 500);
    const candidates = [...context.matchAll(/(\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d{4,6}(?:,\d+)?)\s*kwh/gi)]
      .map(m => deNumber(m[1], "consumption"))
      .filter((n): n is number => n !== null && n >= 500 && n <= 100000);
    if (candidates.length) return makeField(candidates[0], "medium");
  }
  return makeField(null);
}

function parseText(text: string): BillAnalysisResult {
  const r = emptyBillAnalysis();
  const clean = text.replace(/\u00a0/g, " ").replace(/\r/g, "");
  const normalized = normalizeOcr(clean);

  const hasStrom = /\bstrom\b/i.test(clean) || /\bstr[o0]m\b/i.test(clean);
  const hasGas = /\bgas\b/i.test(clean);
  r.energyType = makeField(hasStrom && hasGas ? "Strom + Gas" : hasGas ? "Gas" : hasStrom ? "Strom" : null, hasStrom || hasGas ? "high" : "unknown");

  const provider = /\be\s*\.?\s*on\b/i.test(clean) || /eon/i.test(clean) ? "E.ON" : /\benbw\b/i.test(clean) ? "EnBW" : /\bvattenfall\b/i.test(clean) ? "Vattenfall" : /\bmainova\b/i.test(clean) ? "Mainova" : /\bewe\b/i.test(clean) ? "EWE" : null;
  r.provider = makeField(provider, provider ? "high" : "unknown");

  // The annualized chart value is deliberately separated from individual billing-period consumption.
  r.annualConsumptionKwh = parseAnnualConsumption(clean, normalized);

  // Price extraction is label-bound. This prevents a contract number, invoice total or other
  // currency from being mistaken for the work/base price.
  r.workPriceCtPerKwh = makeField(findNumber(clean, [
    { pattern: /arbeitspreis[^\d]{0,160}(\d{1,3}(?:[.,]\d{1,3})?)\s*ct\s*\/?\s*kwh/i, context: "price" },
    { pattern: /(\d{1,3}(?:[.,]\d{1,3})?)\s*ct\s*\/?\s*kwh[^\n]{0,120}?arbeitspreis/i, context: "price" },
  ]));

  r.basePriceEurPerYear = makeField(findNumber(clean, [
    { pattern: /grundpreis[^\d]{0,160}(\d{1,5}(?:[.,]\d{1,2})?)\s*€\s*\/?\s*(?:jahr|a)\b/i, context: "currency" },
    { pattern: /grundpreis[^\d]{0,160}(\d{1,5}(?:[.,]\d{1,2})?)\s*€/i, context: "currency" },
  ]));

  // Prefer an actual Abschlag entry and never a total payment or energy cost.
  r.monthlyPaymentEur = makeField(findNumber(clean, [
    { pattern: /abschlag[^\d]{0,100}(\d{1,4}(?:[.,]\d{2})?)\s*€/i, context: "currency" },
    { pattern: /monatlicher\s+abschlag[^\d]{0,100}(\d{1,4}(?:[.,]\d{2})?)\s*€/i, context: "currency" },
  ]));

  const period = firstDateRange(clean);
  r.billingPeriod = makeField(period, period ? "high" : "unknown");
  const end = clean.match(/(?:vertragsende|vertragslaufzeit\s*bis|belieferung\s*bis)[\s:]+(\d{1,2}[.\/]\d{1,2}[\/]\d{4})/i);
  r.contractEnd = makeField(end?.[1]?.replace(/\//g, ".") || null, end ? "medium" : "unknown");
  const cancel = clean.match(/k(?:ü|u)ndigungsfrist[\s:]+([^\n]{1,80})/i);
  r.cancellationPeriod = makeField(cancel?.[1]?.trim() || null, cancel ? "medium" : "unknown");
  const address = clean.match(/(?:anschrift|lieferanschrift|verbrauchsstelle)[\s:]+([^\n]{5,120})/i);
  r.address = makeField(address?.[1]?.trim() || null, address ? "medium" : "unknown");
  return r;
}

export async function analyzeBill(file: File): Promise<BillAnalysisResult> {
  if (typeof window === "undefined") throw new Error("BILL_ANALYSIS_BROWSER_ONLY");
  const endpoint = process.env.NEXT_PUBLIC_BILL_ANALYSIS_URL;
  if (endpoint) {
    const body = new FormData(); body.append("file", file, file.name);
    const response = await fetch(endpoint, { method: "POST", body });
    if (!response.ok) throw new Error("BILL_ANALYSIS_FAILED");
    return (await response.json()) as BillAnalysisResult;
  }
  const text = await extractText(file);
  if (!text.trim()) throw new Error("BILL_TEXT_NOT_RECOGNIZED");
  return parseText(text);
}
