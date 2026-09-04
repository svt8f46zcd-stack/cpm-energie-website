"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";

const PROVIDERS = ["E.ON", "EnBW", "Vattenfall", "RheinEnergie", "Mainova", "Stadtwerke München", "Yello Strom", "LichtBlick", "Naturstrom", "EWE", "Energieversorgung Mittelrhein", "Sonstiger Anbieter"];
const NOMINATIM_API = "https://nominatim.openstreetmap.org";
const OPENPLZ_API = "https://openplzapi.org/de";
type NominatimResult = { place_id: number; display_name: string; address?: { road?: string; city?: string; town?: string; village?: string; municipality?: string; postcode?: string } };
type OpenPlzLocality = { postalCode?: string; name?: string; municipality?: { name?: string } };

type EnergyType = "strom" | "gas" | "both";

export function SavingsCalculator() {
  const [step, setStep] = useState(1);
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [cities, setCities] = useState<string[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [street, setStreet] = useState("");
  const [streetSuggestions, setStreetSuggestions] = useState<string[]>([]);
  const [loadingStreets, setLoadingStreets] = useState(false);
  const [houseNumber, setHouseNumber] = useState("");
  const [provider, setProvider] = useState("");
  const [electricity, setElectricity] = useState(0);
  const [gas, setGas] = useState(0);
  const [customerType, setCustomerType] = useState<"private" | "business">("private");
  const [tariffType, setTariffType] = useState<EnergyType>("strom");
  const [showStreets, setShowStreets] = useState(false);
  const [showProviders, setShowProviders] = useState(false);
  const [detecting, setDetecting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setPostalCode(params.get("plz") || "");
    setCity(params.get("ort") || "");
    setStreet(params.get("strasse") || "");
    setHouseNumber(params.get("hausnummer") || "");
    setProvider(params.get("anbieter") || "");
    const incomingTariff = params.get("tarif") as EnergyType | null;
    if (incomingTariff === "strom" || incomingTariff === "gas" || incomingTariff === "both") setTariffType(incomingTariff);
    const incomingElectricity = Number(params.get("strom") || 0);
    const incomingGas = Number(params.get("gas") || 0);
    if (incomingElectricity > 0) setElectricity(incomingElectricity);
    if (incomingGas > 0) setGas(incomingGas);
    if (params.get("plz") || params.get("ort")) setStep(2);
  }, []);

  useEffect(() => {
    if (!/^\d{5}$/.test(postalCode)) { setCities([]); return; }
    let cancelled = false;
    const controller = new AbortController();
    setLoadingCities(true);
    async function loadCities() {
      try {
        const response = await fetch(`${OPENPLZ_API}/Localities?postalCode=${encodeURIComponent(postalCode)}&page=1&pageSize=50`, { signal: controller.signal, cache: "no-store", headers: { Accept: "application/json" } });
        if (!response.ok) throw new Error();
        const results = await response.json() as OpenPlzLocality[];
        const unique = Array.from(new Set(results.map(r => (r.name || r.municipality?.name || "").trim()).filter(Boolean)));
        if (!cancelled) { setCities(unique); setCity(current => current && unique.includes(current) ? current : unique.length === 1 ? unique[0] : ""); }
      } catch {
        try {
          const params = new URLSearchParams({ postalcode: postalCode, country: "Germany", format: "jsonv2", addressdetails: "1", limit: "50" });
          const response = await fetch(`${NOMINATIM_API}/search?${params}`, { signal: controller.signal, cache: "no-store", headers: { Accept: "application/json" } });
          if (!response.ok) throw new Error();
          const results = await response.json() as NominatimResult[];
          const unique = Array.from(new Set(results.map(r => { const a = r.address || {}; return a.city || a.town || a.village || a.municipality || ""; }).filter(Boolean)));
          if (!cancelled) { setCities(unique); setCity(current => current && unique.includes(current) ? current : unique.length === 1 ? unique[0] : ""); }
        } catch { if (!cancelled) setCities([]); }
      } finally { if (!cancelled) setLoadingCities(false); }
    }
    loadCities();
    return () => { cancelled = true; controller.abort(); };
  }, [postalCode]);

  useEffect(() => {
    if (!/^\d{5}$/.test(postalCode) || !city || street.trim().length < 2) { setStreetSuggestions([]); setLoadingStreets(false); return; }
    let cancelled = false;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoadingStreets(true);
      const params = new URLSearchParams({ street: street.trim(), city, postalcode: postalCode, countrycodes: "de", format: "jsonv2", addressdetails: "1", limit: "12" });
      fetch(`${NOMINATIM_API}/search?${params}`, { signal: controller.signal, cache: "no-store", headers: { Accept: "application/json" } })
        .then(async r => { if (!r.ok) throw new Error(); return await r.json() as NominatimResult[]; })
        .then(results => { if (!cancelled) setStreetSuggestions(Array.from(new Set(results.map(r => r.address?.road || "").filter(Boolean))).slice(0, 8)); })
        .catch(() => { if (!cancelled) setStreetSuggestions([]); })
        .finally(() => { if (!cancelled) setLoadingStreets(false); });
    }, 300);
    return () => { cancelled = true; controller.abort(); window.clearTimeout(timer); };
  }, [postalCode, city, street]);

  const providerMatches = useMemo(() => {
    const q = provider.toLowerCase().trim();
    return (q ? PROVIDERS.filter(x => x.toLowerCase().includes(q)) : PROVIDERS).slice(0, 8);
  }, [provider]);

  const consumptionReady = (tariffType === "strom" && electricity > 0) || (tariffType === "gas" && gas > 0) || (tariffType === "both" && electricity > 0 && gas > 0);
  const addressReady = /^\d{5}$/.test(postalCode) && !!city && !!street.trim() && !!houseNumber.trim();
  const params = new URLSearchParams({ plz: postalCode, ort: city, strasse: street, hausnummer: houseNumber, anbieter: provider, strom: String(electricity), gas: String(gas), kundentyp: customerType, tarif: tariffType });

  async function detectLocation() {
    if (!navigator.geolocation) return;
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(async position => {
      try {
        const reverseParams = new URLSearchParams({ lat: String(position.coords.latitude), lon: String(position.coords.longitude), format: "jsonv2", addressdetails: "1" });
        const r = await fetch(`${NOMINATIM_API}/reverse?${reverseParams}`, { cache: "no-store", headers: { Accept: "application/json" } });
        if (!r.ok) throw new Error();
        const a = ((await r.json()) as NominatimResult).address || {};
        setPostalCode(a.postcode || ""); setCity(a.city || a.town || a.village || a.municipality || ""); setStreet(a.road || "");
      } finally { setDetecting(false); }
    }, () => setDetecting(false), { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
  }

  function nextFromStepOne() {
    if (tariffType === "strom" && electricity === 0) setElectricity(3000);
    if (tariffType === "gas" && gas === 0) setGas(12000);
    if (tariffType === "both") { if (electricity === 0) setElectricity(3000); if (gas === 0) setGas(12000); }
    setStep(2);
  }

  return <div className="space-y-5">
    <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#19b7ff]">Schritt {step} von 3</p><p className="mt-1 font-bold text-white">{step === 1 ? "Was möchtest du prüfen?" : step === 2 ? "Dein Verbrauch" : "Wo soll der Tarif passen?"}</p></div>
        <div className="flex gap-1.5" aria-hidden="true">{[1,2,3].map(n => <span key={n} className={`h-1.5 w-8 rounded-full ${n <= step ? "bg-[#19b7ff]" : "bg-white/10"}`} />)}</div>
      </div>
    </div>

    {step === 1 && <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        {(["strom", "gas", "both"] as EnergyType[]).map(type => <button key={type} type="button" onClick={() => setTariffType(type)} className={`rounded-2xl border p-5 text-left transition ${tariffType === type ? "border-[#19b7ff] bg-[#19b7ff]/10" : "border-white/10 bg-white/[.025] hover:border-white/20"}`}><span className="text-2xl">{type === "strom" ? "⚡" : type === "gas" ? "🔥" : "⚡ + 🔥"}</span><span className="mt-3 block font-bold text-white">{type === "strom" ? "Nur Strom" : type === "gas" ? "Nur Gas" : "Strom + Gas"}</span><span className="mt-1 block text-xs text-slate-400">{type === "both" ? "Beides zusammen prüfen" : `Nur ${type === "strom" ? "Strom" : "Gas"}`}</span></button>)}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={() => setCustomerType("private")} className={`rounded-xl border px-4 py-3 text-sm font-semibold ${customerType === "private" ? "border-[#19b7ff] bg-[#19b7ff]/10 text-[#66d5ff]" : "border-white/10 text-slate-400"}`}>Privathaushalt</button>
        <button type="button" onClick={() => setCustomerType("business")} className={`rounded-xl border px-4 py-3 text-sm font-semibold ${customerType === "business" ? "border-[#19b7ff] bg-[#19b7ff]/10 text-[#66d5ff]" : "border-white/10 text-slate-400"}`}>Gewerbe</button>
      </div>
      <button type="button" onClick={nextFromStepOne} className="w-full rounded-full bg-[#19b7ff] px-7 py-4 font-bold text-[#03101c]">Weiter →</button>
      <p className="text-center text-xs text-slate-500">Noch einfacher: Wenn du deine Abrechnung hast, kannst du sie oben hochladen. Dann müssen die Verbrauchsdaten nicht von Hand eingegeben werden.</p>
    </div>}

    {step === 2 && <div className="space-y-5">
      <p className="text-sm leading-6 text-slate-400">Eine grobe Jahresangabe reicht. Wenn du deinen Verbrauch nicht kennst, findest du ihn auf deiner letzten Abrechnung.</p>
      <div className="grid gap-4 md:grid-cols-2">
        {(tariffType === "strom" || tariffType === "both") && <div className="rounded-2xl border border-white/10 bg-white/[.025] p-5"><label className="text-sm font-bold text-white">Stromverbrauch pro Jahr</label><div className="mt-3 flex items-center gap-2"><input type="number" min="0" max="15000" step="100" value={electricity || ""} onChange={e => setElectricity(Math.max(0, Number(e.target.value)))} placeholder="z. B. 3.000" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-lg font-bold text-white outline-none focus:border-[#19b7ff]"/><span className="text-sm text-slate-400">kWh</span></div><div className="mt-3 flex flex-wrap gap-2">{[2000,3000,4000,5000].map(v => <button key={v} type="button" onClick={() => setElectricity(v)} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:border-[#19b7ff]/50">{v.toLocaleString("de-DE")}</button>)}</div></div>}
        {(tariffType === "gas" || tariffType === "both") && <div className="rounded-2xl border border-white/10 bg-white/[.025] p-5"><label className="text-sm font-bold text-white">Gasverbrauch pro Jahr</label><div className="mt-3 flex items-center gap-2"><input type="number" min="0" max="40000" step="500" value={gas || ""} onChange={e => setGas(Math.max(0, Number(e.target.value)))} placeholder="z. B. 12.000" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-lg font-bold text-white outline-none focus:border-[#19b7ff]"/><span className="text-sm text-slate-400">kWh</span></div><div className="mt-3 flex flex-wrap gap-2">{[8000,12000,18000,24000].map(v => <button key={v} type="button" onClick={() => setGas(v)} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:border-[#19b7ff]/50">{v.toLocaleString("de-DE")}</button>)}</div></div>}
      </div>
      <div className="flex gap-3"><button type="button" onClick={() => setStep(1)} className="rounded-full border border-white/10 px-6 py-4 font-semibold text-slate-300">Zurück</button><button type="button" disabled={!consumptionReady} onClick={() => setStep(3)} className={`flex-1 rounded-full px-7 py-4 font-bold ${consumptionReady ? "bg-[#19b7ff] text-[#03101c]" : "cursor-not-allowed bg-white/10 text-slate-500"}`}>Weiter →</button></div>
    </div>}

    {step === 3 && <div className="space-y-5">
      <p className="text-sm leading-6 text-slate-400">Damit wir passende Tarife für deinen Wohnort prüfen können, brauchen wir noch deine Adresse. Dein aktueller Anbieter ist hilfreich, aber nicht zwingend.</p>
      <div className="grid gap-4 md:grid-cols-2">
        <div><label className="text-sm font-semibold text-slate-300">PLZ</label><div className="mt-2 flex gap-2"><input value={postalCode} onChange={e => setPostalCode(e.target.value.replace(/\D/g, "").slice(0, 5))} inputMode="numeric" maxLength={5} placeholder="z. B. 55278" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#19b7ff]"/><button type="button" onClick={detectLocation} disabled={detecting} className="rounded-xl border border-[#19b7ff]/30 px-4 text-sm font-semibold text-[#66d5ff]">{detecting ? "…" : "📍"}</button></div>{loadingCities && <p className="mt-2 text-xs text-slate-500">Ort wird geprüft …</p>}{!loadingCities && !city && cities.length > 0 && <div className="mt-2 overflow-hidden rounded-xl border border-[#19b7ff]/30 bg-[#081725]"><p className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#66d5ff]">Ort auswählen</p>{cities.map(item => <button key={item} type="button" onClick={() => { setCity(item); setStreet(""); }} className="block w-full border-t border-white/5 px-4 py-3 text-left text-sm text-slate-200">{item}</button>)}</div>}{city && <p className="mt-2 text-sm text-[#66d5ff]">✓ {city}</p>}</div>
        <div className="relative"><label className="text-sm font-semibold text-slate-300">Straße</label><input value={street} onChange={e => { setStreet(e.target.value); setShowStreets(true); }} onFocus={() => setShowStreets(true)} placeholder={city ? `Straße in ${city}` : "Erst Ort auswählen"} disabled={!city} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none disabled:opacity-40"/>{showStreets && city && street && (streetSuggestions.length > 0 || loadingStreets) && <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-white/10 bg-[#081725] shadow-2xl">{loadingStreets && <div className="px-4 py-3 text-xs text-slate-400">Straßen werden gesucht …</div>}{!loadingStreets && streetSuggestions.map(item => <button key={item} type="button" onClick={() => { setStreet(item); setStreetSuggestions([]); setShowStreets(false); }} className="block w-full px-4 py-3 text-left text-sm text-slate-200 hover:bg-[#19b7ff]/10">{item}</button>)}</div>}</div>
        <div><label className="text-sm font-semibold text-slate-300">Hausnummer</label><input value={houseNumber} onChange={e => setHouseNumber(e.target.value.slice(0, 8))} placeholder="z. B. 3a" className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"/></div>
        <div className="relative"><label className="text-sm font-semibold text-slate-300">Aktueller Anbieter <span className="font-normal text-slate-500">optional</span></label><input value={provider} onChange={e => { setProvider(e.target.value); setShowProviders(true); }} onFocus={() => setShowProviders(true)} placeholder="z. B. E.ON" className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"/>{showProviders && providerMatches.length > 0 && <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-white/10 bg-[#081725] shadow-2xl">{providerMatches.map(item => <button key={item} type="button" onClick={() => { setProvider(item); setShowProviders(false); }} className="block w-full px-4 py-3 text-left text-sm text-slate-200 hover:bg-white/10">{item}</button>)}</div>}</div>
      </div>
      <div className="rounded-2xl border border-[#19b7ff]/20 bg-[#19b7ff]/5 p-4"><p className="text-sm font-semibold text-white">Was passiert danach?</p><p className="mt-1 text-sm leading-6 text-slate-400">Wir prüfen deine Angaben und zeigen dir, welche Tarife für deine Situation infrage kommen. Es gibt keine automatische Vertragsumstellung.</p></div>
      <div className="flex gap-3"><button type="button" onClick={() => setStep(2)} className="rounded-full border border-white/10 px-6 py-4 font-semibold text-slate-300">Zurück</button><Link href={`/kontakt?${params.toString()}`} className={`flex-1 rounded-full px-7 py-4 text-center font-bold ${addressReady ? "bg-[#19b7ff] text-[#03101c]" : "bg-white/10 text-slate-500"}`}>Tarif kostenlos prüfen</Link></div>
      <p className="text-center text-xs text-slate-500">Kostenlos und unverbindlich. Du entscheidest selbst, ob du wechseln möchtest.</p>
    </div>}
  </div>;
}
