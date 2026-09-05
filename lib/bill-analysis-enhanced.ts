import { analyzeBill as analyzeBillV3, type BillAnalysisField, type BillAnalysisResult } from "@/lib/bill-analysis-v3";

type Confidence = BillAnalysisField["confidence"];

type Candidate = { value: string | number; score: number; index: number };

const OCR = "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";
const PDF = "https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.54/build/pdf.mjs";
let ocrPromise: Promise<void> | null = null;
let pdfPromise: Promise<any> | null = null;

declare global { interface Window { Tesseract?: any } }

const empty = (): BillAnalysisField => ({ value: null, confidence: "unknown", source: "not_detected" });
const field = (value: string | number | null, confidence: Confidence = "medium"): BillAnalysisField =>
  value === null || value === "" ? empty() : { value, confidence, source: "document" };

function loadScript() {
  if (typeof document === "undefined") return Promise.reject(new Error("OCR_LIBRARY_LOAD_FAILED"));
  if (window.Tesseract) return Promise.resolve();
  if (ocrPromise) return ocrPromise;
  ocrPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[data-cpm-enhanced-ocr="1"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("OCR_LIBRARY_LOAD_FAILED")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = OCR;
    script.async = true;
    script.dataset.cpmEnhancedOcr = "1";
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

function enhanceCanvas(source: HTMLCanvasElement | HTMLImageElement) {
  const canvas = document.createElement("canvas");
  const scale = Math.min(3, Math.max(2, 2400 / Math.max(source.width || 1, source.height || 1)));
  canvas.width = Math.ceil((source instanceof HTMLImageElement ? source.naturalWidth || source.width : source.width) * scale);
  canvas.height = Math.ceil((source instanceof HTMLImageElement ? source.naturalHeight || source.height : source.height) * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return source;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function preprocess(source: HTMLCanvasElement, mode: "color" | "gray" | "threshold") {
  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return source;
  ctx.drawImage(source, 0, 0);
  if (mode === "color") return canvas;
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < data.data.length; i += 4) {
    const l = 0.299 * data.data[i] + 0.587 * data.data[i + 1] + 0.114 * data.data[i + 2];
    const v = mode === "threshold" ? (l < 180 ? 0 : 255) : Math.max(0, Math.min(255, (l - 128) * 1.65 + 128));
    data.data[i] = data.data[i + 1] = data.data[i + 2] = v;
  }
  ctx.putImageData(data, 0, 0);
  return canvas;
}

async function worker() {
  await loadScript();
  if (!window.Tesseract) throw new Error("OCR_LIBRARY_LOAD_FAILED");
  return window.Tesseract.createWorker("deu");
}

async function ocrCanvas(canvas: HTMLCanvasElement) {
  const w = await worker();
  const texts: string[] = [];
  try {
    for (const psm of [6, 4, 11]) {
      for (const mode of ["color", "gray"] as const) {
        const result = await w.recognize(preprocess(canvas, mode), { rotateAuto: true }, {
          tessedit_pageseg_mode: String(psm),
          preserve_interword_spaces: "1",
          user_defined_dpi: "300",
        });
        const text = String(result?.data?.text || "");
        if (text.trim()) texts.push(text);
        if (/(ENTEGA|E\.ON|goldgas|EnBW|Vattenfall|Mainova)/i.test(text) && /(Gesamtverbrauch|Jahresverbrauch|Arbeitspreis|Grundpreis)/i.test(text)) break;
      }
    }
  } finally { await w.terminate(); }
  return texts.join("\n");
}

async function imageText(file: File) {
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("IMAGE_DECODE_FAILED"));
      img.src = url;
    });
    return ocrCanvas(enhanceCanvas(image));
  } finally { URL.revokeObjectURL(url); }
}

async function pdfText(file: File) {
  const pdf = await pdfjs();
  const doc = await pdf.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const native: string[] = [];
  for (let n = 1; n <= Math.min(12, doc.numPages); n++) {
    const page = await doc.getPage(n);
    const content = await page.getTextContent();
    const text = (content.items as any[]).map(item => typeof item?.str === "string" ? item.str : "").join(" ");
    if (text.trim()) native.push(text);
  }
  const nativeText = native.join("\n");
  if (nativeText.length >= 300) return nativeText;

  const ocrPages: string[] = [];
  for (let n = 1; n <= Math.min(12, doc.numPages); n++) {
    const page = await doc.getPage(n);
    const viewport = page.getViewport({ scale: 2.6 });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;
    await page.render({ canvasContext: ctx, viewport }).promise;
    ocrPages.push(await ocrCanvas(canvas));
  }
  return [nativeText, ...ocrPages].filter(Boolean).join("\n");
}

function clean(text: string) {
  return text
    .replace(/\u00a0/g, " ")
    .replace(/[‐‑‒–—]/g, "-")
    .replace(/\r/g, "\n")
    .replace(/[|]/g, " ")
    .replace(/\b(?:kvvh|kvwh|kwn|kvn)\b/gi, "kWh")
    .replace(/k\s*[vw]\s*[whn]/gi, "kWh")
    .replace(/j[a4]hresverbrauch|jahresverh?rauch|jahresverhrauch/gi, "Jahresverbrauch")
    .replace(/ges[a4]mtverbrauch|gesammtverbrauch/gi, "Gesamtverbrauch")
    .replace(/verbrauch\s*\/\s*menge/gi, "Verbrauch/Menge")
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

const num = "\\d{1,3}(?:[.,]\\d{3})*(?:[.,]\\d{1,3})?|\\d{4,7}(?:[.,]\\d{1,3})?";

function number(raw: string) {
  let v = raw.replace(/\s/g, "").replace(/[^0-9,.-]/g, "");
  if (!v) return null;
  const comma = v.lastIndexOf(","), dot = v.lastIndexOf(".");
  if (comma >= 0 && dot >= 0) v = comma > dot ? v.replace(/\./g, "").replace(",", ".") : v.replace(/,/g, "");
  else if (comma >= 0) v = v.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}\.\d{3}$/.test(v)) v = v.replace(".", "");
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function lines(text: string) { return text.split(/\n+/).map(x => x.trim()).filter(Boolean); }
function best(candidates: Candidate[], highScore = 800) {
  if (!candidates.length) return empty();
  candidates.sort((a, b) => b.score - a.score || a.index - b.index);
  return field(candidates[0].value, candidates[0].score >= highScore ? "high" : "medium");
}

function provider(text: string) {
  const list: Array<[RegExp, string]> = [
    [/e\.?\s*n\.?\s*t\.?\s*e\.?\s*g\.?\s*a/i, "ENTEGA"], [/e\.\s*on\b|eon\b/i, "E.ON"], [/goldgas/i, "goldgas"], [/enbw/i, "EnBW"],
    [/vattenfall/i, "Vattenfall"], [/mainova/i, "Mainova"], [/rhein\s*energie/i, "RheinEnergie"], [/stadtwerke\s+m[uü]nchen|\bswm\b/i, "Stadtwerke München"],
    [/yello/i, "Yello"], [/lichtblick/i, "LichtBlick"], [/naturstrom/i, "Naturstrom"], [/eprimo/i, "eprimo"], [/ewe/i, "EWE"], [/enercity/i, "enercity"],
    [/süwag/i, "Süwag"], [/mvv\s+energie/i, "MVV Energie"], [/lekker/i, "lekker Energie"],
  ];
  for (const [re, name] of list) if (re.test(text)) return field(name, "high");
  return empty();
}

function energyType(text: string) {
  const gas = /\bgas\b|gasrechnung|gasverbrauch|erdgas/i.test(text);
  const electricity = /\bstrom\b|stromrechnung|stromverbrauch|ökostrom|o[kö]kostrom/i.test(text);
  const value = gas && electricity ? "Strom + Gas" : gas ? "Gas" : electricity ? "Strom" : null;
  return field(value, value ? "high" : "unknown");
}

function tariff(text: string) {
  const patterns = [
    /(?:Tarif|Produkt)\s*[:\-]\s*([^\n]{3,100})/i,
    /Tarif\s+([A-ZÄÖÜ][^\n]{2,90})/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1]) {
      const value = m[1].replace(/\s+/g, " ").replace(/\s+(?:Zeitraum|Marktlokations|Zählernummer).*$/i, "").trim();
      if (value.length >= 3 && !/nicht erkannt/i.test(value)) return field(value, "high");
    }
  }
  return empty();
}

function annualConsumption(text: string) {
  const c: Candidate[] = [];
  const add = (v: number | null, score: number, index: number) => { if (v !== null && v >= 300 && v <= 100000) c.push({ value: v, score, index }); };
  const ls = lines(text);
  ls.forEach((line, i) => {
    if (!/(Jahresverbrauch|Gesamtverbrauch|Verbrauch\/Menge|Verbrauch\s+im\s+Abrechnungsjahr|Ihr\s+Verbrauch)/i.test(line)) return;
    for (const m of line.matchAll(new RegExp(`(${num})\\s*(?:kWh|kwh)`, "gi"))) add(number(m[1]), 1200, i);
    for (const m of line.matchAll(new RegExp(`(?:Jahresverbrauch|Gesamtverbrauch)[^0-9]{0,80}(${num})`, "gi"))) add(number(m[1]), 1150, i);
  });
  for (const m of text.matchAll(new RegExp(`(?:Jahresverbrauch|Gesamtverbrauch)[^\\n]{0,180}?(${num})\\s*kWh`, "gi"))) add(number(m[1]), 1100, m.index ?? 0);

  // Many supplier tables put the unit in the column header and the total on a separate line.
  const context = /(?:Gesamtverbrauch|Jahresverbrauch|Verbrauch\/Menge)[\s\S]{0,900}/gi;
  for (const section of text.matchAll(context)) {
    const block = section[0];
    const values: number[] = [];
    for (const m of block.matchAll(new RegExp(`\\b(${num})\\b`, "g"))) {
      const v = number(m[1]);
      if (v !== null && v >= 300 && v <= 100000) values.push(v);
    }
    for (const v of values) add(v, 650, (section.index ?? 0) + values.indexOf(v));
    const kwhValues = [...block.matchAll(new RegExp(`(${num})\\s*kWh`, "gi"))].map(m => number(m[1])).filter((v): v is number => v !== null && v >= 300 && v <= 100000);
    if (kwhValues.length) add(Math.max(...kwhValues), 1050, section.index ?? 0);
    if (values.length >= 2) {
      const sum = values.filter(v => v >= 300 && v <= 50000).reduce((a, b) => a + b, 0);
      if (sum >= 300 && sum <= 100000) add(sum, 700, section.index ?? 0);
    }
  }
  return best(c, 1000);
}

function workPrice(text: string) {
  const c: Candidate[] = [];
  const add = (v: number | null, score: number, index: number) => { if (v !== null && v >= 5 && v <= 100) c.push({ value: Math.round(v * 100) / 100, score, index }); };
  const ct = `(\\d{1,3}[,.]\\d{1,3})\\s*(?:ct|c|cent)\\s*(?:\\/|pro)\\s*kWh`;
  const eur = `(\\d{1,3}[,.]\\d{1,4})\\s*(?:€|EUR)\\s*(?:\\/|pro)\\s*kWh`;
  for (const line of lines(text)) if (/(Arbeitspreis|Verbrauchspreis)/i.test(line)) {
    for (const m of line.matchAll(new RegExp(ct, "gi"))) add(number(m[1]), 1200, line.length);
    for (const m of line.matchAll(new RegExp(eur, "gi"))) { const v = number(m[1]); if (v !== null) add(v * 100, 1100, line.length); }
  }
  for (const m of text.matchAll(new RegExp(`(?:Arbeitspreis|Verbrauchspreis)[\\s\\S]{0,500}?${ct}`, "gi"))) { const p = m[0].match(new RegExp(ct, "i")); if (p) add(number(p[1]), 1000, m.index ?? 0); }
  return best(c, 1000);
}

function basePrice(text: string) {
  const c: Candidate[] = [];
  const add = (v: number | null, score: number, index: number) => { if (v !== null && v >= 20 && v <= 5000) c.push({ value: Math.round(v * 100) / 100, score, index }); };
  for (const line of lines(text)) if (/Grundpreis/i.test(line)) {
    const annual = line.match(new RegExp(`(${num})\\s*(?:€|EUR)\\s*(?:\\/\\s*|pro\\s*)?(?:Jahr|jährlich|a)\\b`, "i"));
    if (annual) add(number(annual[1]), 1200, line.length);
    const monthly = line.match(new RegExp(`(${num})\\s*(?:€|EUR)\\s*(?:\\/\\s*Monat|pro\\s+Monat|monatlich)`, "i"));
    if (monthly) { const v = number(monthly[1]); if (v !== null) add(v * 12, 1100, line.length); }
    const day = line.match(new RegExp(`(${num})\\s*(?:€|EUR)\\s*\\/\\s*(\\d{1,3})\\s*Tage?`, "i"));
    if (day) { const v = number(day[1]), days = number(day[2]); if (v !== null && days) add(v * 365 / days, 950, line.length); }
  }
  for (const m of text.matchAll(new RegExp(`Grundpreis[\\s\\S]{0,450}?(${num})\\s*(?:€|EUR)\\s*(?:\\/\\s*|pro\\s*)?(?:Jahr|a)\\b`, "gi"))) add(number(m[1]), 1050, m.index ?? 0);
  return best(c, 1000);
}

function monthly(text: string) {
  const c: Candidate[] = [];
  const add = (v: number | null, score: number, index: number) => { if (v !== null && v >= 20 && v <= 5000) c.push({ value: Math.round(v * 100) / 100, score, index }); };
  for (const line of lines(text)) if (/(neuer\s+Abschlag|monatlicher\s+Abschlag|Abschlagszahlung)/i.test(line) && !/(Gutschrift|Summe|Gesamt)/i.test(line)) {
    for (const m of line.matchAll(new RegExp(`(${num})\\s*(?:€|EUR)`, "gi"))) add(number(m[1]), 1200, line.length);
  }
  return best(c, 1000);
}

function period(text: string) {
  const c: Candidate[] = [];
  for (const m of text.matchAll(/(\d{1,2}[./]\d{1,2}[./]\d{2,4})\s*(?:-|bis)\s*(\d{1,2}[./]\d{1,2}[./]\d{2,4})/g)) {
    const a = m[1].replace(/\//g, "."), b = m[2].replace(/\//g, ".");
    const date = (s: string) => { const [d, mo, y] = s.split(".").map(Number); return new Date(y < 100 ? y + 2000 : y, mo - 1, d).getTime(); };
    c.push({ value: `${a} - ${b}`, score: Math.abs(date(b) - date(a)) > 250 * 86400000 ? 1000 : 700, index: m.index ?? 0 });
  }
  return best(c, 900);
}

function address(text: string) {
  const ls = lines(text);
  for (let i = 0; i < ls.length; i++) {
    const line = ls[i];
    const m = line.match(/(?:Lieferadresse|Verbrauchsstelle|Verbrauchsadresse|Anschrift)\s*[:\-]?\s*(.+)$/i);
    if (m?.[1] && m[1].length >= 5) return field(m[1].trim(), "high");
    if (/(Lieferadresse|Verbrauchsstelle|Verbrauchsadresse|Anschrift)\s*[:\-]?$/i.test(line) && ls[i + 1]) return field(ls[i + 1], "medium");
  }
  return empty();
}

function enhancedParse(text: string): BillAnalysisResult {
  const t = clean(text);
  return {
    energyType: energyType(t), provider: provider(t), tariffName: tariff(t), annualConsumptionKwh: annualConsumption(t),
    workPriceCtPerKwh: workPrice(t), basePriceEurPerYear: basePrice(t), monthlyPaymentEur: monthly(t),
    billingPeriod: period(t), contractEnd: empty(), cancellationPeriod: empty(), address: address(t),
  };
}

function merge(base: BillAnalysisResult, extra: BillAnalysisResult): BillAnalysisResult {
  const out = { ...base };
  (Object.keys(out) as Array<keyof BillAnalysisResult>).forEach(key => {
    const a = base[key], b = extra[key];
    if (b.value === null || b.value === "") return;
    if (a.value === null || a.value === "" || (b.confidence === "high" && a.confidence !== "high")) out[key] = b;
  });
  return out;
}

export async function analyzeBill(file: File): Promise<BillAnalysisResult> {
  const base = await analyzeBillV3(file);
  const missingCritical = ["provider", "annualConsumptionKwh", "energyType", "tariffName"].some(key => base[key as keyof BillAnalysisResult].value === null);
  if (!missingCritical) return base;
  try {
    const text = clean(file.type === "application/pdf" ? await pdfText(file) : await imageText(file));
    return merge(base, enhancedParse(text));
  } catch { return base; }
}
