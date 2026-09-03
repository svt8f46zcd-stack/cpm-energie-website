"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const PROVIDERS = [
  "E.ON", "EnBW", "Vattenfall", "RheinEnergie", "Mainova", "Stadtwerke München",
  "Yello Strom", "LichtBlick", "Naturstrom", "EWE", "Energieversorgung Mittelrhein", "Sonstiger Anbieter"
];

type AddressResponse = {
  cities?: string[];
  streets?: string[];
};

export function SavingsCalculator() {
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [street, setStreet] = useState("");
  const [streetSuggestions, setStreetSuggestions] = useState<string[]>([]);
  const [houseNumber, setHouseNumber] = useState("");
  const [provider, setProvider] = useState("");
  const [electricity, setElectricity] = useState(3000);
  const [gas, setGas] = useState(0);
  const [customerType, setCustomerType] = useState<"private" | "business">("private");
  const [tariffType, setTariffType] = useState<"strom" | "gas" | "both">("both");
  const [showCities, setShowCities] = useState(false);
  const [showStreets, setShowStreets] = useState(false);
  const [showProviders, setShowProviders] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);

  useEffect(() => {
    if (!/^\d{5}$/.test(postalCode)) {
      setCitySuggestions([]);
      setStreetSuggestions([]);
      setCity("");
      setStreet("");
      return;
    }

    let cancelled = false;
    setAddressLoading(true);
    setCitySuggestions([]);
    setStreetSuggestions([]);
    setCity("");
    setStreet("");

    fetch(`/api/address?postalCode=${postalCode}`, { cache: "force-cache" })
      .then((response) => response.ok ? response.json() as Promise<AddressResponse> : Promise.reject())
      .then((data) => {
        if (cancelled) return;
        const cities = Array.from(new Set(data.cities || []));
        setCitySuggestions(cities);
        if (cities.length === 1) setCity(cities[0]);
        setShowCities(cities.length > 0);
      })
      .catch(() => {
        if (!cancelled) setCitySuggestions([]);
      })
      .finally(() => {
        if (!cancelled) setAddressLoading(false);
      });

    return () => { cancelled = true; };
  }, [postalCode]);

  useEffect(() => {
    if (!/^\d{5}$/.test(postalCode) || !city) {
      setStreetSuggestions([]);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      fetch(`/api/address?postalCode=${encodeURIComponent(postalCode)}&city=${encodeURIComponent(city)}&street=${encodeURIComponent(street)}`, { cache: "force-cache" })
        .then((response) => response.ok ? response.json() as Promise<AddressResponse> : Promise.reject())
        .then((data) => {
          if (!cancelled) setStreetSuggestions(Array.from(new Set(data.streets || [])));
        })
        .catch(() => {
          if (!cancelled) setStreetSuggestions([]);
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [postalCode, city, street]);

  const providerMatches = useMemo(() => {
    const q = provider.toLowerCase().trim();
    if (!q) return PROVIDERS.slice(0, 6);
    return PROVIDERS.filter((item) => item.toLowerCase().includes(q)).slice(0, 6);
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
      } catch {
        // Manual entry remains available.
      } finally {
        setDetecting(false);
      }
    }, () => setDetecting(false), { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
  }

  function selectCity(value: string) {
    setCity(value);
    setShowCities(false);
    setStreet("");
  }

  function selectStreet(value: string) {
    setStreet(value);
    setShowStreets(false);
  }

  const params = new URLSearchParams({
    plz: postalCode,
    ort: city,
    strasse: street,
    hausnummer: houseNumber,
    anbieter: provider,
    strom: String(electricity),
    gas: String(gas),
    kundentyp: customerType,
    tarif: tariffType,
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="relative">
          <label className="text-sm font-semibold text-slate-300">PLZ</label>
          <div className="mt-2 flex gap-2">
            <input
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
              inputMode="numeric"
              maxLength={5}
              placeholder="z. B. 55278"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#19b7ff]"
            />
            <button type="button" onClick={detectLocation} disabled={detecting} aria-label="Standort verwenden" className="rounded-xl border border-[#19b7ff]/30 px-4 text-sm font-semibold text-[#66d5ff] hover:bg-[#19b7ff]/10">
              {detecting ? "…" : "📍"}
            </button>
          </div>
          {addressLoading && <p className="mt-1 text-xs text-slate-500">Ort wird gesucht …</p>}
          {!addressLoading && citySuggestions.length > 1 && showCities && (
            <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-white/10 bg-[#081725] shadow-2xl">
              <p className="border-b border-white/10 px-4 py-2 text-xs text-slate-500">Mehrere Orte gefunden. Bitte auswählen:</p>
              {citySuggestions.map((item) => (
                <button key={item} type="button" onClick={() => selectCity(item)} className="block w-full px-4 py-3 text-left text-sm text-slate-200 hover:bg-white/10">{item}</button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <label className="text-sm font-semibold text-slate-300">Ort</label>
          <input
            value={city}
            onChange={(e) => { setCity(e.target.value); setShowCities(true); }}
            onFocus={() => setShowCities(true)}
            placeholder={citySuggestions.length ? "Ort auswählen" : "wird über PLZ erkannt"}
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#19b7ff]"
          />
          {citySuggestions.length > 0 && showCities && (
            <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-white/10 bg-[#081725] shadow-2xl">
              {citySuggestions.map((item) => <button key={item} type="button" onClick={() => selectCity(item)} className="block w-full px-4 py-3 text-left text-sm text-slate-200 hover:bg-white/10">{item}</button>)}
            </div>
          )}
        </div>

        <div className="relative">
          <label className="text-sm font-semibold text-slate-300">Straße</label>
          <input
            value={street}
            onChange={(e) => { setStreet(e.target.value); setShowStreets(true); }}
            onFocus={() => setShowStreets(true)}
            placeholder={city ? "Straße eingeben" : "Zuerst Ort auswählen"}
            disabled={!city}
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#19b7ff] disabled:cursor-not-allowed disabled:opacity-50"
          />
          {showStreets && streetSuggestions.length > 0 && city && (
            <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-white/10 bg-[#081725] shadow-2xl">
              {streetSuggestions.map((item) => <button key={item} type="button" onClick={() => selectStreet(item)} className="block w-full px-4 py-3 text-left text-sm text-slate-200 hover:bg-white/10">{item}</button>)}
            </div>
          )}
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-300">Hausnummer</label>
          <input value={houseNumber} onChange={(e) => setHouseNumber(e.target.value.slice(0, 8))} placeholder="z. B. 3a" className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#19b7ff]" />
        </div>

        <div className="relative md:col-span-2">
          <label className="text-sm font-semibold text-slate-300">Aktueller Anbieter</label>
          <input value={provider} onChange={(e) => { setProvider(e.target.value); setShowProviders(true); }} onFocus={() => setShowProviders(true)} placeholder="Anbieter suchen" className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#19b7ff]" />
          {showProviders && providerMatches.length > 0 && (
            <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-white/10 bg-[#081725] shadow-2xl">
              {providerMatches.map((item) => <button key={item} type="button" onClick={() => { setProvider(item); setShowProviders(false); }} className="block w-full px-4 py-3 text-left text-sm text-slate-200 hover:bg-white/10">{item}</button>)}
            </div>
          )}
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

      <div className="rounded-2xl bg-white/5 p-6">
        <p className="text-sm text-slate-400">Erste Orientierung zum möglichen Einsparpotenzial</p>
        <p className="mt-1 text-4xl font-black text-[#66d5ff]">ca. {estimatedSavings.toLocaleString("de-DE")} € <span className="text-lg text-slate-400">/ Jahr</span></p>
        <p className="mt-3 text-xs leading-5 text-slate-500">Keine Tarifzusage. Die tatsächliche Ersparnis hängt von Verbrauch, Arbeitspreis, Grundpreis, Boni und verfügbaren Angeboten an Ihrem Standort ab.</p>
      </div>

      <Link href={`/kontakt?${params.toString()}`} className="block rounded-full bg-[#19b7ff] px-6 py-4 text-center font-bold text-[#03101c] hover:bg-white">Jetzt persönlichen Tarifcheck anfragen</Link>
    </div>
  );
}
