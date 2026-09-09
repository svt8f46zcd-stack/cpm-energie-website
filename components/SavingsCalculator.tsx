"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Energy = "strom" | "gas" | "both";

const BENCHMARKS = { strom: 28, gas: 9.5 };

export function SavingsCalculator() {
  const [energy, setEnergy] = useState<Energy>("strom");
  const [strom, setStrom] = useState(3500);
  const [gas, setGas] = useState(12000);
  const [stromPrice, setStromPrice] = useState(35);
  const [gasPrice, setGasPrice] = useState(12);

  const result = useMemo(() => {
    const stromSavings = energy === "gas" ? 0 : Math.max(0, strom - 0) * Math.max(0, stromPrice - BENCHMARKS.strom) / 100;
    const gasSavings = energy === "strom" ? 0 : Math.max(0, gas - 0) * Math.max(0, gasPrice - BENCHMARKS.gas) / 100;
    const current = (energy === "strom" ? strom * stromPrice / 100 : energy === "gas" ? gas * gasPrice / 100 : strom * stromPrice / 100 + gas * gasPrice / 100);
    const estimated = (energy === "strom" ? strom * BENCHMARKS.strom / 100 : energy === "gas" ? gas * BENCHMARKS.gas / 100 : strom * BENCHMARKS.strom / 100 + gas * BENCHMARKS.gas / 100);
    const savings = Math.max(0, current - estimated);
    return { current, estimated, savings: Math.max(savings, stromSavings + gasSavings) };
  }, [energy, strom, gas, stromPrice, gasPrice]);

  const money = (value: number) => value.toLocaleString("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[#19b7ff]/20 bg-[#19b7ff]/5 p-5">
        <p className="font-bold text-white">Dein mögliches Einsparpotenzial</p>
        <p className="mt-1 text-sm leading-6 text-slate-400">Gib Verbrauch und aktuellen Arbeitspreis ein. Wir rechnen eine grobe Orientierung gegen einen günstigeren Richtwert.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {(["strom", "gas", "both"] as Energy[]).map((value) => (
          <button key={value} type="button" onClick={() => setEnergy(value)} className={`rounded-2xl border p-4 text-left font-bold transition ${energy === value ? "border-[#19b7ff] bg-[#19b7ff]/10 text-white" : "border-white/10 bg-white/[.025] text-slate-300"}`}>
            {value === "strom" ? "⚡ Strom" : value === "gas" ? "🔥 Gas" : "⚡ + 🔥 Strom + Gas"}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {(energy === "strom" || energy === "both") && (
          <div className="rounded-2xl border border-white/10 bg-white/[.025] p-5">
            <p className="font-bold text-white">Strom</p>
            <label className="mt-4 block text-sm text-slate-400">Jahresverbrauch in kWh<input type="number" min="0" step="100" value={strom} onChange={(e) => setStrom(Math.max(0, Number(e.target.value)))} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#19b7ff]" /></label>
            <label className="mt-4 block text-sm text-slate-400">Aktueller Arbeitspreis in ct/kWh<input type="number" min="0" step="0.1" value={stromPrice} onChange={(e) => setStromPrice(Math.max(0, Number(e.target.value)))} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#19b7ff]" /></label>
          </div>
        )}
        {(energy === "gas" || energy === "both") && (
          <div className="rounded-2xl border border-white/10 bg-white/[.025] p-5">
            <p className="font-bold text-white">Gas</p>
            <label className="mt-4 block text-sm text-slate-400">Jahresverbrauch in kWh<input type="number" min="0" step="500" value={gas} onChange={(e) => setGas(Math.max(0, Number(e.target.value)))} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#19b7ff]" /></label>
            <label className="mt-4 block text-sm text-slate-400">Aktueller Arbeitspreis in ct/kWh<input type="number" min="0" step="0.1" value={gasPrice} onChange={(e) => setGasPrice(Math.max(0, Number(e.target.value)))} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#19b7ff]" /></label>
          </div>
        )}
      </div>

      <div className="rounded-[2rem] border border-emerald-400/20 bg-emerald-400/5 p-6">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-300">Grobe Orientierung</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div><p className="text-xs text-slate-500">Aktuelle Energiekosten</p><p className="mt-1 text-2xl font-black text-white">{money(result.current)}</p></div>
          <div><p className="text-xs text-slate-500">Richtwert</p><p className="mt-1 text-2xl font-black text-white">{money(result.estimated)}</p></div>
          <div><p className="text-xs text-slate-500">Mögliches Potenzial</p><p className="mt-1 text-3xl font-black text-emerald-300">bis ca. {money(result.savings)}</p></div>
        </div>
        <p className="mt-4 text-xs leading-5 text-slate-500">Die Berechnung ist eine Orientierung auf Basis von Arbeitspreisen und berücksichtigt keinen Grundpreis, Boni oder individuelle Vertragsbedingungen. Eine echte Prüfung erfolgt anhand deiner Rechnung.</p>
      </div>

      <Link href="/kontakt/rechnung" className="block w-full rounded-full bg-[#19b7ff] px-6 py-4 text-center font-bold text-[#03101c] transition hover:brightness-110">Rechnung kostenlos prüfen lassen →</Link>
    </div>
  );
}
