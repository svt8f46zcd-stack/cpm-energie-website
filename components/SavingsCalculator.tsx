"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";

const PROVIDERS = ["E.ON", "EnBW", "Vattenfall", "RheinEnergie", "Mainova", "Stadtwerke München", "Yello Strom", "LichtBlick", "Naturstrom", "EWE", "Energieversorgung Mittelrhein", "Sonstiger Anbieter"];

export function SavingsCalculator() {
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [cities, setCities] = useState<string[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [street, setStreet] = useState("");
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
    if (!/^\d{5}$/.test(postalCode)) {
      setCities([]);
      setCity("");
      return;
    }

    let cancelled = false;
    setLoadingCities(true);
    setCity("");
    fetch(`/api/address/postal?plz=${postalCode}`)
      .then((r) => r.ok ? r.json() : { locations: [] })
      .then((data) => {
        if (!cancelled) setCities((data.locations ?? []).map((x: { city: string }) => x.city));
      })
      .catch(() => { if (!cancelled) setCities([]); })
      .finally(() => { if (!cancelled) setLoadingCities(false); });

    return () => { cancelled = true; };
  }, [postalCode]);

  const providerMatches = useMemo(() => {
    const q = provider.toLowerCase().trim();
    return (q ? PROVIDERS.filter((x) => x.toLowerCase().includes(q)) : PROVIDERS).slice(0, 6);
  }, [provider]);

  const estimatedSavings = useMemo(() => {
    const stromSaving = tariffType === "gas" ? 0 : electricity * (customerType === "business" ? 0.06 : 0.08);
    const gasSaving = tariffType === "strom" ? 0 : gas * (customerType === "business" ? 0.035 : 0.045);
    return Math.max(0, Math.round(stromSaving + gasSaving));
  }, [electricity, gas, customerType, tariffType]);

  async function detectLocation() {
    if (!navigator.geolocation) return;
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const response = await fetch(`/api/location/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}`, { cache: "no-store" });
        if (!response.ok) throw new Error("location");
        const data = await response.json();
        setPostalCode(data.postalCode || "");
        setCity(data.city || "");
        setStreet(data.street || "");
        setHouseNumber(data.houseNumber || "");
      } finally { setDetecting(false); }
    }, () => setDetecting(false), { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
  }

  const params = new URLSearchParams({ plz: postalCode, ort: city, strasse: street, hausnummer: houseNumber, anbieter: provider, strom: String(electricity), gas: String(gas), kundentyp: customerType, tarif: tariffType });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-semibold text-slate-300">PLZ</label>
          <div className="mt-2 flex gap-2">
            <input value={postalCode} onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, "").slice(0, 5))} inputMode="numeric" maxLength={5} placeholder="z. B. 55278" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#19b7ff]" />
            <button type="button" onClick={detectLocation} disabled={detecting} className="rounded-xl border border-[#19b7ff]/30 px-4 text-sm font-semibold text-[#66d5ff] hover:bg-[#19b7ff]/10">{detecting ? "…" : "📍"}</button>
          </div>
          {loadingCities && <p className="mt-2 text-xs text-slate-500">Ort wird gesucht …</p>}
          {!loadingCities && cities.length > 0 && !city && (
            <div className="mt-2 overflow-hidden rounded-xl border border-[#19b7ff]/30 bg-[#081725] shadow-xl">
              {cities.map((item) => <button key={item} type="button" onClick={() => setCity(item)} className="block w-full px-4 py-3 text-left text-sm text-slate-200 hover:bg-[#19b7ff]/10">{item}</button>)}
            </div>
          )}
          {city && <p className="mt-2 text-sm text-[#66d5ff]">Ort: <strong>{city}</strong></p>}
          {!loadingCities && /^\d{5}$/.test(postalCode) && cities.length === 0 && <p className="mt-2 text-xs text-slate-500">Kein Ort automatisch gefunden. Bitte prüfen Sie die PLZ.</p>}
        </div>

        <div className="relative">
          <label className="text-sm font-semibold text-slate-300">Straße</label>
          <input value={street} onChange={(e) => { setStreet(e.target.value); setShowStreets(true); }} onFocus={() => setShowStreets(true)} placeholder={city ? `Straße in ${city}` : "Erst Ort auswählen"} disabled={!city} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#19b7ff] disabled:opacity-40" />
          {showStreets && city && street && <div className="absolute z-20 mt-1 w-full rounded-xl border border-white/10 bg-[#081725] p-4 text-xs text-slate-400">Straßenvervollständigung wird mit der ausgewählten PLZ und dem Ort verbunden.</div>}
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-300">Hausnummer</label>
          <input value={houseNumber} onChange={(e) => setHouseNumber(e.target.value.slice(0, 8))} placeholder="z. B. 3a" className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#19b7ff]" />
        </div>

        <div className="relative">
          <label className="text-sm font-semibold text-slate-300">Aktueller Anbieter</label>
          <input value={provider} onChange={(e) => { setProvider(e.target.value); setShowProviders(true); }} onFocus={() => setShowProviders(true)} placeholder="Anbieter suchen" className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#19b7ff]" />
          {showProviders && providerMatches.length > 0 && <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-white/10 bg-[#081725] shadow-2xl">{providerMatches.map((item) => <button key={item} type="button" onClick={() => { setProvider(item); setShowProviders(false); }} className="block w-full px-4 py-3 text-left text-sm text-slate-200 hover:bg-white/10">{item}</button>)}</div>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <button type="button" onClick={() => setCustomerType("private")} className={`rounded-xl border px-4 py-3 text-sm font-semibold ${customerType === "private" ? "border-[#19b7ff] bg-[#19b7ff]/10 text-[#66d5ff]" : "border-white/10 text-slate-400"}`}>Privathaushalt</button>
        <button type="button" onClick={() => setCustomerType("business")} className={`rounded-xl border px-4 py-3 text-sm font-semibold ${customerType === "business" ? "border-[#19b7ff] bg-[#19b7ff]/10 text-[#66d5ff]" : "border-white/10 text-slate-400"}`}>Gewerbe</button>
        <select value={tariffType} onChange={(e) => setTariffType(e.target.value as "strom" | "gas" | "both")} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"><option value="both">Strom + Gas</option><option value="strom">Nur Strom</option><option value="gas">Nur Gas</option></select>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {(tariffType === "strom" || tariffType === "both") && <div><label className="text-sm font-semibold text-slate-300">Stromverbrauch pro Jahr</label><div className="mt-3 flex items-center gap-3"><input type="range" min="500" max="15000" step="100" value={electricity} onChange={(e) => setElectricity(Number(e.target.value))} className="w-full accent-[#19b7ff]"/><span className="w-24 text-right font-bold">{electricity.toLocaleString("de-DE")} kWh</span></div></div>}
        {(tariffType === "gas" || tariffType === "both") && <div><label className="text-sm font-semibold text-slate-300">Gasverbrauch pro Jahr</label><div className="mt-3 flex items-center gap-3"><input type="range" min="0" max="40000" step="500" value={gas} onChange={(e) => setGas(Number(e.target.value))} className="w-full accent-[#19b7ff]"/><span className="w-24 text-right font-bold">{gas.toLocaleString("de-DE")} kWh</span></div></div>}
      </div>

      <div className="rounded-2xl bg-white/5 p-6"><p className="text-sm text-slate-400">Erste Orientierung zum möglichen Einsparpotenzial</p><p className="mt-1 text-4xl font-black text-[#66d5ff]">ca. {estimatedSavings.toLocaleString("de-DE")} € <span className="text-lg text-slate-400">/ Jahr</span></p><p className="mt-3 text-xs leading-5 text-slate-500">Keine Tarifzusage. Die tatsächliche Ersparnis hängt von Verbrauch, Arbeitspreis, Grundpreis, Boni und verfügbaren Angeboten an Ihrem Standort ab.</p></div>
      <Link href={`/kontakt?${params.toString()}`} className="block rounded-full bg-[#19b7ff] px-6 py-4 text-center font-bold text-[#03101c] hover:bg-white">Jetzt persönlichen Tarifcheck anfragen</Link>
    </div>
  );
}
