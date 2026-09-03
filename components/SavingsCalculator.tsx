"use client";

import { useMemo, useState } from "react";

export function SavingsCalculator() {
  const [electricity, setElectricity] = useState(3000);
  const [gas, setGas] = useState(0);
  const savings = useMemo(() => Math.round(electricity * 0.08 + gas * 0.045), [electricity, gas]);
  return <div className="glass rounded-[2rem] p-6 md:p-9">
    <div className="grid gap-8 md:grid-cols-2">
      <div>
        <label className="text-sm font-semibold text-slate-300">Stromverbrauch pro Jahr</label>
        <div className="mt-3 flex items-center gap-3"><input type="range" min="500" max="10000" step="100" value={electricity} onChange={e=>setElectricity(Number(e.target.value))} className="w-full accent-[#19b7ff]"/><span className="w-24 text-right font-bold">{electricity.toLocaleString("de-DE")} kWh</span></div>
      </div>
      <div>
        <label className="text-sm font-semibold text-slate-300">Gasverbrauch pro Jahr <span className="text-slate-500">optional</span></label>
        <div className="mt-3 flex items-center gap-3"><input type="range" min="0" max="30000" step="500" value={gas} onChange={e=>setGas(Number(e.target.value))} className="w-full accent-[#19b7ff]"/><span className="w-24 text-right font-bold">{gas.toLocaleString("de-DE")} kWh</span></div>
      </div>
    </div>
    <div className="mt-9 rounded-2xl bg-white/5 p-6"><p className="text-sm text-slate-400">Mögliches Einsparpotenzial*</p><p className="mt-1 text-4xl font-black text-[#66d5ff]">ca. {savings.toLocaleString("de-DE")} € <span className="text-lg text-slate-400">/ Jahr</span></p><p className="mt-3 text-xs leading-5 text-slate-500">*Nur eine grobe Orientierung. Das tatsächliche Potenzial hängt unter anderem von Arbeitspreis, Grundpreis, Verbrauch und aktuellen Angeboten ab.</p></div>
  </div>;
}
