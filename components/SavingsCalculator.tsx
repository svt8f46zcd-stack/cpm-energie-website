"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

const CITY_BY_PREFIX: Record<string, string> = {
  "01": "Dresden",
  "04": "Leipzig",
  "10": "Berlin",
  "20": "Hamburg",
  "30": "Hannover",
  "40": "Düsseldorf",
  "50": "Köln",
  "55": "Mainz / Rheinland-Pfalz",
  "60": "Frankfurt am Main",
  "65": "Wiesbaden / Hessen",
  "66": "Saarbrücken / Saarland",
  "68": "Mannheim / Rhein-Neckar",
  "70": "Stuttgart",
  "76": "Karlsruhe",
  "80": "München",
  "90": "Nürnberg",
  "99": "Erfurt / Thüringen",
};

const STREETS: Record<string, string[]> = {
  Berlin: ["Friedrichstraße", "Unter den Linden", "Kurfürstendamm", "Alexanderplatz", "Hauptstraße"],
  Hamburg: ["Mönckebergstraße", "Jungfernstieg", "Steindamm", "Reeperbahn", "Hauptstraße"],
  München: ["Maximilianstraße", "Leopoldstraße", "Sendlinger Straße", "Marienplatz", "Hauptstraße"],
  Köln: ["Hohe Straße", "Schildergasse", "Deutzer Freiheit", "Breite Straße", "Hauptstraße"],
  "Frankfurt am Main": ["Zeil", "Kaiserstraße", "Mainzer Landstraße", "Berger Straße", "Hauptstraße"],
  Mainz: ["Große Bleiche", "Rheinallee", "Ludwigsstraße", "Augustusstraße", "Hauptstraße"],
  Stuttgart: ["Königstraße", "Calwer Straße", "Theodor-Heuss-Straße", "Schlossstraße", "Hauptstraße"],
  Nürnberg: ["Königstraße", "Fürther Straße", "Äußere Bayreuther Straße", "Hauptstraße"],
};

const PROVIDERS = [
  "E.ON", "EnBW", "Vattenfall", "RheinEnergie", "Mainova", "Stadtwerke München",
  "Yello Strom", "LichtBlick", "Naturstrom", "EWE", "Energieversorgung Mittelrhein", "Sonstiger Anbieter"
];

function cityForPostalCode(postalCode: string) {
  if (postalCode.length !== 5) return "";
  return CITY_BY_PREFIX[postalCode.slice(0, 2)] || "Deutschland";
}

function streetSuggestions(city: string, query: string) {
  const key = Object.keys(STREETS).find((name) => city.includes(name));
  const streets = key ? STREETS[key] : ["Hauptstraße", "Bahnhofstraße", "Gartenstraße", "Kirchstraße", "Berliner Straße"];
  const q = query.trim().toLowerCase();
  return (q ? streets.filter((street) => street.toLowerCase().includes(q)) : streets).slice(0, 6);
}

export function SavingsCalculator() {
  const [postalCode, setPostalCode] = useState("");
  const [street, setStreet] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [city, setCity] = useState("");
  const [provider, setProvider] = useState("");
  const [electricity, setElectricity] = useState(3000);
  const [gas, setGas] = useState(0);
  const [customerType, setCustomerType] = useState<"private" | "business">("private");
  const [tariffType, setTariffType] = useState<"strom" | "gas" | "both">("both");
  const [showStreets, setShowStreets] = useState(false);
  const [showProviders, setShowProviders] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const streetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (/^\d{5}$/.test(postalCode)) setCity(cityForPostalCode(postalCode));
    else if (postalCode.length < 5) setCity("");
  }, [postalCode]);

  const streets = useMemo(() => streetSuggestions(city, street), [city, street]);
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
        // Manual address entry remains available.
      } finally {
        setDetecting(false);
      }
    }, () => setDetecting(false), { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
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
        <div>
          <label className="text-sm font-semibold text-slate-300">PLZ</label>
          <div className="mt-2 flex gap-2">
            <input value={postalCode} onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, "").slice(0, 5))} inputMode="numeric" maxLength={5} placeholder="z. B. 55278" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#19b7ff]" />
            <button type="button" onClick={detectLocation} disabled={detecting} className="rounded-xl border border-[#19b7ff]/30 px-4 text-sm font-semibold text-[#66d5ff] hover:bg-[#19b7ff]/10">{detecting ? "…" : "📍"}</button>
          </div>
          {city && <p className="mt-1 text-xs text-slate-500">Erkannt: {city}</p>}
        </div>
        <div ref={streetRef} className="relative">
          <label className="text-sm font-semibold text-slate-300">Straße</label>
          <input value={street} onChange={(e) => { setStreet(e.target.value); setShowStreets(true); }} onFocus={() => setShowStreets(true)} placeholder="Straße eingeben" className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#19b7ff]" />
          {showStreets && streets.length > 0 && street && (
            <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-white/10 bg-[#081725] shadow-2xl">
              {streets.map((item) => <button key={item} type="button" onClick={() => { setStreet(item); setShowStreets(false); }} className="block w-full px-4 py-3 text-left text-sm text-slate-200 hover:bg-white/10">{item}</button>)}
            </div>
          )}
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-300">Hausnummer</label>
          <input value={houseNumber} onChange={(e) => setHouseNumber(e.target.value.slice(0, 8))} placeholder="z. B. 3a" className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#19b7ff]" />
        </div>
        <div className="relative">
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
