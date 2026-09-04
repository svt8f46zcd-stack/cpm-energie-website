"use client";

import { useRef, useState } from "react";

export default function BillUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");

  const handleFile = (file?: File) => {
    setError("");
    if (!file) return;
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setError("Bitte PDF, JPG, PNG oder WEBP auswählen.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Die Datei darf maximal 10 MB groß sein.");
      return;
    }
    setFileName(file.name);
  };

  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-white/[.035] p-4 text-left">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#19b7ff]/10 text-xl text-[#66d5ff]">↑</div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-white">Abrechnung hochladen</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">Strom oder Gas. PDF oder Foto, maximal 10 MB. Die Datei wird hier zunächst nur ausgewählt und noch nicht automatisch versendet.</p>
          <button type="button" onClick={() => inputRef.current?.click()} className="mt-3 rounded-xl border border-[#19b7ff]/35 bg-[#19b7ff]/10 px-4 py-2.5 text-sm font-bold text-[#8ce4ff] transition hover:bg-[#19b7ff]/20">Datei auswählen</button>
          <input ref={inputRef} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
          {fileName && <p className="mt-2 truncate text-xs text-emerald-300">✓ {fileName}</p>}
          {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
        </div>
      </div>
    </div>
  );
}
