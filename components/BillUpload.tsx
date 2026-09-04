"use client";

import { useRef, useState } from "react";
import { analyzeBill, type BillAnalysisResult } from "@/lib/bill-analysis-v2";

const labels: Array<[keyof BillAnalysisResult, string]> = [
  ["energyType", "Energieart"], ["provider", "Anbieter"], ["annualConsumptionKwh", "Jahresverbrauch"],
  ["workPriceCtPerKwh", "Arbeitspreis"], ["basePriceEurPerYear", "Grundpreis"], ["monthlyPaymentEur", "Monatlicher Abschlag"],
  ["billingPeriod", "Abrechnungszeitraum"], ["contractEnd", "Vertragsende"], ["cancellationPeriod", "Kündigungsfrist"], ["address", "Adresse"],
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
    const target = type.includes("gas") ? inputs.find(i => i.placeholder?.includes("12.000")) : inputs.find(i => i.placeholder?.includes("3.000"));
    if (target) setReactInputValue(target, String(consumption));
  }
  const provider = result.provider.value;
  if (typeof provider === "string" && provider.trim()) {
    const input = Array.from(document.querySelectorAll<HTMLInputElement>("input")).find(i => i.placeholder?.toLowerCase().includes("e.on"));
    if (input) setReactInputValue(input, provider);
  }
}

function displayValue(key: keyof BillAnalysisResult, value: string | number | null) {
  if (value === null) return "Nicht erkannt";
  if (key === "workPriceCtPerKwh") return `${String(value).replace(".", ",")} ct/kWh`;
  if (key === "basePriceEurPerYear") return `${String(value).replace(".", ",")} €/Jahr`;
  if (key === "monthlyPaymentEur") return `${String(value).replace(".", ",")} €`;
  if (key === "annualConsumptionKwh") return `${value} kWh`;
  return String(value);
}

export default function BillUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"idle" | "ready" | "analyzing" | "done">("idle");
  const [analysis, setAnalysis] = useState<BillAnalysisResult | null>(null);

  const handleFile = async (file?: File) => {
    setError(""); setAnalysis(null); if (!file) return;
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) { setStatus("idle"); setError("Bitte PDF, JPG, PNG oder WEBP auswählen."); return; }
    if (file.size > 10 * 1024 * 1024) { setStatus("idle"); setError("Die Datei darf maximal 10 MB groß sein."); return; }
    setFileName(file.name); setStatus("analyzing");
    try {
      const result = await analyzeBill(file);
      setAnalysis(result); setStatus("done"); applyRecognizedData(result);
    } catch (err) {
      setStatus("ready");
      setError(err instanceof Error && err.message === "OCR_LIBRARY_LOAD_FAILED" ? "Die lokale Rechnungserkennung konnte nicht geladen werden. Bitte erneut versuchen." : "Die Rechnung konnte nicht eindeutig ausgewertet werden. Bitte prüfe die Angaben oder gib den Verbrauch manuell ein.");
    }
  };

  return <div className="mt-4 rounded-2xl border border-white/10 bg-white/[.035] p-4 text-left">
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#19b7ff]/10 text-xl text-[#66d5ff]">↑</div>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-white">Abrechnung hochladen</p>
        <p className="mt-1 text-xs leading-5 text-slate-400">PDF oder Foto, maximal 10 MB. Die Standardauswertung läuft lokal im Browser. Die Datei wird dabei nicht an CPM Energie übertragen.</p>
        <button type="button" disabled={status === "analyzing"} onClick={() => inputRef.current?.click()} className="mt-3 rounded-xl border border-[#19b7ff]/35 bg-[#19b7ff]/10 px-4 py-2.5 text-sm font-bold text-[#8ce4ff] transition hover:bg-[#19b7ff]/20 disabled:opacity-50">
          {status === "analyzing" ? "Rechnung wird geprüft …" : "Datei auswählen"}
        </button>
        <input ref={inputRef} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
        {fileName && <p className="mt-2 truncate text-xs text-slate-300">✓ {fileName}</p>}
        {status === "analyzing" && <p className="mt-2 text-xs text-[#8ce4ff]">Rechnung wird in mehreren OCR Varianten gelesen. Preiswerte werden anschließend anhand von Einheit, Menge und Rechnungszeile gegengeprüft.</p>}
        {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
        {analysis && <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-sm font-bold text-white">Erkannte Angaben</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">Nur Werte mit passendem Rechnungszusammenhang werden übernommen. Arbeitspreise werden ausdrücklich in ct/kWh geprüft.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {labels.map(([key, label]) => { const f = analysis[key]; return <div key={key} className="rounded-lg border border-white/10 bg-white/[.025] p-2.5"><p className="text-[11px] text-slate-500">{label}</p><p className="mt-0.5 text-sm font-semibold text-white">{displayValue(key, f.value)}</p><p className="mt-0.5 text-[10px] text-slate-500">Sicherheit: {f.confidence}</p></div>; })}
          </div>
          <p className="mt-3 text-xs font-semibold text-emerald-300">✓ Erkannte Werte wurden in den Tarifcheck übernommen.</p>
        </div>}
      </div>
    </div>
  </div>;
}
