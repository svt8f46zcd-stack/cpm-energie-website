export type BillAnalysisField = {
  value: string | number | null;
  confidence: "high" | "medium" | "low" | "unknown";
  source: "document" | "not_detected";
};

export type BillAnalysisResult = {
  energyType: BillAnalysisField;
  provider: BillAnalysisField;
  tariffName: BillAnalysisField;
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
  "energyType",
  "provider",
  "tariffName",
  "annualConsumptionKwh",
  "workPriceCtPerKwh",
  "basePriceEurPerYear",
  "monthlyPaymentEur",
  "billingPeriod",
  "contractEnd",
  "cancellationPeriod",
  "address",
];

type Confidence = BillAnalysisField["confidence"];
type Hit = { value: number; score: number; index: number };

const OCR = "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";
const PDF = "https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.54/build/pdf.mjs";
let ocrPromise: Promise<void> | null = null;
let pdfPromise: Promise<any> | null = null;

declare global {
  interface Window {
    Tesseract?: any;
  }
}

const empty = (): BillAnalysisField => ({ value: null, confidence: "unknown", source: "not_detected" });
const field = (value: string | number | null, confidence: Confidence = "medium"): BillAnalysisField =>
  value === null || value === "" ? empty() : { value, confidence, source: "document" };

export function emptyBillAnalysis(): BillAnalysisResult {
  return {
    energyType: empty(),
    provider: empty(),
    tariffName: empty(),
    annualConsumptionKwh: empty(),
    workPriceCtPerKwh: empty(),
    basePriceEurPerYear: empty(),
    monthlyPaymentEur: empty(),
    billingPeriod: empty(),
    contractEnd: empty(),
    cancellationPeriod: empty(),
    address: empty(),
  };
}

function loadScript(src: string) {
  if (typeof document === "undefined") return Promise.reject(new Error("OCR_LIBRARY_LOAD_FAILED"));
  if (window.Tesseract) return Promise.resolve();
  if (ocrPromise) return ocrPromise;
  ocrPromise = new Promise<void>((resolve, reject) => {
    const old = document.querySelector<HTMLScriptElement>(`script[data-cpm-ocr="${src}"]`);
    if (old) {
      old.addEventListener("load", () => resolve(), { once: true });
      old.addEventListener("error", () => reject(new Error("OCR_LIBRARY_LOAD_FAILED")), { once: true });
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
  return ocrPromise;
}

async function pdfjs() {
  if (pdfPromise) return pdfPromise;
  const dynamicImport = new Function("u", "return import(u)") as (u: string) => Promise<any>;
  pdfPromise = dynamicImport(PDF);
  return pdfPromise;
}

function copySource(source: unknown) {
  if (typeof document === "undefined") return null;
  if (!(source instanceof HTMLCanvasElement) && !(source instanceof HTMLImageElement)) return null;
  const canvas = document.createElement("canvas");
  canvas.width = source instanceof HTMLCanvasElement ? source.width : source.naturalWidth || source.width;
  canvas.height = source instanceof HTMLCanvasElement ? source.height : source.naturalHeight || source.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0);
  return canvas;
}

function enhance(source: unknown, mode: "color" | "gray" | "threshold") {
  const original = copySource(source);
  if (!original) return source;
  const canvas = document.createElement("canvas");
  const scale = 2;
  canvas.width = Math.ceil(original.width * scale);
  canvas.height = Math.ceil(original.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return original;
  ctx.drawImage(original, 0, 0, canvas.width, canvas.height);
  if (mode === "color") return canvas;

  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < data.data.length; i += 4) {
    const luminance = 0.299 * data.data[i] + 0.587 * data.data[i + 1] + 0.114 * data.data[i + 2];
    const value = mode === "threshold" ? (luminance < 175 ? 0 : 255) : Math.max(0, Math.min(255, (luminance - 128) * 1.45 + 128));
    data.data[i] = data.data[i + 1] = data.data[i + 2] = value;
  }
  ctx.putImageData(data, 0, 0);
  return canvas;
}

async function imageCanvas(file: File) {
  return new Promise<HTMLCanvasElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth || image.width;
      canvas.height = image.naturalHeight || image.height;
      const ctx = canvas.getContext("2d");
      URL.revokeObjectURL(url);
      if (!ctx) return reject(new Error("IMAGE_DECODE_FAILED"));
      ctx.drawImage(image, 0, 0);
      resolve(canvas);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("IMAGE_DECODE_FAILED"));
    };
    image.src = url;
  });
}

async function worker() {
  await loadScript(OCR);
  if (!window.Tesseract) throw new Error("OCR_LIBRARY_LOAD_FAILED");
  return window.Tesseract.createWorker("deu");
}

async function ocrSource(source: unknown) {
  const w = await worker();
  const texts: string[] = [];
  try {
    for (const mode of ["color", "gray", "threshold"] as const) {
      const result = await w.recognize(
        enhance(source, mode),
        { rotateAuto: true },
        { tessedit_pageseg_mode: "6", preserve_interword_spaces: "1", user_defined_dpi: "300" },
      );
      const text = String(result?.data?.text || "");
      if (text.trim()) texts.push(text);
      if (/(arbeit\s*spreis|verbrauchs\s*preis|grund\s*preis|neuer?\s+abschlag)/i.test(text) && /(?:ct\s*\/\s*kWh|cent\s*\/\s*kWh|€\s*\/\s*(?:jahr|a))/i.test(text)) break;
    }
  } finally {
    await w.terminate();
  }
  return texts.join("\n");
}

async function extractPdf(file: File) {
  const pdf = await pdfjs();
  const documentProxy = await pdf.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= Math.min(12, documentProxy.numPages); pageNumber++) {
    const page = await documentProxy.getPage(pageNumber);
    const content = await page.getTextContent();
    const items = content.items as any[];
    const text = items.map(item => (typeof item?.str === "string" ? item.str : "")).join(" ").replace(/\s+/g, " ").trim();
    if (text) pages.push(text);
  }
  return pages.join("\n");
}

async function pdfOcr(file: File) {
  const pdf = await pdfjs();
  const documentProxy = await pdf.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const w = await worker();
  const pages: string[] = [];
  try {
    for (let pageNumber = 1; pageNumber <= Math.min(12, documentProxy.numPages); pageNumber++) {
      const page = await documentProxy.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 2.4 });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;
      await page.render({ canvasContext: ctx, viewport }).promise;
      pages.push(await ocrSourceWithWorker(w, canvas));
    }
  } finally {
    await w.terminate();
  }
  return pages.join("\n");
}

async function ocrSourceWithWorker(w: any, source: unknown) {
  const result = await w.recognize(
    enhance(source, "color"),
    { rotateAuto: true },
    { tessedit_pageseg_mode: "6", preserve_interword_spaces: "1", user_defined_dpi: "300" },
  );
  return String(result?.data?.text || "");
}

function clean(text: string) {
  return text
    .replace(/\u00a0/g, " ")
    .replace(/[|]/g, " ")
    .replace(/[‐‑‒–—]/g, "-")
    .replace(/\r/g, "\n")
    .replace(/\b(?:kwh|kvvh|kvwh|kwn|kvn)\b/gi, "kWh")
    .replace(/k\s*[vw]\s*[whn]/gi, "kWh")
    .replace(/grund[o0]reis|grundpre[i1]s|grundoeis/gi, "Grundpreis")
    .replace(/arbeit\s*(?:s|ss)?\s*pre[i1]s|arbeitspre[il]s|ar[bp]atspre[i1]s/gi, "Arbeitspreis")
    .replace(/verbrauch\s*spre[i1]s|verbrauchspre[i1]s/gi, "Verbrauchspreis")
    .replace(/jahresverh?rauch|jahresverhrauch/gi, "Jahresverbrauch")
    .replace(/str[o0]m/gi, "Strom")
    .replace(/e\s*[.]?\s*o\s*n/gi, "E.ON")
    .replace(/c\s*t\s*\/\s*k\s*[vw]\s*[whn]/gi, "ct/kWh")
    .replace(/c\s*t\s*\/\s*kwh/gi, "ct/kWh")
    .replace(/cent\s*\/\s*kWh/gi, "ct/kWh")
    .replace(/€\s*\/\s*kWh/gi, "€/kWh")
    .replace(/[ \t]+/g, " ");
}

const numberPattern = "\\d{1,3}(?:[.,]\\d{3})*(?:[.,]\\d{1,3})?|\\d{4,7}(?:[.,]\\d{1,3})?";

function parseNumber(raw: string) {
  let value = raw.replace(/\s/g, "").replace(/[^0-9,.-]/g, "");
  if (!value) return null;
  const comma = value.lastIndexOf(",");
  const dot = value.lastIndexOf(".");
  if (comma >= 0 && dot >= 0) value = comma > dot ? value.replace(/\./g, "").replace(",", ".") : value.replace(/,/g, "");
  else if (comma >= 0) value = value.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}\.\d{3}$/.test(value)) value = value.replace(".", "");
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizedLines(text: string) {
  return text
    .split(/\n+/)
    .map(line => line.trim())
    .filter(Boolean);
}

function annualConsumption(text: string) {
  const hits: Hit[] = [];
  const add = (value: number | null, score: number, index: number) => {
    if (value !== null && value >= 300 && value <= 100000) hits.push({ value, score, index });
  };

  const lines = normalizedLines(text);
  lines.forEach((line, index) => {
    if (!/(Jahresverbrauch|Verbrauch\/Menge|Verbrauch\s+im\s+Abrechnungsjahr|Ihr\s+Verbrauch|Verbrauch\s+gesamt|Gesamtverbrauch|Summe)/i.test(line)) return;
    for (const match of line.matchAll(new RegExp(`(${numberPattern})\\s*kWh`, "gi"))) {
      add(parseNumber(match[1]), /Jahresverbrauch|Gesamtverbrauch|Summe/i.test(line) ? 950 : 850, index);
    }
  });

  for (const match of text.matchAll(new RegExp(`(?:Jahresverbrauch|Verbrauch\\s+gesamt|Gesamtverbrauch)[^\\n]{0,160}?(${numberPattern})\\s*kWh`, "gi"))) {
    add(parseNumber(match[1]), 900, match.index ?? 0);
  }

  for (const match of text.matchAll(new RegExp(`(${numberPattern})\\s*kWh`, "gi"))) {
    add(parseNumber(match[1]), 80, match.index ?? 0);
  }

  if (!hits.length) return empty();
  hits.sort((a, b) => b.score - a.score || a.index - b.index);
  return field(hits[0].value, hits[0].score >= 850 ? "high" : "medium");
}

function workPrice(text: string) {
  const hits: Hit[] = [];
  const add = (value: number | null, score: number, index: number) => {
    if (value !== null && value >= 5 && value <= 100) hits.push({ value, score, index });
  };

  const pricePattern = `(\\d{1,3}[,.]\\d{1,3})\\s*(?:ct|c|cent)\\s*(?:\\/|pro)\\s*kWh`;
  const eurPattern = `(\\d{1,3}[,.]\\d{1,4})\\s*(?:€|EUR)\\s*(?:\\/|pro)\\s*kWh`;

  for (const line of normalizedLines(text)) {
    if (!/(Arbeitspreis|Verbrauchspreis)/i.test(line)) continue;
    for (const match of line.matchAll(new RegExp(pricePattern, "gi"))) add(parseNumber(match[1]), 1000, line.length);
    for (const match of line.matchAll(new RegExp(eurPattern, "gi"))) {
      const value = parseNumber(match[1]);
      if (value !== null) add(value * 100, 900, line.length);
    }

    const bare = line.match(new RegExp(`(?:Arbeitspreis|Verbrauchspreis)[^\\n]*?(${numberPattern})\\s*(?:ct|c|cent)\\s*(?:\\/\\s*)?kWh`, "i"));
    if (bare) add(parseNumber(bare[1]), 950, line.length);
  }

  for (const match of text.matchAll(new RegExp(`(?:Arbeitspreis|Verbrauchspreis)[\\s\\S]{0,450}?${pricePattern}`, "gi"))) {
    const price = match[0].match(new RegExp(pricePattern, "i"));
    if (price) add(parseNumber(price[1]), 900, match.index ?? 0);
  }

  if (!hits.length) {
    for (const match of text.matchAll(new RegExp(pricePattern, "gi"))) add(parseNumber(match[1]), 200, match.index ?? 0);
  }

  if (!hits.length) return empty();
  hits.sort((a, b) => b.score - a.score || a.index - b.index);
  return field(Math.round(hits[0].value * 100) / 100, hits[0].score >= 900 ? "high" : "medium");
}

function basePrice(text: string) {
  const hits: Hit[] = [];
  const add = (value: number | null, score: number, index: number) => {
    if (value !== null && value >= 20 && value <= 5000) hits.push({ value, score, index });
  };

  const annualPatterns = [
    /(\d{1,5}[,.]\d{1,3})\s*(?:€|EUR)\s*(?:\/\s*|pro\s*)?(?:Jahr|Jahr\b|a\b)/i,
    /(\d{1,5}[,.]\d{1,3})\s*(?:€|EUR)\s*(?:im\s+Jahr|jährlich)/i,
  ];
  const monthlyPattern = /(\d{1,4}[,.]\d{1,3})\s*(?:€|EUR)\s*(?:\/\s*Monat|pro\s+Monat|monatlich)/i;

  for (const line of normalizedLines(text)) {
    if (!/Grundpreis/i.test(line)) continue;
    for (const pattern of annualPatterns) {
      const match = line.match(pattern);
      if (match) add(parseNumber(match[1]), 1000, line.length);
    }
    const monthly = line.match(monthlyPattern);
    if (monthly) {
      const value = parseNumber(monthly[1]);
      if (value !== null) add(value * 12, 900, line.length);
    }

    // Common table layout: "Grundpreis 90,83 EUR / 365 Tage".
    const dayRate = line.match(/(\d{1,5}[,.]\d{1,3})\s*(?:€|EUR)\s*\/\s*(?:\d{1,3}\s*)?Tage?/i);
    if (dayRate) {
      const value = parseNumber(dayRate[1]);
      if (value !== null) add(value * 365 / 365, 850, line.length);
    }
  }

  for (const match of text.matchAll(/Grundpreis[\s\S]{0,500}?([0-9]{1,5}[,.][0-9]{1,3})\s*(?:€|EUR)\s*(?:\/\s*|pro\s*)?(?:Jahr|a)\b/gi)) {
    add(parseNumber(match[1]), 950, match.index ?? 0);
  }

  if (!hits.length) return empty();
  hits.sort((a, b) => b.score - a.score || a.index - b.index);
  return field(Math.round(hits[0].value * 100) / 100, hits[0].score >= 900 ? "high" : "medium");
}

function monthlyPayment(text: string) {
  const hits: Hit[] = [];
  const add = (value: number | null, score: number, index: number) => {
    if (value !== null && value >= 20 && value <= 5000) hits.push({ value, score, index });
  };

  // First choice: an explicitly named new/current monthly payment.
  const preferredLabels = [
    /Ihr\s+neuer\s+Abschlag/i,
    /neuer\s+Abschlag/i,
    /monatlicher\s+Abschlag/i,
    /monatliche\s+Abschlagszahlung/i,
    /Abschlag\s+pro\s+Monat/i,
  ];
  for (const line of normalizedLines(text)) {
    if (!preferredLabels.some(pattern => pattern.test(line))) continue;
    for (const match of line.matchAll(/(\d{2,5}(?:[,.]\d{1,3})?)\s*(?:€|EUR)\b/gi)) add(parseNumber(match[1]), 1200, line.length);
    const before = line.match(/(?:Ihr\s+neuer\s+Abschlag|neuer\s+Abschlag|monatlicher\s+Abschlag)[^\d]{0,80}(\d{2,5}(?:[,.]\d{1,3})?)/i);
    if (before) add(parseNumber(before[1]), 1150, line.length);
  }

  // Payment schedules such as "15.09. 617,00 €" or "31.07.2019 57,00 EUR".
  for (const section of text.matchAll(/(?:Ihre\s+Zahlungen|geleistete\s+Abschläge|geleistete\s+Zahlungen)[\s\S]{0,900}/gi)) {
    const start = section.index ?? 0;
    for (const match of section[0].matchAll(/(?:\b\d{1,2}[./]\d{1,2}(?:[./]\d{2,4})?\b\s+)(\d{2,5}(?:[,.]\d{1,3})?)\s*(?:€|EUR)\b/gi)) {
      add(parseNumber(match[1]), 1000, start + (match.index ?? 0));
    }
  }

  // Generic explicit Abschlag line, but never a total/guthaben/open amount.
  if (!hits.length) {
    for (const line of normalizedLines(text)) {
      if (!/(?:Abschlag|Abschlagszahlung)/i.test(line)) continue;
      if (/(Gutschrift|offener\s+Betrag|Gesamt|Summe|Zahlungen\s+insgesamt)/i.test(line)) continue;
      const match = line.match(/(\d{2,5}(?:[,.]\d{1,3})?)\s*(?:€|EUR)\b/);
      if (match) add(parseNumber(match[1]), 700, line.length);
    }
  }

  if (!hits.length) return empty();
  hits.sort((a, b) => b.score - a.score || a.index - b.index);
  return field(Math.round(hits[0].value * 100) / 100, hits[0].score >= 1000 ? "high" : "medium");
}

function provider(text: string) {
  const providers: Array<[RegExp, string]> = [
    [/e\.?\s*o\.?\s*n\b/i, "E.ON"],
    [/goldgas/i, "goldgas"],
    [/enbw/i, "EnBW"],
    [/vattenfall/i, "Vattenfall"],
    [/mainova/i, "Mainova"],
    [/rheinen?ergie/i, "RheinEnergie"],
    [/stadtwerke\s+m[uü]nchen/i, "Stadtwerke München"],
    [/yello/i, "Yello"],
    [/lichtblick/i, "LichtBlick"],
    [/naturstrom/i, "Naturstrom"],
    [/\bewe\b/i, "EWE"],
    [/enercity/i, "enercity"],
    [/swm\b/i, "Stadtwerke München"],
    [/süwag/i, "Süwag"],
    [/eprimo/i, "eprimo"],
    [/mvv\s+energie/i, "MVV Energie"],
    [/lekker/i, "lekker Energie"],
  ];
  for (const [pattern, name] of providers) if (pattern.test(text)) return field(name, "high");
  return empty();
}

function energyType(text: string) {
  const gas = /\bgas\b|gaskosten|gasrechnung|gasverbrauch|gas\s+et/i.test(text);
  const electricity = /\bstrom\b|stromkosten|stromrechnung|stromverbrauch|optimalstrom|verbrauchspreis\s+et|strom\s+et/i.test(text);
  const value = electricity && gas ? "Strom + Gas" : gas ? "Gas" : electricity ? "Strom" : null;
  return field(value, value ? "high" : "unknown");
}

function tariffName(text: string) {
  const patterns = [
    /(?:Ihr|Ihre)\s+(?:Tarif|Produkt)\s*[:\-]\s*([^\n]{3,100})/i,
    /Produkt\s*[:\-]\s*([^\n]{3,100})/i,
    /Ihre\s+Energiekosten\s+(?:E\.ON|goldgas)\s+([^\n]{3,100}?)(?=\s+Zeitraum|\s+Menge|\s+Ihre|$)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return field(match[1].replace(/\s+/g, " ").trim(), "medium");
  }
  return empty();
}

function billingPeriod(text: string) {
  const dates = [...text.matchAll(/(\d{1,2}[./]\d{1,2}[./]\d{2,4})\s*(?:-|bis)\s*(\d{1,2}[./]\d{1,2}[./]\d{2,4})/g)].map(match => {
    const start = match[1].replace(/\//g, ".");
    const end = match[2].replace(/\//g, ".");
    const toDate = (value: string) => {
      const [day, month, year] = value.split(".").map(Number);
      return new Date(year < 100 ? year + 2000 : year, month - 1, day).getTime();
    };
    return { raw: `${start} - ${end}`, days: Math.abs(toDate(end) - toDate(start)) };
  });
  dates.sort((a, b) => b.days - a.days);
  return field(dates[0]?.raw ?? null, dates.length ? "high" : "unknown");
}

function contractEnd(text: string) {
  const match = text.match(/(?:Vertragsende|Vertragslaufzeit\s*bis|Belieferung\s*bis|Vertrag\s*endet\s*am)[\s:]+(\d{1,2}[./]\d{1,2}[./]\d{2,4})/i);
  return field(match?.[1]?.replace(/\//g, ".") ?? null, match ? "medium" : "unknown");
}

function cancellationPeriod(text: string) {
  const match = text.match(/k(?:ü|u)ndigungsfrist[\s:]+([^\n]{1,100})/i);
  return field(match?.[1]?.trim() ?? null, match ? "medium" : "unknown");
}

function address(text: string) {
  const match = text.match(/(?:Lieferadresse|Verbrauchsstelle|Verbrauchsadresse|Anschrift)[\s:]+([^\n]{5,140})/i);
  return field(match?.[1]?.trim() ?? null, match ? "medium" : "unknown");
}

function parse(text: string): BillAnalysisResult {
  const cleaned = clean(text);
  return {
    energyType: energyType(cleaned),
    provider: provider(cleaned),
    tariffName: tariffName(cleaned),
    annualConsumptionKwh: annualConsumption(cleaned),
    workPriceCtPerKwh: workPrice(cleaned),
    basePriceEurPerYear: basePrice(cleaned),
    monthlyPaymentEur: monthlyPayment(cleaned),
    billingPeriod: billingPeriod(cleaned),
    contractEnd: contractEnd(cleaned),
    cancellationPeriod: cancellationPeriod(cleaned),
    address: address(cleaned),
  };
}

async function textOf(file: File) {
  if (file.type !== "application/pdf") return ocrSource(await imageCanvas(file));
  const native = await extractPdf(file);
  const cleaned = clean(native);
  const hasConsumption = new RegExp(`(${numberPattern})\\s*kWh`, "i").test(cleaned);
  const hasPrice = /(?:Arbeitspreis|Verbrauchspreis)[\s\S]{0,700}(?:ct\s*\/\s*kWh|cent\s*\/\s*kWh|ct\s*kWh|€\s*\/\s*kWh)/i.test(cleaned);
  const hasBase = /Grundpreis[\s\S]{0,500}(?:€|EUR)/i.test(cleaned);
  if (native.length >= 100 && (hasConsumption || hasPrice || hasBase)) return native;
  return [native, await pdfOcr(file)].filter(Boolean).join("\n");
}

export async function analyzeBill(file: File): Promise<BillAnalysisResult> {
  if (typeof window === "undefined") throw new Error("BILL_ANALYSIS_BROWSER_ONLY");
  const endpoint = process.env.NEXT_PUBLIC_BILL_ANALYSIS_URL;
  if (endpoint) {
    const body = new FormData();
    body.append("file", file, file.name);
    const response = await fetch(endpoint, { method: "POST", body });
    if (!response.ok) throw new Error(`BILL_ANALYSIS_HTTP_${response.status}`);
    const data = await response.json();
    return data.result ?? data;
  }
  return parse(await textOf(file));
}
