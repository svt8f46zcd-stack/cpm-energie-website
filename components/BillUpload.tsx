"use client";

import { useRef, useState } from "react";
import { analyzeBill, type BillAnalysisResult } from "@/lib/bill-analysis";

const labels: Array<[keyof BillAnalysisResult, string]> = [
  ["energyType", "Energieart"],
  ["provider", "Anbieter"],
  ["annualConsumptionKwh", "Jahresverbrauch"],
  ["workPriceCtPerKwh", "Arbeitspreis"],
  ["basePriceEurPerYear", "Grundpreis"],
  ["monthlyPaymentEur", "Monatlicher Abschlag"],
  ["billingPeriod", "Abrechnungszeitraum"],
  ["contractEnd", "Vertragsende"],
  ["cancellationPeriod", "Kündigungsfrist"],
  ["address", "Adresse"],
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
    const value = String(consumption);
    const type = String(result.energyType.value || "").toLowerCase();
    const numberInputs = Array.from(document.querySelectorAll<HTMLInputElement>('input[type="number"]'));
    const target = type.includes("gas") ? numberInputs.find(i => i.getAttribute("placeholder")?.includes("12.000")) : numberInputs.find(i => i.getAttribute("placeholder")?.includes("3.000"));
    if (target) setReactInputValue(target, value);
  }

  const provider = result.provider.value;
  if (typeof provider === "string" && provider.trim()) {
    const input = Array.from(document.querySelectorAll<HTMLInputElement>("input")).find(i => i.placeholder?.toLowerCase().includes("e.on"));
    if (input) setReactInputValue(input, provider);
  }

  const address = result.address.value;
  if (typeof address === "string" && address.trim()) {
    const match = address.match(/^(.+?)\s+(\d+[a-zA-Z]?)\s*,?\s*(\d{5})\s+(.+)$/);
    if (match) {
      const [, street, house, postal, city] = match;
      const inputs = Array.from(document.querySelectorAll<HTMLInputElement>("input"));
      const plzInput = inputs.find(i => i.placeholder === "55278");
      const streetInput = inputs.find(i => i.placeholder?.includes("Hauptstraße"));
      const houseInput = inputs.find(i => i.placeholder?.includes("3a"));
      if (plzInput) setReactInputValue(plzInput, postal);
      if (streetInput) setReactInputValue(streetInput, street.trim());
      if (houseInput) setReactInputValue(houseInput, house);
      const cityText = Array.from(document.querySelectorAll("p")).find(p => p.textContent?.trim() === city.trim());
      if (cityText) (cityText as HTMLElement).click();
    }
  }

  window.setTimeout(() => {
    const continueButton = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(b => b.textContent?.includes("Mit Abrechnung fortfahren"));
    continueButton?.click();
  }, 150);
}

export default function BillUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"idle" | "ready" | "analyzing" | "done" | "unavailable">("idle");
  const [analysis, setAnalysis] = useState<BillAnalysisResult | null>(null);

  const handleFile = async (file?: File) => {
    setError("");
    setAnalysis(null);
    if (!file) return;

    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setStatus("idle");
      setError("Bitte PDF, JPG, PNG oder WEBP auswählen.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setStatus("idle");
      setError("Die Datei darf maximal 10 MB groß sein.");
      return;
    }

    setFileName(file.name);
    setStatus("ready");

    try {
      setStatus("analyzing");
      const result = await analyzeBill(file);
      setAnalysis(result);
      setStatus("done");
      applyRecognizedData(result);
    } catch (err) {
      if (err instanceof Error && err.message === "BILL_ANALYSIS_ENDPOINT_MISSING") {
        setStatus("unavailable");
        return;
      }
      setStatus("ready");
      setError("Die Rechnung konnte noch nicht ausgewertet werden. Bitte versuche es später erneut.");
    }
  };

  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-white/[.035] p-4 text-left">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#19b7ff]/10 text-xl text-[#66d5ff]">↑</div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-white">Abrechnung hochladen</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">Strom oder Gas. PDF oder Foto, maximal 10 MB. Die Auswertung erfolgt nur über eine ausdrücklich konfigurierte Analyse-Schnittstelle.</p>
          <button type="button" onClick={() => inputRef.current?.click()} className="mt-3 rounded-xl border border-[#19b7ff]/35 bg-[#19b7ff]/10 px-4 py-2.5 text-sm font-bold text-[#8ce4ff] transition hover:bg-[#19b7ff]/20">
            {status === "analyzing" ? "Rechnung wird geprüft …" : "Datei auswählen"}
          </button>
          <input ref={inputRef} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />

          {fileName && status !== "done" && <p className="mt-2 truncate text-xs text-slate-300">✓ {fileName}</p>}
          {status === "ready" && <p className="mt-2 text-xs text-emerald-300">Datei geprüft und bereit für die Auswertung.</p>}
          {status === "analyzing" && <p className="mt-2 text-xs text-[#8ce4ff]">Die Rechnung wird verarbeitet. Es werden keine Werte erfunden, wenn Angaben fehlen.</p>}
          {status === "unavailable" && <p className="mt-2 text-xs leading-5 text-slate-400">Die automatische Rechnungsauswertung ist technisch vorbereitet, aber noch nicht mit einem Analyse-Dienst verbunden. Deine Datei wird deshalb nicht übertragen.</p>}
          {error && <p className="mt-2 text-xs text-red-300">{error}</p>}

          {analysis && (
            <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="text-sm font-bold text-white">Erkannte Angaben</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">Die erkannten Werte wurden in den Tarifcheck übernommen. Bitte vor dem Vergleich prüfen. Nicht eindeutig erkannte Angaben bleiben leer.</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {labels.map(([key, label]) => {
                  const field = analysis[key];
                  return (
                    <div key={key} className="rounded-lg border border-white/10 bg-white/[.025] p-2.5">
                      <p className="text-[11px] text-slate-500">{label}</p>
                      <p className="mt-0.5 text-sm font-semibold text-white">{field.value ?? "Nicht erkannt"}</p>
                      <p className="mt-0.5 text-[10px] text-slate-500">Sicherheit: {field.confidence}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
