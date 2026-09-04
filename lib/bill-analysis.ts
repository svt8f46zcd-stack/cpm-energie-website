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
    const viewport = page.getViewport({ scale: 2.2 });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
    await page.render({ canvasContext: canvas.getContext("2d")!, viewport }).promise;
    chunks.push(await ocrImage(canvas));
  }
  return chunks.join("\n");
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

function parseText(text: string): BillAnalysisResult {
  const r = emptyBillAnalysis();
  const clean = text.replace(/\u00a0/g, " ").replace(/\r/g, "");
  const normalized = clean.replace(/[|]/g, " ").replace(/\s+/g, " ");

  const hasStrom = /\bstrom\b/i.test(clean);
  const hasGas = /\bgas\b/i.test(clean);
  r.energyType = makeField(hasStrom && hasGas ? "Strom + Gas" : hasGas ? "Gas" : hasStrom ? "Strom" : null, "high");

  const provider = /\be\.?\s*on\b/i.test(clean) ? "E.ON" : /\benbw\b/i.test(clean) ? "EnBW" : /\bvattenfall\b/i.test(clean) ? "Vattenfall" : null;
  r.provider = makeField(provider, provider ? "high" : "unknown");

  // Annualized consumption has priority over partial-period totals.
  const annual = findNumber(clean, [
    /jahresverbrauch[\s\S]{0,260}?([\d.]+(?:,\d+)?)\s*kwh/i,
    /jahresverbrauch\s+in\s+kwh[\s\S]{0,420}?([\d.]+(?:,\d+)?)/i,
    /jahresverbrauch[\s\S]{0,420}?365\s*tage[\s\S]{0,260}?([\d.]+(?:,\d+)?)\s*kwh/i,
    /365\s*tage\s*(?:umgerechnet|hochgerechnet)[\s\S]{0,260}?([\d.]+(?:,\d+)?)\s*kwh/i,
    /auf\s+365\s*tage\s+umgerechnet[\s\S]{0,260}?([\d.]+(?:,\d+)?)\s*kwh/i,
    /365\s*tage\s*(?:umgerechnet|hochgerechnet)[^\d]{0,100}(\d{1,3}(?:\.\d{3})+(?:,\d+)?)/i,
    /auf\s+365\s*tage\s+umgerechnet[^\d]{0,100}(\d{1,3}(?:\.\d{3})+(?:,\d+)?)/i,
  ]);
  r.annualConsumptionKwh = makeField(annual, annual !== null ? "high" : "unknown");

  if (r.annualConsumptionKwh.value === null) {
    const annualContext = normalized.match(/(?:ihr\s+)?jahresverbrauch[^\d]{0,180}(\d{1,3}(?:\.\d{3})+(?:,\d+)?)\s*kwh/i);
    if (annualContext?.[1]) r.annualConsumptionKwh = makeField(deNumber(annualContext[1]), "medium");
  }

  r.workPriceCtPerKwh = makeField(findNumber(clean, [
    /arbeitspreis[\s\S]{0,120}?([\d.]+(?:,\d+)?)\s*ct\s*\/?\s*kwh/i,
    /([\d.]+(?:,\d+)?)\s*ct\s*\/?\s*kwh[\s\S]{0,100}?arbeitspreis/i,
  ]));
  r.basePriceEurPerYear = makeField(findNumber(clean, [
    /grundpreis[\s\S]{0,120}?([\d.]+(?:,\d+)?)\s*€\s*\/?\s*jahr/i,
    /grundpreis[\s\S]{0,120}?([\d.]+(?:,\d+)?)\s*€\s*jahr/i,
  ]));
  r.monthlyPaymentEur = makeField(findNumber(clean, [/abschlag[\s\S]{0,80}?([\d.]+(?:,\d+)?)\s*€/i]));

  const period = clean.match(/(\d{2}\.\d{2}\.\d{4}\s*(?:-|bis)\s*\d{2}\.\d{2}\.\d{4})/);
  r.billingPeriod = makeField(period?.[1] || null, period ? "medium" : "unknown");
  const end = clean.match(/vertragsende[\s:]+(\d{2}\.\d{2}\.\d{4})/i);
  r.contractEnd = makeField(end?.[1] || null, end ? "medium" : "unknown");
  const cancel = clean.match(/k(?:ü|u)ndigungsfrist[\s:]+([^\n]{1,60})/i);
  r.cancellationPeriod = makeField(cancel?.[1]?.trim() || null, cancel ? "medium" : "unknown");
  const address = clean.match(/(?:anschrift|lieferanschrift|verbrauchsstelle)[\s:]+([^\n]{5,100})/i);
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
