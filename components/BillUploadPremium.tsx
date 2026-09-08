"use client";

import { useEffect, useRef, useState } from "react";
import { analyzeBill, type BillAnalysisResult } from "@/lib/bill-analysis-v3";
import { repairBillPrices } from "@/lib/bill-price-repair";
import { getBillSession, saveBillSession } from "@/lib/bill-session";

function Icon({name}:{name:"file"|"chart"|"bolt"|"coins"|"calendar"|"wallet"|"tag"|"info"|"check"}){
 const common={fill:"none",stroke:"currentColor",strokeWidth:1.8,strokeLinecap:"round" as const,strokeLinejoin:"round" as const};
 const p={
  file:<><path {...common} d="M7 2.8h7l4 4v14.4H7z"/><path {...common} d="M14 2.8v4h4M10 11h5M10 15h5M10 19h3"/></>,
  chart:<><path {...common} d="M5 19V11M12 19V6M19 19V9"/><path {...common} d="M3 21h18"/></>,
  bolt:<path {...common} d="M13 2 5.5 13h6L11 22l7.5-12h-6z"/>,
  coins:<><ellipse {...common} cx="12" cy="6.5" rx="7" ry="3"/><path {...common} d="M5 6.5v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5M5 11.5v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5"/></>,
  calendar:<><rect {...common} x="4" y="5" width="16" height="16" rx="2"/><path {...common} d="M8 3v4M16 3v4M4 10h16"/></>,
  wallet:<><path {...common} d="M4 6.5A2.5 2.5 0 0 1 6.5 4H19v15H6.5A2.5 2.5 0 0 1 4 16.5z"/><path {...common} d="M4 7h15M15 12h5v4h-5a2 2 0 0 1 0-4z"/></>,
  tag:<path {...common} d="m3 11 8-8h8l2 2v8l-8 8L3 11zM16 8h.01"/>,
  info:<><circle {...common} cx="12" cy="12" r="9"/><path {...common} d="M12 11v6M12 8h.01"/></>,
  check:<><circle {...common} cx="12" cy="12" r="9"/><path {...common} d="m8 12 2.5 2.5L16 9"/></>
 };
 return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7">{p[name]}</svg>;
}

function text(k:keyof BillAnalysisResult,v:string|number|null){
 if(v===null)return "Nicht erkannt";
 if(k==="workPriceCtPerKwh")return `${Number(v).toFixed(2).replace(".",",")} ct/kWh`;
 if(k==="basePriceEurPerYear")return `${Number(v).toFixed(2).replace(".",",")} € / Jahr`;
 if(k==="monthlyPaymentEur")return `${Number(v).toFixed(2).replace(".",",")} €`;
 if(k==="annualConsumptionKwh")return `${Number(v).toLocaleString("de-DE")} kWh`;
 return String(v).replace(/\s-\s/g," – ");
}
function timeout<T>(p:Promise<T>,ms:number){return Promise.race([p,new Promise<T>((_,r)=>setTimeout(()=>r(new Error("TIMEOUT")),ms))]);}
function accepted(f:File){return ["application/pdf","image/jpeg","image/png","image/webp"].includes(f.type)||/\.(pdf|jpe?g|png|webp)$/i.test(f.name);}
function setInput(input:HTMLInputElement,value:string){const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value")?.set;setter?.call(input,value);input.dispatchEvent(new Event("input",{bubbles:true}));input.dispatchEvent(new Event("change",{bubbles:true}));}
function applyData(r:BillAnalysisResult){const v=r.annualConsumptionKwh.value;if(typeof v!=="number")return;const type=String(r.energyType.value||"").toLowerCase();const inputs=Array.from(document.querySelectorAll<HTMLInputElement>('input[type="number"]'));const target=type.includes("gas")?inputs.find(i=>/gas|verbrauch/i.test(`${i.placeholder} ${i.name}`)):inputs.find(i=>/strom|verbrauch/i.test(`${i.placeholder} ${i.name}`));if(target)setInput(target,String(v));}
function merge(rs:BillAnalysisResult[]){const out={...rs[0]};for(const r of rs.slice(1)){for(const k of Object.keys(out) as Array<keyof BillAnalysisResult>){if(out[k].value===null&&r[k].value!==null)out[k]=r[k];}}return out;}

function Metric({icon,label,value,wide=false}:{icon:"bolt"|"coins"|"calendar"|"wallet"|"tag";label:string;value:string;wide?:boolean}){
 return <div className={`${wide?"sm:col-span-2":""} rounded-[22px] border border-[#173a53] bg-[#071b2d] px-5 py-5 sm:px-6 sm:py-6`}>
  <div className="flex items-center gap-4">
   <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#092c49] text-[#62d4ff] ring-1 ring-[#174d70]"><Icon name={icon}/></div>
   <div className="min-w-0">
    <p className="text-[15px] font-medium text-[#9cacc1]">{label}</p>
    <p className="mt-1 break-words text-[22px] font-bold leading-tight tracking-[-.025em] text-white sm:text-[25px]">{value}</p>
   </div>
  </div>
 </div>;
}

export default function BillUploadPremium({onContinue}:{onContinue?:()=>void}){
 const inputRef=useRef<HTMLInputElement>(null);const[files,setFiles]=useState<File[]>([]);const[analysis,setAnalysis]=useState<BillAnalysisResult|null>(null);const[error,setError]=useState("");const[status,setStatus]=useState<"idle"|"ready"|"analyzing"|"done">("idle");
 useEffect(()=>{getBillSession().then(s=>{if(s.files.length){setFiles(s.files);if(s.meta?.analysis){setAnalysis(s.meta.analysis);setStatus("done");}}}).catch(()=>undefined);},[]);
 const add=(incoming:File[])=>{const valid=incoming.filter(accepted).filter(f=>f.size<=10*1024*1024);const next=[...files,...valid].filter((f,i,a)=>i===a.findIndex(x=>x.name===f.name&&x.size===f.size&&x.lastModified===f.lastModified)).slice(0,12);setFiles(next);setAnalysis(null);setStatus(next.length?"ready":"idle");void saveBillSession(next,null);};
 const analyze=async()=>{if(!files.length)return;setStatus("analyzing");setError("");try{const results:BillAnalysisResult[]=[];for(const f of files){try{results.push(await timeout(analyzeBill(f),150000));}catch{}}if(!results.length)throw new Error("NO_DATA");const m=merge(results);const repairs=await Promise.all(files.map(f=>repairBillPrices(f)));const wp=repairs.map(x=>x.workPriceCtPerKwh).filter((x):x is number=>typeof x==="number"&&x>=5&&x<=100);const bp=repairs.map(x=>x.basePriceEurPerYear).filter((x):x is number=>typeof x==="number"&&x>=10&&x<=10000);if(wp.length)m.workPriceCtPerKwh={value:Math.max(...wp),confidence:"high",source:"document"};if(bp.length)m.basePriceEurPerYear={value:Math.max(...bp),confidence:"high",source:"document"};setAnalysis(m);setStatus("done");applyData(m);await saveBillSession(files,m);}catch{setStatus("ready");setError("Die Rechnung konnte nicht ausgelesen werden. Bitte eine PDF oder ein scharfes Foto hochladen.");}};
 const provider=analysis?.provider.value?String(analysis.provider.value):"Rechnung";const energy=analysis?.energyType.value?String(analysis.energyType.value):"Stromrechnung";
 const consumption=analysis?text("annualConsumptionKwh",analysis.annualConsumptionKwh.value):"Nicht erkannt";const work=analysis?text("workPriceCtPerKwh",analysis.workPriceCtPerKwh.value):"Nicht erkannt";const base=analysis?text("basePriceEurPerYear",analysis.basePriceEurPerYear.value):"Nicht erkannt";const monthly=analysis?text("monthlyPaymentEur",analysis.monthlyPaymentEur.value):"Nicht erkannt";const period=analysis?text("billingPeriod",analysis.billingPeriod.value):"Nicht erkannt";const tariff=analysis?text("tariffName",analysis.tariffName.value):"Nicht erkannt";
 return <div className="mt-5 text-left">
  {!analysis&&<div className="rounded-[24px] border border-white/10 bg-[#061426]/90 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold text-white">Rechnung hochladen</p><p className="mt-1 text-xs text-slate-400">PDF, JPG, PNG oder WEBP · bis zu 12 Dateien</p></div><div className="flex gap-2"><button type="button" onClick={()=>inputRef.current?.click()} disabled={status==="analyzing"} className="rounded-xl border border-[#19b7ff]/35 bg-[#19b7ff]/10 px-4 py-2.5 text-sm font-bold text-[#8ce4ff]">{files.length?"Weitere Seite":"Rechnung auswählen"}</button>{files.length>0&&<button type="button" onClick={analyze} disabled={status==="analyzing"} className="rounded-xl bg-[#19b7ff] px-4 py-2.5 text-sm font-bold text-[#03101c]">{status==="analyzing"?"Wird geprüft …":"Rechnung prüfen"}</button>}</div></div><input ref={inputRef} type="file" multiple accept="application/pdf,image/jpeg,image/png,image/webp,.pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={e=>{add(Array.from(e.target.files||[]));e.currentTarget.value="";}}/>{error&&<p className="mt-2 text-xs text-red-300">{error}</p>}</div>}
  {analysis&&<div className="space-y-5">
   <section className="rounded-[30px] border border-[#123d5d] bg-[#061a2d] p-5 shadow-[0_20px_60px_rgba(0,0,0,.24)] sm:p-7">
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
     <div className="flex min-w-0 items-center gap-4"><div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] bg-[#082c49] text-[#63d5ff] ring-1 ring-[#174d70]"><Icon name="file"/></div><div className="min-w-0"><p className="text-[11px] font-medium uppercase tracking-[.28em] text-[#9cacc1]">Rechnungsanalyse</p><h3 className="mt-1 text-[28px] font-extrabold leading-none tracking-[-.035em] text-white">{provider}</h3><p className="mt-2 text-base text-[#b7c5d8]">{energy} erkannt</p></div></div>
     <div className="flex shrink-0 items-center gap-3 rounded-[19px] border border-[#087d70] bg-[#06382f]/80 px-4 py-3 text-[#4ff0c5]"><Icon name="check"/><span className="text-sm font-bold leading-tight">Rechnung<br/>erfolgreich ausgelesen</span></div>
    </div>
   </section>

   <section className="rounded-[30px] border border-[#123d5d] bg-[#061a2d] p-5 shadow-[0_20px_60px_rgba(0,0,0,.22)] sm:p-7">
    <div className="mb-6 flex items-center gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#082c49] text-[#63d5ff] ring-1 ring-[#174d70]"><Icon name="chart"/></div><div><h3 className="text-[24px] font-extrabold tracking-[-.025em] text-white">Wichtigste Daten</h3><p className="mt-1 text-sm text-[#9cacc1] sm:text-base">Die relevanten Informationen aus deiner Rechnung</p></div></div>
    <div className="grid gap-4 sm:grid-cols-2"><Metric icon="bolt" label="Jahresverbrauch" value={consumption}/><Metric icon="coins" label="Arbeitspreis" value={work}/><Metric icon="calendar" label="Grundpreis" value={base}/><Metric icon="wallet" label="Monatlicher Abschlag" value={monthly}/><Metric icon="calendar" label="Abrechnungszeitraum" value={period} wide/><Metric icon="tag" label="Tarif" value={tariff} wide/></div>
   </section>

   <section className="rounded-[30px] border border-[#10517b] bg-[#061a2d] p-5 shadow-[0_20px_60px_rgba(0,0,0,.2)] sm:p-7"><div className="flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#082c49] text-[#63d5ff] ring-1 ring-[#174d70]"><Icon name="info"/></div><div><h3 className="text-[18px] font-extrabold text-[#63d5ff]">Hinweis</h3><p className="mt-1 text-sm leading-6 text-[#9cacc1] sm:text-base">Die ausgelesenen Werte können je nach Rechnungstyp leicht variieren. Bitte überprüfe die Angaben zur Sicherheit.</p></div></div></section>
   {onContinue&&<button type="button" onClick={onContinue} className="w-full rounded-[18px] bg-[#19b7ff] px-5 py-3.5 text-sm font-bold text-[#03101c]">Mit diesen Daten weiter</button>}
  </div>}
 </div>;
}
