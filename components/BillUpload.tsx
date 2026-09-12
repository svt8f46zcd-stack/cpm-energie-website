"use client";

import { useEffect, useState } from "react";
import { analyzeBill, type BillAnalysisResult } from "@/lib/bill-analysis-v3";
import { analyzeBillNames } from "@/lib/bill-name-analysis";
import { getBillSession, saveBillSession } from "@/lib/bill-session";
import { BillAnalysisResult as BillAnalysisResultView } from "@/components/BillAnalysisResult";
import { BillAnalysisStatus } from "@/components/BillAnalysisStatus";
import { BillDropzone } from "@/components/BillDropzone";

type NameField = { value: string | null; confidence: "high" | "medium" | "unknown"; source: "document" | "not_detected" };
type BillAnalysisWithName = BillAnalysisResult & { firstName?: NameField; lastName?: NameField };
type BillUploadState = "idle" | "uploading" | "analyzing" | "success" | "error";
type BillUploadProps = { onContinue?: () => void; onStatusChange?: (status: BillUploadState) => void };

function setReactInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function applyRecognizedData(result: BillAnalysisResult) {
  const consumption = result.annualConsumptionKwh.value;
  const type = String(result.energyType.value || "").toLowerCase();
  if (typeof consumption === "number" || typeof consumption === "string") {
    const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('input[type="number"]'));
    const target = type.includes("gas")
      ? inputs.find((input) => /12\.000|gas|verbrauch/i.test(`${input.placeholder} ${input.name} ${input.getAttribute("aria-label") || ""}`))
      : inputs.find((input) => /3\.000|strom|verbrauch/i.test(`${input.placeholder} ${input.name} ${input.getAttribute("aria-label") || ""}`));
    if (target) setReactInputValue(target, String(consumption));
  }

  const provider = result.provider.value;
  if (typeof provider === "string" && provider.trim()) {
    const inputs = Array.from(document.querySelectorAll<HTMLInputElement>("input"));
    const target = inputs.find((input) => /anbieter|versorger|stromanbieter|gasanbieter|e\.on/i.test(`${input.placeholder} ${input.name} ${input.getAttribute("aria-label") || ""}`));
    if (target) setReactInputValue(target, provider);
  }
}

function fileAccepted(file: File) {
  return ["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(file.type) || /\.(pdf|jpe?g|png|webp)$/i.test(file.name);
}

function withTimeout<T>(promise: Promise<T>, ms: number) {
  return new Promise<T>((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error("TIMEOUT")), ms);
    promise.then((value) => { window.clearTimeout(timeout); resolve(value); }, (error) => { window.clearTimeout(timeout); reject(error); });
  });
}

function mergeAnalyses(results: BillAnalysisResult[]) {
  if (!results.length) throw new Error("NO_USABLE_DATA");
  const rank = (confidence: string) => confidence === "high" ? 3 : confidence === "medium" ? 2 : confidence === "low" ? 1 : 0;
  const merged = { ...results[0] };

  for (let index = 1; index < results.length; index += 1) {
    const current = results[index];
    for (const key of Object.keys(merged) as Array<keyof BillAnalysisResult>) {
      const a = merged[key];
      const b = current[key];
      if (a.value === null && b.value !== null) merged[key] = b;
      else if (a.value !== null && b.value !== null && key === "annualConsumptionKwh" && typeof a.value === "number" && typeof b.value === "number") merged[key] = b.value > a.value ? b : a;
      else if (a.value !== null && b.value !== null && rank(b.confidence) >= rank(a.confidence)) merged[key] = b;
    }
  }

  return merged;
}

export default function BillUpload({ onContinue, onStatusChange }: BillUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<BillUploadState>("idle");
  const [analysis, setAnalysis] = useState<BillAnalysisWithName | null>(null);

  const updateStatus = (next: BillUploadState) => {
    setStatus(next);
    onStatusChange?.(next);
  };

  useEffect(() => {
    let cancelled = false;
    getBillSession().then((session) => {
      if (cancelled || !session.files.length) return;
      setFiles(session.files.slice(0, 1));
      setAnalysis((session.meta?.analysis as BillAnalysisWithName) || null);
      updateStatus(session.meta?.analysis ? "success" : "idle");
      if (session.meta?.analysis) applyRecognizedData(session.meta.analysis);
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  const mergeFiles = (incoming: File[]) => {
    const file = incoming[0];
    if (!file) return;

    if (!fileAccepted(file)) {
      setError("Bitte nur PDF, JPG, PNG oder WEBP auswählen.");
      updateStatus("error");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Die Datei darf maximal 10 MB groß sein. Bitte wähle eine kleinere PDF oder ein klares Foto.");
      updateStatus("error");
      return;
    }

    setError("");
    setFiles([file]);
    setAnalysis(null);
    updateStatus("uploading");
    void saveBillSession([file], null)
      .then(() => updateStatus("idle"))
      .catch(() => updateStatus("idle"));
  };

  const removeFile = () => {
    setFiles([]);
    setAnalysis(null);
    setError("");
    updateStatus("idle");
    void saveBillSession([], null).catch(() => undefined);
  };

  const removeAllFiles = removeFile;

  const analyzeFiles = async () => {
    if (!files.length || status === "analyzing") return;
    setError("");
    updateStatus("analyzing");

    try {
      const results: BillAnalysisResult[] = [];
      for (const file of files) {
        try { results.push(await withTimeout(analyzeBill(file), 150000)); } catch { /* continue with usable pages */ }
      }
      if (!results.length) throw new Error("NO_USABLE_DATA");

      const merged = mergeAnalyses(results);
      const usable = [merged.energyType.value, merged.provider.value, merged.annualConsumptionKwh.value, merged.workPriceCtPerKwh.value, merged.basePriceEurPerYear.value, merged.monthlyPaymentEur.value];
      if (!usable.some((value) => value !== null && value !== "")) throw new Error("NO_USABLE_DATA");

      const initial: BillAnalysisWithName = {
        ...merged,
        firstName: { value: null, confidence: "unknown", source: "not_detected" },
        lastName: { value: null, confidence: "unknown", source: "not_detected" },
      };
      setAnalysis(initial);
      updateStatus("success");
      applyRecognizedData(initial);
      await saveBillSession(files, initial);

      void withTimeout(analyzeBillNames(files), 12000).then((names) => {
        const withName: BillAnalysisWithName = {
          ...initial,
          firstName: { value: names.firstName, confidence: names.confidence, source: names.firstName ? "document" : "not_detected" },
          lastName: { value: names.lastName, confidence: names.confidence, source: names.lastName ? "document" : "not_detected" },
        };
        setAnalysis(withName);
        void saveBillSession(files, withName).catch(() => undefined);
      }).catch(() => undefined);
    } catch (err) {
      setError(err instanceof Error && err.message === "OCR_LIBRARY_LOAD_FAILED" ? "Die Rechnungserkennung konnte nicht geladen werden. Bitte erneut versuchen." : "Die Rechnung konnte nicht ausgelesen werden. Bitte lade ein klares Foto oder eine PDF hoch.");
      updateStatus("error");
    }
  };

  return (
    <div className="mt-4 text-left">
      <BillDropzone files={files} disabled={status === "analyzing"} error={error} onFiles={mergeFiles} onRemove={removeFile} onRemoveAll={removeAllFiles} />
      <BillAnalysisStatus status={status} onAnalyze={analyzeFiles} disabled={status === "analyzing" || !files.length} fileCount={files.length} error={error} />
      {analysis && <BillAnalysisResultView analysis={analysis} onSubmitted={onContinue} />}
    </div>
  );
}
