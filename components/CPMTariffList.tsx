"use client";

import { useMemo, useState } from "react";
import tariffs from "@/data/tariffs.json";

type EnergyType = "strom" | "gas";
type Tariff = (typeof tariffs)[number];

function parseNumber(value: string) {
  const normalized = value.replace(/\./g, "").replace(",", ".").trim();
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function formatEuro(value: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function annualCost(tariff: Tariff, consumption: number) {
  return tariff.basePriceYear + tariff.workPriceCt * consumption / 100;
}

export function CPMTariffList() {
  const [type, setType] = useState<EnergyType>("strom");
  const [consumption, setConsumption] = useState("3500");

  const kwh = parseNumber(consumption) ?? 0;

  const visibleTariffs = useMemo(() => {
    return tariffs
      .filter((tariff) => tariff.energyType === type)
      .map((tariff) => ({ ...tariff, annualCost: annualCost(tariff, kwh) }))
      .sort((a, b) => a.annualCost - b.annualCost);
  }, [type, kwh]);

  return (
    <section className="cpm-section cpm-section-dark" id="tarifvergleich" aria-labelledby="cpm-tariff-list-heading">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <p className="cpm-eyebrow">Öffentliche Tarifdaten</p>
          <h2 id="cpm-tariff-list-heading" className="cpm-section-title">Tarife nachvollziehbar vergleichen.</h2>
          <p className="cpm-section-copy mx-auto">
            Hier zeigen wir öffentlich veröffentlichte Tarifdaten mit Arbeitspreis und Grundpreis. Die Werte werden auf deinen Jahresverbrauch umgerechnet.
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-5xl rounded-[2rem] border border-white/10 bg-[#0b1b30]/80 p-5 shadow-2xl shadow-black/20 sm:p-7">
          <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div>
              <span className="mb-2 block text-sm font-bold text-white">Energieart</span>
              <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-black/10 p-1">
                <button type="button" onClick={() => setType("strom")} aria-pressed={type === "strom"} className={`rounded-lg px-4 py-2.5 text-sm font-extrabold transition ${type === "strom" ? "bg-[#19b7ff] text-[#02111d]" : "text-slate-300 hover:bg-white/5"}`}>Strom</button>
                <button type="button" onClick={() => setType("gas")} aria-pressed={type === "gas"} className={`rounded-lg px-4 py-2.5 text-sm font-extrabold transition ${type === "gas" ? "bg-[#19b7ff] text-[#02111d]" : "text-slate-300 hover:bg-white/5"}`}>Gas</button>
              </div>
            </div>
            <label>
              <span className="mb-2 block text-sm font-bold text-white">Jahresverbrauch</span>
              <div className="relative">
                <input value={consumption} onChange={(e) => setConsumption(e.target.value.replace(/[^0-9.,]/g, ""))} inputMode="decimal" className="w-full rounded-xl border border-white/10 bg-[#06101f] px-4 py-3 text-white outline-none focus:border-cyan-400/60" />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">kWh/Jahr</span>
              </div>
            </label>
            <div className="rounded-xl border border-cyan-400/15 bg-cyan-400/[.045] px-4 py-3 text-sm text-slate-300">
              <span className="block text-xs font-bold uppercase tracking-wider text-cyan-300">Berechnung</span>
              <strong className="mt-1 block text-white">Grundpreis + Verbrauchspreis</strong>
            </div>
          </div>

          <div className="mt-7 overflow-hidden rounded-2xl border border-white/10">
            <div className="hidden grid-cols-[1.5fr_.8fr_.8fr_1fr] gap-4 bg-white/[.04] px-5 py-3 text-xs font-black uppercase tracking-wider text-slate-500 md:grid">
              <span>Anbieter / Tarif</span><span>Arbeitspreis</span><span>Grundpreis</span><span>Jahreskosten</span>
            </div>
            {visibleTariffs.map((tariff) => (
              <article key={tariff.id} className="grid gap-4 border-t border-white/8 px-5 py-5 first:border-t-0 md:grid-cols-[1.5fr_.8fr_.8fr_1fr] md:items-center">
                <div>
                  <strong className="block text-base text-white">{tariff.provider}</strong>
                  <span className="mt-1 block text-sm text-slate-400">{tariff.tariffName}</span>
                  <span className="mt-2 inline-block rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-bold text-slate-500">Stand {new Intl.DateTimeFormat("de-DE").format(new Date(tariff.validFrom))}</span>
                </div>
                <div><span className="block text-xs text-slate-500 md:hidden">Arbeitspreis</span><strong className="text-white">{tariff.workPriceCt.toLocaleString("de-DE", { maximumFractionDigits: 3 })} ct/kWh</strong></div>
                <div><span className="block text-xs text-slate-500 md:hidden">Grundpreis</span><strong className="text-white">{formatEuro(tariff.basePriceYear)} / Jahr</strong></div>
                <div><span className="block text-xs text-slate-500 md:hidden">Jahreskosten bei {kwh.toLocaleString("de-DE")} kWh</span><strong className="text-xl font-black text-cyan-200">{formatEuro(tariff.annualCost)}</strong></div>
              </article>
            ))}
          </div>

          <div className="mt-5 grid gap-3 text-xs leading-5 text-slate-500 sm:grid-cols-2">
            <p>Die Liste enthält derzeit öffentlich veröffentlichte Referenztarife. Sie ist kein vollständiger Marktvergleich und ersetzt keine Verfügbarkeitsprüfung für die konkrete Adresse.</p>
            <p>Quelle und Gültigkeit werden pro Tarif gespeichert. Weitere Anbieter können später ohne Änderung der Berechnungslogik ergänzt werden.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
