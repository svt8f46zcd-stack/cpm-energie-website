export type RepairedPrices = {
  workPriceCtPerKwh: number | null;
  basePriceEurPerYear: number | null;
  annualConsumptionKwh: number | null;
};

declare global { interface Window { Tesseract?: any; pdfjsLib?: any } }

const OCR_SCRIPT = "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";
const OCR_WORKER = "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/worker.min.js";
const PDF_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.54/pdf.min.mjs";
const PDF_WORKER = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.54/pdf.worker.min.mjs";
let tesseractPromise: Promise<void> | null = null;
let workerPromise: Promise<any> | null = null;
let pdfPromise: Promise<any> | null = null;

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script"); script.src = src; script.async = true;
    script.onload = () => resolve(); script.onerror = () => reject(new Error("SCRIPT_LOAD_FAILED")); document.head.appendChild(script);
  });
}
async function getWorker() {
  if (!tesseractPromise) tesseractPromise = (async()=>{if(!window.Tesseract?.createWorker) await loadScript(OCR_SCRIPT)})().catch(e=>{tesseractPromise=null;throw e});
  await tesseractPromise;
  if(!workerPromise) workerPromise=window.Tesseract.createWorker("deu",1,{workerPath:OCR_WORKER,logger:()=>undefined}).catch((e:any)=>{workerPromise=null;throw e});
  return workerPromise;
}
async function getPdfJs(){
  if(!pdfPromise) pdfPromise=import(/* webpackIgnore: true */ PDF_URL).then((m:any)=>{const api=m.default||m;api.GlobalWorkerOptions.workerSrc=PDF_WORKER;return api}).catch(e=>{pdfPromise=null;throw e});
  return pdfPromise;
}
function numberValue(raw:string){
  let value=raw.replace(/\s/g,"").replace(/[^0-9,.-]/g,""); if(!value)return null;
  const comma=value.lastIndexOf(","),dot=value.lastIndexOf(".");
  if(comma>=0&&dot>=0)value=comma>dot?value.replace(/\./g,"").replace(",","."):value.replace(/,/g,"");
  else if(comma>=0)value=value.replace(/\./g,"").replace(",",".");
  else if(/^\d{1,3}(?:\.\d{3})+$/.test(value))value=value.replace(/\./g,"");
  const n=Number(value); return Number.isFinite(n)?n:null;
}
function normalize(text:string){
  return text.replace(/\u00a0/g," ").replace(/[‐‑‒–—]/g,"-").replace(/\r/g,"\n")
    .replace(/k\s*[wvw]\s*[hn]/gi,"kWh").replace(/kwh/gi,"kWh")
    .replace(/c\s*[tcuoa]\s*\/\s*k\s*[wvw]\s*[hn]/gi,"ct/kWh").replace(/c\s*[tcuoa]\s*\/\s*kwh/gi,"ct/kWh")
    .replace(/grund[o0]reis|grundpre[i1]s|grundoeis|grundprels/gi,"Grundpreis")
    .replace(/arbeit\s*(?:s|ss)?\s*pre[i1]s|arbeitspre[il]s|ar[bp]atspre[i1]s/gi,"Arbeitspreis")
    .replace(/[ \t]+/g," ");
}
function extract(text:string):RepairedPrices{
  const t=normalize(text), work:number[]=[] , base:number[]=[], consumption:number[]=[];
  // Only accept consumption when it is attached to an explicit annual/billed-consumption label.
  for(const re of [
    /(?:Summe|Jahresverbrauch|Jahresmenge)[\s\S]{0,140}?([0-9]{1,3}(?:[.,][0-9]{1,3})?)[\s]*(?:kWh|kW\s*h)/gi,
    /Abgerechneter\s+Verbrauch[\s\S]{0,100}?([0-9]{1,3}(?:[.,][0-9]{1,3})?)[\s]*(?:kWh|kW\s*h)?/gi
  ]){
    for(const m of t.matchAll(re)){const n=numberValue(m[1]);if(n!==null&&n>=100&&n<=100000)consumption.push(n)}
  }
  for(const match of t.matchAll(/Arbeitspreis([\s\S]{0,320})/gi)){
    const chunk=match[1];
    for(const m of chunk.matchAll(/([0-9]{1,5}(?:[,.][0-9]{1,3})?)/g)){
      const n=numberValue(m[1]); if(n!==null&&n>=5&&n<=100){const after=chunk.slice(m.index!+m[0].length,m.index!+m[0].length+35);if(/ct|cent|kWh|kw\s*h/i.test(after)||/[,.]\d{1,3}/.test(m[1]))work.push(n)}
    }
  }
  for(const match of t.matchAll(/Grundpreis([\s\S]{0,260})/gi)){
    const chunk=match[1];
    const explicit=[...chunk.matchAll(/([0-9]{1,5}(?:[,.][0-9]{1,2}))\s*(?:€|EUR|E|Eu)\s*(?:\/\s*(?:Jahr|year)|pro\s+Jahr|jährlich)/gi)].map(m=>numberValue(m[1])).filter((n):n is number=>n!==null&&n>=10&&n<=10000);
    base.push(...explicit);
    if(!explicit.length)for(const line of chunk.split("\n").slice(0,3)){const nums=[...line.matchAll(/([0-9]{1,5}(?:[,.][0-9]{1,2}))/g)].map(m=>numberValue(m[1])).filter((n):n is number=>n!==null&&n>=10&&n<=1000);if(nums.length)base.push(nums[0])}
  }
  return {workPriceCtPerKwh:work.length?Math.max(...work):null,basePriceEurPerYear:base.length?Math.max(...base):null,annualConsumptionKwh:consumption.length?Math.max(...consumption):null};
}
function preprocessImage(file:File){return new Promise<Blob>((resolve,reject)=>{const img=new Image(),url=URL.createObjectURL(file);img.onload=()=>{URL.revokeObjectURL(url);const max=3600,scale=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight)),canvas=document.createElement("canvas");canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));const ctx=canvas.getContext("2d");if(!ctx)return reject(new Error("CANVAS_FAILED"));ctx.drawImage(img,0,0,canvas.width,canvas.height);canvas.toBlob(b=>b?resolve(b):reject(new Error("BLOB_FAILED")),"image/jpeg",.95)};img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error("IMAGE_FAILED"))};img.src=url})}
async function ocrBlob(blob:Blob){const worker=await getWorker();const result=await worker.recognize(blob);return String(result?.data?.text||"")}
async function ocrPdf(file:File){const pdfjs=await getPdfJs(),data=await file.arrayBuffer(),pdf=await pdfjs.getDocument({data}).promise,texts:string[]=[];for(let pageNo=1;pageNo<=Math.min(pdf.numPages,8);pageNo++){const page=await pdf.getPage(pageNo),viewport=page.getViewport({scale:2.4}),canvas=document.createElement("canvas");canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);const ctx=canvas.getContext("2d");if(!ctx)continue;await page.render({canvasContext:ctx,viewport}).promise;const blob=await new Promise<Blob|null>(r=>canvas.toBlob(r,"image/jpeg",.95));if(blob)texts.push(await ocrBlob(blob))}return texts.join("\n")}
export async function repairBillPrices(file:File):Promise<RepairedPrices>{try{let text="";if(file.type==="application/pdf"||/\.pdf$/i.test(file.name))text=await ocrPdf(file);else text=await ocrBlob(await preprocessImage(file));return extract(text)}catch{return{workPriceCtPerKwh:null,basePriceEurPerYear:null,annualConsumptionKwh:null}}}
