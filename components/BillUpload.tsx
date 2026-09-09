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

type BillUploadProps = { onContinue?: () => void };

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

export default function BillUpload({ onContinue }: BillUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"idle" | "ready" | "analyzing" | "done">("idle");
  const [analysis, setAnalysis] = useState<BillAnalysisWithName | null>(null);

  useEffect(() => {
    let cancelled = false;
    getBillSession().then((session) => {
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
    const oversized = valid.filter((file) => file.size > 10 * 1024 * 1024);
    if (incoming.some((file) => !fileAccepted(file))) setError("Bitte nur PDF, JPG, PNG oder WEBP auswählen.");
    else if (oversized.length) setError("Jede Datei darf maximal 10 MB groß sein.");
    else setError("");

    const next = [...files, ...valid.filter((file) => file.size <= 10 * 1024 * 1024)];
    const unique = next.filter((file, index, all) => index === all.findIndex((other) => other.name === file.name && other.size === file.size && other.lastModified === file.lastModified));
    if (unique.length > 12) {
      setError("Bitte maximal 12 Dateien gleichzeitig auswählen.");
      return;
    }
    setFiles(unique);
    setStatus(unique.length ? "ready" : "idle");
    setAnalysis(null);
    void saveBillSession(unique, null).catch(() => undefined);
  };

  const removeFile = (index: number) => {
    const next = files.filter((_, fileIndex) => fileIndex !== index);
    setFiles(next);
    setAnalysis(null);
    setStatus(next.length ? "ready" : "idle");
    void saveBillSession(next, null).catch(() => undefined);
  };

  const removeAllFiles = () => {
    setFiles([]);
    setAnalysis(null);
    setError("");
    setStatus("idle");
    void saveBillSession([], null).catch(() => undefined);
  };

  const analyzeFiles = async () => {
    if (!files.length || status === "analyzing") return;
    setError("");
    setStatus("analyzing");

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
      setStatus("done");
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
      setStatus("ready");
      setError(err instanceof Error && err.message === "OCR_LIBRARY_LOAD_FAILED" ? "Die Rechnungserkennung konnte nicht geladen werden. Bitte erneut versuchen." : "Die Rechnung konnte nicht ausgelesen werden. Bitte die Seite möglichst gerade und vollständig fotografieren oder eine PDF hochladen.");
    }
  };

  return (
    <div className="mt-4 text-left">
      <BillDropzone files={files} disabled={status === "analyzing"} error={error} onFiles={mergeFiles} onRemove={removeFile} onRemoveAll={removeAllFiles} />
      <BillAnalysisStatus status={status} onAnalyze={analyzeFiles} disabled={status === "analyzing"} fileCount={files.length} />
      {analysis && <BillAnalysisResultView analysis={analysis} onContinue={onContinue} />}
    </div>
  );
}
