"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";

const SUBMIT_URL = "https://formsubmit.co/ajax/cristiano02moreira@gmail.com";

export function ContactFormStatic() {
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [consent, setConsent] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!consent) {
      setError("Bitte bestätigen Sie zuerst die Einwilligung zur Verarbeitung Ihrer Angaben.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const form = new FormData(event.currentTarget);
      form.set("_subject", "Neue Anfrage | CPM Energie");
      form.set("_template", "table");
      form.set("_captcha", "false");
      form.set("source", "kontaktseite");
      const response = await fetch(SUBMIT_URL, { method: "POST", body: form, headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error();
      setSent(true);
    } catch {
      setError("Die Anfrage konnte gerade nicht gesendet werden. Bitte versuchen Sie es erneut.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return <div className="glass rounded-[2rem] border border-emerald-400/20 p-8"><p className="text-sm font-bold uppercase tracking-[.18em] text-emerald-300">✓ Anfrage gesendet</p><h2 className="mt-3 text-2xl font-black text-white">Anfrage erhalten.</h2><p className="mt-3 text-slate-300">Danke. Wir melden uns so schnell wie möglich bei Ihnen.</p></div>;
  }

  return (
    <form onSubmit={submit} className="glass rounded-[2rem] p-6 md:p-9">
      <div className="grid gap-5 md:grid-cols-2">
        <Field name="name" label="Name" required defaultValue={params.get("name") || ""} />
        <Field name="email" label="E-Mail" type="email" required />
        <Field name="phone" label="Telefon" />
        <label className="block text-sm font-semibold text-slate-300">Kundentyp<select name="customerType" defaultValue={params.get("kundentyp") === "business" ? "Gewerbekunde" : "Privatkunde"} className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0b1b30] p-4 outline-none focus:border-[#19b7ff]"><option>Privatkunde</option><option>Gewerbekunde</option></select></label>
      </div>

      <div className="mt-7 rounded-2xl border border-[#19b7ff]/20 bg-[#19b7ff]/5 p-5">
        <p className="text-sm font-bold text-[#66d5ff]">Ihre Adresse</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field name="postalCode" label="PLZ" required defaultValue={params.get("plz") || ""} />
          <Field name="city" label="Ort" required defaultValue={params.get("ort") || ""} />
          <Field name="street" label="Straße" required defaultValue={params.get("strasse") || ""} />
          <Field name="houseNumber" label="Hausnummer" required defaultValue={params.get("hausnummer") || ""} />
          <Field name="provider" label="Aktueller Anbieter" defaultValue={params.get("anbieter") || ""} />
          <Field name="strom" label="Stromverbrauch pro Jahr" defaultValue={params.get("strom") || ""} placeholder="z. B. 3.500 kWh" />
          <Field name="gas" label="Gasverbrauch pro Jahr" defaultValue={params.get("gas") || ""} placeholder="z. B. 12.000 kWh" />
        </div>
      </div>

      <label className="mt-5 block text-sm font-semibold text-slate-300">Nachricht<textarea name="message" rows={5} className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 p-4 outline-none focus:border-[#19b7ff]" placeholder="Zum Beispiel: Ich möchte meinen aktuellen Stromtarif prüfen lassen." /></label>
      <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/[.025] p-4"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-[#19b7ff]" /><span className="text-xs leading-5 text-slate-400">Ich bin damit einverstanden, dass meine Angaben zur Tarifprüfung verarbeitet und zur Bearbeitung meiner Anfrage übermittelt werden. Details stehen in der Datenschutzerklärung.</span></label>
      {error && <p className="mt-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
      <button disabled={loading || !consent} className="mt-6 w-full rounded-full bg-[#19b7ff] px-7 py-4 font-bold text-[#03101c] disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Wird gesendet…" : "Kostenlose Prüfung anfragen"}</button>
      <p className="mt-4 text-center text-xs leading-5 text-slate-500">Kostenlos und unverbindlich. Keine automatische Kündigung.</p>
    </form>
  );
}

function Field({ name, label, type = "text", defaultValue, placeholder, required }: { name: string; label: string; type?: string; defaultValue?: string; placeholder?: string; required?: boolean }) {
  return <label className="block text-sm font-semibold text-slate-300">{label}<input name={name} type={type} defaultValue={defaultValue} placeholder={placeholder} required={required} className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-[#19b7ff]" /></label>;
}
