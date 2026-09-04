"use client";

import { FormEvent, useEffect, useState } from "react";
import { clearBillSession, getBillSession, type BillSessionMeta } from "@/lib/bill-session";

export default function HeroLeadForm() {
  const [filesCount, setFilesCount] = useState(0);
  const [meta, setMeta] = useState<BillSessionMeta | null>(null);
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getBillSession().then(session => {
      setFilesCount(session.files.length);
      setMeta(session.meta);
    }).catch(() => undefined);
  }, []);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!consent) {
      setError("Bitte bestätigen Sie zuerst die Einwilligung.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const session = await getBillSession();
      if (!session.files.length) throw new Error("NO_BILL");
      const form = new FormData(e.currentTarget);
      form.set("consent", "true");
      form.set("source", "hero-bill-upload");
      if (session.meta?.analysis) form.append("billAnalysis", JSON.stringify(session.meta.analysis));
      session.files.forEach((file, index) => form.append("billFiles", file, `${String(index + 1).padStart(2, "0")}_${file.name}`));

      const res = await fetch("/api/kontakt", { method: "POST", body: form });
      if (!res.ok) throw new Error("SEND_FAILED");
      setSent(true);
      await clearBillSession();
    } catch (err) {
      setError(err instanceof Error && err.message === "NO_BILL" ? "Die Abrechnung ist nicht mehr verfügbar. Bitte lade sie erneut hoch." : "Die Anfrage konnte gerade nicht gesendet werden. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) return <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-5 text-center"><p className="font-bold text-white">Anfrage erfolgreich übermittelt.</p><p className="mt-1 text-sm text-slate-300">Deine Abrechnung wurde zusammen mit deinen Kontaktdaten übermittelt.</p></div>;

  return <div className="mt-5 rounded-2xl border border-[#19b7ff]/20 bg-[#06111dcc] p-5 shadow-xl shadow-black/20 backdrop-blur-xl">
    <div className="flex items-center justify-between gap-3">
      <div><p className="text-sm font-bold text-white">Fast geschafft</p><p className="mt-1 text-xs leading-5 text-slate-400">{filesCount} {filesCount === 1 ? "Abrechnungsdatei" : "Abrechnungsdateien"} gespeichert. Jetzt nur noch deine Kontaktdaten.</p></div>
      <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">✓ bereit</span>
    </div>
    {meta?.analysis && <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
      <div className="rounded-xl border border-white/10 bg-white/[.025] p-2.5"><span className="text-slate-500">Anbieter</span><strong className="mt-1 block text-white">{meta.analysis.provider.value || "Erkannt"}</strong></div>
      <div className="rounded-xl border border-white/10 bg-white/[.025] p-2.5"><span className="text-slate-500">Verbrauch</span><strong className="mt-1 block text-white">{meta.analysis.annualConsumptionKwh.value !== null ? `${Number(meta.analysis.annualConsumptionKwh.value).toLocaleString("de-DE")} kWh` : "Erkannt"}</strong></div>
      <div className="rounded-xl border border-white/10 bg-white/[.025] p-2.5"><span className="text-slate-500">Arbeitspreis</span><strong className="mt-1 block text-white">{meta.analysis.workPriceCtPerKwh.value !== null ? `${Number(meta.analysis.workPriceCtPerKwh.value).toFixed(2).replace(".", ",")} ct/kWh` : "Erkannt"}</strong></div>
      <div className="rounded-xl border border-white/10 bg-white/[.025] p-2.5"><span className="text-slate-500">Energie</span><strong className="mt-1 block text-white">{meta.analysis.energyType.value || "Erkannt"}</strong></div>
    </div>}
    <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
      <input name="name" required autoComplete="name" placeholder="Vor und Nachname" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#19b7ff]" />
      <input name="phone" required autoComplete="tel" placeholder="Telefonnummer" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#19b7ff]" />
      <input name="email" required type="email" autoComplete="email" placeholder="E-Mail-Adresse" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#19b7ff] sm:col-span-2" />
      <textarea name="message" rows={2} placeholder="Optional: Was soll ich mir besonders ansehen?" className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#19b7ff] sm:col-span-2" />
      <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[.025] p-3 text-xs leading-5 text-slate-400 sm:col-span-2"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-[#19b7ff]" />Ich bin damit einverstanden, dass meine Angaben und die hochgeladene Abrechnung zur Tarifprüfung verarbeitet und zur Bearbeitung meiner Anfrage übermittelt werden. Die Einwilligung kann ich jederzeit widerrufen.</label>
      {error && <p className="rounded-xl bg-red-500/10 p-3 text-xs text-red-300 sm:col-span-2">{error}</p>}
      <button disabled={loading || filesCount === 0 || !consent} className="w-full rounded-full bg-[#19b7ff] px-6 py-3.5 text-sm font-black text-[#03101c] shadow-[0_10px_30px_rgba(25,183,255,.18)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2">{loading ? "Wird übermittelt …" : "Abrechnung prüfen lassen →"}</button>
    </form>
  </div>;
}
