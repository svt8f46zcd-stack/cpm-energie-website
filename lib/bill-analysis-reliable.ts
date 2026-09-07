"use client";

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

type TesseractApi = { createWorker: (...args: any[]) => Promise<any> };

declare global { interface Window { Tesseract?: TesseractApi } }

const OCR_SOURCES = [
  "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.1.1/tesseract.min.js",
];
const WORKER_SOURCES = [
  "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/worker.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.1.1/worker.min.js",
];
const CORE = "https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.0";
const LANG = "https://tessdata.projectnaptha.com/4.0.0";
const PDF = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.54/pdf.min.mjs";
const PDF_WORKER = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.54/pdf.worker.min.mjs";

let ocrLoader: Promise<TesseractApi> | null = null;
let pdfLoader: Promise<any> | null = null;

const empty = (): BillAnalysisField => ({ value: null, confidence: "unknown", source: "not_detected" });
const field = (value: string | number | null, confidence: BillAnalysisField["confidence"] = "medium"): BillAnalysisField =>
  value === null || value === "" ? empty() : { value, confidence, source: "document" };

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[data-cpm-ocr-src="${src}"]`);
    if (existing) {
      if (window.Tesseract) return resolve();
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("OCR_LIBRARY_LOAD_FAILED")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.dataset.cpmOcrSrc = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("OCR_LIBRARY_LOAD_FAILED"));
    document.head.appendChild(script);
  });
}

async function getTesseract() {
  if (typeof window === "undefined" || typeof document === "undefined") throw new Error("OCR_LIBRARY_LOAD_FAILED");
  if (window.Tesseract) return window.Tesseract;
  if (ocrLoader) return ocrLoader;
  ocrLoader = (async () => {
    let last: unknown;
    for (const src of OCR_SOURCES) {
      try {
        await loadScript(src);
        if (window.Tesseract) return window.Tesseract;
      } catch (error) { last = error; }
    }
    throw last instanceof Error ? last : new Error("OCR_LIBRARY_LOAD_FAILED");
  })().catch(error => {
    ocrLoader = null;
    throw error;
  });
  return ocrLoader;
}

async function getPdfJs() {
  if (pdfLoader) return pdfLoader;
  const dynamicImport = new Function("u", "return import(u)") as (u: string) => Promise<any>;
  pdfLoader = dynamicImport(PDF).then(mod => {
    if (mod?.GlobalWorkerOptions) mod.GlobalWorkerOptions.workerSrc = PDF_WORKER;
    return mod;
  }).catch(error => {
    pdfLoader = null;
    throw error;
  });
  return pdfLoader;
}

function fileLooksLikePdf(file: File) {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
}

function fileLooksLikeImage(file: File) {
  return /^image\/(jpeg|png|webp)$/i.test(file.type) || /\.(jpe?g|png|webp)$/i.test(file.name);
}

function imageToCanvas(file: File) {
  return new Promise<HTMLCanvasElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      try {
        const w = image.naturalWidth || image.width;
        const h = image.naturalHeight || image.height;
        if (!w || !h) throw new Error("IMAGE_DECODE_FAILED");
        const canvas = document.createElement("canvas");
        const scale = Math.min(3, Math.max(2, 2800 / Math.max(w, h)));
        canvas.width = Math.min(7000, Math.ceil(w * scale));
        canvas.height = Math.min(7000, Math.ceil(h * scale));
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) throw new Error("IMAGE_DECODE_FAILED");
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas);
      } catch (error) { reject(error); }
      finally { URL.revokeObjectURL(url); }
    };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("IMAGE_DECODE_FAILED")); };
    image.src = url;
  });
}

function prepare(source: HTMLCanvasElement, mode: "color" | "gray" | "threshold") {
  if (mode === "color") return source;
  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return source;
  ctx.drawImage(source, 0, 0);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < data.data.length; i += 4) {
    const l = 0.299 * data.data[i] + 0.587 * data.data[i + 1] + 0.114 * data.data[i + 2];
    const v = mode === "threshold" ? (l < 185 ? 0 : 255) : Math.max(0, Math.min(255, (l - 128) * 1.7 + 128));
    data.data[i] = data.data[i + 1] = data.data[i + 2] = v;
  }
  ctx.putImageData(data, 0, 0);
  return canvas;
}

async function createWorker(api: TesseractApi) {
  let last: unknown;
  for (const workerPath of WORKER_SOURCES) {
    try {
      return await api.createWorker("deu", 1, {
        workerPath,
        langPath: LANG,
        corePath: CORE,
        workerBlobURL: false,
      });
    } catch (error) { last = error; }
  }
  throw last instanceof Error ? last : new Error("OCR_WORKER_LOAD_FAILED");
}

async function ocrCanvas(canvas: HTMLCanvasElement) {
  const api = await getTesseract();
  const worker = await createWorker(api);
  const texts: string[] = [];
  try {
    for (const psm of [6, 11]) {
      for (const mode of ["color", "gray", "threshold"] as const) {
        try {
          const result = await worker.recognize(prepare(canvas, mode), { rotateAuto: true }, {
            tessedit_pageseg_mode: String(psm),
            preserve_interword_spaces: "1",
            user_defined_dpi: "300",
          });
          const text = String(result?.data?.text || "").trim();
          if (text) texts.push(text);
          if (/(E\.ON|ENTEGA|EnBW|Vattenfall|Mainova|goldgas)/i.test(text) && /(kWh|Arbeitspreis|Grundpreis|Verbrauch)/i.test(text)) return texts.join("\n");
        } catch {
          // Try the next preprocessing mode instead of aborting the whole invoice.
        }
      }
    }
  } finally { await worker.terminate(); }
  return texts.join("\n");
}

async function pdfNative(file: File) {
  const pdf = await getPdfJs();
  const doc = await pdf.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages: string[] = [];
  for (let n = 1; n <= Math.min(12, doc.numPages); n++) {
    const page = await doc.getPage(n);
    const content = await page.getTextContent();
    const text = (content.items as any[]).map(item => typeof item?.str === "string" ? item.str : "").join(" ").replace(/\s+/g, " ").trim();
    if (text) pages.push(text);
  }
  return pages.join("\n");
}

async function pdfOcr(file: File) {
  const pdf = await getPdfJs();
  const doc = await pdf.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages: string[] = [];
  for (let n = 1; n <= Math.min(12, doc.numPages); n++) {
    const page = await doc.getPage(n);
    const viewport = page.getViewport({ scale: 2.5 });
    const canvas = document.createElement("canvas");
    canvas.width = Math.min(7000, Math.ceil(viewport.width));
    canvas.height = Math.min(7000, Math.ceil(viewport.height));
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) continue;
    await page.render({ canvasContext: ctx, viewport }).promise;
    const text = await ocrCanvas(canvas);
    if (text) pages.push(text);
  }
  return pages.join("\n");
}

function clean(text: string) {
  return text
    .replace(/\u00a0/g, " ")
    .replace(/[‐‑‒–—]/g, "-")
    .replace(/\r/g, "\n")
    .replace(/[|]/g, " ")
    .replace(/\b(?:kvvh|kvwh|kwn|kvn)\b/gi, "kWh")
    .replace(/k\s*[vw]\s*[whn]/gi, "kWh")
    .replace(/jahresverh?rauch|jahresverhrauch/gi, "Jahresverbrauch")
    .replace(/ges[a4]mtverbrauch|gesammtverbrauch/gi, "Gesamtverbrauch")
    .replace(/arbeit\s*(?:s|ss)?\s*pre[i1]s|arbeitspre[il]s|ar[bp]atspre[i1]s/gi, "Arbeitspreis")
    .replace(/grund[o0]reis|grundpre[i1]s|grundoeis/gi, "Grundpreis")
    .replace(/verbrauch\s*spre[i1]s|verbrauchspre[il]s/gi, "Verbrauchspreis")
    .replace(/e\s*[.]?\s*n\s*t\s*e\s*g\s*a/gi, "ENTEGA")
    .replace(/e\s*[.]?\s*o\s*n/gi, "E.ON")
    .replace(/c\s*t\s*\/\s*k\s*[vw]\s*[whn]/gi, "ct/kWh")
    .replace(/c\s*t\s*\/\s*kwh/gi, "ct/kWh")
    .replace(/cent\s*\/\s*kwh/gi, "ct/kWh")
    .replace(/[ \t]+/g, " ");
}

function parseNumber(raw: string) {
  let value = raw.replace(/\s/g, "").replace(/[^0-9,.-]/g, "");
  if (!value) return null;
  const comma = value.lastIndexOf(",");
  const dot = value.lastIndexOf(".");
  if (comma >= 0 && dot >= 0) value = comma > dot ? value.replace(/\./g, "").replace(",", ".") : value.replace(/,/g, "");
  else if (comma >= 0) value = value.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}\.\d{3}$/.test(value)) value = value.replace(".", "");
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

const NUMBER = "\\d{1,3}(?:[.,]\\d{3})*(?:[.,]\\d{1,3})?|\\d{4,7}(?:[.,]\\d{1,3})?";
const lines = (text: string) => text.split(/\n+/).map(x => x.trim()).filter(Boolean);

function provider(text: string) {
  const providers: Array<[RegExp, string]> = [
    [/e\.?\s*n\.?\s*t\.?\s*e\.?\s*g\.?\s*a/i, "ENTEGA"],
    [/e\.?\s*o\.?\s*n\b|eon\b/i, "E.ON"],
    [/goldgas/i, "goldgas"], [/enbw/i, "EnBW"], [/vattenfall/i, "Vattenfall"],
    [/mainova/i, "Mainova"], [/rhein\s*energie/i, "RheinEnergie"], [/yello/i, "Yello"],
    [/lichtblick/i, "LichtBlick"], [/naturstrom/i, "Naturstrom"], [/eprimo/i, "eprimo"],
    [/ewe/i, "EWE"], [/enercity/i, "enercity"], [/süwag/i, "Süwag"],
    [/mvv\s+energie/i, "MVV Energie"], [/lekker/i, "lekker Energie"],
  ];
  for (const [pattern, name] of providers) if (pattern.test(text)) return field(name, "high");
  return empty();
}

function energyType(text: string) {
  const gas = /\bgas\b|gasrechnung|gasverbrauch|erdgas|gas\s+et/i.test(text);
  const strom = /\bstrom\b|stromrechnung|stromverbrauch|ökostrom|okostrom|optimalstrom|strom\s+et/i.test(text);
  const value = gas && strom ? "Strom + Gas" : gas ? "Gas" : strom ? "Strom" : null;
  return field(value, value ? "high" : "unknown");
}

function annualConsumption(text: string) {
  const hits: Array<{ value: number; score: number; index: number }> = [];
  const add = (value: number | null, score: number, index: number) => { if (value !== null && value >= 300 && value <= 100000) hits.push({ value, score, index }); };
  lines(text).forEach((line, index) => {
    if (!/(Jahresverbrauch|Gesamtverbrauch|Verbrauch\/Menge|Verbrauch\s+gesamt|Ihr\s+Verbrauch|Abgerechneter\s+Verbrauch|Gesamtverbrauch)/i.test(line)) return;
    for (const m of line.matchAll(new RegExp(`(${NUMBER})\\s*kWh`, "gi"))) add(parseNumber(m[1]), 1200, index);
    for (const m of line.matchAll(new RegExp(`(?:Jahresverbrauch|Gesamtverbrauch)[^0-9]{0,120}(${NUMBER})`, "gi"))) add(parseNumber(m[1]), 1100, index);
  });
  for (const m of text.matchAll(new RegExp(`(?:Jahresverbrauch|Gesamtverbrauch|Verbrauch\\s+gesamt|Abgerechneter\\s+Verbrauch)[^\\n]{0,180}?(${NUMBER})\\s*kWh`, "gi"))) add(parseNumber(m[1]), 1000, m.index ?? 0);
  if (!hits.length) for (const m of text.matchAll(new RegExp(`(${NUMBER})\\s*kWh`, "gi"))) add(parseNumber(m[1]), 120, m.index ?? 0);
  hits.sort((a, b) => b.score - a.score || a.index - b.index);
  return hits.length ? field(hits[0].value, hits[0].score >= 1000 ? "high" : "medium") : empty();
}

function workPrice(text: string) {
  const hits: Array<{ value: number; score: number; index: number }> = [];
  const add = (value: number | null, score: number, index: number) => { if (value !== null && value >= 2 && value <= 100) hits.push({ value, score, index }); };
  const ct = `(\\d{1,3}[,.]\\d{1,4})\\s*(?:ct|c|cent)\\s*(?:\\/|pro)\\s*kWh`;
  const eur = `(\\d{1,3}[,.]\\d{1,4})\\s*(?:€|EUR)\\s*(?:\\/|pro)\\s*kWh`;
  lines(text).forEach((line, index) => {
    if (!/(Arbeitspreis|Verbrauchspreis)/i.test(line)) return;
    for (const m of line.matchAll(new RegExp(ct, "gi"))) add(parseNumber(m[1]), 1200, index);
    for (const m of line.matchAll(new RegExp(eur, "gi"))) { const n = parseNumber(m[1]); add(n === null ? null : n * 100, 1100, index); }
  });
  if (!hits.length) for (const m of text.matchAll(new RegExp(ct, "gi"))) add(parseNumber(m[1]), 250, m.index ?? 0);
  hits.sort((a, b) => b.score - a.score || a.index - b.index);
  return hits.length ? field(Math.round(hits[0].value * 100) / 100, hits[0].score >= 1000 ? "high" : "medium") : empty();
}

function basePrice(text: string) {
  const hits: Array<{ value: number; score: number; index: number }> = [];
  const add = (value: number | null, score: number, index: number) => { if (value !== null && value >= 0 && value <= 5000) hits.push({ value, score, index }); };
  for (const [index, line] of lines(text).entries()) {
    if (!/Grundpreis/i.test(line)) continue;
    const annual = line.match(new RegExp(`(${NUMBER})\\s*(?:€|EUR)\\s*(?:\\/\\s*|pro\\s*)?(?:Jahr|jährlich|a\\b)`, "i"));
    if (annual) add(parseNumber(annual[1]), 1200, index);
    const monthly = line.match(new RegExp(`(${NUMBER})\\s*(?:€|EUR)\\s*(?:\\/\\s*Monat|pro\\s+Monat|monatlich)`, "i"));
    if (monthly) { const n = parseNumber(monthly[1]); add(n === null ? null : n * 12, 1100, index); }
    const days = line.match(new RegExp(`(${NUMBER})\\s*(?:€|EUR)\\s*\\/\\s*(?:\\d+\\s*)?Tage`, "i"));
    if (days) add(parseNumber(days[1]), 900, index);
  }
  hits.sort((a, b) => b.score - a.score || a.index - b.index);
  return hits.length ? field(Math.round(hits[0].value * 100) / 100, hits[0].score >= 1100 ? "high" : "medium") : empty();
}

function monthlyPayment(text: string) {
  const hits: Array<{ value: number; score: number; index: number }> = [];
  const add = (value: number | null, score: number, index: number) => { if (value !== null && value >= 20 && value <= 5000) hits.push({ value, score, index }); };
  for (const [index, line] of lines(text).entries()) {
    if (!/(neuer\s+Abschlag|monatlicher\s+Abschlag|Abschlagszahlung|Abschlag\s+pro\s+Monat)/i.test(line)) continue;
    if (/(Gutschrift|Gesamt|Summe)/i.test(line)) continue;
    for (const m of line.matchAll(new RegExp(`(${NUMBER})\\s*(?:€|EUR)`, "gi"))) add(parseNumber(m[1]), 1100, index);
  }
  hits.sort((a, b) => b.score - a.score || a.index - b.index);
  return hits.length ? field(Math.round(hits[0].value * 100) / 100, "high") : empty();
}

function tariffName(text: string) {
  const patterns = [
    /(?:Ihr|Ihre)\s+(?:Tarif|Produkt)\s*[:\-]\s*([^\n]{3,100})/i,
    /Tarif\s*[:\-]\s*([^\n]{3,100})/i,
    /Ihre\s+Energiekosten\s+(?:E\.ON|ENTEGA)\s+([^\n]{3,100}?)(?=\s+Zeitraum|\s+Menge|$)/i,
  ];
  for (const re of patterns) { const m = text.match(re); if (m?.[1]) return field(m[1].replace(/\s+/g, " ").trim(), "medium"); }
  return empty();
}

function billingPeriod(text: string) {
  const matches = [...text.matchAll(/(\d{1,2}[./]\d{1,2}[./]\d{2,4})\s*(?:-|bis)\s*(\d{1,2}[./]\d{1,2}[./]\d{2,4})/g)];
  if (!matches.length) return empty();
  const toTime = (s: string) => { const [d, m, y] = s.replace(/\//g, ".").split(".").map(Number); return new Date(y < 100 ? y + 2000 : y, m - 1, d).getTime(); };
  matches.sort((a, b) => Math.abs(toTime(b[2]) - toTime(b[1])) - Math.abs(toTime(a[2]) - toTime(a[1])));
  return field(`${matches[0][1].replace(/\//g, ".")} - ${matches[0][2].replace(/\//g, ".")}`, "high");
}

function contractEnd(text: string) {
  const m = text.match(/(?:Vertragsende|Vertragslaufzeit\s*bis|Vertrag\s*endet\s*am)[\s:]+(\d{1,2}[./]\d{1,2}[./]\d{2,4})/i);
  return field(m?.[1]?.replace(/\//g, ".") ?? null, m ? "medium" : "unknown");
}

function cancellationPeriod(text: string) {
  const m = text.match(/K(?:ü|u)ndigungsfrist[\s:]+([^\n]{1,100})/i);
  return field(m?.[1]?.trim() ?? null, m ? "medium" : "unknown");
}

function address(text: string) {
  const m = text.match(/(?:Lieferadresse|Verbrauchsstelle|Verbrauchsadresse|Anschrift)[\s:]+([^\n]{5,160})/i);
  return field(m?.[1]?.trim() ?? null, m ? "medium" : "unknown");
}

function parse(text: string): BillAnalysisResult {
  const t = clean(text);
  return {
    energyType: energyType(t), provider: provider(t), tariffName: tariffName(t),
    annualConsumptionKwh: annualConsumption(t), workPriceCtPerKwh: workPrice(t),
    basePriceEurPerYear: basePrice(t), monthlyPaymentEur: monthlyPayment(t),
    billingPeriod: billingPeriod(t), contractEnd: contractEnd(t),
    cancellationPeriod: cancellationPeriod(t), address: address(t),
  };
}

export async function analyzeBill(file: File): Promise<BillAnalysisResult> {
  if (typeof window === "undefined") throw new Error("BILL_ANALYSIS_BROWSER_ONLY");
  let text = "";
  if (fileLooksLikePdf(file)) {
    const native = await pdfNative(file);
    const nativeResult = parse(native);
    const nativeUsable = [nativeResult.energyType.value, nativeResult.provider.value, nativeResult.annualConsumptionKwh.value, nativeResult.workPriceCtPerKwh.value, nativeResult.basePriceEurPerYear.value].filter(v => v !== null && v !== "").length;
    if (native.length >= 120 && nativeUsable >= 2) return nativeResult;
    text = [native, await pdfOcr(file)].filter(Boolean).join("\n");
  } else if (fileLooksLikeImage(file)) {
    text = await ocrCanvas(await imageToCanvas(file));
  } else {
    throw new Error("UNSUPPORTED_FILE_TYPE");
  }

  const result = parse(text);
  const usable = [result.energyType.value, result.provider.value, result.annualConsumptionKwh.value, result.workPriceCtPerKwh.value, result.basePriceEurPerYear.value].filter(v => v !== null && v !== "").length;
  if (!usable) throw new Error("NO_USABLE_DATA");
  return result;
}
