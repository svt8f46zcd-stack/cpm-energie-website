type BillAnalysisStatusProps = {
  status: "idle" | "ready" | "analyzing" | "done";
  onAnalyze: () => void;
  disabled?: boolean;
  fileCount: number;
};

export function BillAnalysisStatus({ status, onAnalyze, disabled = false, fileCount }: BillAnalysisStatusProps) {
  if (!fileCount) return null;

  return (
    <div className="mt-3">
      <button type="button" disabled={disabled || status === "analyzing"} onClick={onAnalyze} className="w-full rounded-xl bg-[#19b7ff] px-4 py-3 text-sm font-bold text-[#03101c] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60">
        {status === "analyzing" ? "Rechnung wird geprüft …" : status === "done" ? "Erneut prüfen" : `${fileCount} ${fileCount === 1 ? "Datei" : "Dateien"} prüfen`}
      </button>
      {status === "analyzing" && <p className="mt-3 text-xs leading-5 text-[#8ce4ff]" aria-live="polite">Rechnung wird analysiert. Die erste OCR Initialisierung kann auf dem iPhone etwas länger dauern.</p>}
    </div>
  );
}
