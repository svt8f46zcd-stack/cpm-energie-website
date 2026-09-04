"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";

const PROVIDERS = ["E.ON", "EnBW", "Vattenfall", "RheinEnergie", "Mainova", "Stadtwerke München", "Yello Strom", "LichtBlick", "Naturstrom", "EWE", "Energieversorgung Mittelrhein", "Sonstiger Anbieter"];
const NOMINATIM_API = "https://nominatim.openstreetmap.org";
const OPENPLZ_API = "https://openplzapi.org/de";

type NominatimResult = { place_id: number; display_name: string; address?: { road?: string; city?: string; town?: string; village?: string; municipality?: string; postcode?: string } };
type OpenPlzLocality = { postalCode?: string; name?: string; municipality?: { name?: string } };

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
  const [electricity, setElectricity] = useState(3000);
  const [gas, setGas] = useState(0);
  const [customerType, setCustomerType] = useState<"private" | "business">("private");
  const [tariffType, setTariffType] = useState<"strom" | "gas" | "both">("both");
  const [showStreets, setShowStreets] = useState(false);
  const [showProviders, setShowProviders] = useState(false);
  const [detecting, setDetecting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setPostalCode(params.get("plz") || ""); setCity(params.get("ort") || ""); setStreet(params.get("strasse") || ""); setHouseNumber(params.get("hausnummer") || ""); setProvider(params.get("anbieter") || "");
  }, []);

  useEffect(() => {
    if (!/^\d{5}$/.test(postalCode)) { setCities([]); setStreetSuggestions([]); return; }
    let cancelled = false; const controller = new AbortController(); setLoadingCities(true);
    async function loadCities() { try { const response = await fetch(`${OPENPLZ_API}/Localities?postalCode=${encodeURIComponent(postalCode)}&page=1&pageSize=50`, { signal: controller.signal, cache: "no-store", headers: { Accept: "application/json" } }); if (!response.ok) throw new Error(); const results = await response.json() as OpenPlzLocality[]; const unique = Array.from(new Set(results.map(r => (r.name || r.municipality?.name || "").trim()).filter(Boolean))); if (cancelled) return; setCities(unique); setCity(current => current && unique.includes(current) ? current : unique.length === 1 ? unique[0] : ""); } catch { if (!cancelled) { try { const params = new URLSearchParams({ postalcode: postalCode, country: "Germany", format: "jsonv2", addressdetails: "1", limit: "50" }); const response = await fetch(`${NOMINATIM_API}/search?${params}`, { signal: controller.signal, cache: "no-store", headers: { Accept: "application/json" } }); if (!response.ok) throw new Error(); const results = await response.json() as NominatimResult[]; const unique = Array.from(new Set(results.map(r => { const a = r.address || {}; return a.city || a.town || a.village || a.municipality || ""; }).filter(Boolean))); if (!cancelled) { setCities(unique); setCity(current => current && unique.includes(current) ? current : unique.length === 1 ? unique[0] : ""); } } catch { if (!cancelled) setCities([]); } } } finally { if (!cancelled) setLoadingCities(false); } }
    loadCities(); return () => { cancelled = true; controller.abort(); };
  }, [postalCode]);

  useEffect(() => {
    if (!/^\d{5}$/.test(postalCode) || !city || street.trim().length < 2) { setStreetSuggestions([]); setLoadingStreets(false); return; }
    let cancelled = false; const controller = new AbortController(); const timer = window.setTimeout(() => { setLoadingStreets(true); const params = new URLSearchParams({ street: street.trim(), city, postalcode: postalCode, countrycodes: "de", format: "jsonv2", addressdetails: "1", limit: "12" }); fetch(`${NOMINATIM_API}/search?${params}`, { signal: controller.signal, cache: "no-store", headers: { Accept: "application/json" } }).then(async r => { if (!r.ok) throw new Error(); return await r.json() as NominatimResult[]; }).then(results => { if (!cancelled) setStreetSuggestions(Array.from(new Set(results.map(r => r.address?.road || "").filter(Boolean))).slice(0, 8)); }).catch(() => { if (!cancelled) setStreetSuggestions([]); }).finally(() => { if (!cancelled) setLoadingStreets(false); }); }, 300); return () => { cancelled = true; controller.abort(); window.clearTimeout(timer); };
  }, [postalCode, city, street]);

  const providerMatches = useMemo(() => { const q = provider.toLowerCase().trim(); return (q ? PROVIDERS.filter(x => x.toLowerCase().includes(q)) : PROVIDERS).slice(0, 8); }, [provider]);
  const estimatedSavings = useMemo(() => Math.max(0, Math.round((tariffType === "gas" ? 0 : electricity * (customerType === "business" ? .06 : .08)) + (tariffType === "strom" ? 0 : gas * (customerType === "business" ? .035 : .045)))), [electricity, gas, customerType, tariffType]);
  async function detectLocation() { if (!navigator.geolocation) return; setDetecting(true); navigator.geolocation.getCurrentPosition(async position => { try { const params = new URLSearchParams({ lat: String(position.coords.latitude), lon: String(position.coords.longitude), format: "jsonv2", addressdetails: "1" }); const r = await fetch(`${NOMINATIM_API}/reverse?${params}`, { cache: "no-store", headers: { Accept: "application/json" } }); if (!r.ok) throw new Error(); const a = ((await r.json()) as NominatimResult).address || {}; setPostalCode(a.postcode || ""); setCity(a.city || a.town || a.village || a.municipality || ""); setStreet(a.road || ""); } finally { setDetecting(false); } }, () => setDetecting(false), { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }); }

  const params = new URLSearchParams({ plz: postalCode, ort: city, strasse: street, hausnummer: houseNumber, anbieter: provider, strom: String(electricity), gas: String(gas), kundentyp: customerType, tarif: tariffType });

  return <div className="space-y-6">
    <div className="grid gap-4 md:grid-cols-2">
      <div><label className="text-sm font-semibold text-slate-300">PLZ</label><div className="mt-2 flex gap-2"><input value={postalCode} onChange={e => setPostalCode(e.target.value.replace(/\D/g, "").slice(0, 5))} inputMode="numeric" maxLength={5} placeholder="z. B. 55278" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#19b7ff]" /><button type="button" onClick={detectLocation} disabled={detecting} className="rounded-xl border border-[#19b7ff]/30 px-4 text-sm font-semibold text-[#66d5ff]">{detecting ? "…" : "📍"}</button></div>{loadingCities && <p className="mt-2 text-xs text-slate-500">Ort wird geprüft …</p>}{!loadingCities && !city && cities.length > 0 && <div className="mt-2 overflow-hidden rounded-xl border border-[#19b7ff]/30 bg-[#081725]"><p className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#66d5ff]">Ort auswählen</p>{cities.map(item => <button key={item} type="button" onClick={() => { setCity(item); setStreet(""); }} className="block w-full border-t border-white/5 px-4 py-3 text-left text-sm text-slate-200">{item}</button>)}</div>}{city && <p className="mt-2 text-sm text-[#66d5ff]">✓ {city}</p>}</div>
      <div className="relative"><label className="text-sm font-semibold text-slate-300">Straße</label><input value={street} onChange={e => { setStreet(e.target.value); setShowStreets(true); }} onFocus={() => setShowStreets(true)} placeholder={city ? `Straße in ${city}` : "Erst Ort auswählen"} disabled={!city} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none disabled:opacity-40" />{showStreets && city && street && (streetSuggestions.length > 0 || loadingStreets) && <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-white/10 bg-[#081725] shadow-2xl">{loadingStreets && <div className="px-4 py-3 text-xs text-slate-400">Straßen werden gesucht …</div>}{!loadingStreets && streetSuggestions.map(item => <button key={item} type="button" onClick={() => { setStreet(item); setStreetSuggestions([]); setShowStreets(false); }} className="block w-full px-4 py-3 text-left text-sm text-slate-200 hover:bg-[#19b7ff]/10">{item}</button>)}</div>}</div>
      <div><label className="text-sm font-semibold text-slate-300">Hausnummer</label><input value={houseNumber} onChange={e => setHouseNumber(e.target.value.slice(0, 8))} placeholder="z. B. 3a" className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" /></div>
      <div className="relative"><label className="text-sm font-semibold text-slate-300">Aktueller Anbieter</label><input value={provider} onChange={e => { setProvider(e.target.value); setShowProviders(true); }} onFocus={() => setShowProviders(true)} placeholder="Anbieter suchen" className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" />{showProviders && providerMatches.length > 0 && <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-white/10 bg-[#081725] shadow-2xl">{providerMatches.map(item => <button key={item} type="button" onClick={() => { setProvider(item); setShowProviders(false); }} className="block w-full px-4 py-3 text-left text-sm text-slate-200 hover:bg-white/10">{item}</button>)}</div>}</div>
    </div>
    <div className="grid gap-4 sm:grid-cols-3"><button type="button" onClick={() => setCustomerType("private")} className={`rounded-xl border px-4 py-3 text-sm font-semibold ${customerType === "private" ? "border-[#19b7ff] bg-[#19b7ff]/10 text-[#66d5ff]" : "border-white/10 text-slate-400"}`}>Privathaushalt</button><button type="button" onClick={() => setCustomerType("business")} className={`rounded-xl border px-4 py-3 text-sm font-semibold ${customerType === "business" ? "border-[#19b7ff] bg-[#19b7ff]/10 text-[#66d5ff]" : "border-white/10 text-slate-400"}`}>Gewerbe</button><select value={tariffType} onChange={e => setTariffType(e.target.value as "strom" | "gas" | "both")} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"><option value="both">Strom + Gas</option><option value="strom">Nur Strom</option><option value="gas">Nur Gas</option></select></div>
    <div className="grid gap-6 md:grid-cols-2">{(tariffType === "strom" || tariffType === "both") && <div><label className="text-sm font-semibold text-slate-300">Stromverbrauch pro Jahr</label><div className="mt-3 flex items-center gap-3"><input type="range" min="500" max="15000" step="100" value={electricity} onChange={e => setElectricity(Number(e.target.value))} className="w-full accent-[#19b7ff]"/><span className="w-24 text-right font-bold">{electricity.toLocaleString("de-DE")} kWh</span></div></div>}{(tariffType === "gas" || tariffType === "both") && <div><label className="text-sm font-semibold text-slate-300">Gasverbrauch pro Jahr</label><div className="mt-3 flex items-center gap-3"><input type="range" min="0" max="40000" step="500" value={gas} onChange={e => setGas(Number(e.target.value))} className="w-full accent-[#19b7ff]"/><span className="w-24 text-right font-bold">{gas.toLocaleString("de-DE")} kWh</span></div></div>}</div>
    <div className="rounded-2xl border border-[#19b7ff]/20 bg-[#19b7ff]/5 p-5"><p className="text-sm text-slate-400">Mögliche jährliche Ersparnis</p><p className="mt-1 text-3xl font-black text-[#66d5ff]">bis zu {estimatedSavings.toLocaleString("de-DE")} €</p></div>
    <Link href={`/kontakt?${params.toString()}`} className="block w-full rounded-full bg-[#19b7ff] px-7 py-4 text-center font-bold text-[#03101c]">Tarife prüfen</Link>
  </div>;
}
