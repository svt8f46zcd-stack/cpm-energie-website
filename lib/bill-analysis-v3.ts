export type BillAnalysisField = { value: string | number | null; confidence: "high" | "medium" | "low" | "unknown"; source: "document" | "not_detected" };
export type BillAnalysisResult = {
  energyType: BillAnalysisField; provider: BillAnalysisField; tariffName: BillAnalysisField;
  annualConsumptionKwh: BillAnalysisField; workPriceCtPerKwh: BillAnalysisField; basePriceEurPerYear: BillAnalysisField;
  monthlyPaymentEur: BillAnalysisField; billingPeriod: BillAnalysisField; contractEnd: BillAnalysisField;
  cancellationPeriod: BillAnalysisField; address: BillAnalysisField;
};
export const BILL_ANALYSIS_FIELDS: Array<keyof BillAnalysisResult> = ["energyType","provider","tariffName","annualConsumptionKwh","workPriceCtPerKwh","basePriceEurPerYear","monthlyPaymentEur","billingPeriod","contractEnd","cancellationPeriod","address"];
type Confidence = BillAnalysisField["confidence"];
const empty = (): BillAnalysisField => ({value:null,confidence:"unknown",source:"not_detected"});
const field = (value: string|number|null, confidence: Confidence="medium"): BillAnalysisField => value===null || value==="" ? empty() : {value,confidence,source:"document"};
export function emptyBillAnalysis(): BillAnalysisResult { return Object.fromEntries(BILL_ANALYSIS_FIELDS.map(k=>[k,empty()])) as BillAnalysisResult; }

declare global { interface Window { Tesseract?: any } }
const OCR_URL="https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.1.1/tesseract.min.js";
const PDF_URL="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.54/pdf.min.mjs";
const PDF_WORKER="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.54/pdf.worker.min.mjs";
let ocrLoader: Promise<void>|null=null;
let pdfLoader: Promise<any>|null=null;

function loadOCR(): Promise<void> {
  if(typeof document==="undefined") return Promise.reject(new Error("OCR_UNAVAILABLE"));
  if(window.Tesseract) return Promise.resolve();
  if(ocrLoader) return ocrLoader;
  ocrLoader=new Promise((resolve,reject)=>{const s=document.createElement("script");s.src=OCR_URL;s.async=true;s.onload=()=>resolve();s.onerror=()=>reject(new Error("OCR_LOAD_FAILED"));document.head.appendChild(s);});
  return ocrLoader;
}
async function loadPDF(){
  if(pdfLoader) return pdfLoader;
  const importer=new Function("u","return import(u)") as (u:string)=>Promise<any>;
  pdfLoader=importer(PDF_URL).then(m=>{if(m?.GlobalWorkerOptions)m.GlobalWorkerOptions.workerSrc=PDF_WORKER;return m;});
  return pdfLoader;
}
function timed<T>(p:Promise<T>,ms=25000){return Promise.race([p,new Promise<T>((_,r)=>setTimeout(()=>r(new Error("TIMEOUT")),ms))]);}
function parseNumber(raw:string){
  let s=raw.replace(/\s/g,"").replace(/[^0-9,.-]/g,""); if(!s)return null;
  const c=s.lastIndexOf(","),d=s.lastIndexOf(".");
  if(c>=0&&d>=0)s=c>d?s.replace(/\./g,"").replace(",","."):s.replace(/,/g,"");
  else if(c>=0)s=s.replace(/\./g,"").replace(",",".");
  else if(/^\d{1,3}\.\d{3}$/.test(s))s=s.replace(".","");
  const n=Number(s);return Number.isFinite(n)?n:null;
}
function clean(t:string){return t.replace(/\u00a0/g," ").replace(/[|]/g," ").replace(/[‐‑‒–—]/g,"-").replace(/\r/g,"\n").replace(/\b(?:kvvh|kvwh|kwn|kvn)\b/gi,"kWh").replace(/\bKWH\b/gi,"kWh").replace(/grund[o0]reis|grundpre[i1]s|grundoeis/gi,"Grundpreis").replace(/arbeit\s*(?:s|ss)?\s*pre[i1]s|arbeitspre[il]s|ar[bp]atspre[i1]s/gi,"Arbeitspreis").replace(/verbrauch\s*spre[i1]s|verbrauchspre[i1]s/gi,"Verbrauchspreis").replace(/jahresverh?rauch|jahresverhrauch/gi,"Jahresverbrauch").replace(/str[o0]m/gi,"Strom").replace(/g[a4]s/gi,"Gas").replace(/e\s*[.]?\s*o\s*n/gi,"E.ON").replace(/c\s*t\s*\/\s*k\s*[vw]\s*[whn]/gi,"ct/kWh").replace(/cent\s*\/\s*kWh/gi,"ct/kWh").replace(/[ \t]+/g," ");}
function lines(t:string){return t.split(/\n+/).map(x=>x.trim()).filter(Boolean);}

async function worker(){await loadOCR();if(!window.Tesseract)throw new Error("OCR_UNAVAILABLE");return window.Tesseract.createWorker("deu",1,{workerPath:"https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.1.1/worker.min.js",langPath:"https://tessdata.projectnaptha.com/4.0.0",corePath:"https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.0",workerBlobURL:false});}
async function imageText(file:File){
  const url=URL.createObjectURL(file);const img=await new Promise<HTMLImageElement>((resolve,reject)=>{const i=new Image();i.onload=()=>{URL.revokeObjectURL(url);resolve(i)};i.onerror=()=>{URL.revokeObjectURL(url);reject(new Error("IMAGE_FAILED"))};i.src=url;});
  const max=2800,scale=Math.min(1,max/Math.max(img.naturalWidth||img.width,img.naturalHeight||img.height));const c=document.createElement("canvas");c.width=Math.max(1,Math.round((img.naturalWidth||img.width)*scale));c.height=Math.max(1,Math.round((img.naturalHeight||img.height)*scale));const ctx=c.getContext("2d");if(!ctx)throw new Error("CANVAS_FAILED");ctx.drawImage(img,0,0,c.width,c.height);
  const w=await worker();try{const r=await timed(w.recognize(c,{rotateAuto:true},{tessedit_pageseg_mode:"6",preserve_interword_spaces:"1",user_defined_dpi:"300"}));return String(r?.data?.text||"")}finally{await w.terminate();}
}
async function pdfText(file:File){
  const pdf=await loadPDF(),doc=await pdf.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise,parts:string[]=[];
  for(let n=1;n<=Math.min(10,doc.numPages);n++){const p=await doc.getPage(n),c=await p.getTextContent();const s=(c.items as any[]).map(x=>typeof x?.str==="string"?x.str:"").join(" ");if(s.trim())parts.push(s);}
  return parts.join("\n");
}
async function pdfOCR(file:File){
  const pdf=await loadPDF(),doc=await pdf.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise,w=await worker(),parts:string[]=[];
  try{for(let n=1;n<=Math.min(3,doc.numPages);n++){const p=await doc.getPage(n),v=p.getViewport({scale:2});const c=document.createElement("canvas");c.width=Math.ceil(v.width);c.height=Math.ceil(v.height);const x=c.getContext("2d");if(!x)continue;await p.render({canvasContext:x,viewport:v}).promise;const r=await timed(w.recognize(c,{rotateAuto:true},{tessedit_pageseg_mode:"6",preserve_interword_spaces:"1",user_defined_dpi:"250"}));parts.push(String(r?.data?.text||""));}}finally{await w.terminate();}return parts.join("\n");
}

function firstMatch(text:string,patterns:RegExp[],min:number,max:number){for(const re of patterns){const m=text.match(re);if(m){const n=parseNumber(m[1]);if(n!==null&&n>=min&&n<=max)return n;}}return null;}
function energy(text:string){const hasGas=/\bGas\b|Erdgas|kWh\s*Gas|Gasverbrauch/i.test(text),hasPower=/\bStrom\b|Elektrizität|Arbeitspreis|Stromverbrauch|kWh\s*Strom/i.test(text);return field(hasGas&&hasPower?"Strom + Gas":hasGas?"Gas":hasPower?"Strom":null,hasGas||hasPower?"high":"unknown");}
function provider(text:string){const names=["ENTEGA","E.ON","goldgas","EnBW","Vattenfall","Mainova","RheinEnergie","Yello","LichtBlick","Naturstrom","eprimo","EWE","enercity","Süwag","MVV Energie","lekker"];const n=names.find(x=>new RegExp(x.replace(".","\\."),"i").test(text));return field(n||null,n?"high":"unknown");}
function tariff(text:string){const pats=[/(?:Tarif|Produkt|Vertrag|Stromtarif|Gast arif)\s*[:\-]?\s*([^\n]{3,80})/i,/(?:Tarifname|Produktname)\s*[:\-]?\s*([^\n]{3,80})/i];for(const p of pats){const m=text.match(p);if(m&&m[1])return field(m[1].trim().replace(/\s{2,}/g," "),"medium");}return empty();}
function annual(text:string){
  const patterns=[/(?:Jahresverbrauch|Jahresverbrauch\s+Strom|Jahresverbrauch\s+Gas)[^\n]{0,100}?([0-9][0-9., ]{2,})\s*kWh/i,/(?:Gesamtverbrauch|Verbrauch\s+gesamt|Ihr\s+Verbrauch|Abgerechneter\s+Verbrauch)[^\n]{0,100}?([0-9][0-9., ]{2,})\s*kWh/i,/([0-9][0-9., ]{2,})\s*kWh/i];
  const n=firstMatch(text,patterns,300,100000);return field(n,n!==null&&patterns.indexOf(patterns.find(p=>p.test(text))!)<2?"high":"medium");
}
function work(text:string){const n=firstMatch(text,[/(?:Arbeitspreis|Verbrauchspreis)[^\n]{0,80}?([0-9]{1,3}[,.][0-9]{1,3})\s*(?:ct|cent)\s*(?:\/|pro)\s*kWh/i,/([0-9]{1,3}[,.][0-9]{1,3})\s*(?:ct|cent)\s*(?:\/|pro)\s*kWh/i],5,100);return field(n===null?null:Math.round(n*100)/100,n!==null?"high":"unknown");}
function base(text:string){const a=firstMatch(text,[/Grundpreis[^\n]{0,80}?([0-9]{1,5}[,.][0-9]{1,2})\s*(?:€|EUR)\s*(?:\/\s*Jahr|pro\s+Jahr|jährlich)/i],20,5000);if(a!==null)return field(Math.round(a*100)/100,"high");const m=firstMatch(text,[/Grundpreis[^\n]{0,80}?([0-9]{1,4}[,.][0-9]{1,2})\s*(?:€|EUR)\s*(?:\/\s*Monat|pro\s+Monat|monatlich)/i],20,5000);return field(m===null?null:Math.round(m*12*100)/100,m!==null?"high":"unknown");}
function monthly(text:string){const n=firstMatch(text,[/(?:neuer\s+Abschlag|monatlicher\s+Abschlag|Abschlagszahlung|Abschlag)[^\n]{0,80}?([0-9]{2,5}[,.][0-9]{1,2})\s*(?:€|EUR)/i],20,5000);return field(n,n!==null?"high":"unknown");}
function period(text:string){const m=text.match(/(\d{1,2}[.\/]\d{1,2}[.\/]\d{2,4})\s*(?:-|bis|–)\s*(\d{1,2}[.\/]\d{1,2}[.\/]\d{2,4})/);return field(m?`${m[1]} - ${m[2]}`:null,m?"high":"unknown");}
function contract(text:string){const m=text.match(/(?:Vertragsende|Vertragslaufzeit\s*bis|Vertrag\s*endet|Mindestvertragslaufzeit)[^\n]{0,60}?(\d{1,2}[.\/]\d{1,2}[.\/]\d{2,4})/i);return field(m?.[1]||null,m?"high":"unknown");}
function cancel(text:string){const m=text.match(/(?:Kündigungsfrist|kündbar)[^\n]{0,80}?([0-9]{1,3}\s*(?:Tage?|Wochen?|Monate?))/i);return field(m?.[1]||null,m?"high":"unknown");}
function address(text:string){const m=text.match(/(?:Lieferadresse|Verbrauchsstelle|Entnahmestelle|Anschrift)[\s:]*([^\n]{5,120})/i);return field(m?.[1]?.trim()||null,m?"medium":"unknown");}

export function parseBillText(raw:string):BillAnalysisResult{const text=clean(raw);return {energyType:energy(text),provider:provider(text),tariffName:tariff(text),annualConsumptionKwh:annual(text),workPriceCtPerKwh:work(text),basePriceEurPerYear:base(text),monthlyPaymentEur:monthly(text),billingPeriod:period(text),contractEnd:contract(text),cancellationPeriod:cancel(text),address:address(text)};}
function useful(r:BillAnalysisResult){return [r.energyType,r.provider,r.annualConsumptionKwh,r.workPriceCtPerKwh,r.basePriceEurPerYear,r.monthlyPaymentEur,r.billingPeriod].filter(x=>x.value!==null).length;}
export async function analyzeBill(file:File):Promise<BillAnalysisResult>{
  if(typeof window!=="undefined" && process.env.NEXT_PUBLIC_BILL_ANALYSIS_URL){try{const c=new AbortController();const id=setTimeout(()=>c.abort(),30000);const fd=new FormData();fd.append("file",file);const res=await fetch(process.env.NEXT_PUBLIC_BILL_ANALYSIS_URL,{method:"POST",body:fd,signal:c.signal});clearTimeout(id);if(res.ok){const data=await res.json();if(data?.analysis)return data.analysis as BillAnalysisResult;}}catch{}}
  let raw="";
  if(file.type==="application/pdf"||file.name.toLowerCase().endsWith(".pdf")){try{raw=await timed(pdfText(file),15000)}catch{};let result=parseBillText(raw);if(useful(result)<2){try{raw=[raw,await timed(pdfOCR(file),40000)].filter(Boolean).join("\n")}catch{}}return parseBillText(raw);}
  try{raw=await timed(imageText(file),40000)}catch{}
  return parseBillText(raw);
}
