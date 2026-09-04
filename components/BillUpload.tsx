"use client";

import { useRef, useState } from "react";
import { analyzeBill, type BillAnalysisResult } from "@/lib/bill-analysis-v3";

const labels: Array<[keyof BillAnalysisResult, string]> = [
  ["energyType", "Energieart"],
  ["provider", "Anbieter"],
  ["tariffName", "Tarif"],
  ["annualConsumptionKwh", "Jahresverbrauch"],
  ["workPriceCtPerKwh", "Arbeitspreis"],
  ["basePriceEurPerYear", "Grundpreis"],
  ["monthlyPaymentEur", "Monatlicher Abschlag"],
  ["billingPeriod", "Abrechnungszeitraum"],
  ["contractEnd", "Vertragsende"],
  ["cancellationPeriod", "Kündigungsfrist"],
  ["address", "Verbrauchsstelle"],
];

function setReactInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function applyRecognizedData(result: BillAnalysisResult) {
  const consumption = result.annualConsumptionKwh.value;
  if (typeof consumption === "number" || typeof consumption === "string") {
    const type = String(result.energyType.value || "").toLowerCase();
    const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('input[type="number"]'));
    const target = type.includes("gas")
      ? inputs.find(input => input.placeholder?.includes("12.000"))
      : inputs.find(input => input.placeholder?.includes("3.000"));
    if (target) setReactInputValue(target, String(consumption));
  }

  const provider = result.provider.value;
  if (typeof provider === "string" && provider.trim()) {
    const input = Array.from(document.querySelectorAll<HTMLInputElement>("input")).find(input => input.placeholder?.toLowerCase().includes("e.on"));
    if (input) setReactInputValue(input, provider);
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

export default function BillUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"idle" | "ready" | "analyzing" | "done">("idle");
  const [analysis, setAnalysis] = useState<BillAnalysisResult | null>(null);

  const mergeFiles = (incoming: File[]) => {
    const valid = incoming.filter(file => ["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(file.type));
    const oversized = valid.filter(file => file.size > 10 * 1024 * 1024);
    if (incoming.length !== valid.length) setError("Bitte nur PDF, JPG, PNG oder WEBP auswählen.");
    else if (oversized.length) setError("Jede Datei darf maximal 10 MB groß sein.");
    else setError("");

    const next = [...files, ...valid.filter(file => file.size <= 10 * 1024 * 1024)];
    const unique = next.filter((file, index, all) => index === all.findIndex(other => other.name === file.name && other.size === file.size && other.lastModified === file.lastModified));
    if (unique.length > 12) {
      setError("Bitte maximal 12 Seiten bzw. Dateien gleichzeitig auswählen.");
      return;
    }
    setFiles(unique);
    setFileNames(unique.map(file => file.name));
    setStatus(unique.length ? "ready" : "idle");
    setAnalysis(null);
  };

  const removeFile = (index: number) => {
    const next = files.filter((_, i) => i !== index);
    setFiles(next);
    setFileNames(next.map(file => file.name));
    setAnalysis(null);
    setStatus(next.length ? "ready" : "idle");
  };

  const analyzeFiles = async () => {
    if (!files.length) return;
    setError("");
    setStatus("analyzing");
    try {
      const results: BillAnalysisResult[] = [];
      for (const file of files) results.push(await analyzeBill(file));
      const merged: BillAnalysisResult = results.reduce((acc, current) => {
        (Object.keys(acc) as Array<keyof BillAnalysisResult>).forEach(key => {
          const candidate = current[key];
          if (candidate.value !== null && candidate.value !== "" && (acc[key].value === null || candidate.confidence === "high")) acc[key] = candidate;
        });
        return acc;
      }, structuredClone(results[0]));

      const usable = [merged.energyType.value, merged.provider.value, merged.annualConsumptionKwh.value, merged.workPriceCtPerKwh.value, merged.basePriceEurPerYear.value];
      if (!usable.some(value => value !== null && value !== "")) throw new Error("NO_USABLE_DATA");
      setAnalysis(merged);
      setStatus("done");
      applyRecognizedData(merged);
    } catch (err) {
      setStatus("ready");
      setError(err instanceof Error && err.message === "OCR_LIBRARY_LOAD_FAILED" ? "Die Rechnungserkennung konnte nicht geladen werden. Bitte erneut versuchen." : "Die Rechnung konnte nicht eindeutig ausgewertet werden. Bitte prüfe die Dateien oder gib den Verbrauch manuell ein.");
    }
  };

  return <div className="mt-4 rounded-2xl border border-white/10 bg-white/[.035] p-4 text-left">
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#19b7ff]/10 text-xl text-[#66d5ff]">↑</div>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-white">Abrechnung hochladen</p>
        <p className="mt-1 text-xs leading-5 text-slate-400">PDF oder mehrere Seiten als Fotos, maximal 12 Dateien. Mehrseitige Abrechnungen werden gemeinsam geprüft. Die Dateien werden nicht an CPM Energie übertragen.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" disabled={status === "analyzing"} onClick={() => inputRef.current?.click()} className="rounded-xl border border-[#19b7ff]/35 bg-[#19b7ff]/10 px-4 py-2.5 text-sm font-bold text-[#8ce4ff] transition hover:bg-[#19b7ff]/20 disabled:opacity-50">
            {files.length ? "Weitere Seite hinzufügen" : "Rechnung auswählen"}
          </button>
          {files.length > 0 && <button type="button" disabled={status === "analyzing"} onClick={analyzeFiles} className="rounded-xl bg-[#19b7ff] px-4 py-2.5 text-sm font-bold text-[#03101c] disabled:opacity-50">
            {status === "analyzing" ? "Rechnung wird geprüft …" : status === "done" ? "Erneut prüfen" : `${files.length} ${files.length === 1 ? "Datei" : "Dateien"} prüfen`}
          </button>}
        </div>
        <input ref={inputRef} type="file" multiple accept="application/pdf,image/jpeg,image/png,image/webp" className="hidden" onChange={e => mergeFiles(Array.from(e.target.files || []))} />
        {files.length > 0 && <div className="mt-4 space-y-2"><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Ausgewählt · {files.length}/12</p>{files.map((file, index) => <div key={`${file.name}-${file.size}-${file.lastModified}`} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[.02] px-3 py-2"><span className="text-xs font-semibold text-emerald-300">✓</span><span className="min-w-0 flex-1 truncate text-xs text-slate-300">Seite {index + 1} · {file.name}</span><button type="button" disabled={status === "analyzing"} onClick={() => removeFile(index)} className="rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-white/5 hover:text-white">Entfernen</button></div>)}</div>}
        {status === "analyzing" && <p className="mt-3 text-xs leading-5 text-[#8ce4ff]">{files.length > 1 ? `Wir prüfen ${files.length} Seiten gemeinsam und führen die erkannten Rechnungsdaten zusammen.` : "Die Rechnung wird auf vorhandene Textdaten geprüft. Falls nötig, wird automatisch OCR nachgeschaltet."}</p>}
        {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
        {analysis && <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-white">Rechnung erkannt</p>
            <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">{files.length > 1 ? `${files.length} Seiten` : "Automatisch"}</span>
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-400">Die Erkennung bewertet Preis, Verbrauch und Zahlungen anhand ihrer Rechnungsposition. Bei mehreren Seiten werden die Ergebnisse zusammengeführt, statt jede Seite als separate Rechnung zu behandeln.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {labels.map(([key, label]) => { const f = analysis[key]; return <div key={key} className="rounded-lg border border-white/10 bg-white/[.025] p-2.5"><p className="text-[11px] text-slate-500">{label}</p><p className="mt-0.5 text-sm font-semibold text-white">{displayValue(key, f.value)}</p><p className="mt-0.5 text-[10px] text-slate-500">Sicherheit: {f.confidence}</p></div>; })}
          </div>
          <p className="mt-3 text-xs font-semibold text-emerald-300">✓ Erkannte Werte wurden in den Tarifcheck übernommen.</p>
        </div>}
      </div>
    </div>
  </div>;
}
