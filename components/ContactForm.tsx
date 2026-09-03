"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

type AddressState = { plz: string; ort: string; strasse: string; hausnummer: string; anbieter: string; strom: string; gas: string };
type Locality = { name: string; postalCode: string };
type Street = { name: string; postalCode: string; locality: string };

const API = "https://openplzapi.org/de";
const PROVIDERS = [
  "E.ON", "EnBW", "Vattenfall", "RWE", "EWE", "ENTEGA", "Mainova", "MVV Energie", "SWM", "Stadtwerke München",
  "Stadtwerke Mainz", "Stadtwerke Wiesbaden", "GGEW", "EWR", "Energieversorgung Mittelrhein", "Pfalzwerke", "Yello",
  "Octopus Energy", "LichtBlick", "Naturstrom", "Green Planet Energy", "Ostrom", "immergrün!", "eprimo", "Maingau Energie",
  "ExtraEnergie", "123energie", "NEW Energie", "Süwag", "LEW", "ENTEGA Plus", "Andere"
];

export function ContactForm() {
  const searchParams = useSearchParams();
  const [sent, setSent] = useState(false), [loading, setLoading] = useState(false), [error, setError] = useState("");
  const [addressLoading, setAddressLoading] = useState(false), [streetLoading, setStreetLoading] = useState(false);
  const [streetSuggestions, setStreetSuggestions] = useState<Street[]>([]), [citySuggestions, setCitySuggestions] = useState<Locality[]>([]);
  const [defaults, setDefaults] = useState<AddressState>({ plz: "", ort: "", strasse: "", hausnummer: "", anbieter: "", strom: "", gas: "" });
  const streetRequest = useRef(0);

  useEffect(() => { setDefaults({ plz: searchParams.get("plz") || "", ort: searchParams.get("ort") || "", strasse: searchParams.get("strasse") || "", hausnummer: searchParams.get("hausnummer") || "", anbieter: searchParams.get("anbieter") || "", strom: searchParams.get("strom") || "", gas: searchParams.get("gas") || "" }); }, [searchParams]);

  useEffect(() => {
    const plz = defaults.plz.replace(/\D/g, "");
    if (plz.length !== 5) { setCitySuggestions([]); setStreetSuggestions([]); return; }
    const controller = new AbortController(); setAddressLoading(true);
    fetch(`${API}/Localities?postalCode=${plz}&page=1&pageSize=50`, { signal: controller.signal }).then(r => r.ok ? r.json() : []).then((items: Locality[]) => {
      const unique = Array.from(new Map(items.map(i => [i.name, i])).values()); setCitySuggestions(unique);
      if (unique.length === 1) setDefaults(c => ({ ...c, ort: unique[0].name })); else if (unique.length > 1 && !unique.some(i => i.name === defaults.ort)) setDefaults(c => ({ ...c, ort: "" }));
    }).catch(() => setCitySuggestions([])).finally(() => setAddressLoading(false));
    return () => controller.abort();
  }, [defaults.plz]);

  useEffect(() => {
    const plz = defaults.plz.replace(/\D/g, ""), street = defaults.strasse.trim();
    if (plz.length !== 5 || street.length < 2) { setStreetSuggestions([]); return; }
    const requestId = ++streetRequest.current, timer = window.setTimeout(() => {
      setStreetLoading(true); const params = new URLSearchParams({ postalCode: plz, name: street, page: "1", pageSize: "20" });
      fetch(`${API}/Streets?${params}`).then(r => r.ok ? r.json() : []).then((items: Street[]) => { if (requestId === streetRequest.current) setStreetSuggestions(Array.from(new Map(items.map(i => [i.name, i])).values()).slice(0, 8)); }).catch(() => requestId === streetRequest.current && setStreetSuggestions([])).finally(() => requestId === streetRequest.current && setStreetLoading(false));
    }, 250); return () => window.clearTimeout(timer);
  }, [defaults.plz, defaults.strasse]);

  function updateAddress(key: keyof AddressState, value: string) { setDefaults(c => ({ ...c, [key]: value })); if (key === "plz") setStreetSuggestions([]); }
  async function submit(e: FormEvent<HTMLFormElement>) { e.preventDefault(); setLoading(true); setError(""); try { const data = Object.fromEntries(new FormData(e.currentTarget)); const res = await fetch("/api/kontakt", { method: "POST", body: JSON.stringify(data), headers: { "Content-Type": "application/json" } }); if (!res.ok) throw new Error(); setSent(true); } catch { setError("Die Anfrage konnte gerade nicht gesendet werden. Bitte versuchen Sie es erneut oder kontaktieren Sie uns direkt per WhatsApp."); } finally { setLoading(false); } }
  if (sent) return <div className="rounded-3xl border border-[#19b7ff]/30 bg-[#19b7ff]/10 p-8"><h2 className="text-2xl font-bold">Anfrage erhalten.</h2><p className="mt-3 text-slate-300">Danke. Wir melden uns so schnell wie möglich bei Ihnen.</p></div>;

  return <form onSubmit={submit} className="glass rounded-[2rem] p-6 md:p-9">
    <div className="grid gap-5 md:grid-cols-2"><Field name="name" label="Name" required /><Field name="email" label="E-Mail" type="email" required /><Field name="phone" label="Telefon" /><Field name="customerType" label="Kunde" select /></div>
    <div className="mt-7 rounded-2xl border border-[#19b7ff]/20 bg-[#19b7ff]/5 p-5">
      <div className="flex items-center justify-between gap-4"><div><p className="text-sm font-bold text-[#66d5ff]">Ihre Adresse</p><p className="mt-1 text-xs text-slate-500">PLZ eingeben und Ort automatisch erkennen lassen</p></div>{addressLoading && <span className="text-xs text-[#66d5ff]">wird erkannt …</span>}</div>
      <div className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
        <label className="relative block sm:col-span-2"><span className="sr-only">PLZ</span><input name="postalCode" inputMode="numeric" autoComplete="postal-code" maxLength={5} required value={defaults.plz} onChange={e => updateAddress("plz", e.target.value.replace(/\D/g, "").slice(0, 5))} placeholder="PLZ" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-[#19b7ff]" /></label>
        <label className="relative block sm:col-span-2"><span className="sr-only">Ort</span><input name="city" autoComplete="address-level2" required value={defaults.ort} onChange={e => updateAddress("ort", e.target.value)} list="cpm-city-suggestions" placeholder="Ort wird automatisch erkannt …" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-[#19b7ff]" /><datalist id="cpm-city-suggestions">{citySuggestions.map(c => <option key={`${c.postalCode}-${c.name}`} value={c.name} />)}</datalist></label>
        <label className="relative block"><span className="sr-only">Straße</span><input name="street" autoComplete="street-address" required value={defaults.strasse} onChange={e => updateAddress("strasse", e.target.value)} placeholder="Straße eingeben …" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-[#19b7ff]" />{streetLoading && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#66d5ff]">Suche …</span>}{streetSuggestions.length > 0 && <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-xl border border-white/10 bg-[#07182a] shadow-2xl">{streetSuggestions.map(s => <button key={s.name} type="button" onClick={() => { updateAddress("strasse", s.name); setStreetSuggestions([]); }} className="block w-full px-4 py-3 text-left text-sm text-slate-200 hover:bg-[#19b7ff]/10 hover:text-white">{s.name}</button>)}</div>}</label>
        <input name="houseNumber" inputMode="text" autoComplete="address-line2" required value={defaults.hausnummer} onChange={e => updateAddress("hausnummer", e.target.value)} placeholder="Hausnummer" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-[#19b7ff]" />
        <label className="block sm:col-span-2"><span className="text-sm font-semibold text-slate-300">Aktueller Stromanbieter</span><select name="provider" value={defaults.anbieter} onChange={e => updateAddress("anbieter", e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b1b30] px-4 py-3 outline-none focus:border-[#19b7ff]"><option value="">Anbieter auswählen …</option>{PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}</select></label>
      </div>
      {defaults.plz.length === 5 && citySuggestions.length > 1 && <p className="mt-3 text-xs text-slate-500">Mehrere Orte gefunden. Bitte einen Ort auswählen.</p>}
      {defaults.plz.length === 5 && citySuggestions.length === 0 && !addressLoading && <p className="mt-3 text-xs text-amber-300/80">PLZ konnte nicht automatisch zugeordnet werden. Der Ort kann manuell eingegeben werden.</p>}
    </div>
    <label className="mt-5 block text-sm font-semibold text-slate-300">Nachricht<textarea name="message" rows={5} className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 p-4 outline-none focus:border-[#19b7ff]" placeholder="Zum Beispiel: Ich möchte meinen aktuellen Stromtarif prüfen lassen." defaultValue={defaults.anbieter ? `Bitte meinen Tarif prüfen. Aktueller Anbieter: ${defaults.anbieter}.` : ""} /></label>
    {error && <p className="mt-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
    <button disabled={loading} className="mt-6 w-full rounded-full bg-[#19b7ff] px-7 py-4 font-bold text-[#03101c] disabled:opacity-60">{loading ? "Wird gesendet…" : "Kostenlose Prüfung anfragen"}</button>
    <p className="mt-4 text-xs leading-5 text-slate-500">Mit dem Absenden stimmen Sie der Verarbeitung Ihrer Angaben zur Bearbeitung der Anfrage zu. Details finden Sie in der Datenschutzerklärung.</p>
  </form>;
}

function Field({ name, label, type = "text", required = false, select = false }: { name: string; label: string; type?: string; required?: boolean; select?: boolean }) { return <label className="block text-sm font-semibold text-slate-300">{label}{select ? <select name={name} className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0b1b30] p-4 outline-none focus:border-[#19b7ff]"><option value="Privatkunde">Privatkunde</option><option value="Gewerbekunde">Gewerbekunde</option></select> : <input name={name} type={type} required={required} className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 p-4 outline-none focus:border-[#19b7ff]" />}</label>; }
