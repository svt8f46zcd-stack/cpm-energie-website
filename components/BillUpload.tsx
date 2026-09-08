"use client";

import { useEffect, useRef, useState } from "react";
import { analyzeBill, type BillAnalysisResult } from "@/lib/bill-analysis-v3";
import { analyzeBillNames } from "@/lib/bill-name-analysis";
import { getBillSession, saveBillSession } from "@/lib/bill-session";

type NameField = { value: string | null; confidence: "high" | "medium" | "unknown"; source: "document" | "not_detected" };
type BillAnalysisWithName = BillAnalysisResult & { firstName?: NameField; lastName?: NameField };

const labels: Array<[keyof BillAnalysisResult, string]> = [
  ["energyType", "Energieart"], ["provider", "Anbieter"], ["tariffName", "Tarif"],
  ["annualConsumptionKwh", "Jahresverbrauch"], ["workPriceCtPerKwh", "Arbeitspreis"],
  ["basePriceEurPerYear", "Grundpreis"], ["monthlyPaymentEur", "Monatlicher Abschlag"],
  ["billingPeriod", "Abrechnungszeitraum"], ["contractEnd", "Vertragsende"],
  ["cancellationPeriod", "Kündigungsfrist"], ["address", "Verbrauchsstelle"],
];

function setReactInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function setReactSelectValue(select: HTMLSelectElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")?.set;
  setter?.call(select, value);
  select.dispatchEvent(new Event("input", { bubbles: true }));
  select.dispatchEvent(new Event("change", { bubbles: true }));
}

function applyRecognizedData(result: BillAnalysisResult) {
  const consumption = result.annualConsumptionKwh.value;
  const type = String(result.energyType.value || "").toLowerCase();
  if (typeof consumption === "number" || typeof consumption === "string") {
    const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('input[type="number"]'));
    const target = type.includes("gas")
      ? inputs.find(i => /12\.000|gas|verbrauch/i.test(`${i.placeholder} ${i.name} ${i.getAttribute("aria-label") || ""}`))
      : inputs.find(i => /3\.000|strom|verbrauch/i.test(`${i.placeholder} ${i.name} ${i.getAttribute("aria-label") || ""}`));
    if (target) setReactInputValue(target, String(consumption));
  }
  const provider = result.provider.value;
  if (typeof provider === "string" && provider.trim()) {
    const inputs = Array.from(document.querySelectorAll<HTMLInputElement>("input"));
    const target = inputs.find(i => /anbieter|versorger|stromanbieter|gasanbieter|e\.on/i.test(`${i.placeholder} ${i.name} ${i.getAttribute("aria-label") || ""}`));
    if (target) setReactInputValue(target, provider);
    const selects = Array.from(document.querySelectorAll<HTMLSelectElement>("select"));
    const select = selects.find(s => /anbieter|versorger|energie/i.test(`${s.name} ${s.id} ${s.getAttribute("aria-label") || ""}`) && Array.from(s.options).some(o => o.text.toLowerCase().includes(provider.toLowerCase())));
    if (select) {
      const option = Array.from(select.options).find(o => o.text.toLowerCase().includes(provider.toLowerCase()));
      if (option) setReactSelectValue(select, option.value);
    }
  }
}

function displayValue(key: keyof BillAnalysisResult, value: string | number | null) {
  if (value === null) return "Nicht erkannt";
  if (key === "workPriceCtPerKwh") return `${Number(value).toFixed(2).replace(".", ",")} ct/kWh`;
  if (key === "basePriceEurPerYear") return `${Number(value).toFixed(2).replace(".", ",")} €/Jahr`;
  if (key === "monthlyPaymentEur") return `${Number(value).toFixed(2).replace(".", ",")} €`;
  if (key === "annualConsumptionKwh") return `${Number(value).toLocaleString("de-DE")} kWh`;
  return String(value);
}

function fileAccepted(file: File) {
  return ["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(file.type) || /\.(pdf|jpe?g|png|webp)$/i.test(file.name);
}

function withTimeout<T>(promise: Promise<T>, ms: number) {
  return Promise.race([promise, new Promise<T>((_, reject) => setTimeout(() => reject(new Error("BILL_ANALYSIS_TIMEOUT")), ms))]);
}

function mergeAnalyses(results: BillAnalysisResult[]) {
  if (!results.length) throw new Error("NO_USABLE_DATA");
  const rank = (c: string) => c === "high" ? 3 : c === "medium" ? 2 : c === "low" ? 1 : 0;
  const merged = { ...results[0] };
  for (let i = 1; i < results.length; i++) {
    const current = results[i];
    for (const key of Object.keys(merged) as Array<keyof BillAnalysisResult>) {
      const a = merged[key], b = current[key];
      if (a.value === null && b.value !== null) merged[key] = b;
      else if (a.value !== null && b.value !== null && key === "annualConsumptionKwh" && typeof a.value === "number" && typeof b.value === "number") merged[key] = b.value > a.value ? b : a;
      else if (a.value !== null && b.value !== null && rank(b.confidence) >= rank(a.confidence)) merged[key] = b;
    }
  }
  return merged;
}

export default function BillUpload({ onContinue }: { onContinue?: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"idle" | "ready" | "analyzing" | "done">("idle");
  const [analysis, setAnalysis] = useState<BillAnalysisWithName | null>(null);

  useEffect(() => {
    let cancelled = false;
    getBillSession().then(session => {
      if (cancelled || !session.files.length) return;
      setFiles(session.files);
      setAnalysis((session.meta?.analysis as BillAnalysisWithName) || null);
      setStatus(session.meta?.analysis ? "done" : "ready");
      if (session.meta?.analysis) applyRecognizedData(session.meta.analysis);
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  const mergeFiles = (incoming: File[]) => {
    const valid = incoming.filter(fileAccepted);
    const oversized = valid.filter(file => file.size > 10 * 1024 * 1024);
    if (incoming.some(file => !fileAccepted(file))) setError("Bitte nur PDF, JPG, PNG oder WEBP auswählen.");
    else if (oversized.length) setError("Jede Datei darf maximal 10 MB groß sein.");
    else setError("");
    const next = [...files, ...valid.filter(file => file.size <= 10 * 1024 * 1024)];
    const unique = next.filter((file, index, all) => index === all.findIndex(other => other.name === file.name && other.size === file.size && other.lastModified === file.lastModified));
    if (unique.length > 12) { setError("Bitte maximal 12 Dateien gleichzeitig auswählen."); return; }
    setFiles(unique); setStatus(unique.length ? "ready" : "idle"); setAnalysis(null);
    void saveBillSession(unique, null).catch(() => undefined);
  };

  const removeFile = (index: number) => {
    const next = files.filter((_, i) => i !== index);
    setFiles(next); setAnalysis(null); setStatus(next.length ? "ready" : "idle");
    void saveBillSession(next, null).catch(() => undefined);
  };

  const removeAllFiles = () => {
    setFiles([]); setAnalysis(null); setError(""); setStatus("idle");
    if (inputRef.current) inputRef.current.value = "";
    void saveBillSession([], null).catch(() => undefined);
  };

  const analyzeFiles = async () => {
    if (!files.length || status === "analyzing") return;
    setError(""); setStatus("analyzing");
    try {
      const results: BillAnalysisResult[] = [];
      for (const file of files) {
        try { results.push(await withTimeout(analyzeBill(file), 150000)); } catch { /* continue */ }
      }
      if (!results.length) throw new Error("NO_USABLE_DATA");
      const merged = mergeAnalyses(results);
      const usable = [merged.energyType.value, merged.provider.value, merged.annualConsumptionKwh.value, merged.workPriceCtPerKwh.value, merged.basePriceEurPerYear.value, merged.monthlyPaymentEur.value];
      if (!usable.some(value => value !== null && value !== "")) throw new Error("NO_USABLE_DATA");
      const initial: BillAnalysisWithName = {
        ...merged,
        firstName: { value: null, confidence: "unknown", source: "not_detected" },
        lastName: { value: null, confidence: "unknown", source: "not_detected" },
      };
      setAnalysis(initial); setStatus("done"); applyRecognizedData(initial);
      await saveBillSession(files, initial);
      void withTimeout(analyzeBillNames(files), 12000).then(names => {
        const withName: BillAnalysisWithName = {
          ...initial,
          firstName: { value: names.firstName, confidence: names.confidence, source: names.firstName ? "document" : "not_detected" },
          lastName: { value: names.lastName, confidence: names.confidence, source: names.lastName ? "document" : "not_detected" },
        };
        setAnalysis(withName); void saveBillSession(files, withName).catch(() => undefined);
      }).catch(() => undefined);
    } catch (err) {
      setStatus("ready");
      setError(err instanceof Error && err.message === "OCR_LIBRARY_LOAD_FAILED" ? "Die Rechnungserkennung konnte nicht geladen werden. Bitte erneut versuchen." : "Die Rechnung konnte nicht ausgelesen werden. Bitte die Seite möglichst gerade und vollständig fotografieren oder eine PDF hochladen.");
    }
  };

  const recipientComplete = Boolean(analysis?.firstName?.value && analysis?.lastName?.value);
  const recipientName = recipientComplete ? [analysis?.firstName?.value, analysis?.lastName?.value].filter(Boolean).join(" ") : "Nicht sicher erkannt";
  const cards = analysis ? labels.map(([key, label]) => ({ key, label, value: displayValue(key, analysis[key].value) })) : [];

  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-white/[.035] p-4 text-left">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#19b7ff]/10 text-xl text-[#66d5ff]">↑</div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-white">Rechnung hochladen</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">Eine oder mehrere Seiten deiner Strom oder Gasrechnung. PDF, JPG, PNG oder WEBP, bis zu 12 Dateien.</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">Die wichtigen Tarifdaten werden automatisch aus der Rechnung gelesen.</p>

          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" disabled={status === "analyzing"} onClick={() => inputRef.current?.click()} className="rounded-xl border border-[#19b7ff]/35 bg-[#19b7ff]/10 px-4 py-2.5 text-sm font-bold text-[#8ce4ff]">{files.length ? "Weitere Seite hinzufügen" : "Rechnung auswählen"}</button>
            {files.length > 0 ? <button type="button" disabled={status === "analyzing"} onClick={analyzeFiles} className="rounded-xl bg-[#19b7ff] px-4 py-2.5 text-sm font-bold text-[#03101c]">{status === "analyzing" ? "Rechnung wird geprüft …" : status === "done" ? "Erneut prüfen" : `${files.length} ${files.length === 1 ? "Datei" : "Dateien"} prüfen`}</button> : null}
          </div>

          <input ref={inputRef} type="file" multiple accept="application/pdf,image/jpeg,image/png,image/webp,.pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={e => { mergeFiles(Array.from(e.target.files || [])); e.currentTarget.value = ""; }} />

          {files.length > 0 ? (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Hochgeladene Dateien · {files.length}/12</p>
                <button type="button" disabled={status === "analyzing"} onClick={removeAllFiles} className="rounded-lg border border-red-400/20 bg-red-400/5 px-2.5 py-1.5 text-[11px] font-bold text-red-300">Alle löschen</button>
              </div>
              {files.map((file, index) => (
                <div key={`${file.name}-${file.size}-${file.lastModified}`} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.02] p-2.5">
                  <div className="h-14 w-12 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-[#071321]">{file.type.startsWith("image/") ? <img src={URL.createObjectURL(file)} alt={`Vorschau Seite ${index + 1}`} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-[10px] font-black text-[#66d5ff]">PDF</div>}</div>
                  <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-slate-200">{file.type === "application/pdf" || /\.pdf$/i.test(file.name) ? `Datei ${index + 1} · ${file.name}` : `Seite ${index + 1} · ${file.name}`}</p><p className="mt-0.5 text-[10px] text-slate-500">{(file.size / 1024 / 1024).toFixed(1)} MB</p></div>
                  <button type="button" aria-label={`${file.name} löschen`} disabled={status === "analyzing"} onClick={() => removeFile(index)} className="flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-red-400/20 bg-red-400/5 px-2.5 text-[11px] font-bold text-red-300"><span aria-hidden="true">✕</span><span>Löschen</span></button>
                </div>
              ))}
            </div>
          ) : null}

          {status === "analyzing" ? <p className="mt-3 text-xs leading-5 text-[#8ce4ff]">Rechnung wird analysiert. Die erste OCR Initialisierung kann auf dem iPhone etwas länger dauern.</p> : null}
          {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}

          {analysis ? (
            <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="flex items-center justify-between gap-3"><p className="text-sm font-bold text-white">Rechnung erkannt</p><span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">Automatisch</span></div>
              <div className="mt-3 rounded-lg border border-[#19b7ff]/15 bg-[#19b7ff]/5 p-3"><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Rechnungsempfänger</p><p className="mt-1 text-base font-bold text-white">{recipientName}</p><p className="mt-0.5 text-[10px] text-slate-500">{recipientComplete ? `Automatisch erkannt · Sicherheit: ${analysis.firstName?.confidence || "unknown"}` : "Name wurde nicht sicher erkannt. Die Tarifdaten können trotzdem übernommen werden."}</p></div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {cards.map(card => <div key={card.key} className="rounded-lg border border-white/10 bg-white/[.025] p-2"><p className="text-[10px] uppercase tracking-wider text-slate-500">{card.label}</p><p className="mt-0.5 text-sm font-semibold text-white">{card.value}</p></div>)}
              </div>
              {onContinue ? <button type="button" onClick={onContinue} className="mt-4 w-full rounded-xl bg-[#19b7ff] px-4 py-3 text-sm font-bold text-[#03101c]">Mit den erkannten Daten fortfahren</button> : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
