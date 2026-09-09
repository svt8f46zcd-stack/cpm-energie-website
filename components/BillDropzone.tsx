"use client";

type BillDropzoneProps = {
  files: File[];
  disabled?: boolean;
  error?: string;
  onFiles: (files: File[]) => void;
  onRemove: (index: number) => void;
  onRemoveAll: () => void;
};

const ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp";

export function BillDropzone({ files, disabled = false, error, onFiles, onRemove, onRemoveAll }: BillDropzoneProps) {
  const hasFile = files.length > 0;

  return (
    <div className="text-left">
      <input
        id="bill-upload"
        type="file"
        accept={ACCEPT}
        multiple={false}
        disabled={disabled}
        className="hidden"
        onChange={(event) => {
          onFiles(Array.from(event.target.files || []));
          event.currentTarget.value = "";
        }}
        aria-describedby="upload-hint"
      />

      {!hasFile ? (
        <label
          htmlFor="bill-upload"
          className={`block cursor-pointer rounded-2xl border-2 border-dashed border-[#31506c] bg-[#081827] p-7 text-center transition hover:border-[#19b7ff] hover:bg-[#0a1d30] ${disabled ? "pointer-events-none opacity-50" : ""}`}
        >
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#19b7ff]/10 text-2xl text-[#66d5ff]" aria-hidden="true">↑</span>
          <span className="mt-4 block font-bold text-[#66d5ff]">Rechnung auswählen</span>
          <p id="upload-hint" className="mt-2 text-sm leading-6 text-slate-400">
            PDF, JPG, PNG oder WEBP · wird nur für die Prüfung verwendet
          </p>
        </label>
      ) : (
        <div className="rounded-2xl border border-[#19b7ff]/25 bg-[#081827] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#19b7ff]/10 text-xs font-black text-[#66d5ff]">{/\.pdf$/i.test(files[0].name) ? "PDF" : "IMG"}</div>
            <p className="min-w-0 flex-1 truncate text-sm font-semibold text-white">{files[0].name}</p>
            <button type="button" disabled={disabled} onClick={onRemoveAll} className="text-xs font-bold text-red-300 disabled:opacity-50">Löschen</button>
          </div>
          <label htmlFor="bill-upload" className="mt-3 inline-block cursor-pointer text-xs font-bold text-[#66d5ff] hover:text-white">Andere Rechnung auswählen</label>
        </div>
      )}

      {error && <p className="mt-3 text-xs text-red-300" role="alert">{error}</p>}
    </div>
  );
}
