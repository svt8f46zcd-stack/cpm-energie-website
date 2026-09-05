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

type Hit = { value: string | number; score: number; index: number };
const OCR = "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";
const PDF = "https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.54/build/pdf.mjs";
let ocrPromise: Promise<void> | null = null;
let pdfPromise: Promise<any> | null = null;

declare global { interface Window { Tesseract?: any } }

const empty = (): BillAnalysisField => ({ value: null, confidence: "unknown", source: "not_detected" });
const field = (value: string | number | null, confidence: BillAnalysisField["confidence"] = "medium"): BillAnalysisField => value === null || value === "" ? empty() : { value, confidence, source: "document" };

export function emptyBillAnalysis(): BillAnalysisResult {
  return Object.fromEntries(["energyType","provider","tariffName","annualConsumptionKwh","workPriceCtPerKwh","basePriceEurPerYear","monthlyPaymentEur","billingPeriod","contractEnd","cancellationPeriod","address"].map(k => [k, empty()])) as BillAnalysisResult;
}

function loadOCR() {
  if (typeof document === "undefined") return Promise.reject(new Error("OCR_LIBRARY_LOAD_FAILED"));
  if (window.Tesseract) return Promise.resolve();
  if (ocrPromise) return ocrPromise;
  ocrPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script"); s.src = OCR; s.async = true; s.dataset.cpmSmartOcr = "1";
    s.onload = () => resolve(); s.onerror = () => reject(new Error("OCR_LIBRARY_LOAD_FAILED")); document.head.appendChild(s);
  });
  return ocrPromise;
}
async function getPdf() {
  if (pdfPromise) return pdfPromise;
  pdfPromise = (new Function("u", "return import(u)") as (u: string) => Promise<any>)(PDF);
  return pdfPromise;
}

function upscale(source: HTMLCanvasElement | HTMLImageElement) {
  const w = source instanceof HTMLImageElement ? source.naturalWidth || source.width : source.width;
  const h = source instanceof HTMLImageElement ? source.naturalHeight || source.height : source.height;
  const scale = Math.min(3, Math.max(2, 2600 / Math.max(w, h)));
  const c = document.createElement("canvas"); c.width = Math.ceil(w * scale); c.height = Math.ceil(h * scale);
  const ctx = c.getContext("2d"); if (!ctx) return c;
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high"; ctx.drawImage(source, 0, 0, c.width, c.height); return c;
}
function prep(source: HTMLCanvasElement, mode: "color" | "gray" | "threshold") {
  const c = document.createElement("canvas"); c.width = source.width; c.height = source.height;
  const ctx = c.getContext("2d"); if (!ctx) return source; ctx.drawImage(source, 0, 0);
  if (mode === "color") return c;
  const d = ctx.getImageData(0, 0, c.width, c.height);
  for (let i = 0; i < d.data.length; i += 4) {
    const l = .299*d.data[i] + .587*d.data[i+1] + .114*d.data[i+2];
    const v = mode === "threshold" ? (l < 180 ? 0 : 255) : Math.max(0, Math.min(255, (l-128)*1.7+128));
    d.data[i] = d.data[i+1] = d.data[i+2] = v;
  }
  ctx.putImageData(d, 0, 0); return c;
}
async function recognize(canvas: HTMLCanvasElement) {
  await loadOCR(); if (!window.Tesseract) throw new Error("OCR_LIBRARY_LOAD_FAILED");
  const w = await window.Tesseract.createWorker("deu"); const texts: string[] = [];
  try {
    for (const psm of [6, 4, 11]) {
      for (const mode of ["color", "gray", "threshold"] as const) {
        const r = await w.recognize(prep(canvas, mode), { rotateAuto: true }, { tessedit_pageseg_mode: String(psm), preserve_interword_spaces: "1", user_defined_dpi: "300" });
        const t = String(r?.data?.text || ""); if (t.trim()) texts.push(t);
      }
      if (texts.join("\n").match(/ENTEGA|E\.ON|Gesamtverbrauch|Jahresverbrauch/i) && texts.join("\n").match(/Arbeitspreis|Grundpreis/i)) break;
    }
  } finally { await w.terminate(); }
  return texts.join("\n");
}
async function imageText(file: File) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => { const i = new Image(); i.onload = () => resolve(i); i.onerror = () => reject(new Error("IMAGE_DECODE_FAILED")); i.src = url; });
    return recognize(upscale(img));
  } finally { URL.revokeObjectURL(url); }
}
async function pdfText(file: File) {
  const pdf = await getPdf(); const doc = await pdf.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise; const native: string[] = [];
  for (let n=1; n<=Math.min(12, doc.numPages); n++) { const page=await doc.getPage(n); const content=await page.getTextContent(); const t=(content.items as any[]).map(x=>typeof x?.str === "string" ? x.str : "").join(" "); if(t.trim()) native.push(t); }
  const nativeText = native.join("\n");
  if (nativeText.length >= 500 && /(Grundpreis|Arbeitspreis|Verbrauch|kWh)/i.test(nativeText)) return nativeText;
  const ocr: string[] = [];
  for (let n=1; n<=Math.min(12, doc.numPages); n++) { const page=await doc.getPage(n); const v=page.getViewport({scale:2.6}); const c=document.createElement("canvas"); c.width=Math.ceil(v.width); c.height=Math.ceil(v.height); const ctx=c.getContext("2d"); if(!ctx) continue; await page.render({canvasContext:ctx,viewport:v}).promise; ocr.push(await recognize(c)); }
  return [nativeText,...ocr].filter(Boolean).join("\n");
}

function clean(text: string) {
  return text.replace(/\u00a0/g," ").replace(/[‐‑‒–—]/g,"-").replace(/\r/g,"\n").replace(/[|]/g," ")
    .replace(/k\s*[vw]\s*[whn]/gi,"kWh").replace(/\b(?:kvvh|kvwh|kwn|kvn)\b/gi,"kWh")
    .replace(/jahresverh?rauch|jahresverhrauch|j[a4]hresverbrauch/gi,"Jahresverbrauch")
    .replace(/ges[a4]mtverbrauch|gesammtverbrauch/gi,"Gesamtverbrauch")
    .replace(/arbeit\s*(?:s|ss)?\s*pre[i1]s|arbeitspre[il]s|ar[bp]atspre[i1]s/gi,"Arbeitspreis")
    .replace(/grund[o0]reis|grundpre[i1]s|grundoeis/gi,"Grundpreis")
    .replace(/verbrauch\s*spre[i1]s|verbrauchspre[il]s/gi,"Verbrauchspreis")
    .replace(/e\s*n\s*t\s*e\s*g\s*a/gi,"ENTEGA").replace(/e\s*[.]?\s*o\s*n/gi,"E.ON")
    .replace(/c\s*t\s*\/\s*k\s*[vw]\s*[whn]/gi,"ct/kWh").replace(/c\s*t\s*\/\s*kwh/gi,"ct/kWh")
    .replace(/[ \t]+/g," ");
}
const num = "\\d{1,3}(?:[.,]\\d{3})*(?:[.,]\\d{1,3})?|\\d{4,7}(?:[.,]\\d{1,3})?";
function n(raw: string) { let v=raw.replace(/\s/g,"").replace(/[^0-9,.-]/g,""); if(!v)return null; const c=v.lastIndexOf(","),d=v.lastIndexOf("."); if(c>=0&&d>=0)v=c>d?v.replace(/\./g,"").replace(",","."):v.replace(/,/g,""); else if(c>=0)v=v.replace(/\./g,"").replace(",","."); else if(/^\d{1,3}\.\d{3}$/.test(v))v=v.replace(".",""); const x=Number(v); return Number.isFinite(x)?x:null; }
function ls(text:string){return text.split(/\n+/).map(x=>x.trim()).filter(Boolean)}
function pick(c:Hit[], high=900){ if(!c.length)return empty(); c.sort((a,b)=>b.score-a.score||a.index-b.index); return field(c[0].value, c[0].score>=high?"high":"medium"); }

function provider(t:string){const p:Array<[RegExp,string]>=[[/e\.?\s*n\.?\s*t\.?\s*e\.?\s*g\.?\s*a/i,"ENTEGA"],[/e\.\s*on\b|eon\b/i,"E.ON"],[/goldgas/i,"goldgas"],[/enbw/i,"EnBW"],[/vattenfall/i,"Vattenfall"],[/mainova/i,"Mainova"],[/rhein\s*energie/i,"RheinEnergie"],[/stadtwerke\s+m[uü]nchen|\bswm\b/i,"Stadtwerke München"],[/yello/i,"Yello"],[/lichtblick/i,"LichtBlick"],[/eprimo/i,"eprimo"],[/naturstrom/i,"Naturstrom"],[/ewe/i,"EWE"],[/enercity/i,"enercity"],[/süwag/i,"Süwag"],[/mvv\s+energie/i,"MVV Energie"],[/lekker/i,"lekker Energie"]]; for(const [r,v]of p)if(r.test(t))return field(v,"high"); return empty();}
function energy(t:string){const gas=/\bgas\b|gasrechnung|gasverbrauch|erdgas/i.test(t),st=/\bstrom\b|stromrechnung|stromverbrauch|ökostrom/i.test(t);const v=gas&&st?"Strom + Gas":gas?"Gas":st?"Strom":null;return field(v,v?"high":"unknown");}
function tariff(t:string){for(const r of [/(?:Tarif|Produkt)\s*[:\-]\s*([^\n]{3,100})/i,/Tarif\s+([A-ZÄÖÜ][^\n]{2,90})/i]){const m=t.match(r);if(m?.[1]){const v=m[1].replace(/\s+/g," ").replace(/\s+(?:Zeitraum|Marktlokations|Zählernummer).*$/i,"").trim();if(v.length>=3&&!/nicht erkannt/i.test(v))return field(v,"high")}}return empty();}
function consumption(t:string){const c:Hit[]=[];const add=(v:number|null,s:number,i:number)=>{if(v!==null&&v>=300&&v<=100000)c.push({value:v,score:s,index:i})};
  ls(t).forEach((line,i)=>{if(!/(Jahresverbrauch|Gesamtverbrauch|Verbrauch\/Menge|Verbrauch\s+im\s+Abrechnungsjahr|Ihr\s+Verbrauch)/i.test(line))return; for(const m of line.matchAll(new RegExp(`(${num})\\s*kWh`,`gi`)) )add(n(m[1]),1200,i); for(const m of line.matchAll(new RegExp(`(?:Jahresverbrauch|Gesamtverbrauch)[^0-9]{0,100}(${num})`,`gi`)))add(n(m[1]),1150,i);});
  for(const m of t.matchAll(new RegExp(`(?:Jahresverbrauch|Gesamtverbrauch)[^\\n]{0,220}?(${num})\\s*kWh`,`gi`)))add(n(m[1]),1100,m.index??0);
  for(const m of t.matchAll(new RegExp(`(?:Gesamtverbrauch|Jahresverbrauch|Verbrauch\\/Menge)[\\s\\S]{0,900}`,"gi"))){const block=m[0];const values:number[]=[];for(const x of block.matchAll(new RegExp(`\\b(${num})\\b`,"g"))){const v=n(x[1]);if(v!==null&&v>=300&&v<=50000)values.push(v)};const sum=values.filter(v=>v<50000).reduce((a,b)=>a+b,0);if(sum>=300&&sum<=100000)add(sum,720,m.index??0);if(values.length)add(Math.max(...values),650,m.index??0);}
  return pick(c,1000);
}
function work(t:string){const c:Hit[]=[];const ct=`(\\d{1,3}[,.]\\d{1,3})\\s*(?:ct|c|cent)\\s*(?:\\/|pro)\\s*kWh`;const eur=`(\\d{1,3}[,.]\\d{1,4})\\s*(?:€|EUR)\\s*(?:\\/|pro)\\s*kWh`;for(const line of ls(t))if(/(Arbeitspreis|Verbrauchspreis)/i.test(line)){for(const m of line.matchAll(new RegExp(ct,"gi")))c.push({value:Math.round((n(m[1])||0)*100)/100,score:1200,index:line.length});for(const m of line.matchAll(new RegExp(eur,"gi")))c.push({value:Math.round((n(m[1])||0)*100)/100*100,score:1100,index:line.length})}return pick(c,1000);}
function base(t:string){const c:Hit[]=[];for(const line of ls(t))if(/Grundpreis/i.test(line)){const a=line.match(new RegExp(`(${num})\\s*(?:€|EUR)\\s*(?:\\/\\s*|pro\\s*)?(?:Jahr|jährlich|a)\\b`,`i`));if(a)c.push({value:Math.round((n(a[1])||0)*100)/100,score:1200,index:line.length});const m=line.match(new RegExp(`(${num})\\s*(?:€|EUR)\\s*(?:\\/\\s*Monat|pro\\s+Monat|monatlich)`,`i`));if(m)c.push({value:Math.round((n(m[1])||0)*12*100)/100,score:1100,index:line.length});const d=line.match(new RegExp(`(${num})\\s*(?:€|EUR)\\s*\\/\\s*(\\d{1,3})\\s*Tage?`,`i`));if(d)c.push({value:(n(d[1])||0)*365/(n(d[2])||365),score:950,index:line.length})}return pick(c,1000);}
function monthly(t:string){const c:Hit[]=[];for(const line of ls(t))if(/neuer\s+Abschlag|monatlicher\s+Abschlag|Abschlagszahlung/i.test(line)&&!/Gutschrift|Summe|Gesamt/i.test(line))for(const m of line.matchAll(new RegExp(`(${num})\\s*(?:€|EUR)`,`gi`)))c.push({value:n(m[1])||0,score:1100,index:line.length});return pick(c,1000);}
function period(t:string){const c:Hit[]=[];for(const m of t.matchAll(/(\d{1,2}[./]\d{1,2}[./]\d{2,4})\s*(?:-|bis)\s*(\d{1,2}[./]\d{1,2}[./]\d{2,4})/g))c.push({value:`${m[1].replace(/\//g,".")} - ${m[2].replace(/\//g,".")}`,score:800,index:m.index??0});return pick(c,700);}
function address(t:string){const a=ls(t);for(let i=0;i<a.length;i++){const m=a[i].match(/(?:Lieferadresse|Verbrauchsstelle|Verbrauchsadresse|Anschrift)\s*[:\-]?\s*(.+)$/i);if(m?.[1]&&m[1].length>=5)return field(m[1].trim(),"high");if(/(?:Lieferadresse|Verbrauchsstelle|Verbrauchsadresse|Anschrift)\s*[:\-]?$/i.test(a[i])&&a[i+1])return field(a[i+1],"medium")}return empty();}

function parse(text:string):BillAnalysisResult{const t=clean(text);return{energyType:energy(t),provider:provider(t),tariffName:tariff(t),annualConsumptionKwh:consumption(t),workPriceCtPerKwh:work(t),basePriceEurPerYear:base(t),monthlyPaymentEur:monthly(t),billingPeriod:period(t),contractEnd:empty(),cancellationPeriod:empty(),address:address(t)}}

export async function analyzeBill(file:File):Promise<BillAnalysisResult>{if(typeof window==="undefined")throw new Error("BILL_ANALYSIS_BROWSER_ONLY");const text=clean(file.type==="application/pdf"?await pdfText(file):await imageText(file));return parse(text);}
