"use client";

import { useMemo, useState } from "react";
import tariffs from "@/data/tariffs-live.json";

type Energy = "strom" | "gas" | "both";
type Offer = {
  id: string;
  providerId?: string;
  provider: string;
  tariffName: string;
  energyType: string;
  availability?: string;
  postalCodes?: string[];
  sourceLabel: string;
  basePriceYear: number;
  workPriceCt: number;
  firstYearPrice?: number;
  monthlyBasePrice?: number;
  bonus?: number;
  minimumContractMonths?: number;
  cancellationPeriodWeeks?: number;
  priceGuaranteeUntil?: string | null;
  networkFeesIncluded?: boolean;
  paymentCount?: number;
  digitalSignature?: boolean;
};

const euro = (value: number) => value.toLocaleString("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const euro2 = (value: number) => value.toLocaleString("de-DE", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const cents = (value: number) => `${value.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 3 })} ct/kWh`;

function annualEnergyCost(offer: Offer, consumption: number) {
  return offer.basePriceYear + (offer.workPriceCt * consumption) / 100;
}

function annualComparableCost(offer: Offer, consumption: number) {
  if (typeof offer.firstYearPrice === "number") return offer.firstYearPrice;
  return annualEnergyCost(offer, consumption) - (offer.bonus || 0);
}

function availableForZip(offer: Offer, zip: string) {
  if (offer.availability === "nationwide_verified") return true;
  if (offer.availability === "postal_codes" && Array.isArray(offer.postalCodes)) return offer.postalCodes.includes(zip);
  return true;
}

export function AutomatedTariffCalculator() {
  const [energy, setEnergy] = useState<Energy>("strom");
  const [zip, setZip] = useState("55116");
  const [strom, setStrom] = useState(3500);
  const [gas, setGas] = useState(12000);

  const results = useMemo(() => {
    const normalizedZip = zip.replace(/\D/g, "").slice(0, 5);
    const selected = energy === "both" ? ["strom", "gas"] : [energy];
    const offers = tariffs.offers as unknown as Offer[];
    return selected.flatMap((kind) => offers
      .filter((offer) => offer.energyType === kind)
      .filter((offer) => availableForZip(offer, normalizedZip))
      .map((offer) => ({
        ...offer,
        annualEnergyCost: annualEnergyCost(offer, kind === "strom" ? strom : gas),
        comparableCost: annualComparableCost(offer, kind === "strom" ? strom : gas),
      }))
      .sort((a, b) => a.comparableCost - b.comparableCost));
  }, [energy, zip, strom, gas]);

  const hasData = results.length > 0;
  const selectedConsumption = energy === "gas" ? gas : strom;
  const selectedKinds = energy === "both" ? "Strom und Gas" : energy === "strom" ? "Strom" : "Gas";

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        {(["strom", "gas", "both"] as Energy[]).map((value) => (
          <button key={value} type="button" onClick={() => setEnergy(value)} className={`rounded-2xl border p-4 text-left font-bold transition ${energy === value ? "border-[#19b7ff] bg-[#19b7ff]/10 text-white" : "border-white/10 bg-white/[.025] text-slate-300 hover:border-white/20"}`}>
            {value === "strom" ? "⚡ Strom" : value === "gas" ? "🔥 Gas" : "⚡ + 🔥 Beides"}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="rounded-2xl border border-white/10 bg-white/[.025] p-5 text-sm text-slate-400">PLZ
          <input inputMode="numeric" maxLength={5} value={zip} onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#19b7ff]" />
        </label>
        {(energy === "strom" || energy === "both") && <label className="rounded-2xl border border-white/10 bg-white/[.025] p-5 text-sm text-slate-400">Strom kWh/Jahr
          <input type="number" min={1} step={100} value={strom} onChange={(e) => setStrom(Math.max(1, Number(e.target.value)))} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#19b7ff]" />
        </label>}
        {(energy === "gas" || energy === "both") && <label className="rounded-2xl border border-white/10 bg-white/[.025] p-5 text-sm text-slate-400">Gas kWh/Jahr
          <input type="number" min={1} step={500} value={gas} onChange={(e) => setGas(Math.max(1, Number(e.target.value)))} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#19b7ff]" />
        </label>}
      </div>

      <div className="rounded-2xl border border-amber-300/20 bg-amber-300/5 p-4 text-sm leading-6 text-amber-100">
        <strong>Unverbindliche Beispielrechnung:</strong> Die Sortierung folgt dem Preis im 1. Jahr, sofern die Datenquelle diesen liefert. Zusätzlich werden Arbeitspreis, Grundpreis, Bonus und Vertragsmerkmale angezeigt. Ohne echte PLZ Verfügbarkeitsprüfung wird kein Angebot als verbindlich verfügbar dargestellt.
      </div>

      {!hasData ? (
        <div className="rounded-3xl border border-white/10 bg-white/[.025] p-8 text-center">
          <p className="text-lg font-black text-white">Tarifvergleich ist noch im Aufbau</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">Aktuell sind noch nicht mindestens zwei Anbieter mit validierten Live Preisen im automatischen Datensatz. Deshalb werden keine Beispielwerte erfunden oder als Live Angebote ausgegeben.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#19b7ff]">Automatischer Tarifvergleich</p><h3 className="mt-1 text-2xl font-black text-white">Preisindikation für {selectedKinds}</h3></div><span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">{results.length} Angebote</span></div>
          {results.slice(0, 10).map((offer, index) => {
            const partner = offer.providerId === "vattenfall" || offer.providerId === "lichtblick";
            const firstYear = typeof offer.firstYearPrice === "number" ? offer.firstYearPrice : offer.annualEnergyCost;
            const monthly = typeof offer.monthlyBasePrice === "number" ? offer.monthlyBasePrice : offer.basePriceYear / 12;
            return <div key={offer.id} className={`rounded-2xl border p-5 ${partner ? "border-[#19b7ff]/40 bg-[#19b7ff]/5" : "border-white/10 bg-white/[.025]"}`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-bold text-slate-500">#{index + 1}</span><span className="font-black text-white">{offer.provider}</span>{partner && <span className="rounded-full bg-[#19b7ff]/15 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-[#66d5ff]">Unser Partner</span>}</div><p className="mt-1 text-sm text-slate-300">{offer.tariffName}</p><p className="mt-2 text-xs text-slate-500">Arbeitspreis {cents(offer.workPriceCt)} · Grundpreis {euro2(monthly)}/Monat</p></div>
                <div className="sm:text-right"><p className="text-2xl font-black text-white">{euro(firstYear)}</p><p className="text-xs text-slate-500">Preis im 1. Jahr bei {selectedConsumption.toLocaleString("de-DE")} kWh</p></div>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-xs text-slate-300">
                <span className="rounded-xl bg-white/5 px-3 py-2">Grundpreis/Jahr: <strong>{euro2(offer.basePriceYear)}</strong></span>
                <span className="rounded-xl bg-white/5 px-3 py-2">Bonus: <strong>{euro2(offer.bonus || 0)}</strong></span>
                {offer.minimumContractMonths ? <span className="rounded-xl bg-white/5 px-3 py-2">Mindestlaufzeit: <strong>{offer.minimumContractMonths} Monate</strong></span> : null}
                {offer.paymentCount ? <span className="rounded-xl bg-white/5 px-3 py-2">Abschläge: <strong>{offer.paymentCount}</strong></span> : null}
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-400"><span className="rounded-full bg-white/5 px-2.5 py-1">Quelle: {offer.sourceLabel}</span><span className="rounded-full bg-white/5 px-2.5 py-1">PLZ Verfügbarkeit: nicht live verifiziert</span>{offer.networkFeesIncluded ? <span className="rounded-full bg-white/5 px-2.5 py-1">Netzentgelte berücksichtigt</span> : null}{offer.digitalSignature ? <span className="rounded-full bg-white/5 px-2.5 py-1">Digitale Unterschrift</span> : null}</div>
            </div>;
          })}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <a href="https://wa.me/?text=Hallo%20CPM%20Energie%2C%20ich%20möchte%20meinen%20Strom-%20oder%20Gastarif%20prüfen%20lassen." target="_blank" rel="noreferrer" className="rounded-full bg-[#19b7ff] px-6 py-4 text-center font-bold text-[#03101c] hover:brightness-110">Per WhatsApp prüfen lassen</a>
        <a href="/kontakt/rechnung" className="rounded-full border border-white/15 bg-white/5 px-6 py-4 text-center font-bold text-white hover:bg-white/10">Rechnung über Webformular prüfen</a>
      </div>
      <p className="text-center text-xs leading-5 text-slate-500">Stand: {tariffs.generatedAt ? new Date(tariffs.generatedAt).toLocaleString("de-DE") : "noch kein automatischer Datenlauf"}. Preise können sich ändern. Vertragslaufzeit, Boni, Preisgarantien, Netzgebiet und weitere Bedingungen sind vor einem Wechsel zu prüfen.</p>
    </div>
  );
}
