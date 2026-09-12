"use client";

import { useEffect, useRef, useState } from "react";
import { analyzeBill, type BillAnalysisResult } from "@/lib/bill-analysis-v3";
import { repairBillPrices } from "@/lib/bill-price-repair";
import { getBillSession, saveBillSession } from "@/lib/bill-session";

function text(k: keyof BillAnalysisResult, v: string | number | null | undefined) {
  if (v == null) return "Nicht erkannt";
  if (k === "workPriceCtPerKwh") return `${Number(v).toFixed(2).replace(".", ",")} ct/kWh`;
  if (k === "basePriceEurPerYear") return `${Number(v).toFixed(2).replace(".", ",")} € / Jahr`;
  if (k === "annualConsumptionKwh") return `${Number(v).toLocaleString("de-DE")} kWh`;
  return String(v).replace(/\s-\s/g, " – ");
}

function timeout<T>(p: Promise<T>, ms: number) { return Promise.race([p, new Promise<T>((_, r) => setTimeout(() => r(new Error("TIMEOUT")), ms))]); }
function accepted(f: File) { return ["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(f.type) || /\.(pdf|jpe?g|png|webp)$/i.test(f.name); }
function setInput(input: HTMLInputElement, value: string) { const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set; setter?.call(input, value); input.dispatchEvent(new Event("input", { bubbles: true })); input.dispatchEvent(new Event("change", { bubbles: true })); }
function applyData(r: BillAnalysisResult) { const v = r.annualConsumptionKwh.value; if (typeof v !== "number") return; const type = String(r.energyType.value || "").toLowerCase(); const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('input[type="number"]')); const target = type.includes("gas") ? inputs.find(i => /gas|verbrauch/i.test(`${i.placeholder} ${i.name}`)) : inputs.find(i => /strom|verbrauch/i.test(`${i.placeholder} ${i.name}`)); if (target) setInput(target, String(v)); }
function merge(rs: BillAnalysisResult[]) { const out = { ...rs[0] }; for (const r of rs.slice(1)) for (const k of Object.keys(out) as Array<keyof BillAnalysisResult>) if (out[k].value === null && r[k].value !== null) out[k] = r[k]; return out; }

export default function BillUploadPremium({ onContinue }: { onContinue?: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [analysis, setAnalysis] = useState<BillAnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"idle" | "ready" | "analyzing" | "done">("idle");

  useEffect(() => { getBillSession().then(s => { if (s.files.length) { setFiles(s.files); if (s.meta?.analysis) { setAnalysis(s.meta.analysis); setStatus("done"); } } }).catch(() => undefined); }, []);

  const add = (incoming: File[]) => {
    const valid = incoming.filter(accepted).filter(f => f.size <= 10 * 1024 * 1024);
    const next = [...files, ...valid].filter((f, i, a) => i === a.findIndex(x => x.name === f.name && x.size === f.size && x.lastModified === f.lastModified)).slice(0, 12);
    setFiles(next); setAnalysis(null); setStatus(next.length ? "ready" : "idle"); void saveBillSession(next, null);
  };

  const analyze = async () => {
    if (!files.length) return;
    setStatus("analyzing"); setError("");
    try {
      const results: BillAnalysisResult[] = [];
      for (const f of files) { try { results.push(await timeout(analyzeBill(f), 150000)); } catch {} }
      if (!results.length) throw new Error("NO_DATA");
      const m = merge(results);
      const repairs = await Promise.all(files.map(f => repairBillPrices(f)));
      const wp = repairs.map(x => x.workPriceCtPerKwh).filter((x): x is number => typeof x === "number" && x >= 5 && x <= 100);
      const bp = repairs.map(x => x.basePriceEurPerYear).filter((x): x is number => typeof x === "number" && x >= 10 && x <= 10000);
      if (wp.length) m.workPriceCtPerKwh = { value: Math.max(...wp), confidence: "high", source: "document" };
      if (bp.length) m.basePriceEurPerYear = { value: Math.max(...bp), confidence: "high", source: "document" };
      setAnalysis(m); setStatus("done"); applyData(m); await saveBillSession(files, m);
    } catch { setStatus("ready"); setError("Die Rechnung konnte nicht ausgelesen werden. Bitte eine PDF oder ein scharfes Foto hochladen."); }
  };

  const provider = analysis?.provider.value ? String(analysis.provider.value) : "Energierechnung";
  const consumptionValue = analysis?.annualConsumptionKwh.value;
  const workValue = analysis?.workPriceCtPerKwh.value;
  const baseValue = analysis?.basePriceEurPerYear.value;
  const consumption = analysis ? text("annualConsumptionKwh", consumptionValue) : "Nicht erkannt";
  const work = analysis ? text("workPriceCtPerKwh", workValue) : "Nicht erkannt";
  const base = analysis ? text("basePriceEurPerYear", baseValue) : "Nicht erkannt";
  const annualCost = typeof consumptionValue === "number" && typeof workValue === "number" && typeof baseValue === "number"
    ? `${Math.round(consumptionValue * workValue / 100 + baseValue).toLocaleString("de-DE")} €`
    : "Nicht erkannt";

  return <div className="mt-5 text-left">
    {!analysis && <div className="rounded-[24px] border border-white/10 bg-[#061426]/90 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold text-white">Rechnung hochladen</p><p className="mt-1 text-xs text-slate-400">PDF, JPG, PNG oder WEBP · bis zu 12 Dateien</p></div><div className="flex gap-2"><button type="button" onClick={() => inputRef.current?.click()} disabled={status === "analyzing"} className="rounded-xl border border-[#19b7ff]/35 bg-[#19b7ff]/10 px-4 py-2.5 text-sm font-bold text-[#8ce4ff]">{files.length ? "Weitere Seite" : "Rechnung auswählen"}</button>{files.length > 0 && <button type="button" onClick={analyze} disabled={status === "analyzing"} className="rounded-xl bg-[#19b7ff] px-4 py-2.5 text-sm font-bold text-[#03101c]">{status === "analyzing" ? "Wird geprüft …" : "Rechnung prüfen"}</button>}</div></div>
      <input ref={inputRef} type="file" multiple accept="application/pdf,image/jpeg,image/png,image/webp,.pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={e => { add(Array.from(e.target.files || [])); e.currentTarget.value = ""; }} />
      {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
    </div>}

    {analysis && <section className="overflow-hidden rounded-[30px] border border-[#173b56] bg-[#061a2d] px-6 py-8 shadow-[0_20px_60px_rgba(0,0,0,.25)] sm:px-10 sm:py-10">
      <div className="flex items-start justify-between gap-5"><div className="min-w-0"><p className="text-[13px] uppercase tracking-[.30em] text-[#92a5c0] sm:text-[14px]">Rechnungsanalyse</p><h3 className="mt-4 text-[34px] font-extrabold leading-none tracking-[-.04em] text-white sm:text-[42px]">{provider}</h3></div><div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] bg-[#0b3150] text-[34px] leading-none text-[#67d7ff] sm:h-[76px] sm:w-[76px]">✦</div></div>
      <div className="mt-10 border-t border-[#20384e] pt-8 sm:mt-12 sm:pt-9"><div className="space-y-4">{[["Jahresverbrauch", consumption], ["Arbeitspreis", work], ["Grundpreis", base], ["Jahreskosten", annualCost]].map(([label, value]) => <div key={label} className="grid min-h-[92px] grid-cols-[minmax(0,1fr)_minmax(0,42%)] items-center gap-4 rounded-[28px] border border-[#213d56] bg-[#102238] px-6 py-5 sm:min-h-[100px] sm:px-8"><span className="min-w-0 text-[20px] font-medium leading-tight text-[#9aabc3] sm:text-[24px]">{label}</span><span className="min-w-0 break-words text-right text-[21px] font-extrabold leading-tight tracking-[-.025em] text-white sm:text-[25px]">{value}</span></div>)}</div><p className="mt-6 text-[17px] text-[#758ba8] sm:text-[19px]">Darstellung dient als Beispiel.</p></div>
    </section>}

    {analysis && onContinue && <button type="button" onClick={onContinue} className="mt-5 w-full rounded-[18px] bg-[#19b7ff] px-5 py-3.5 text-sm font-bold text-[#03101c]">Mit diesen Daten weiter</button>}
  </div>;
}
