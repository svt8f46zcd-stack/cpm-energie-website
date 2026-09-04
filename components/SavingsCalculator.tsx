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
  const [tariffType, setTariffType] = useState<EnergyType>("both");
  const [showStreets, setShowStreets] = useState(false);
  const [showProviders, setShowProviders] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setPostalCode(params.get("plz") || "");
    setCity(params.get("ort") || "");
    setStreet(params.get("strasse") || "");
    setHouseNumber(params.get("hausnummer") || "");
    setProvider(params.get("anbieter") || "");
    const tariff = params.get("tarif");
    if (tariff === "strom" || tariff === "gas" || tariff === "both") setTariffType(tariff);
    const strom = Number(params.get("strom"));
    const gasValue = Number(params.get("gas"));
    if (Number.isFinite(strom) && strom > 0) setElectricity(strom);
    if (Number.isFinite(gasValue) && gasValue > 0) setGas(gasValue);
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
        if (cancelled) return;
        setCities(unique);
        setCity(current => current && unique.includes(current) ? current : unique.length === 1 ? unique[0] : "");
      } catch {
        if (!cancelled) {
          try {
            const params = new URLSearchParams({ postalcode: postalCode, country: "Germany", format: "jsonv2", addressdetails: "1", limit: "50" });
            const response = await fetch(`${NOMINATIM_API}/search?${params}`, { signal: controller.signal, cache: "no-store", headers: { Accept: "application/json" } });
            if (!response.ok) throw new Error();
            const results = await response.json() as NominatimResult[];
            const unique = Array.from(new Set(results.map(r => { const a = r.address || {}; return a.city || a.town || a.village || a.municipality || ""; }).filter(Boolean)));
            if (!cancelled) { setCities(unique); setCity(current => current && unique.includes(current) ? current : unique.length === 1 ? unique[0] : ""); }
          } catch { if (!cancelled) setCities([]); }
        }
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

  const hasConsumption = (tariffType === "strom" || tariffType === "both") ? electricity > 0 : gas > 0;
  const params = new URLSearchParams({ plz: postalCode, ort: city, strasse: street, hausnummer: houseNumber, anbieter: provider, strom: String(electricity), gas: String(gas), kundentyp: customerType, tarif: tariffType });

  async function detectLocation() {
    if (!navigator.geolocation) return;
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(async position => {
      try {
        const reverse = new URLSearchParams({ lat: String(position.coords.latitude), lon: String(position.coords.longitude), format: "jsonv2", addressdetails: "1" });
        const r = await fetch(`${NOMINATIM_API}/reverse?${reverse}`, { cache: "no-store", headers: { Accept: "application/json" } });
        if (!r.ok) throw new Error();
        const a = ((await r.json()) as NominatimResult).address || {};
        setPostalCode(a.postcode || ""); setCity(a.city || a.town || a.village || a.municipality || ""); setStreet(a.road || "");
      } finally { setDetecting(false); }
    }, () => setDetecting(false), { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
  }

  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#06111d] shadow-2xl shadow-black/20">
      <div className="border-b border-white/10 px-5 py-6 md:px-8 md:py-7">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#19b7ff]/10 text-lg text-[#66d5ff]">1</div>
          <div>
            <h2 className="text-xl font-bold text-white md:text-2xl">Was möchtest du prüfen?</h2>
            <p className="mt-1 text-sm text-slate-400">Wähle Strom, Gas oder beides.</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {(["strom", "gas", "both"] as EnergyType[]).map(type => {
            const label = type === "strom" ? "Nur Strom" : type === "gas" ? "Nur Gas" : "Strom + Gas";
            return <button key={type} type="button" onClick={() => setTariffType(type)} className={`rounded-xl border px-4 py-3.5 text-sm font-bold transition ${tariffType === type ? "border-[#19b7ff] bg-[#19b7ff]/10 text-[#66d5ff]" : "border-white/10 bg-white/[.03] text-slate-300 hover:border-white/20"}`}>{label}</button>;
          })}
        </div>
      </div>

      <div className="px-5 py-6 md:px-8 md:py-7">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#19b7ff]/10 text-lg text-[#66d5ff]">2</div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white md:text-2xl">Wie viel verbrauchst du im Jahr?</h2>
            <p className="mt-1 text-sm text-slate-400">Am besten steht der Jahresverbrauch auf deiner letzten Abrechnung.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {(tariffType === "strom" || tariffType === "both") && <div className="rounded-2xl border border-white/10 bg-white/[.025] p-5">
            <label className="text-sm font-bold text-white">Stromverbrauch</label>
            <div className="mt-3 flex items-center gap-3"><input type="number" min="0" max="15000" step="100" value={electricity || ""} onChange={e => setElectricity(Math.max(0, Math.min(15000, Number(e.target.value) || 0)))} placeholder="z. B. 3.000" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-lg font-bold text-white outline-none focus:border-[#19b7ff]"/><span className="text-sm font-semibold text-slate-400">kWh/Jahr</span></div>
            <div className="mt-3 flex gap-2">{[2500, 3500, 4500].map(value => <button key={value} type="button" onClick={() => setElectricity(value)} className="rounded-lg bg-white/5 px-3 py-2 text-xs text-slate-300 hover:bg-white/10">{value.toLocaleString("de-DE")}</button>)}</div>
          </div>}
          {(tariffType === "gas" || tariffType === "both") && <div className="rounded-2xl border border-white/10 bg-white/[.025] p-5">
            <label className="text-sm font-bold text-white">Gasverbrauch</label>
            <div className="mt-3 flex items-center gap-3"><input type="number" min="0" max="40000" step="500" value={gas || ""} onChange={e => setGas(Math.max(0, Math.min(40000, Number(e.target.value) || 0)))} placeholder="z. B. 12.000" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-lg font-bold text-white outline-none focus:border-[#19b7ff]"/><span className="text-sm font-semibold text-slate-400">kWh/Jahr</span></div>
            <div className="mt-3 flex gap-2">{[10000, 15000, 20000].map(value => <button key={value} type="button" onClick={() => setGas(value)} className="rounded-lg bg-white/5 px-3 py-2 text-xs text-slate-300 hover:bg-white/10">{value.toLocaleString("de-DE")}</button>)}</div>
          </div>}
        </div>

        <div className="mt-5 rounded-2xl border border-[#19b7ff]/20 bg-[#19b7ff]/5 p-4">
          <p className="text-sm font-semibold text-white">Noch keine Abrechnung zur Hand?</p>
          <p className="mt-1 text-sm leading-6 text-slate-400">Du kannst deinen Verbrauch eingeben oder oben die Abrechnung hochladen. Ohne Verbrauch zeigen wir bewusst keine geschätzte Ersparnis an.</p>
        </div>
      </div>

      <div className="border-t border-white/10 px-5 py-5 md:px-8">
        <button type="button" onClick={() => setShowDetails(value => !value)} className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[.025] px-4 py-3.5 text-left hover:bg-white/[.05]">
          <span><strong className="block text-sm text-white">Weitere Angaben</strong><span className="text-xs text-slate-500">Adresse, Anbieter und Kundentyp für eine genauere Prüfung</span></span>
          <span className="text-xl text-slate-400">{showDetails ? "⌃" : "⌄"}</span>
        </button>

        {showDetails && <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div><label className="text-sm font-semibold text-slate-300">PLZ</label><div className="mt-2 flex gap-2"><input value={postalCode} onChange={e => setPostalCode(e.target.value.replace(/\D/g, "").slice(0, 5))} inputMode="numeric" maxLength={5} placeholder="z. B. 55278" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#19b7ff]"/><button type="button" onClick={detectLocation} disabled={detecting} className="rounded-xl border border-[#19b7ff]/30 px-4 text-sm font-semibold text-[#66d5ff]">{detecting ? "…" : "📍"}</button></div>{loadingCities && <p className="mt-2 text-xs text-slate-500">Ort wird geprüft …</p>}{!loadingCities && !city && cities.length > 0 && <div className="mt-2 overflow-hidden rounded-xl border border-[#19b7ff]/30 bg-[#081725]"><p className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#66d5ff]">Ort auswählen</p>{cities.map(item => <button key={item} type="button" onClick={() => { setCity(item); setStreet(""); }} className="block w-full border-t border-white/5 px-4 py-3 text-left text-sm text-slate-200">{item}</button>)}</div>}{city && <p className="mt-2 text-sm text-[#66d5ff]">✓ {city}</p>}</div>
          <div className="relative"><label className="text-sm font-semibold text-slate-300">Straße</label><input value={street} onChange={e => { setStreet(e.target.value); setShowStreets(true); }} onFocus={() => setShowStreets(true)} placeholder={city ? `Straße in ${city}` : "Erst Ort auswählen"} disabled={!city} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none disabled:opacity-40"/>{showStreets && city && street && (streetSuggestions.length > 0 || loadingStreets) && <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-white/10 bg-[#081725] shadow-2xl">{loadingStreets && <div className="px-4 py-3 text-xs text-slate-400">Straßen werden gesucht …</div>}{!loadingStreets && streetSuggestions.map(item => <button key={item} type="button" onClick={() => { setStreet(item); setStreetSuggestions([]); setShowStreets(false); }} className="block w-full px-4 py-3 text-left text-sm text-slate-200 hover:bg-[#19b7ff]/10">{item}</button>)}</div>}</div>
          <div><label className="text-sm font-semibold text-slate-300">Hausnummer</label><input value={houseNumber} onChange={e => setHouseNumber(e.target.value.slice(0, 8))} placeholder="z. B. 3a" className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"/></div>
          <div className="relative"><label className="text-sm font-semibold text-slate-300">Aktueller Anbieter</label><input value={provider} onChange={e => { setProvider(e.target.value); setShowProviders(true); }} onFocus={() => setShowProviders(true)} placeholder="Anbieter suchen" className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"/>{showProviders && providerMatches.length > 0 && <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-white/10 bg-[#081725] shadow-2xl">{providerMatches.map(item => <button key={item} type="button" onClick={() => { setProvider(item); setShowProviders(false); }} className="block w-full px-4 py-3 text-left text-sm text-slate-200 hover:bg-white/10">{item}</button>)}</div>}</div>
          <div className="md:col-span-2"><label className="text-sm font-semibold text-slate-300">Du bist</label><div className="mt-2 grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => setCustomerType("private")} className={`rounded-xl border px-4 py-3 text-sm font-semibold ${customerType === "private" ? "border-[#19b7ff] bg-[#19b7ff]/10 text-[#66d5ff]" : "border-white/10 text-slate-400"}`}>Privathaushalt</button><button type="button" onClick={() => setCustomerType("business")} className={`rounded-xl border px-4 py-3 text-sm font-semibold ${customerType === "business" ? "border-[#19b7ff] bg-[#19b7ff]/10 text-[#66d5ff]" : "border-white/10 text-slate-400"}`}>Gewerbe</button></div></div>
        </div>}
      </div>

      <div className="border-t border-white/10 bg-[#040d17] px-5 py-6 md:px-8 md:py-7">
        <div className="rounded-2xl border border-white/10 bg-white/[.025] p-5">
          <p className="text-sm text-slate-400">Ersparnis</p>
          <p className="mt-1 text-base font-semibold text-slate-200">{hasConsumption ? "Deine Angaben sind erfasst. Das tatsächliche Einsparpotenzial prüfen wir anhand deines aktuellen Tarifs und der verfügbaren Angebote." : "Gib zuerst deinen Jahresverbrauch ein. Dann können wir das Einsparpotenzial sinnvoll prüfen."}</p>
        </div>
        <Link href={`/kontakt?${params.toString()}`} className={`mt-4 block w-full rounded-full px-7 py-4 text-center font-bold transition ${hasConsumption ? "bg-[#19b7ff] text-[#03101c] hover:bg-white" : "bg-white/10 text-slate-500"}`}>Tarif kostenlos prüfen →</Link>
        <p className="mt-3 text-center text-xs leading-5 text-slate-500">Kostenlos und unverbindlich. Keine Verpflichtung zum Wechsel.</p>
      </div>
    </div>
  );
}
