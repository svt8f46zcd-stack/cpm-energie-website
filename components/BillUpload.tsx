"use client";

import { useEffect, useRef, useState } from "react";
import { analyzeBill, type BillAnalysisResult } from "@/lib/bill-analysis-enhanced";
import { analyzeBillNames } from "@/lib/bill-name-analysis";
import { saveBillSession } from "@/lib/bill-session";

type BillAnalysisWithName = BillAnalysisResult & {
  firstName?: { value: string | null; confidence: "high" | "medium" | "unknown"; source: "document" | "not_detected" };
  lastName?: { value: string | null; confidence: "high" | "medium" | "unknown"; source: "document" | "not_detected" };
};

const labels: Array<[keyof BillAnalysisResult, string]> = [
  ["energyType", "Energieart"], ["provider", "Anbieter"], ["tariffName", "Tarif"],
  ["annualConsumptionKwh", "Jahresverbrauch"], ["workPriceCtPerKwh", "Arbeitspreis"],
  ["basePriceEurPerYear", "Grundpreis"], ["monthlyPaymentEur", "Monatlicher Abschlag"],
  ["billingPeriod", "Abrechnungszeitraum"], ["contractEnd", "Vertragsende"],
  ["cancellationPeriod", "Kündigungsfrist"], ["address", "Verbrauchsstelle"],
];

const CONFIDENCE_SCORE: Record<BillAnalysisResult[keyof BillAnalysisResult]["confidence"], number> = {
  high: 3, medium: 2, low: 1, unknown: 0,
};

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

function normalizeValue(value: string | number | null) {
  if (value === null || value === "") return "";
  if (typeof value === "number") return String(Math.round(value * 100) / 100);
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function valuesAgree(a: string | number | null, b: string | number | null, key: keyof BillAnalysisResult) {
  if (a === null || b === null || a === "" || b === "") return false;
  if (typeof a === "number" && typeof b === "number") {
    const tolerance = key === "annualConsumptionKwh" ? Math.max(50, Math.max(a, b) * 0.015) : Math.max(0.05, Math.max(a, b) * 0.01);
    return Math.abs(a - b) <= tolerance;
  }
  return normalizeValue(a) === normalizeValue(b);
}

function mergeAnalyses(results: BillAnalysisResult[]): BillAnalysisResult {
  if (!results.length) throw new Error("NO_USABLE_DATA");
  const first = results[0];
  const merged = structuredClone(first);

  (Object.keys(merged) as Array<keyof BillAnalysisResult>).forEach(key => {
    const candidates = results
      .map(result => result[key])
      .filter(field => field.value !== null && field.value !== "")
      .sort((a, b) => CONFIDENCE_SCORE[b.confidence] - CONFIDENCE_SCORE[a.confidence]);

    if (!candidates.length) return;

    const top = candidates[0];
    const topScore = CONFIDENCE_SCORE[top.confidence];
    const sameConfidence = candidates.filter(candidate => CONFIDENCE_SCORE[candidate.confidence] === topScore);
    const repeated = sameConfidence.find(candidate => sameConfidence.filter(other => valuesAgree(candidate.value, other.value, key)).length >= 2);

    if (repeated) {
      merged[key] = repeated;
      return;
    }

    const conflictingHigh = top.confidence === "high" && sameConfidence.some(candidate => !valuesAgree(top.value, candidate.value, key));
    if (conflictingHigh && sameConfidence.length > 1) {
      merged[key] = { ...top, confidence: "medium" };
      return;
    }

    merged[key] = top;
  });

  const consumption = merged.annualConsumptionKwh.value;
  if (typeof consumption === "number" && (consumption < 300 || consumption > 100000)) {
    merged.annualConsumptionKwh = { value: null, confidence: "unknown", source: "not_detected" };
  }

  const workPrice = merged.workPriceCtPerKwh.value;
  if (typeof workPrice === "number" && (workPrice < 2 || workPrice > 100)) {
    merged.workPriceCtPerKwh = { value: null, confidence: "unknown", source: "not_detected" };
  }

  const basePrice = merged.basePriceEurPerYear.value;
  if (typeof basePrice === "number" && (basePrice < 0 || basePrice > 5000)) {
    merged.basePriceEurPerYear = { value: null, confidence: "unknown", source: "not_detected" };
  }

  return merged;
}

async function analyzeWithConcurrency(files: File[], concurrency = 1) {
  const results: BillAnalysisResult[] = [];
  for (const file of files) {
    try {
      results.push(await analyzeBill(file));
    } catch {
      // A single unreadable page must not invalidate the other invoice pages.
    }
  }
  if (!results.length) throw new Error("NO_USABLE_DATA");
  return results;
}

export default function BillUpload({ onContinue }: { onContinue?: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"idle" | "ready" | "analyzing" | "done">("idle");
  const [analysis, setAnalysis] = useState<BillAnalysisWithName | null>(null);

  useEffect(() => {
    let cancelled = false;
    import("@/lib/bill-session").then(({ getBillSession }) => getBillSession()).then(session => {
      if (cancelled || !session.files.length) return;
      setFiles(session.files);
      setAnalysis((session.meta?.analysis as BillAnalysisWithName) || null);
      setStatus(session.meta?.analysis ? "done" : "ready");
      if (session.meta?.analysis) applyRecognizedData(session.meta.analysis);
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  const mergeFiles = (incoming: File[]) => {
    const valid = incoming.filter(file => ["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(file.type));
    const oversized = valid.filter(file => file.size > 10 * 1024 * 1024);
    if (incoming.length !== valid.length) setError("Bitte nur PDF, JPG, PNG oder WEBP auswählen.");
    else if (oversized.length) setError("Jede Datei darf maximal 10 MB groß sein.");
    else setError("");

    const next = [...files, ...valid.filter(file => file.size <= 10 * 1024 * 1024)];
    const unique = next.filter((file, index, all) => index === all.findIndex(other => other.name === file.name && other.size === file.size && other.lastModified === file.lastModified));
    if (unique.length > 12) { setError("Bitte maximal 12 Seiten bzw. Dateien gleichzeitig auswählen."); return; }
    setFiles(unique);
    setStatus(unique.length ? "ready" : "idle");
    setAnalysis(null);
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
    if (!files.length) return;
    setError(""); setStatus("analyzing");
    try {
      const results = await analyzeWithConcurrency(files, 1);
      const merged = mergeAnalyses(results);
      let names: { firstName: string | null; lastName: string | null; confidence: "high" | "medium" | "unknown" } = { firstName: null, lastName: null, confidence: "unknown" };
      try {
        names = await analyzeBillNames(files);
      } catch {
        // Name recognition is optional. Tariff recognition must still succeed when name OCR fails.
      }
      const withName: BillAnalysisWithName = {
        ...merged,
        firstName: { value: names.firstName, confidence: names.confidence, source: names.firstName ? "document" : "not_detected" },
        lastName: { value: names.lastName, confidence: names.confidence, source: names.lastName ? "document" : "not_detected" },
      };

      const usable = [withName.energyType.value, withName.provider.value, withName.annualConsumptionKwh.value, withName.workPriceCtPerKwh.value, withName.basePriceEurPerYear.value];
      if (!usable.some(value => value !== null && value !== "")) throw new Error("NO_USABLE_DATA");

      setAnalysis(withName);
      setStatus("done");
      applyRecognizedData(merged);
      await saveBillSession(files, withName);
    } catch (err) {
      setStatus("ready");
      setError(err instanceof Error && err.message === "OCR_LIBRARY_LOAD_FAILED"
        ? "Die Rechnungserkennung konnte nicht geladen werden. Bitte erneut versuchen."
        : "Die Rechnung konnte nicht eindeutig ausgewertet werden. Bitte prüfe die Dateien oder gib den Verbrauch manuell ein.");
    }
  };

  const recipientComplete = Boolean(analysis?.firstName?.value && analysis?.lastName?.value);
  const recipientConfidence = recipientComplete ? analysis?.firstName?.confidence || "unknown" : "unknown";

  return <div className="mt-4 rounded-2xl border border-white/10 bg-white/[.035] p-4 text-left">
    <div className="flex items-start gap-3"><div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#19b7ff]/10 text-xl text-[#66d5ff]">↑</div><div className="min-w-0 flex-1">
      <p className="font-bold text-white">Rechnung hochladen</p>
      <p className="mt-1 text-xs leading-5 text-slate-400">Eine oder mehrere Seiten deiner Strom oder Gasrechnung. PDF, JPG, PNG oder WEBP, bis zu 12 Dateien.</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">Du musst nichts abtippen. Ich lese die wichtigen Tarifdaten automatisch aus der Rechnung.</p>
      <div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={status === "analyzing"} onClick={() => inputRef.current?.click()} className="rounded-xl border border-[#19b7ff]/35 bg-[#19b7ff]/10 px-4 py-2.5 text-sm font-bold text-[#8ce4ff] transition hover:bg-[#19b7ff]/20 disabled:opacity-50">{files.length ? "Weitere Seite hinzufügen" : "Rechnung auswählen"}</button>{files.length > 0 && <button type="button" disabled={status === "analyzing"} onClick={analyzeFiles} className="rounded-xl bg-[#19b7ff] px-4 py-2.5 text-sm font-bold text-[#03101c] disabled:opacity-50">{status === "analyzing" ? "Rechnung wird geprüft …" : status === "done" ? "Erneut prüfen" : `${files.length} ${files.length === 1 ? "Datei" : "Dateien"} prüfen`}</button>}</div>
      <input ref={inputRef} type="file" multiple accept="application/pdf,image/jpeg,image/png,image/webp" className="hidden" onChange={e => { mergeFiles(Array.from(e.target.files || [])); e.currentTarget.value = ""; }} />
      {files.length > 0 && <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Hochgeladene Dateien · {files.length}/12</p><button type="button" disabled={status === "analyzing"} onClick={removeAllFiles} className="rounded-lg border border-red-400/20 bg-red-400/5 px-2.5 py-1.5 text-[11px] font-bold text-red-300 transition hover:bg-red-400/10">Alle löschen</button></div>
        {files.map((file, index) => <div key={`${file.name}-${file.size}-${file.lastModified}`} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.02] p-2.5">
          <div className="h-14 w-12 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-[#071321]">
            {file.type.startsWith("image/") ? <img src={URL.createObjectURL(file)} alt={`Vorschau Seite ${index + 1}`} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-[10px] font-black text-[#66d5ff]">PDF</div>}
          </div>
          <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-slate-200">{file.type === "application/pdf" ? `Datei ${index + 1} · ${file.name}` : `Seite ${index + 1} · ${file.name}`}</p><p className="mt-0.5 text-[10px] text-slate-500">{(file.size / 1024 / 1024).toFixed(1)} MB</p></div>
          <button type="button" aria-label={`${file.name} löschen`} title="Datei löschen" disabled={status === "analyzing"} onClick={() => removeFile(index)} className="flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-red-400/20 bg-red-400/5 px-2.5 text-[11px] font-bold text-red-300 transition hover:bg-red-400/10 disabled:opacity-50"><span aria-hidden="true">✕</span><span>Löschen</span></button>
        </div>)}
      </div>}
      {status === "analyzing" && <p className="mt-3 text-xs leading-5 text-[#8ce4ff]">{files.length > 1 ? `Ich prüfe ${files.length} Seiten nacheinander, gleiche die Ergebnisse ab und übernehme nur belastbare Werte.` : "Ich prüfe deine Rechnung auf Anbieter, Energieart, Verbrauch und Preise."}</p>}
      {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
      {analysis && <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3"><div className="flex items-center justify-between gap-3"><p className="text-sm font-bold text-white">Rechnung erkannt</p><span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">{files.length > 1 ? `${files.length} Seiten` : "Automatisch"}</span></div>
        <p className="mt-1 text-xs leading-5 text-slate-400">Die Erkennung kombiniert mehrere Seiten derselben Rechnung. Bei widersprüchlichen Hochsicherheitswerten wird nicht einfach der größte Wert übernommen.</p>
        <div className="mt-3 rounded-lg border border-[#19b7ff]/15 bg-[#19b7ff]/5 p-3"><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Rechnungsempfänger</p><p className="mt-1 text-base font-bold text-white">{recipientComplete ? [analysis.firstName?.value, analysis.lastName?.value].filter(Boolean).join(" ") : "Nicht sicher erkannt"}</p><p className="mt-0.5 text-[10px] text-slate-500">{recipientComplete ? `Automatisch aus der Rechnung erkannt · Sicherheit: ${recipientConfidence}` : "Kein belastbarer Vorname und Nachname erkannt. Es wurde kein unsicherer OCR Treffer übernommen."}</p></div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">{labels.map(([key, label]) => { const f = analysis[key]; return <div key={key} className="rounded-lg border border-white/10 bg-white/[.025] p-2.5"><p className="text-[11px] text-slate-500">{label}</p><p className="mt-0.5 text-sm font-semibold text-white">{displayValue(key, f.value)}</p><p className="mt-0.5 text-[10px] text-slate-500">Sicherheit: {f.confidence}</p></div>; })}</div>
        <p className="mt-3 text-xs font-semibold text-emerald-300">✓ Erkannte Werte wurden in den Tarifcheck übernommen und bleiben für das Kontaktformular erhalten.</p>
        {onContinue && <button type="button" onClick={onContinue} className="mt-4 w-full rounded-full bg-[#19b7ff] px-5 py-3.5 text-sm font-bold text-[#03101c] shadow-[0_10px_30px_rgba(25,183,255,.16)] transition hover:brightness-110">Weiter zur Adresse und Anfrage →</button>}
      </div>}
    </div></div>
  </div>;
}
