"use client";

import { FormEvent, useState } from "react";
import type { BillAnalysisResult as Analysis } from "@/lib/bill-analysis-v3";
import type { FunnelPayload } from "@/lib/funnel-payload";
import { clearBillSession } from "@/lib/bill-session";

const SUBMIT_URL = "https://formsubmit.co/ajax/cristiano02moreira@gmail.com";

type Props = {
  analysis: Analysis;
  onSubmitted?: () => void;
};

export function BillRecipient({ analysis, onSubmitted }: Props) {
  const [lead, setLead] = useState<FunnelPayload["lead"]>({ vorname: "", email: "", telefon: "" });
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!consent) {
      setError("Bitte bestätige zuerst die Einwilligung.");
      return;
    }
    setLoading(true);
    setError("");
    const payload: FunnelPayload = {
      lead: { vorname: lead.vorname.trim(), email: lead.email.trim(), telefon: lead.telefon?.trim() || undefined },
      analysis: {
        verbrauch: typeof analysis.annualConsumptionKwh.value === "number" ? analysis.annualConsumptionKwh.value : undefined,
        arbeitspreis: typeof analysis.workPriceCtPerKwh.value === "number" ? analysis.workPriceCtPerKwh.value : undefined,
        grundpreis: typeof analysis.basePriceEurPerYear.value === "number" ? analysis.basePriceEurPerYear.value : undefined,
        vertragsende: analysis.contractEnd.value ? String(analysis.contractEnd.value) : undefined,
      },
    };
    try {
      const form = new FormData();
      form.set("lead_vorname", payload.lead.vorname);
      form.set("email", payload.lead.email);
      form.set("telefon", payload.lead.telefon || "");
      form.set("analysis_verbrauch", payload.analysis.verbrauch?.toString() || "");
      form.set("analysis_arbeitspreis", payload.analysis.arbeitspreis?.toString() || "");
      form.set("analysis_grundpreis", payload.analysis.grundpreis?.toString() || "");
      form.set("analysis_vertragsende", payload.analysis.vertragsende || "");
      form.set("lead_status", "Heiß | Analyse abgeschlossen");
      form.set("source", "bill-analysis-funnel");
      form.set("consent", "true");
      form.set("_subject", "Heißer Lead | CPM Energie | Analyse abgeschlossen");
      form.set("_template", "table");
      form.set("_captcha", "false");

      const response = await fetch(SUBMIT_URL, { method: "POST", body: form, headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("SEND_FAILED");
      const result = await response.json().catch(() => null);
      if (result && result.success === false) throw new Error("SEND_FAILED");
      setSent(true);
      await clearBillSession();
      onSubmitted?.();
    } catch {
      setError("Die Anfrage konnte gerade nicht gesendet werden. Bitte versuche es erneut. Deine Analyse bleibt erhalten.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) return <div className="border-t border-white/10 bg-emerald-400/[.04] p-5 text-center sm:p-7"><p className="font-bold text-white">Persönliche Einschätzung angefordert.</p><p className="mt-1 text-sm leading-6 text-slate-400">Deine Daten wurden übermittelt. Wir melden uns mit der Einschätzung zu deinen Tarifdaten.</p></div>;

  return <div className="border-t border-white/10 bg-white/[.02] p-5 sm:p-7">
    <h3 className="text-2xl font-black tracking-[-.03em] text-white">Deine Daten sind bereit.</h3>
    <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">Wohin sollen wir dir die persönliche Einschätzung zu deinen Tarifdaten senden?</p>
    <form onSubmit={submit} className="mt-5 grid gap-3 sm:grid-cols-2">
      <input name="vorname" required value={lead.vorname} onChange={e => setLead(v => ({ ...v, vorname: e.target.value }))} autoComplete="given-name" placeholder="Vorname" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#19b7ff]" />
      <input name="email" required type="email" value={lead.email} onChange={e => setLead(v => ({ ...v, email: e.target.value }))} autoComplete="email" placeholder="E-Mail-Adresse" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#19b7ff]" />
      <div className="sm:col-span-2"><input name="telefon" type="tel" value={lead.telefon} onChange={e => setLead(v => ({ ...v, telefon: e.target.value }))} autoComplete="tel" placeholder="Telefonnummer (optional)" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#19b7ff]" /><p className="mt-1.5 text-[11px] text-slate-500">Für Rückfragen zur persönlichen Einschätzung.</p></div>
      <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[.025] p-3 text-xs leading-5 text-slate-400 sm:col-span-2"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-[#19b7ff]" />Ich bin damit einverstanden, dass meine Angaben und die hochgeladene Abrechnung zur Tarifprüfung verarbeitet und zur Bearbeitung meiner Anfrage übermittelt werden. Die Einwilligung kann ich jederzeit widerrufen.</label>
      {error && <p className="rounded-xl bg-red-500/10 p-3 text-xs text-red-300 sm:col-span-2" role="alert">{error}</p>}
      <button type="submit" disabled={loading || !consent} className="w-full rounded-xl bg-[#19b7ff] px-4 py-3.5 text-sm font-black text-[#03101c] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2">{loading ? "Wird übermittelt …" : "Persönliche Einschätzung erhalten"}</button>
    </form>
  </div>;
}
