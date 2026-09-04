"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const OPENPLZ_API = "https://openplzapi.org/de";
const NOMINATIM_API = "https://nominatim.openstreetmap.org";
type Locality = { name?: string; municipality?: { name?: string } };
type NominatimResult = { address?: { city?: string; town?: string; village?: string; municipality?: string } };

export default function HeroAddressCheck() {
  const [plz, setPlz] = useState(""); const [cities, setCities] = useState<string[]>([]); const [city, setCity] = useState(""); const [street, setStreet] = useState(""); const [streetSuggestions, setStreetSuggestions] = useState<string[]>([]); const [loadingCities, setLoadingCities] = useState(false); const [loadingStreets, setLoadingStreets] = useState(false); const [showCities, setShowCities] = useState(false); const [showStreets, setShowStreets] = useState(false);

  useEffect(() => {
    if (!/^\d{5}$/.test(plz)) { setCities([]); setCity(""); setStreet(""); setStreetSuggestions([]); setShowCities(false); return; }
    const controller = new AbortController(); setLoadingCities(true);
    (async () => {
      try {
        const response = await fetch(`${OPENPLZ_API}/Localities?postalCode=${plz}&page=1&pageSize=50`, { signal: controller.signal, cache: "no-store", headers: { Accept: "application/json" } });
        if (!response.ok) throw new Error();
        const data = await response.json() as Locality[];
        const unique = Array.from(new Set(data.map(x => (x.name || x.municipality?.name || "").trim()).filter(Boolean)));
        setCities(unique);
        setCity(prev => unique.includes(prev) ? prev : unique.length === 1 ? unique[0] : "");
        setStreet(prev => unique.length === 1 && city === unique[0] ? prev : "");
        setShowCities(unique.length > 1);
      } catch {
        try {
          const params = new URLSearchParams({ postalcode: plz, country: "Germany", format: "jsonv2", addressdetails: "1", limit: "50" });
          const response = await fetch(`${NOMINATIM_API}/search?${params}`, { signal: controller.signal, cache: "no-store", headers: { Accept: "application/json" } }); if (!response.ok) throw new Error();
          const data = await response.json() as NominatimResult[];
          const unique = Array.from(new Set(data.map(x => { const a = x.address || {}; return a.city || a.town || a.village || a.municipality || ""; }).filter(Boolean)));
          setCities(unique); setCity(prev => unique.includes(prev) ? prev : unique.length === 1 ? unique[0] : ""); setShowCities(unique.length > 1);
        } catch { setCities([]); setShowCities(false); }
      } finally { setLoadingCities(false); }
    })();
    return () => controller.abort();
  }, [plz]);

  useEffect(() => {
    if (!/^\d{5}$/.test(plz) || !city || street.trim().length < 2) { setStreetSuggestions([]); setLoadingStreets(false); return; }
    const controller = new AbortController(); const timer = window.setTimeout(async () => {
      setLoadingStreets(true);
      try { const params = new URLSearchParams({ street: street.trim(), city, postalcode: plz, countrycodes: "de", format: "jsonv2", addressdetails: "1", limit: "10" }); const response = await fetch(`${NOMINATIM_API}/search?${params}`, { signal: controller.signal, cache: "no-store", headers: { Accept: "application/json" } }); if (!response.ok) throw new Error(); const data = await response.json() as NominatimResult[]; setStreetSuggestions(Array.from(new Set(data.map(x => x.address?.road || "").filter(Boolean))).slice(0, 8)); } catch { setStreetSuggestions([]); } finally { setLoadingStreets(false); }
    }, 250); return () => { controller.abort(); window.clearTimeout(timer); };
  }, [plz, city, street]);

  const ready = /^\d{5}$/.test(plz) && !!city && !!street.trim();
  const href = useMemo(() => `/ersparnisrechner?plz=${encodeURIComponent(plz)}&ort=${encodeURIComponent(city)}&strasse=${encodeURIComponent(street)}`, [plz, city, street]);
  return <div className="mt-9 max-w-xl rounded-[1.6rem] border border-[#19b7ff]/25 bg-[#06111dcc] p-5 shadow-2xl shadow-black/30 backdrop-blur-xl">
    <div className="mb-4"><p className="text-sm font-bold text-white">Tarif kostenlos prüfen</p><p className="mt-1 text-xs text-slate-400">Nur einmal Adresse eingeben. Wir übernehmen sie im weiteren Verlauf.</p></div>
    <div className="grid gap-3 sm:grid-cols-2">
      <div><label className="text-xs font-semibold uppercase tracking-wide text-slate-400">PLZ</label><input value={plz} onChange={e => setPlz(e.target.value.replace(/\D/g, "").slice(0, 5))} inputMode="numeric" maxLength={5} placeholder="55278" className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white outline-none transition focus:border-[#19b7ff]" />{loadingCities && <p className="mt-1.5 text-xs text-[#66d5ff]">Ort wird gesucht …</p>}{showCities && cities.length > 1 && <div className="mt-1.5 overflow-hidden rounded-xl border border-[#19b7ff]/30 bg-[#081725]">{cities.map(item => <button key={item} type="button" onClick={() => { setCity(item); setShowCities(false); setStreet(""); }} className="block w-full border-b border-white/5 px-4 py-2.5 text-left text-sm text-slate-200 last:border-0 hover:bg-[#19b7ff]/10">{item}</button>)}</div>}{city && !showCities && <p className="mt-1.5 text-xs text-[#66d5ff]">✓ {city}</p>}</div>
      <div className="relative"><label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Straße</label><input value={street} disabled={!city} onChange={e => { setStreet(e.target.value); setShowStreets(true); }} onFocus={() => setShowStreets(true)} placeholder={city ? "z. B. Hauptstraße" : "Erst PLZ eingeben"} className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white outline-none transition focus:border-[#19b7ff] disabled:opacity-40" />{showStreets && city && street.length >= 2 && (streetSuggestions.length > 0 || loadingStreets) && <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-white/10 bg-[#081725] shadow-2xl">{loadingStreets ? <div className="px-4 py-3 text-xs text-slate-400">Straßen werden gesucht …</div> : streetSuggestions.map(item => <button key={item} type="button" onClick={() => { setStreet(item); setShowStreets(false); }} className="block w-full px-4 py-2.5 text-left text-sm text-slate-200 hover:bg-[#19b7ff]/10">{item}</button>)}</div>}</div>
    </div>
    <Link href={ready ? href : "/ersparnisrechner"} className={`mt-4 block rounded-xl px-5 py-3.5 text-center font-bold transition ${ready ? "bg-[#19b7ff] text-[#03101c] hover:bg-white" : "bg-white/10 text-slate-400 hover:bg-white/15 hover:text-white"}`}>Tarife vergleichen →</Link>
  </div>;
}
