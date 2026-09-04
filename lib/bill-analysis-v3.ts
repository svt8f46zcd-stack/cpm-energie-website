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
  "energyType", "provider", "annualConsumptionKwh", "workPriceCtPerKwh",
  "basePriceEurPerYear", "monthlyPaymentEur", "billingPeriod", "contractEnd",
  "cancellationPeriod", "address",
];

type Confidence = BillAnalysisField["confidence"];
type Hit = { value: number; index: number; score: number };

const OCR_CDN = "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";
const PDF_CDN = "https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.54/build/pdf.mjs";
let ocrLoadPromise: Promise<void> | null = null;
let pdfLoadPromise: Promise<any> | null = null;

declare global { interface Window { Tesseract?: any } }

function emptyField(): BillAnalysisField {
  return { value: null, confidence: "unknown", source: "not_detected" };
}

export function emptyBillAnalysis(): BillAnalysisResult {
  return {
    energyType: emptyField(), provider: emptyField(), annualConsumptionKwh: emptyField(),
    workPriceCtPerKwh: emptyField(), basePriceEurPerYear: emptyField(), monthlyPaymentEur: emptyField(),
    billingPeriod: emptyField(), contractEnd: emptyField(), cancellationPeriod: emptyField(), address: emptyField(),
  };
}

function field(value: string | number | null, confidence: Confidence = "medium"): BillAnalysisField {
  return value === null || value === ""
    ? emptyField()
    : { value, confidence, source: "document" };
}

function loadScript(src: string): Promise<void> {
  if (typeof document === "undefined") return Promise.reject(new Error("OCR_LIBRARY_LOAD_FAILED"));
  if (window.Tesseract) return Promise.resolve();
  if (ocrLoadPromise) return ocrLoadPromise;
  ocrLoadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[data-cpm-ocr="${src}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("OCR_LIBRARY_LOAD_FAILED")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.dataset.cpmOcr = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("OCR_LIBRARY_LOAD_FAILED"));
    document.head.appendChild(script);
  });
  return ocrLoadPromise;
}

async function loadPdfJs(): Promise<any> {
  if (pdfLoadPromise) return pdfLoadPromise;
  const importer = new Function("u", "return import(u)") as (url: string) => Promise<any>;
  pdfLoadPromise = importer(PDF_CDN);
  return pdfLoadPromise;
}

function canvasCopy(source: unknown): HTMLCanvasElement | null {
  if (typeof document === "undefined") return null;
  if (!(source instanceof HTMLCanvasElement) && !(source instanceof HTMLImageElement)) return null;
  const canvas = document.createElement("canvas");
  if (source instanceof HTMLCanvasElement) {
    canvas.width = source.width; canvas.height = source.height;
  } else {
    canvas.width = source.naturalWidth || source.width; canvas.height = source.naturalHeight || source.height;
  }
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.drawImage(source, 0, 0);
  return canvas;
}

function enhance(source: unknown, mode: "color" | "gray" | "threshold"): HTMLCanvasElement | unknown {
  const original = canvasCopy(source);
  if (!original) return source;
  const scale = 2;
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(original.width * scale);
  canvas.height = Math.ceil(original.height * scale);
  const context = canvas.getContext("2d");
  if (!context) return original;
  context.imageSmoothingEnabled = true;
  context.drawImage(original, 0, 0, canvas.width, canvas.height);
  if (mode === "color") return canvas;
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < image.data.length; i += 4) {
    const luminance = 0.299 * image.data[i] + 0.587 * image.data[i + 1] + 0.114 * image.data[i + 2];
    const value = mode === "threshold"
      ? luminance < 175 ? 0 : 255
      : Math.max(0, Math.min(255, (luminance - 128) * 1.45 + 128));
    image.data[i] = value; image.data[i + 1] = value; image.data[i + 2] = value;
  }
  context.putImageData(image, 0, 0);
  return canvas;
}

async function imageCanvas(file: File): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth || image.width;
      canvas.height = image.naturalHeight || image.height;
      const context = canvas.getContext("2d");
      URL.revokeObjectURL(url);
      if (!context) return reject(new Error("IMAGE_DECODE_FAILED"));
      context.drawImage(image, 0, 0);
      resolve(canvas);
    };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("IMAGE_DECODE_FAILED")); };
    image.src = url;
  });
}

async function createOcrWorker(): Promise<any> {
  await loadScript(OCR_CDN);
  if (!window.Tesseract) throw new Error("OCR_LIBRARY_LOAD_FAILED");
  return window.Tesseract.createWorker("deu");
}

async function recognizeWithWorker(worker: any, source: unknown): Promise<string> {
  const texts: string[] = [];
  for (const mode of ["color", "gray", "threshold"] as const) {
    const result = await worker.recognize(
      enhance(source, mode),
      { rotateAuto: true },
      { tessedit_pageseg_mode: "6", preserve_interword_spaces: "1", user_defined_dpi: "300" },
    );
    const text = String(result?.data?.text || "");
    if (text.trim()) texts.push(text);
    if (/arbeit\s*spreis|verbrauchs\s*preis|grund\s*preis|jahres\s*verbrauch/i.test(text) &&
        /(?:ct\s*\/\s*kWh|cent\s*\/\s*kWh|€\s*\/\s*kWh|\d[\d.,]*\s*kWh)/i.test(text)) break;
  }
  return texts.join("\n");
}

async function recognizeImage(file: File): Promise<string> {
  const canvas = await imageCanvas(file);
  const worker = await createOcrWorker();
  try { return await recognizeWithWorker(worker, canvas); }
  finally { await worker.terminate(); }
}

async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await loadPdfJs();
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= Math.min(12, pdf.numPages); pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items.map((item: any) => typeof item?.str === "string" ? item.str : "").join(" ").replace(/\s+/g, " ").trim();
    if (text) pages.push(text);
  }
  return pages.join("\n");
}

async function renderPdfForOcr(file: File): Promise<string> {
  const pdfjs = await loadPdfJs();
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const worker = await createOcrWorker();
  const pages: string[] = [];
  try {
    for (let pageNumber = 1; pageNumber <= Math.min(12, pdf.numPages); pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
      const context = canvas.getContext("2d");
      if (!context) continue;
      await page.render({ canvasContext: context, viewport }).promise;
      pages.push(await recognizeWithWorker(worker, canvas));
    }
  } finally { await worker.terminate(); }
  return pages.join("\n");
}

async function textOf(file: File): Promise<string> {
  if (file.type !== "application/pdf") return recognizeImage(file);
  const nativeText = await extractPdfText(file);
  const normalized = clean(nativeText);
  const hasWorkPrice = /(?:arbeit\s*spreis|verbrauchs\s*preis)[\s\S]{0,650}(?:ct\s*\/\s*kWh|cent\s*\/\s*kWh|€\s*\/\s*kWh)/i.test(normalized);
  const hasConsumption = /\d[\d.,]*\s*kWh/i.test(normalized);
  if (nativeText.length >= 80 && (hasWorkPrice || hasConsumption)) return nativeText;
  const ocrText = await renderPdfForOcr(file);
  return [nativeText, ocrText].filter(Boolean).join("\n");
}

function clean(text: string): string {
  return text.replace(/\u00a0/g, " ").replace(/[|]/g, " ").replace(/[‐‑‒–—]/g, "-").replace(/\r/g, "")
    .replace(/k\s*[vw]\s*[whn]/gi, "kWh").replace(/\b(?:kwh|kvvh|kvwh|kwn|kvn)\b/gi, "kWh")
    .replace(/grund[o0]reis|grundpre[i1]s|grundoeis/gi, "Grundpreis")
    .replace(/arbeit\s*(?:s|ss)?\s*pre[i1]s|arbeitspre[il]s|ar[bp]atspre[i1]s/gi, "Arbeitspreis")
    .replace(/verbrauch\s*spre[i1]s|verbrauchspre[i1]s/gi, "Verbrauchspreis")
    .replace(/jahresverh?rauch|jahresverhrauch/gi, "Jahresverbrauch")
    .replace(/str[o0]m/gi, "Strom").replace(/e\s*[.]?\s*o\s*n/gi, "E.ON")
    .replace(/c\s*t\s*\/\s*k\s*[vw]\s*[whn]/gi, "ct/kWh").replace(/cent\s*\/\s*kWh/gi, "ct/kWh")
    .replace(/€\s*\/\s*kWh/gi, "€/kWh").replace(/[ \t]+/g, " ");
}

function numberValue(raw: string): number | null {
  let value = raw.replace(/\s/g, "").replace(/[^0-9,.-]/g, "");
  if (!value) return null;
  const comma = value.lastIndexOf(",");
  const dot = value.lastIndexOf(".");
  if (comma >= 0 && dot >= 0) value = comma > dot ? value.replace(/\./g, "").replace(",", ".") : value.replace(/,/g, "");
  else if (comma >= 0) value = value.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}\.\d{3}$/.test(value)) value = value.replace(".", "");
  const result = Number(value);
  return Number.isFinite(result) ? result : null;
}

function parseDate(raw: string): number {
  const [day, month, year] = raw.split(/[./]/).map(Number);
  return day && month && year ? new Date(year, month - 1, day).getTime() : 0;
}

function dateRanges(text: string): Array<{ raw: string; end: number }> {
  const ranges: Array<{ raw: string; end: number }> = [];
  for (const match of text.matchAll(/(\d{1,2}[./]\d{1,2}[.]\d{4})\s*(?:-|bis)\s*(\d{1,2}[./]\d{1,2}[.]\d{4})/g)) {
    const end = parseDate(match[2]);
    if (end) ranges.push({ raw: `${match[1].replace(/\//g, ".")} - ${match[2].replace(/\//g, ".")}`, end });
  }
  return ranges;
}

function annualConsumption(text: string): BillAnalysisField {
  const hits: Hit[] = [];
  for (const match of text.matchAll(/(?:Jahresverbrauch|Ihr\s+Jahresverbrauch|Verbrauch\/Menge|Verbrauch\s+im\s+Abrechnungsjahr|Verbrauchsmenge)[\s\S]{0,500}/gi)) {
    for (const number of match[0].matchAll(/(\d{1,3}(?:[.,]\d{3})+|\d{4,6})\s*kWh/gi)) {
      const value = numberValue(number[1]);
      if (value !== null && value >= 300 && value <= 100000) hits.push({ value, index: (match.index ?? 0) + (number.index ?? 0), score: 500 });
    }
  }
  for (const number of text.matchAll(/(\d{1,3}(?:[.,]\d{3})+|\d{4,6})\s*kWh/gi)) {
    const value = numberValue(number[1]);
    if (value !== null && value >= 300 && value <= 100000) hits.push({ value, index: number.index ?? 0, score: 100 });
  }
  if (!hits.length) return emptyField();
  hits.sort((a, b) => b.score - a.score || b.index - a.index);
  return field(hits[0].value, hits[0].score >= 500 ? "high" : "medium");
}

function pricingHits(text: string): { work: Hit[]; base: Hit[] } {
  const work: Hit[] = [], base: Hit[] = [], normalized = text.replace(/\s+/g, " ");
  for (const match of normalized.matchAll(/(?:Arbeitspreis|Verbrauchspreis)[^\n]{0,650}/gi)) {
    const context = match[0], index = match.index ?? 0;
    for (const number of context.matchAll(/(\d{1,3}[,.]\d{1,3})\s*(?:ct|c|cent)\s*(?:\/\s*)?kWh\b/gi)) {
      const value = numberValue(number[1]);
      if (value !== null && value >= 5 && value <= 60) work.push({ value, index: index + (number.index ?? 0), score: 1000 });
    }
    for (const number of context.matchAll(/(\d{1,3}[,.]\d{1,3})\s*(?:€|EUR)\s*(?:\/\s*)?kWh\b/gi)) {
      const value = numberValue(number[1]);
      if (value !== null && value >= 0.05 && value <= 0.6) work.push({ value: value * 100, index: index + (number.index ?? 0), score: 950 });
    }
    for (const row of context.matchAll(/\d{1,6}(?:[.,]\d{3})?\s*kWh[^\n]{0,180}?(\d{1,3}[,.]\d{1,3})\s*(?:ct|c|cent)\s*\/\s*kWh/gi)) {
      const value = numberValue(row[1]);
      if (value !== null && value >= 5 && value <= 60) work.push({ value, index: index + (row.index ?? 0), score: 900 });
    }
  }
  for (const number of normalized.matchAll(/(\d{1,3}[,.]\d{1,3})\s*(?:ct|c|cent)\s*\/?\s*kWh\b/gi)) {
    const value = numberValue(number[1]);
    if (value !== null && value >= 5 && value <= 60) work.push({ value, index: number.index ?? 0, score: 500 });
  }
  for (const match of normalized.matchAll(/Grundpreis[^\n]{0,500}/gi)) {
    const context = match[0], index = match.index ?? 0;
    for (const number of context.matchAll(/(\d{2,5}[,.]\d{2})\s*(?:€|EUR)\s*(?:\/\s*)?(?:Jahr|a)\b/gi)) {
      const value = numberValue(number[1]);
      if (value !== null && value >= 20 && value <= 3000) base.push({ value, index: index + (number.index ?? 0), score: 1000 });
    }
    for (const number of context.matchAll(/(\d{2,5}[,.]\d{2})\s*(?:€|EUR)\b/gi)) {
      const value = numberValue(number[1]);
      if (value !== null && value >= 20 && value <= 3000) base.push({ value, index: index + (number.index ?? 0), score: 700 });
    }
  }
  return { work, base };
}

function workPrice(text: string): BillAnalysisField {
  const hits = pricingHits(text).work;
  if (!hits.length) return emptyField();
  hits.sort((a, b) => b.score - a.score || b.index - a.index);
  return field(Math.round(hits[0].value * 100) / 100, hits[0].score >= 900 ? "high" : "medium");
}

function basePrice(text: string): BillAnalysisField {
  const hits = pricingHits(text).base;
  if (!hits.length) return emptyField();
  hits.sort((a, b) => b.score - a.score || b.index - a.index);
  return field(Math.round(hits[0].value * 100) / 100, hits[0].score >= 900 ? "high" : "medium");
}

function monthlyPayment(text: string): BillAnalysisField {
  const hits: Hit[] = [];
  for (const match of text.replace(/\s+/g, " ").matchAll(/(?:monatlich(?:er)?\s+Abschlag|Abschlag|Ihre\s+Zahlungen)[^\n]{0,250}/gi)) {
    for (const number of match[0].matchAll(/(\d{2,5}(?:[,.]\d{2})?)\s*(?:€|EUR)/gi)) {
      const value = numberValue(number[1]);
      if (value !== null && value >= 20 && value <= 5000) hits.push({ value, index: (match.index ?? 0) + (number.index ?? 0), score: 500 });
    }
  }
  if (!hits.length) return emptyField();
  hits.sort((a, b) => b.index - a.index);
  return field(hits[0].value, "high");
}

function billingPeriod(text: string): BillAnalysisField {
  const ranges = dateRanges(text);
  if (!ranges.length) return emptyField();
  ranges.sort((a, b) => b.end - a.end);
  return field(ranges[0].raw, "high");
}

function provider(text: string): BillAnalysisField {
  const rules: Array<[RegExp, string]> = [
    [/e\.?\s*o\.?\s*n\b/i, "E.ON"], [/enbw/i, "EnBW"], [/vattenfall/i, "Vattenfall"],
    [/mainova/i, "Mainova"], [/\bewe\b/i, "EWE"], [/\binnogy\b/i, "innogy"],
    [/\benercity\b/i, "enercity"], [/\bswv\b/i, "SWV"], [/\b123energie\b/i, "123energie"],
  ];
  for (const [regex, name] of rules) if (regex.test(text)) return field(name, "high");
  return emptyField();
}

function energyType(text: string): BillAnalysisField {
  const electricity = /\bstrom\b|stromkosten|optimalstrom|ökostrom|verbrauchspreis\s+et|strom\s+et/i.test(text);
  const gas = /\bgas\b|gaskosten|gas\s+et/i.test(text);
  if (electricity && gas) return field("Strom + Gas", "high");
  if (gas) return field("Gas", "high");
  if (electricity) return field("Strom", "high");
  return emptyField();
}

function contractEnd(text: string): BillAnalysisField {
  const normalized = text.replace(/\s+/g, " ");
  for (const regex of [
    /Vertragsende[^\d]{0,80}(\d{1,2}[./]\d{1,2}[.]\d{4})/i,
    /Vertragslaufzeit[^\d]{0,100}(\d{1,2}[./]\d{1,2}[.]\d{4})/i,
    /nächstmöglicher\s+Kündigungstermin[^\d]{0,120}(\d{1,2}[./]\d{1,2}[.]\d{4})/i,
  ]) {
    const match = normalized.match(regex);
    if (match) return field(match[1].replace(/\//g, "."), "medium");
  }
  return emptyField();
}

function cancellationPeriod(text: string): BillAnalysisField {
  const match = text.replace(/\s+/g, " ").match(/Kündigungsfrist[^\n]{0,100}?((?:\d+\s*(?:Wochen?|Monate?|Monat|Tage?)))/i);
  return match ? field(match[1], "high") : emptyField();
}

function address(text: string): BillAnalysisField {
  const normalized = text.replace(/\s+/g, " ");
  const match = normalized.match(/(?:Lieferadresse|Verbrauchsstelle|Adresse)\s*:?\s*([A-ZÄÖÜ][A-Za-zÄÖÜäöüß .'-]{2,60}\s+\d{1,4}[A-Za-z]?[,]?\s+\d{5}\s+[A-ZÄÖÜ][A-Za-zÄÖÜäöüß .'-]{2,50})/i);
  return match ? field(match[1].trim(), "medium") : emptyField();
}

export function parseBillText(text: string): BillAnalysisResult {
  const normalized = clean(text);
  const result = emptyBillAnalysis();
  result.energyType = energyType(normalized);
  result.provider = provider(normalized);
  result.annualConsumptionKwh = annualConsumption(normalized);
  result.workPriceCtPerKwh = workPrice(normalized);
  result.basePriceEurPerYear = basePrice(normalized);
  result.monthlyPaymentEur = monthlyPayment(normalized);
  result.billingPeriod = billingPeriod(normalized);
  result.contractEnd = contractEnd(normalized);
  result.cancellationPeriod = cancellationPeriod(normalized);
  result.address = address(normalized);
  return result;
}

export async function analyzeBill(file: File): Promise<BillAnalysisResult> {
  const text = await textOf(file);
  if (!text.trim()) throw new Error("NO_TEXT_DETECTED");
  return parseBillText(text);
}
