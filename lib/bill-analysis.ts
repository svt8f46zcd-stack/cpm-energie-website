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
      await worker.setParameters({ tessedit_pageseg_mode: mode });
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
    const viewport = page.getViewport({ scale: 2.4 });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
    await page.render({ canvasContext: canvas.getContext("2d")!, viewport }).promise;
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
    .replace(/kWh/gi, "kWh")
    .replace(/\s+/g, " ");
}

function deNumber(value: string): number | null {
  const s = value.replace(/\s/g, "").replace(/€/g, "");
  const normalized = s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function makeField(value: string | number | null, confidence: BillAnalysisField["confidence"] = "medium"): BillAnalysisField {
  return value === null || value === "" ? { value: null, confidence: "unknown", source: "not_detected" } : { value, confidence, source: "document" };
}

function findNumber(text: string, patterns: RegExp[]): number | null {
  for (const p of patterns) {
    const m = text.match(p);
    if (!m?.[1]) continue;
    const n = deNumber(m[1]);
    if (n !== null) return n;
  }
  return null;
}

function firstDateRange(text: string): string | null {
  const m = text.match(/(\d{1,2}[.\/]\d{1,2}[.\/]\d{4})\s*(?:-|–|bis)\s*(\d{1,2}[.\/]\d{1,2}[.\/]\d{4})/i);
  return m ? `${m[1].replace(/\//g, ".")} - ${m[2].replace(/\//g, ".")}` : null;
}

function parseText(text: string): BillAnalysisResult {
  const r = emptyBillAnalysis();
  const clean = text.replace(/\u00a0/g, " ").replace(/\r/g, "");
  const normalized = normalizeOcr(clean);
  const lower = normalized.toLowerCase();

  const hasStrom = /\bstrom\b/i.test(clean) || /\bstr[o0]m\b/i.test(clean);
  const hasGas = /\bgas\b/i.test(clean);
  r.energyType = makeField(hasStrom && hasGas ? "Strom + Gas" : hasGas ? "Gas" : hasStrom ? "Strom" : null, hasStrom || hasGas ? "high" : "unknown");

  const provider = /\be\s*\.?\s*on\b/i.test(clean) || /eon/i.test(clean) ? "E.ON" : /\benbw\b/i.test(clean) ? "EnBW" : /\bvattenfall\b/i.test(clean) ? "Vattenfall" : /\bmainova\b/i.test(clean) ? "Mainova" : /\bewe\b/i.test(clean) ? "EWE" : null;
  r.provider = makeField(provider, provider ? "high" : "unknown");

  // Never take a generic consumption number first. Prefer explicit annualized values and 365-day projections.
  const annual = findNumber(clean, [
    /(?:jahresverbrauch|jahresverbrauchs?wert)[\s\S]{0,260}?([\d.]+(?:,\d+)?)\s*kwh/i,
    /(?:auf|für)\s+365\s*tage[\s\S]{0,260}?([\d.]+(?:,\d+)?)\s*kwh/i,
    /365\s*tage[\s\S]{0,260}?(?:hochgerechnet|umgerechnet)[\s\S]{0,220}?([\d.]+(?:,\d+)?)\s*kwh/i,
    /(?:hochgerechnet|umgerechnet)[\s\S]{0,220}?365\s*tage[\s\S]{0,220}?([\d.]+(?:,\d+)?)\s*kwh/i,
  ]);
  r.annualConsumptionKwh = makeField(annual, annual !== null ? "high" : "unknown");

  // OCR often splits a number and unit. Reconstruct an annual value from the line/nearby context.
  if (r.annualConsumptionKwh.value === null) {
    const annualContext = normalized.match(/(?:jahresverbrauch|auf\s+365\s*tage|365\s*tage)[^\d]{0,220}(\d{1,3}(?:\.\d{3})+(?:,\d+)?)\s*kwh/i);
    if (annualContext?.[1]) r.annualConsumptionKwh = makeField(deNumber(annualContext[1]), "medium");
  }

  // Additional E.ON style fallback: if the text contains an annualized consumption section, inspect numbers close to it.
  if (r.annualConsumptionKwh.value === null) {
    const idx = lower.search(/jahresverbrauch|365\s*tage|hochgerechnet|umgerechnet/);
    if (idx >= 0) {
      const context = normalized.slice(idx, idx + 500);
      const candidates = [...context.matchAll(/(\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d{4,6}(?:,\d+)?)\s*kwh/gi)]
        .map(m => deNumber(m[1])).filter((n): n is number => n !== null && n >= 500 && n <= 100000);
      if (candidates.length) r.annualConsumptionKwh = makeField(candidates[candidates.length - 1], "medium");
    }
  }

  r.workPriceCtPerKwh = makeField(findNumber(clean, [
    /arbeitspreis[\s\S]{0,140}?([\d.]+(?:,\d+)?)\s*ct\s*\/?\s*kwh/i,
    /([\d.]+(?:,\d+)?)\s*ct\s*\/?\s*kwh[\s\S]{0,100}?arbeitspreis/i,
    /([\d.]+(?:,\d+)?)\s*ct\s*\/\s*kwh/i,
  ]));
  r.basePriceEurPerYear = makeField(findNumber(clean, [
    /grundpreis[\s\S]{0,140}?([\d.]+(?:,\d+)?)\s*€\s*\/?\s*(?:jahr|a|monat)/i,
    /grundpreis[\s\S]{0,140}?([\d.]+(?:,\d+)?)\s*€/i,
  ]));
  r.monthlyPaymentEur = makeField(findNumber(clean, [
    /abschlag(?:\s+monatlich)?[\s\S]{0,100}?([\d.]+(?:,\d+)?)\s*€/i,
    /monatlicher\s+abschlag[\s\S]{0,100}?([\d.]+(?:,\d+)?)\s*€/i,
  ]));

  const period = firstDateRange(clean);
  r.billingPeriod = makeField(period, period ? "high" : "unknown");
  const end = clean.match(/(?:vertragsende|vertragslaufzeit\s*bis|belieferung\s*bis)[\s:]+(\d{1,2}[.\/]\d{1,2}[.\/]\d{4})/i);
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
