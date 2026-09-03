"use client";

import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export function ContactForm() {
  const searchParams = useSearchParams();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [defaults, setDefaults] = useState({ plz: "", ort: "", strasse: "", hausnummer: "", anbieter: "", strom: "", gas: "" });

  useEffect(() => {
    setDefaults({
      plz: searchParams.get("plz") || "",
      ort: searchParams.get("ort") || "",
      strasse: searchParams.get("strasse") || "",
      hausnummer: searchParams.get("hausnummer") || "",
      anbieter: searchParams.get("anbieter") || "",
      strom: searchParams.get("strom") || "",
      gas: searchParams.get("gas") || "",
    });
  }, [searchParams]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = Object.fromEntries(new FormData(e.currentTarget));
      const res = await fetch("/api/kontakt", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("send");
      setSent(true);
    } catch {
      setError("Die Anfrage konnte gerade nicht gesendet werden. Bitte versuchen Sie es erneut oder kontaktieren Sie uns direkt per WhatsApp.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) return <div className="rounded-3xl border border-[#19b7ff]/30 bg-[#19b7ff]/10 p-8"><h2 className="text-2xl font-bold">Anfrage erhalten.</h2><p className="mt-3 text-slate-300">Danke. Wir melden uns so schnell wie möglich bei Ihnen.</p></div>;

  return <form onSubmit={submit} className="glass rounded-[2rem] p-6 md:p-9">
    <div className="grid gap-5 md:grid-cols-2">
      <Field name="name" label="Name" required />
      <Field name="email" label="E-Mail" type="email" required />
      <Field name="phone" label="Telefon" />
      <Field name="customerType" label="Kunde" select />
    </div>

    <div className="mt-7 rounded-2xl border border-[#19b7ff]/20 bg-[#19b7ff]/5 p-5">
      <p className="text-sm font-bold text-[#66d5ff]">Daten aus dem Tarifcheck</p>
      <div className="mt-3 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
        <input name="postalCode" value={defaults.plz} onChange={(e) => setDefaults({ ...defaults, plz: e.target.value })} placeholder="PLZ" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-[#19b7ff]" />
        <input name="city" value={defaults.ort} onChange={(e) => setDefaults({ ...defaults, ort: e.target.value })} placeholder="Ort" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-[#19b7ff]" />
        <input name="street" value={defaults.strasse} onChange={(e) => setDefaults({ ...defaults, strasse: e.target.value })} placeholder="Straße" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-[#19b7ff]" />
        <input name="houseNumber" value={defaults.hausnummer} onChange={(e) => setDefaults({ ...defaults, hausnummer: e.target.value })} placeholder="Hausnummer" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-[#19b7ff]" />
        <input name="provider" value={defaults.anbieter} onChange={(e) => setDefaults({ ...defaults, anbieter: e.target.value })} placeholder="Aktueller Anbieter" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-[#19b7ff] sm:col-span-2" />
      </div>
    </div>

    <label className="mt-5 block text-sm font-semibold text-slate-300">Nachricht<textarea name="message" rows={5} className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 p-4 outline-none focus:border-[#19b7ff]" placeholder="Zum Beispiel: Ich möchte meinen aktuellen Stromtarif prüfen lassen." defaultValue={defaults.anbieter ? `Bitte meinen Tarif prüfen. Aktueller Anbieter: ${defaults.anbieter}.` : ""} /></label>
    {error && <p className="mt-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
    <button disabled={loading} className="mt-6 w-full rounded-full bg-[#19b7ff] px-7 py-4 font-bold text-[#03101c] disabled:opacity-60">{loading ? "Wird gesendet…" : "Kostenlose Prüfung anfragen"}</button>
    <p className="mt-4 text-xs leading-5 text-slate-500">Mit dem Absenden stimmen Sie der Verarbeitung Ihrer Angaben zur Bearbeitung der Anfrage zu. Details finden Sie in der Datenschutzerklärung.</p>
  </form>;
}

function Field({ name, label, type = "text", required = false, select = false }: { name: string; label: string; type?: string; required?: boolean; select?: boolean }) {
  return <label className="block text-sm font-semibold text-slate-300">{label}{select ? <select name={name} className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0b1b30] p-4 outline-none focus:border-[#19b7ff]"><option value="Privatkunde">Privatkunde</option><option value="Gewerbekunde">Gewerbekunde</option></select> : <input name={name} type={type} required={required} className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 p-4 outline-none focus:border-[#19b7ff]" />}</label>;
}
