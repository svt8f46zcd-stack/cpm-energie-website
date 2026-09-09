"use client";

import { useRef } from "react";

type BillDropzoneProps = {
  files: File[];
  disabled?: boolean;
  error?: string;
  onFiles: (files: File[]) => void;
  onRemove: (index: number) => void;
  onRemoveAll: () => void;
};

const ACCEPT = "application/pdf,image/jpeg,image/png,image/webp,.pdf,.jpg,.jpeg,.png,.webp";

export function BillDropzone({ files, disabled = false, error, onFiles, onRemove, onRemoveAll }: BillDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#19b7ff]/10 text-xl text-[#66d5ff]" aria-hidden="true">↑</div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-white">Rechnung hochladen</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">PDF oder Foto genügt. Mehrseitige Rechnungen können ergänzt werden.</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" disabled={disabled} onClick={() => inputRef.current?.click()} className="rounded-xl border border-[#19b7ff]/35 bg-[#19b7ff]/10 px-4 py-2.5 text-sm font-bold text-[#8ce4ff] disabled:opacity-50">
          {files.length ? "Weitere Seite hinzufügen" : "Rechnung auswählen"}
        </button>
        <input ref={inputRef} type="file" multiple accept={ACCEPT} className="hidden" onChange={(event) => { onFiles(Array.from(event.target.files || [])); event.currentTarget.value = ""; }} />
      </div>

      {files.length > 0 && (
        <div className="mt-4 rounded-xl border border-white/10 bg-black/10 p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Hochgeladene Dateien · {files.length}/12</p>
            <button type="button" disabled={disabled} onClick={onRemoveAll} className="text-[11px] font-bold text-red-300 disabled:opacity-50">Alle löschen</button>
          </div>
          <div className="mt-2 space-y-1.5">
            {files.map((file, index) => (
              <div key={`${file.name}-${file.size}-${file.lastModified}`} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[.02] px-2.5 py-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#071321] text-[9px] font-black text-[#66d5ff]">{/\.pdf$/i.test(file.name) ? "PDF" : "IMG"}</div>
                <p className="min-w-0 flex-1 truncate text-xs text-slate-300">{index + 1}. {file.name}</p>
                <button type="button" disabled={disabled} onClick={() => onRemove(index)} className="shrink-0 text-[11px] font-bold text-red-300 disabled:opacity-50">Löschen</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-300" role="alert">{error}</p>}
    </div>
  );
}
