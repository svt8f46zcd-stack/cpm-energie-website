"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const OPENPLZ = "https://openplzapi.org/de";
const NOMINATIM = "https://nominatim.openstreetmap.org";
const PROVIDERS = ["E.ON", "EnBW", "Vattenfall", "RheinEnergie", "Mainova", "Stadtwerke München", "Yello Strom", "LichtBlick", "Naturstrom", "EWE", "Sonstiger Anbieter"];
type Energy = "strom" | "gas" | "both";
type Mode = "manual" | "bill";
type Locality = { name?: string; municipality?: { name?: string } };
type Geo = { address?: { city?: string; town?: string; village?: string; municipality?: string; road?: string; postcode?: string } };

export function SavingsCalculator() {
  const [step, setStep] = useState(1);
  const [energy, setEnergy] = useState<Energy>("strom");
  const [customer, setCustomer] = useState<"private" | "business">("private");
  const [mode, setMode] = useState<Mode | null>(null);
  const [strom, setStrom] = useState(0);
  const [gas, setGas] = useState(0);
  const [plz, setPlz] = useState("");
  const [ort, setOrt] = useState("");
  const [orte, setOrte] = useState<string[]>([]);
  const [strasse, setStrasse] = useState("");
  const [hausnummer, setHausnummer] = useState("");
  const [anbieter, setAnbieter] = useState("");
  const [anbieterOpen, setAnbieterOpen] = useState(false);
  const [strassen, setStrassen] = useState<string[]>([]);
  const [strassenOpen, setStrassenOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setPlz(q.get("plz") || ""); setOrt(q.get("ort") || ""); setStrasse(q.get("strasse") || ""); setHausnummer(q.get("hausnummer") || ""); setAnbieter(q.get("anbieter") || "");
    const e = q.get("tarif") as Energy | null; if (e === "strom" || e === "gas" || e === "both") setEnergy(e);
    const s = Number(q.get("strom") || 0), g = Number(q.get("gas") || 0); if (s > 0) setStrom(s); if (g > 0) setGas(g);
    if (q.get("plz") || q.get("ort")) setStep(3);
  }, []);

  useEffect(() => {
    if (!/^\d{5}$/.test(plz)) { setOrte([]); return; }
    const c = new AbortController(); setLoading(true);
    fetch(`${OPENPLZ}/Localities?postalCode=${plz}&page=1&pageSize=50`, { signal: c.signal, cache: "no-store" })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: Locality[]) => setOrte(Array.from(new Set(data.map(x => (x.name || x.municipality?.name || "").trim()).filter(Boolean)))))
      .catch(() => setOrte([])).finally(() => setLoading(false));
    return () => c.abort();
  }, [plz]);

  useEffect(() => {
    if (!/^\d{5}$/.test(plz) || !ort || strasse.trim().length < 2) { setStrassen([]); return; }
    const c = new AbortController(); const t = window.setTimeout(() => {
      const p = new URLSearchParams({ street: strasse.trim(), city: ort, postalcode: plz, countrycodes: "de", format: "jsonv2", addressdetails: "1", limit: "8" });
      fetch(`${NOMINATIM}/search?${p}`, { signal: c.signal, cache: "no-store" }).then(r => r.ok ? r.json() : Promise.reject()).then((data: Geo[]) => setStrassen(Array.from(new Set(data.map(x => x.address?.road || "").filter(Boolean))))).catch(() => setStrassen([]));
    }, 250);
    return () => { c.abort(); window.clearTimeout(t); };
  }, [plz, ort, strasse]);

  const providerMatches = useMemo(() => { const q = anbieter.toLowerCase(); return PROVIDERS.filter(x => !q || x.toLowerCase().includes(q)).slice(0, 6); }, [anbieter]);
  const consumptionReady = energy === "strom" ? strom > 0 : energy === "gas" ? gas > 0 : strom > 0 && gas > 0;
  const addressReady = /^\d{5}$/.test(plz) && !!ort && !!strasse.trim() && !!hausnummer.trim();
  const query = new URLSearchParams({ plz, ort, strasse, hausnummer, anbieter, strom: String(strom), gas: String(gas), kundentyp: customer, tarif: energy });

  async function useLocation() {
    if (!navigator.geolocation) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async pos => {
      try { const p = new URLSearchParams({ lat: String(pos.coords.latitude), lon: String(pos.coords.longitude), format: "jsonv2", addressdetails: "1" }); const data = await (await fetch(`${NOMINATIM}/reverse?${p}`)).json() as Geo; const a = data.address || {}; setPlz(a.postcode || ""); setOrt(a.city || a.town || a.village || a.municipality || ""); setStrasse(a.road || ""); } finally { setLoading(false); }
    }, () => setLoading(false), { timeout: 10000, maximumAge: 300000 });
  }

  const Field = ({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) => <div><label className="text-sm font-semibold text-slate-300">{label}{optional && <span className="ml-2 font-normal text-slate-500">Optional</span>}</label>{children}</div>;

  return <div className="space-y-5">
    <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#19b7ff]">Schritt {step} von 4</p><p className="mt-1 font-bold text-white">{step === 1 ? "Was möchtest du prüfen?" : step === 2 ? "Wie möchtest du deine Daten eingeben?" : step === 3 ? "Dein Verbrauch" : "Dein Standort"}</p></div><div className="flex gap-1.5">{[1,2,3,4].map(n => <span key={n} className={`h-1.5 w-7 rounded-full ${n <= step ? "bg-[#19b7ff]" : "bg-white/10"}`} />)}</div></div></div>

    {step === 1 && <div className="space-y-5"><div className="grid gap-3 sm:grid-cols-3">{(["strom","gas","both"] as Energy[]).map(x => <button key={x} type="button" onClick={() => setEnergy(x)} className={`rounded-2xl border p-5 text-left ${energy === x ? "border-[#19b7ff] bg-[#19b7ff]/10" : "border-white/10 bg-white/[.025]"}`}><span className="text-xl">{x === "strom" ? "⚡" : x === "gas" ? "🔥" : "⚡ + 🔥"}</span><span className="mt-2 block font-bold text-white">{x === "strom" ? "Strom" : x === "gas" ? "Gas" : "Strom + Gas"}</span></button>)}</div><div><p className="mb-2 text-sm font-semibold text-slate-300">Für wen?</p><div className="grid grid-cols-2 gap-3">{([["private","Privathaushalt"],["business","Gewerbe"]] as const).map(([v,l]) => <button key={v} type="button" onClick={() => setCustomer(v)} className={`rounded-xl border py-3 font-semibold ${customer === v ? "border-[#19b7ff] text-[#66d5ff]" : "border-white/10 text-slate-400"}`}>{l}</button>)}</div></div><button type="button" onClick={() => setStep(2)} className="w-full rounded-full bg-[#19b7ff] px-6 py-4 font-bold text-[#03101c]">Weiter →</button></div>}

    {step === 2 && <div className="space-y-4"><p className="text-sm leading-6 text-slate-400">Am schnellsten geht es mit deiner Abrechnung. Wenn du sie nicht zur Hand hast, kannst du den Verbrauch auch selbst eingeben.</p><div className="grid gap-3 md:grid-cols-2"><button type="button" onClick={() => { setMode("bill"); setStep(3); }} className="rounded-2xl border border-[#19b7ff]/40 bg-[#19b7ff]/10 p-5 text-left"><span className="text-2xl">📄</span><span className="mt-2 block font-bold text-white">Abrechnung hochladen</span><span className="mt-1 block text-sm text-slate-400">Relevante Angaben können später automatisch übernommen werden.</span></button><button type="button" onClick={() => { setMode("manual"); setStep(3); }} className="rounded-2xl border border-white/10 bg-white/[.025] p-5 text-left"><span className="text-2xl">✏️</span><span className="mt-2 block font-bold text-white">Verbrauch selbst eingeben</span><span className="mt-1 block text-sm text-slate-400">Du brauchst nur deinen ungefähren Jahresverbrauch.</span></button></div><button type="button" onClick={() => setStep(1)} className="w-full rounded-full border border-white/10 px-6 py-3 font-semibold text-slate-300">Zurück</button></div>}

    {step === 3 && <div className="space-y-5"><div className="rounded-2xl border border-white/10 bg-white/[.025] p-4"><p className="font-semibold text-white">{mode === "bill" ? "Abrechnung" : "Jahresverbrauch"}</p>{mode === "bill" ? <p className="mt-1 text-sm text-slate-400">Du kannst die Abrechnung im Upload Bereich auswählen. Falls noch keine Auswertung verfügbar ist, kannst du die Werte unten manuell ergänzen.</p> : <p className="mt-1 text-sm text-slate-400">Keine Beispielwerte: Nur deine tatsächlichen Angaben werden übernommen.</p>}</div><div className="grid gap-4 md:grid-cols-2">{(energy === "strom" || energy === "both") && <div className="rounded-2xl border border-white/10 bg-white/[.025] p-5"><label className="text-sm font-bold text-white">Strom pro Jahr</label><div className="mt-3 flex items-center gap-2"><input type="number" min="0" max="15000" step="100" value={strom || ""} onChange={e => setStrom(Math.max(0, Number(e.target.value)))} placeholder="z. B. 3.000" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-lg font-bold text-white outline-none focus:border-[#19b7ff]"/><span className="text-sm text-slate-400">kWh</span></div></div>}{(energy === "gas" || energy === "both") && <div className="rounded-2xl border border-white/10 bg-white/[.025] p-5"><label className="text-sm font-bold text-white">Gas pro Jahr</label><div className="mt-3 flex items-center gap-2"><input type="number" min="0" max="40000" step="500" value={gas || ""} onChange={e => setGas(Math.max(0, Number(e.target.value)))} placeholder="z. B. 12.000" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-lg font-bold text-white outline-none focus:border-[#19b7ff]"/><span className="text-sm text-slate-400">kWh</span></div></div>}</div><div className="flex gap-3"><button type="button" onClick={() => setStep(2)} className="rounded-full border border-white/10 px-6 py-4 font-semibold text-slate-300">Zurück</button><button type="button" disabled={mode === "manual" && !consumptionReady} onClick={() => setStep(4)} className={`flex-1 rounded-full px-6 py-4 font-bold ${(mode === "bill" || consumptionReady) ? "bg-[#19b7ff] text-[#03101c]" : "bg-white/10 text-slate-500"}`}>Weiter →</button></div></div>}

    {step === 4 && <div className="space-y-5"><p className="text-sm leading-6 text-slate-400">Wir benötigen deinen Standort, damit die Prüfung zu deinem Anschluss passt. Ort wird über die PLZ automatisch erkannt.</p><div className="grid gap-4 md:grid-cols-2"><Field label="PLZ"><div className="mt-2 flex gap-2"><input value={plz} onChange={e => { setPlz(e.target.value.replace(/\D/g, "").slice(0,5)); setOrt(""); setStrasse(""); }} placeholder="55278" inputMode="numeric" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#19b7ff]"/><button type="button" onClick={useLocation} className="rounded-xl border border-[#19b7ff]/30 px-4 text-[#66d5ff]">{loading ? "…" : "📍"}</button></div>{orte.length > 0 && !ort && <div className="mt-2 overflow-hidden rounded-xl border border-white/10 bg-[#081725]">{orte.map(x => <button key={x} type="button" onClick={() => setOrt(x)} className="block w-full border-b border-white/5 px-4 py-3 text-left text-sm text-white">{x}</button>)}</div>}{ort && <p className="mt-2 text-xs text-[#66d5ff]">✓ {ort}</p>}</Field><Field label="Straße"><div className="relative mt-2"><input value={strasse} disabled={!ort} onChange={e => { setStrasse(e.target.value); setStrassenOpen(true); }} onFocus={() => setStrassenOpen(true)} placeholder={ort ? "z. B. Hauptstraße" : "Erst PLZ und Ort"} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none disabled:opacity-40 focus:border-[#19b7ff]"/>{strassenOpen && strassen.length > 0 && <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-white/10 bg-[#081725]">{strassen.map(x => <button key={x} type="button" onClick={() => { setStrasse(x); setStrassenOpen(false); }} className="block w-full px-4 py-3 text-left text-sm text-white">{x}</button>)}</div>}</div></Field><Field label="Hausnummer"><input value={hausnummer} onChange={e => setHausnummer(e.target.value.slice(0,8))} placeholder="z. B. 3a" className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"/></Field><Field label="Aktueller Anbieter" optional><div className="relative mt-2"><input value={anbieter} onChange={e => { setAnbieter(e.target.value); setAnbieterOpen(true); }} onFocus={() => setAnbieterOpen(true)} placeholder="z. B. E.ON" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"/>{anbieterOpen && providerMatches.length > 0 && <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-white/10 bg-[#081725]">{providerMatches.map(x => <button key={x} type="button" onClick={() => { setAnbieter(x); setAnbieterOpen(false); }} className="block w-full px-4 py-3 text-left text-sm text-white">{x}</button>)}</div>}</div></Field></div><div className="rounded-2xl border border-[#19b7ff]/20 bg-[#19b7ff]/5 p-4"><p className="font-semibold text-white">Transparente Prüfung</p><p className="mt-1 text-sm leading-6 text-slate-400">Wir zeigen keine erfundene Ersparnis. Deine Angaben werden für die Tarifprüfung verwendet. Es erfolgt kein automatischer Anbieterwechsel.</p></div><div className="flex gap-3"><button type="button" onClick={() => setStep(3)} className="rounded-full border border-white/10 px-6 py-4 font-semibold text-slate-300">Zurück</button>{addressReady ? <Link href={`/kontakt?${query.toString()}`} className="flex-1 rounded-full bg-[#19b7ff] px-6 py-4 text-center font-bold text-[#03101c]">Tarif kostenlos prüfen</Link> : <button type="button" disabled className="flex-1 rounded-full bg-white/10 px-6 py-4 font-bold text-slate-500">Adresse vervollständigen</button>}</div></div>}
  </div>;
}
