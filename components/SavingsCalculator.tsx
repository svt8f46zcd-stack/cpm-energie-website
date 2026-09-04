"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import BillUpload from "@/components/BillUpload";
import { getBillSession } from "@/lib/bill-session";

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
  const panelRef = useRef<HTMLDivElement>(null);

  const goTo = (next: number) => setStep(next);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setPlz(q.get("plz") || "");
    setOrt(q.get("ort") || "");
    setStrasse(q.get("strasse") || "");
    setHausnummer(q.get("hausnummer") || "");
    setAnbieter(q.get("anbieter") || "");
    const e = q.get("tarif") as Energy | null;
    if (e === "strom" || e === "gas" || e === "both") setEnergy(e);
    const s = Number(q.get("strom") || 0);
    const g = Number(q.get("gas") || 0);
    if (s > 0) setStrom(s);
    if (g > 0) setGas(g);
    if (q.get("plz") || q.get("ort")) setStep(4);
  }, []);

  useEffect(() => {
    if (step !== 4) return;
    let active = true;
    getBillSession().then(session => {
      if (!active || !session.meta?.analysis) return;
      const result = session.meta.analysis;
      const type = String(result.energyType.value || "").toLowerCase();
      if (type.includes("gas") && type.includes("strom")) setEnergy("both");
      else if (type.includes("gas")) setEnergy("gas");
      else if (type.includes("strom")) setEnergy("strom");
      const consumption = result.annualConsumptionKwh.value;
      if (typeof consumption === "number") {
        if (type.includes("gas")) setGas(consumption);
        else setStrom(consumption);
      }
      if (typeof result.provider.value === "string" && result.provider.value.trim()) setAnbieter(result.provider.value);
    }).catch(() => undefined);
    return () => { active = false; };
  }, [step]);

  useEffect(() => {
    if (step === 1) return;
    requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, [step]);

  useEffect(() => {
    if (!/^\d{5}$/.test(plz)) { setOrte([]); return; }
    const controller = new AbortController();
    setLoading(true);
    fetch(`${OPENPLZ}/Localities?postalCode=${plz}&page=1&pageSize=50`, { signal: controller.signal, cache: "no-store" })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: Locality[]) => {
        const names = Array.from(new Set(data.map(x => (x.name || x.municipality?.name || "").trim()).filter(Boolean)));
        setOrte(names);
        if (names.length === 1) setOrt(names[0]);
      })
      .catch(() => setOrte([]))
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [plz]);

  useEffect(() => {
    if (!/^\d{5}$/.test(plz) || !ort || strasse.trim().length < 2) { setStrassen([]); return; }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams({ street: strasse.trim(), city: ort, postalcode: plz, countrycodes: "de", format: "jsonv2", addressdetails: "1", limit: "8" });
      fetch(`${NOMINATIM}/search?${params}`, { signal: controller.signal, cache: "no-store" })
        .then(r => r.ok ? r.json() : Promise.reject())
        .then((data: Geo[]) => setStrassen(Array.from(new Set(data.map(x => x.address?.road || "").filter(Boolean)))))
        .catch(() => setStrassen([]));
    }, 250);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [plz, ort, strasse]);

  const providerMatches = useMemo(() => {
    const q = anbieter.toLowerCase();
    return PROVIDERS.filter(x => !q || x.toLowerCase().includes(q)).slice(0, 6);
  }, [anbieter]);

  const consumptionReady = energy === "strom" ? strom > 0 : energy === "gas" ? gas > 0 : strom > 0 && gas > 0;
  const addressReady = /^\d{5}$/.test(plz) && !!ort && !!strasse.trim() && !!hausnummer.trim();
  const query = new URLSearchParams({ plz, ort, strasse, hausnummer, anbieter, strom: String(strom), gas: String(gas), kundentyp: customer, tarif: energy });

  async function useLocation() {
    if (!navigator.geolocation) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async pos => {
      try {
        const p = new URLSearchParams({ lat: String(pos.coords.latitude), lon: String(pos.coords.longitude), format: "jsonv2", addressdetails: "1" });
        const data = await (await fetch(`${NOMINATIM}/reverse?${p}`)).json() as Geo;
        const a = data.address || {};
        setPlz(a.postcode || "");
        setOrt(a.city || a.town || a.village || a.municipality || "");
        setStrasse(a.road || "");
      } finally { setLoading(false); }
    }, () => setLoading(false), { timeout: 10000, maximumAge: 300000 });
  }

  const Field = ({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) => (
    <div>
      <label className="text-sm font-semibold text-slate-300">{label}{optional && <span className="ml-2 font-normal text-slate-500">Optional</span>}</label>
      {children}
    </div>
  );

  return (
    <div ref={panelRef} className="scroll-mt-24 space-y-5">
      <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[#19b7ff]">Tarifcheck</p>
            <p className="mt-1 font-bold text-white">{step === 1 ? "Was möchtest du prüfen?" : step === 2 ? "Am einfachsten mit deiner Abrechnung" : step === 3 ? "Dein Verbrauch" : "Anschluss und Ergebnis"}</p>
          </div>
          <div className="shrink-0 text-xs text-slate-500">{step} / 4</div>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#19b7ff] transition-all duration-500" style={{ width: `${step * 25}%` }} /></div>
      </div>

      {step === 1 && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-[#19b7ff]/20 bg-[#19b7ff]/5 p-5"><p className="font-bold text-white">Prüfe deinen aktuellen Strom oder Gastarif.</p><p className="mt-2 text-sm leading-6 text-slate-400">Du musst deinen Tarif nicht kennen. Im nächsten Schritt kannst du einfach deine letzte Abrechnung hochladen.</p></div>
          <div><p className="mb-3 text-sm font-semibold text-slate-300">Was möchtest du prüfen?</p><div className="grid gap-3 sm:grid-cols-3">{(["strom", "gas", "both"] as Energy[]).map(x => <button key={x} type="button" onClick={() => setEnergy(x)} className={`rounded-2xl border p-5 text-left transition ${energy === x ? "border-[#19b7ff] bg-[#19b7ff]/10" : "border-white/10 bg-white/[.025]"}`}><span className="text-xl">{x === "strom" ? "⚡" : x === "gas" ? "🔥" : "⚡ + 🔥"}</span><span className="mt-2 block font-bold text-white">{x === "strom" ? "Strom" : x === "gas" ? "Gas" : "Strom + Gas"}</span></button>)}</div></div>
          <p className="text-xs leading-5 text-slate-500">Privat oder Gewerbe musst du noch nicht auswählen. Das klären wir erst, wenn es für den Vergleich relevant ist.</p>
          <button type="button" onClick={() => goTo(2)} className="w-full rounded-full bg-[#19b7ff] px-6 py-4 font-bold text-[#03101c]">Rechnung prüfen →</button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#19b7ff]/30 bg-[#19b7ff]/5 p-5"><p className="font-bold text-white">Deine Abrechnung ist der schnellste Weg.</p><p className="mt-1 text-sm leading-6 text-slate-400">Wir versuchen Anbieter, Verbrauch, Arbeitspreis und Grundpreis automatisch zu erkennen. Du kannst die erkannten Angaben anschließend prüfen.</p></div>
          <div className="rounded-2xl border border-[#19b7ff]/40 bg-[#19b7ff]/10 p-5"><div className="mb-3 flex items-start gap-3"><span className="text-2xl">📄</span><div><p className="font-bold text-white">Abrechnung hochladen</p><p className="text-sm text-slate-400">PDF, JPG, PNG oder WEBP</p></div></div><BillUpload onContinue={() => { setMode("bill"); goTo(4); }} /></div>
          <div className="rounded-2xl border border-white/10 bg-white/[.025] p-5"><p className="font-bold text-white">Keine Abrechnung zur Hand?</p><p className="mt-1 text-sm text-slate-400">Dann reicht für den Einstieg dein bekannter Jahresverbrauch.</p><button type="button" onClick={() => { setMode("manual"); goTo(3); }} className="mt-4 w-full rounded-full border border-white/10 px-5 py-3 font-semibold text-slate-200">Verbrauch selbst eingeben →</button></div>
          <button type="button" onClick={() => goTo(1)} className="w-full rounded-full border border-white/10 px-6 py-3 font-semibold text-slate-300">Zurück</button>
          <p className="text-center text-xs text-slate-500">Keine automatische Kündigung. Du entscheidest selbst über einen Wechsel.</p>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5"><div className="rounded-2xl border border-white/10 bg-white/[.025] p-5"><p className="font-bold text-white">Nur die Zahl, die du kennst.</p><p className="mt-1 text-sm leading-6 text-slate-400">Arbeitspreis und Grundpreis musst du nicht kennen. Für eine erste Prüfung reicht dein Jahresverbrauch.</p></div><div className="grid gap-4 md:grid-cols-2">{(energy === "strom" || energy === "both") && <div className="rounded-2xl border border-white/10 bg-white/[.025] p-5"><label className="text-sm font-bold text-white">Strom pro Jahr</label><div className="mt-3 flex items-center gap-2"><input type="number" min="0" max="15000" step="100" value={strom || ""} onChange={e => setStrom(Math.max(0, Number(e.target.value)))} placeholder="z. B. 3.000" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-lg font-bold text-white outline-none focus:border-[#19b7ff]"/><span className="text-sm text-slate-400">kWh</span></div></div>}{(energy === "gas" || energy === "both") && <div className="rounded-2xl border border-white/10 bg-white/[.025] p-5"><label className="text-sm font-bold text-white">Gas pro Jahr</label><div className="mt-3 flex items-center gap-2"><input type="number" min="0" max="40000" step="500" value={gas || ""} onChange={e => setGas(Math.max(0, Number(e.target.value)))} placeholder="z. B. 12.000" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-lg font-bold text-white outline-none focus:border-[#19b7ff]"/><span className="text-sm text-slate-400">kWh</span></div></div>}</div><div className="flex gap-3"><button type="button" onClick={() => goTo(2)} className="rounded-full border border-white/10 px-6 py-4 font-semibold text-slate-300">Zurück</button><button type="button" disabled={!consumptionReady} onClick={() => goTo(4)} className={`flex-1 rounded-full px-6 py-4 font-bold ${consumptionReady ? "bg-[#19b7ff] text-[#03101c]" : "bg-white/10 text-slate-500"}`}>Weiter →</button></div></div>
      )}

      {step === 4 && (
        <div className="space-y-5"><div className="rounded-2xl border border-[#19b7ff]/20 bg-[#19b7ff]/5 p-5"><p className="font-bold text-white">Fast geschafft.</p><p className="mt-1 text-sm leading-6 text-slate-400">Mit deiner Anschlussadresse können wir die Tarifprüfung passend eingrenzen. Der Anbieter ist optional.</p></div><div className="grid gap-4 md:grid-cols-2"><Field label="PLZ"><div className="mt-2 flex gap-2"><input value={plz} onChange={e => { setPlz(e.target.value.replace(/\D/g, "").slice(0, 5)); setOrt(""); setStrasse(""); }} placeholder="55278" inputMode="numeric" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#19b7ff]"/><button type="button" onClick={useLocation} className="rounded-xl border border-[#19b7ff]/30 px-4 text-[#66d5ff]">{loading ? "…" : "📍"}</button></div>{orte.length > 0 && !ort && <div className="mt-2 overflow-hidden rounded-xl border border-white/10 bg-[#081725]">{orte.map(x => <button key={x} type="button" onClick={() => setOrt(x)} className="block w-full border-b border-white/5 px-4 py-3 text-left text-sm text-white">{x}</button>)}</div>}{ort && <p className="mt-2 text-xs text-[#66d5ff]">✓ {ort}</p>}</Field><Field label="Straße"><div className="relative mt-2"><input value={strasse} disabled={!ort} onChange={e => { setStrasse(e.target.value); setStrassenOpen(true); }} onFocus={() => setStrassenOpen(true)} placeholder={ort ? "z. B. Hauptstraße" : "Erst PLZ und Ort"} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none disabled:opacity-40 focus:border-[#19b7ff]"/>{strassenOpen && strassen.length > 0 && <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-white/10 bg-[#081725]">{strassen.map(x => <button key={x} type="button" onClick={() => { setStrasse(x); setStrassenOpen(false); }} className="block w-full px-4 py-3 text-left text-sm text-white">{x}</button>)}</div>}</div></Field><Field label="Hausnummer"><input value={hausnummer} onChange={e => setHausnummer(e.target.value.slice(0, 8))} placeholder="z. B. 3a" className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#19b7ff]"/></Field><Field label="Aktueller Anbieter" optional><div className="relative mt-2"><input value={anbieter} onChange={e => { setAnbieter(e.target.value); setAnbieterOpen(true); }} onFocus={() => setAnbieterOpen(true)} placeholder="z. B. E.ON" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#19b7ff]"/>{anbieterOpen && providerMatches.length > 0 && <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-white/10 bg-[#081725]">{providerMatches.map(x => <button key={x} type="button" onClick={() => { setAnbieter(x); setAnbieterOpen(false); }} className="block w-full px-4 py-3 text-left text-sm text-white">{x}</button>)}</div>}</div></Field></div><div className="rounded-2xl border border-white/10 bg-white/[.025] p-4"><p className="font-semibold text-white">Tarifprofil</p><p className="mt-1 text-xs text-slate-500">Nur für die passende Einordnung des Vergleichs.</p><div className="mt-3 grid grid-cols-2 gap-3">{([["private", "Privathaushalt"], ["business", "Gewerbe"]] as const).map(([v, l]) => <button key={v} type="button" onClick={() => setCustomer(v)} className={`rounded-xl border py-3 font-semibold ${customer === v ? "border-[#19b7ff] text-[#66d5ff]" : "border-white/10 text-slate-400"}`}>{l}</button>)}</div></div><div className="rounded-xl border border-white/10 bg-white/[.02] p-4"><p className="text-sm font-semibold text-white">Deine Angaben</p><div className="mt-2 grid gap-1 text-sm text-slate-400"><span>{energy === "strom" ? "⚡ Strom" : energy === "gas" ? "🔥 Gas" : "⚡ Strom + 🔥 Gas"}{strom > 0 ? ` · ${strom.toLocaleString("de-DE")} kWh` : ""}{gas > 0 ? ` · ${gas.toLocaleString("de-DE")} kWh` : ""}</span><span>📍 {plz || "PLZ fehlt"} {ort}</span>{strasse && <span>🏠 {strasse} {hausnummer}</span>}{anbieter && <span>⚡ {anbieter}</span>}</div></div><div className="rounded-xl border border-white/10 bg-white/[.025] p-4"><p className="text-sm font-semibold text-white">Transparent geprüft</p><p className="mt-1 text-xs leading-5 text-slate-500">Wir zeigen keine erfundene Ersparnis und lösen keinen Anbieterwechsel automatisch aus. Du entscheidest selbst.</p></div><div className="flex gap-3"><button type="button" onClick={() => goTo(mode === "manual" ? 3 : 2)} className="rounded-full border border-white/10 px-6 py-4 font-semibold text-slate-300">Zurück</button>{addressReady ? <Link href={`/kontakt?${query.toString()}`} className="flex-1 rounded-full bg-[#19b7ff] px-6 py-4 text-center font-bold text-[#03101c]">Tarif kostenlos prüfen</Link> : <button type="button" disabled className="flex-1 rounded-full bg-white/10 px-6 py-4 font-bold text-slate-500">Adresse vervollständigen</button>}</div></div>
      )}
    </div>
  );
}
