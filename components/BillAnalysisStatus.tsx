"use client";

import { useEffect, useState } from "react";

type BillAnalysisStatusProps = {
  status: "idle" | "uploading" | "ready" | "analyzing" | "success" | "done" | "error";
  onAnalyze: () => void;
  disabled?: boolean;
  fileCount: number;
  error?: string;
};

const ANALYSIS_STEPS = [
  "Dokument wird eingelesen...",
  "Verbrauchswerte werden extrahiert...",
  "Tarifdaten werden geprüft...",
] as const;

export function BillAnalysisStatus({ status, onAnalyze, disabled = false, fileCount, error }: BillAnalysisStatusProps) {
  const [visualStep, setVisualStep] = useState(-1);

  useEffect(() => {
    if (status === "analyzing") {
      setVisualStep(0);
      const t1 = window.setTimeout(() => setVisualStep(1), 1200);
      const t2 = window.setTimeout(() => setVisualStep(2), 2500);
      return () => {
        window.clearTimeout(t1);
        window.clearTimeout(t2);
      };
    }

    if (status === "done" || status === "success") {
      setVisualStep(3);
    } else {
      setVisualStep(-1);
    }
  }, [status]);

  if (!fileCount) return null;

  const showSteps = status === "analyzing" || status === "done" || status === "success";

  return (
    <div className="mt-3 min-h-[300px] rounded-2xl border border-white/10 bg-[#08131f] p-5">
      {status === "error" ? (
        <div className="flex min-h-[260px] flex-col justify-center text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-400/10 text-red-300" aria-hidden="true">!</div>
          <h3 className="mt-6 text-lg font-bold text-white">Die Rechnung konnte nicht gelesen werden</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">{error || "Bitte lade ein klares Foto oder eine PDF hoch und versuche es erneut."}</p>
          <button type="button" disabled={disabled} onClick={onAnalyze} className="mt-6 w-full rounded-xl bg-[#19b7ff] px-4 py-3 font-bold text-[#03101c] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60">Erneut versuchen</button>
        </div>
      ) : showSteps ? (
        <div className="flex min-h-[260px] flex-col justify-center" aria-live="polite" aria-busy={status === "analyzing"}>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#19b7ff]/30 bg-[#19b7ff]/10">
            {status === "done" || status === "success" ? (
              <svg className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            ) : <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#19b7ff]/20 border-t-[#66d5ff]" />}
          </div>
          <h3 className="mt-6 text-center text-lg font-bold text-white">{status === "done" || status === "success" ? "Analyse erfolgreich" : "Deine Rechnung wird geprüft"}</h3>
          <p className="mx-auto mt-2 max-w-sm text-center text-sm leading-6 text-slate-400">{status === "done" || status === "success" ? "Alle Tarifdaten wurden erfolgreich erkannt." : "Die wichtigsten Tarifdaten werden automatisch erfasst."}</p>
          <div className="mx-auto mt-7 w-full max-w-md space-y-3">
            {ANALYSIS_STEPS.map((step, index) => (
              <div key={step} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.025] px-4 py-3 transition-colors">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black transition-colors ${index < visualStep ? "bg-emerald-400/10 text-emerald-300" : index === visualStep ? "bg-[#19b7ff]/10 text-[#66d5ff]" : "bg-white/[.04] text-slate-600"}`} aria-hidden="true">{index < visualStep ? "✓" : index + 1}</span>
                <span className={`text-sm transition-colors ${index <= visualStep ? "font-semibold text-slate-200" : "text-slate-600"}`}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex min-h-[260px] flex-col justify-center">
          <p className="text-center text-sm text-slate-400">Datei bereit zur Prüfung.</p>
          <button type="button" disabled={disabled} onClick={onAnalyze} className="mt-5 w-full rounded-xl bg-[#19b7ff] px-4 py-3 font-bold text-[#03101c] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60">Analyse starten</button>
        </div>
      )}
    </div>
  );
}
