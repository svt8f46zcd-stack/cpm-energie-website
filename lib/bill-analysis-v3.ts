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
  "energyType", "provider", "tariffName", "annualConsumptionKwh",
  "workPriceCtPerKwh", "basePriceEurPerYear", "monthlyPaymentEur",
  "billingPeriod", "contractEnd", "cancellationPeriod", "address",
];

type Confidence = BillAnalysisField["confidence"];
type Hit = { value: number; score: number; index: number };

const OCR = "https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.1.1/tesseract.min.js";
const PDF = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.54/pdf.min.mjs";
const PDF_WORKER = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.54/pdf.worker.min.mjs";
let ocrLoad: Promise<void> | null = null;
let pdfLoad: Promise<any> | null = null;

const empty = (): BillAnalysisField => ({ value: null, confidence: "unknown", source: "not_detected" });
const field = (value: string | number | null, confidence: Confidence = "medium"): BillAnalysisField => value === null || value === "" ? empty() : { value, confidence, source: "document" };

export function emptyBillAnalysis(): BillAnalysisResult {
  return Object.fromEntries(BILL_ANALYSIS_FIELDS.map(k => [k, empty()])) as BillAnalysisResult;
}

declare global { interface Window { Tesseract?: any; } }

function loadScript() {
  if (typeof document === "undefined") return Promise.reject(new Error("OCR_LIBRARY_LOAD_FAILED"));
  if (window.Tesseract) return Promise.resolve();
  if (ocrLoad) return ocrLoad;
  ocrLoad = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = OCR;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("OCR_LIBRARY_LOAD_FAILED"));
    document.head.appendChild(script);
  });
  return ocrLoad;
}

async function pdfjs() {
  if (pdfLoad) return pdfLoad;
  const dynamicImport = new Function("u", "return import(u)") as (u: string) => Promise<any>;
  pdfLoad = dynamicImport(PDF).then(mod => {
    if (mod?.GlobalWorkerOptions) mod.GlobalWorkerOptions.workerSrc = PDF_WORKER;
    return mod;
  });
  return pdfLoad;
}

function parseNumber(raw: string) {
  let v = raw.replace(/\s/g, "").replace(/[^0-9,.-]/g, "");
  if (!v) return null;
  const comma = v.lastIndexOf(","), dot = v.lastIndexOf(".");
  if (comma >= 0 && dot >= 0) v = comma > dot ? v.replace(/\./g, "").replace(",", ".") : v.replace(/,/g, "");
  else if (comma >= 0) v = v.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}\.\d{3}$/.test(v)) v = v.replace(".", "");
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function clean(text: string) {
  return text.replace(/\u00a0/g, " ").replace(/[|]/g, " ").replace(/[‐‑‒–—]/g, "-").replace(/\r/g, "\n")
    .replace(/\b(?:kwh|kvvh|kvwh|kwn|kvn)\b/gi, "kWh").replace(/k\s*[vw]\s*[whn]/gi, "kWh")
    .replace(/grund[o0]reis|grundpre[i1]s|grundoeis/gi, "Grundpreis")
    .replace(/arbeit\s*(?:s|ss)?\s*pre[i1]s|arbeitspre[il]s|ar[bp]atspre[i1]s/gi, "Arbeitspreis")
    .replace(/verbrauch\s*spre[i1]s|verbrauchspre[i1]s/gi, "Verbrauchspreis")
    .replace(/jahresverh?rauch|jahresverhrauch/gi, "Jahresverbrauch")
    .replace(/str[o0]m/gi, "Strom").replace(/e\s*[.]?\s*o\s*n/gi, "E.ON")
    .replace(/c\s*t\s*\/\s*k\s*[vw]\s*[whn]/gi, "ct/kWh").replace(/c\s*t\s*\/\s*kwh/gi, "ct/kWh")
    .replace(/cent\s*\/\s*kWh/gi, "ct/kWh").replace(/[ \t]+/g, " ");
}

function imageCanvas(file: File) {
  return new Promise<HTMLCanvasElement>((resolve, reject) => {
    const url = URL.createObjectURL(file), image = new Image();
    image.onload = () => {
      const w = image.naturalWidth || image.width, h = image.naturalHeight || image.height;
      const scale = Math.min(1, 2600 / Math.max(w, h));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(w * scale)); canvas.height = Math.max(1, Math.round(h * scale));
      const ctx = canvas.getContext("2d"); URL.revokeObjectURL(url);
      if (!ctx) return reject(new Error("IMAGE_DECODE_FAILED"));
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height); resolve(canvas);
    };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("IMAGE_DECODE_FAILED")); };
    image.src = url;
  });
}

function enhance(source: HTMLCanvasElement, threshold = false) {
  if (!threshold) return source;
  const canvas = document.createElement("canvas"); canvas.width = source.width; canvas.height = source.height;
  const ctx = canvas.getContext("2d"); if (!ctx) return source;
  ctx.drawImage(source, 0, 0); const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < data.data.length; i += 4) {
    const y = 0.299 * data.data[i] + 0.587 * data.data[i + 1] + 0.114 * data.data[i + 2];
    const v = y < 175 ? 0 : 255; data.data[i] = data.data[i + 1] = data.data[i + 2] = v;
  }
  ctx.putImageData(data, 0, 0); return canvas;
}

function timed<T>(promise: Promise<T>, ms = 25000): Promise<T> {
  return Promise.race([promise, new Promise<T>((_, reject) => setTimeout(() => reject(new Error("OCR_TIMEOUT")), ms))]);
}

async function createWorker() {
  await loadScript();
  if (!window.Tesseract) throw new Error("OCR_LIBRARY_LOAD_FAILED");
  return window.Tesseract.createWorker("deu", 1, {
    workerPath: "https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.1.1/worker.min.js",
    langPath: "https://tessdata.projectnaptha.com/4.0.0",
    corePath: "https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.0",
    workerBlobURL: false,
  });
}

async function ocrImage(source: HTMLCanvasElement) {
  const w = await createWorker();
  try {
    const first = await timed(w.recognize(source, { rotateAuto: true }, { tessedit_pageseg_mode: "6", preserve_interword_spaces: "1", user_defined_dpi: "300" }));
    const text = String(first?.data?.text || "");
    if (/(strom|gas|kWh|arbeitspreis|grundpreis|abschlag|verbrauch)/i.test(text)) return text;
    const second = await timed(w.recognize(enhance(source, true), { rotateAuto: true }, { tessedit_pageseg_mode: "6", preserve_interword_spaces: "1", user_defined_dpi: "300" }));
    return [text, String(second?.data?.text || "")].filter(Boolean).join("\n");
  } finally { await w.terminate(); }
}

async function extractPdf(file: File) {
  const pdf = await pdfjs(), doc = await pdf.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages: string[] = [];
  for (let n = 1; n <= Math.min(8, doc.numPages); n++) {
    const page = await doc.getPage(n), content = await page.getTextContent();
    const text = (content.items as any[]).map(i => typeof i?.str === "string" ? i.str : "").join(" ").replace(/\s+/g, " ").trim();
    if (text) pages.push(text);
  }
  return pages.join("\n");
}

async function pdfOcr(file: File) {
  const pdf = await pdfjs(), doc = await pdf.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const w = await createWorker(), pages: string[] = [];
  try {
    for (let n = 1; n <= Math.min(2, doc.numPages); n++) {
      const page = await doc.getPage(n), viewport = page.getViewport({ scale: 1.7 });
      const canvas = document.createElement("canvas"); canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
      const ctx = canvas.getContext("2d"); if (!ctx) continue;
      await page.render({ canvasContext: ctx, viewport }).promise;
      const result = await timed(w.recognize(canvas, { rotateAuto: true }, { tessedit_pageseg_mode: "6", preserve_interword_spaces: "1", user_defined_dpi: "200" }));
      pages.push(String(result?.data?.text || ""));
    }
  } finally { await w.terminate(); }
  return pages.join("\n");
}

function lines(text: string) { return text.split(/\n+/).map(x => x.trim()).filter(Boolean); }
const num = "\\d{1,3}(?:[.,]\\d{3})*(?:[.,]\\d{1,3})?|\\d{4,7}(?:[.,]\\d{1,3})?";

function annual(text: string) {
  const hits: Hit[] = [];
  for (const [i, line] of lines(text).entries()) if (/(Jahresverbrauch|Gesamtverbrauch|Verbrauch\/Menge|Verbrauch\s+gesamt|Ihr\s+Verbrauch)/i.test(line))
    for (const m of line.matchAll(new RegExp(`(${num})\\s*kWh`, "gi"))) { const v = parseNumber(m[1]); if (v !== null && v >= 300 && v <= 100000) hits.push({ value: v, score: 1000, index: i }); }
  for (const m of text.matchAll(new RegExp(`(?:Jahresverbrauch|Gesamtverbrauch|Verbrauch\\s+gesamt)[^\\n]{0,180}?(${num})\\s*kWh`, "gi"))) { const v = parseNumber(m[1]); if (v !== null && v >= 300 && v <= 100000) hits.push({ value: v, score: 900, index: m.index ?? 0 }); }
  if (!hits.length) for (const m of text.matchAll(new RegExp(`(${num})\\s*kWh`, "gi"))) { const v = parseNumber(m[1]); if (v !== null && v >= 300 && v <= 100000) hits.push({ value: v, score: 100, index: m.index ?? 0 }); }
  hits.sort((a,b) => b.score-a.score || a.index-b.index); return field(hits[0]?.value ?? null, hits[0] && hits[0].score >= 900 ? "high" : "medium");
}

function work(text: string) {
  const re = /(\\d{1,3}[,.]\\d{1,3})\\s*(?:ct|c|cent)\\s*(?:\\/|pro)\\s*kWh/gi, hits: Hit[] = [];
  for (const line of lines(text)) if (/(Arbeitspreis|Verbrauchspreis)/i.test(line)) for (const m of line.matchAll(re)) { const v=parseNumber(m[1]); if(v!==null&&v>=5&&v<=100) hits.push({value:v,score:1000,index:line.length}); }
  if (!hits.length) for (const m of text.matchAll(re)) { const v=parseNumber(m[1]); if(v!==null&&v>=5&&v<=100) hits.push({value:v,score:200,index:m.index??0}); }
  hits.sort((a,b)=>b.score-a.score); return field(hits[0]?.value===undefined?null:Math.round(hits[0].value*100)/100, hits[0]&&hits[0].score>=900?"high":"medium");
}

function base(text: string) {
  const hits: Hit[] = [];
  for (const line of lines(text)) if (/Grundpreis/i.test(line)) {
    let m=line.match(/(\d{1,5}[,.]\d{1,3})\s*(?:€|EUR)\s*(?:\/\s*|pro\s*)?(?:Jahr|a\b)/i);
    if(m){const v=parseNumber(m[1]);if(v!==null&&v>=20&&v<=5000)hits.push({value:v,score:1000,index:line.length});}
    m=line.match(/(\d{1,4}[,.]\d{1,3})\s*(?:€|EUR)\s*(?:\/\s*Monat|pro\s+Monat|monatlich)/i);
    if(m){const v=parseNumber(m[1]);if(v!==null&&v>=20&&v<=5000)hits.push({value:v*12,score:900,index:line.length});}
  }
  hits.sort((a,b)=>b.score-a.score); return field(hits[0]?.value===undefined?null:Math.round(hits[0].value*100)/100,hits[0]&&hits[0].score>=900?"high":"medium");
}

function monthly(text: string) {
  const hits: Hit[]=[];
  for(const line of lines(text)) if(/(?:Ihr\s+neuer\s+Abschlag|neuer\s+Abschlag|monatlicher\s+Abschlag|Abschlagszahlung)/i.test(line)) {
    for(const m of line.matchAll(/(\d{2,5}(?:[,.]\d{1,3})?)\s*(?:€|EUR)\b/gi)){const v=parseNumber(m[1]);if(v!==null&&v>=20&&v<=5000)hits.push({value:v,score:1200,index:line.length});}
  }
  if(!hits.length) for(const line of lines(text)) if(/Abschlag/i.test(line)&&!/(Gutschrift|offener\s+Betrag|Gesamt|Summe)/i.test(line)){const m=line.match(/(\d{2,5}(?:[,.]\d{1,3})?)\s*(?:€|EUR)\b/);if(m){const v=parseNumber(m[1]);if(v!==null&&v>=20&&v<=5000)hits.push({value:v,score:700,index:line.length});}}
  hits.sort((a,b)=>b.score-a.score); return field(hits[0]?.value===undefined?null:Math.round(hits[0].value*100)/100,hits[0]&&hits[0].score>=1000?"high":"medium");
}

function provider(text:string){for(const [r,n] of [[/e\.?\s*n\.?\s*t\.?\s*e\.?\s*g\.?\s*a/i,"ENTEGA"],[/e\.?\s*o\.?\s*n\b/i,"E.ON"],[/goldgas/i,"goldgas"],[/enbw/i,"EnBW"],[/vattenfall/i,"Vattenfall"],[/mainova/i,"Mainova"],[/rheinen?ergie/i,"RheinEnergie"],[/yello/i,"Yello"],[/lichtblick/i,"LichtBlick"],[/naturstrom/i,"Naturstrom"],[/eprimo/i,"eprimo"],[/ewe/i,"EWE"],[/süwag/i,"Süwag"],[/lekker/i,"lekker Energie"]] as Array<[RegExp,string]>) if(r.test(text)) return field(n,"high");return empty();}
function energy(text:string){const gas=/\bgas\b|gasrechnung|gasverbrauch|gaskosten/i.test(text), strom=/\bstrom\b|stromrechnung|stromverbrauch|stromkosten/i.test(text);const v=gas&&strom?"Strom + Gas":gas?"Gas":strom?"Strom":null;return field(v,v?"high":"unknown");}
function tariff(text:string){const m=text.match(/(?:Ihr|Ihre)\s+(?:Tarif|Produkt)\s*[:\-]\s*([^\n]{3,100})/i)||text.match(/Produkt\s*[:\-]\s*([^\n]{3,100})/i);return field(m?.[1]?.replace(/\s+/g," ").trim()??null,"medium");}
function period(text:string){const ds=[...text.matchAll(/(\d{1,2}[./]\d{1,2}[./]\d{2,4})\s*(?:-|bis)\s*(\d{1,2}[./]\d{1,2}[./]\d{2,4})/g)];return field(ds[0]?`${ds[0][1].replace(/\//g,".")} - ${ds[0][2].replace(/\//g,".")}`:null,ds[0]?"high":"unknown");}
function contract(text:string){const m=text.match(/(?:Vertragsende|Vertragslaufzeit\s*bis|Belieferung\s*bis|Vertrag\s*endet\s*am)[\s:]+(\d{1,2}[./]\d{1,2}[./]\d{2,4})/i);return field(m?.[1]?.replace(/\//g,".")??null,m?"medium":"unknown");}
function cancellation(text:string){const m=text.match(/k(?:ü|u)ndigungsfrist[\s:]+([^\n]{1,100})/i);return field(m?.[1]?.trim()??null,m?"medium":"unknown");}
function address(text:string){const m=text.match(/(?:Lieferadresse|Verbrauchsstelle|Verbrauchsadresse|Anschrift)[\s:]+([^\n]{5,140})/i);return field(m?.[1]?.trim()??null,m?"medium":"unknown");}

function parse(text:string):BillAnalysisResult{const t=clean(text);return{energyType:energy(t),provider:provider(t),tariffName:tariff(t),annualConsumptionKwh:annual(t),workPriceCtPerKwh:work(t),basePriceEurPerYear:base(t),monthlyPaymentEur:monthly(t),billingPeriod:period(t),contractEnd:contract(t),cancellationPeriod:cancellation(t),address:address(t)};}

async function textOf(file:File){
  if(file.type!=="application/pdf") return ocrImage(await imageCanvas(file));
  const native=await extractPdf(file), t=clean(native);
  if(native.length>=100 && /(?:Strom|Gas|kWh|Arbeitspreis|Grundpreis|Abschlag|Verbrauch)/i.test(t)) return native;
  return [native,await pdfOcr(file)].filter(Boolean).join("\n");
}

export async function analyzeBill(file:File):Promise<BillAnalysisResult>{
  if(typeof window==="undefined") throw new Error("BILL_ANALYSIS_BROWSER_ONLY");
  const endpoint=process.env.NEXT_PUBLIC_BILL_ANALYSIS_URL;
  if(endpoint){const body=new FormData();body.append("file",file,file.name);const response=await timed(fetch(endpoint,{method:"POST",body}),30000);if(!response.ok)throw new Error(`BILL_ANALYSIS_HTTP_${response.status}`);const data=await response.json();return data.result??data;}
  return parse(await textOf(file));
}
