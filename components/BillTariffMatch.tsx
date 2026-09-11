import type { BillAnalysisResult as Analysis } from "@/lib/bill-analysis-v3";
import tariffs from "@/data/tariffs.json";

type Props = { analysis: Analysis };
type Tariff = (typeof tariffs)[number] & { minConsumptionKwh?: number; maxConsumptionKwh?: number };

const euro = (n: number) => `${n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
const cents = (n: number) => `${n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 3 })} ct/kWh`;

function annualCost(t: Tariff, consumption: number) {
  return t.basePriceYear + consumption * t.workPriceCt / 100;
}

export function BillTariffMatch({ analysis }: Props) {
  const consumption = typeof analysis.annualConsumptionKwh.value === "number" ? analysis.annualConsumptionKwh.value : null;
  const currentWork = typeof analysis.workPriceCtPerKwh.value === "number" ? analysis.workPriceCtPerKwh.value : null;
  const currentBase = typeof analysis.basePriceEurPerYear.value === "number" ? analysis.basePriceEurPerYear.value : null;
  const type = String(analysis.energyType.value || "").toLowerCase();

  if (!consumption || currentWork === null || currentBase === null || !["strom", "gas"].includes(type)) {
    return (
      <div className="mx-4 mb-4 rounded-2xl border border-white/10 bg-white/[.025] p-4 sm:mx-6">
        <p className="text-sm font-bold text-white">Tarifvergleich</p>
        <p className="mt-1 text-xs leading-5 text-slate-400">Für die automatische Berechnung fehlen noch Verbrauch, Energieart, Arbeitspreis oder Grundpreis.</p>
      </div>
    );
  }

  const currentAnnual = currentBase + consumption * currentWork / 100;
  const matches = (tariffs as Tariff[])
    .filter(t => t.energyType === type)
    .filter(t => consumption >= (t.minConsumptionKwh ?? 0) && consumption <= (t.maxConsumptionKwh ?? Number.POSITIVE_INFINITY))
    .map(t => ({ ...t, annual: annualCost(t, consumption) }))
    .sort((a, b) => a.annual - b.annual);

  if (!matches.length) return null;

  const best = matches[0];
  const saving = Math.max(0, currentAnnual - best.annual);

  return (
    <div className="mx-4 mb-4 overflow-hidden rounded-2xl border border-[#19b7ff]/25 bg-gradient-to-br from-[#0a2840] to-[#071b2d] sm:mx-6">
      <div className="border-b border-white/10 px-4 py-4 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#66d5ff]">Automatischer Tarifvergleich</p>
            <h3 className="mt-1 text-lg font-black text-white">Günstigster hinterlegter Tarif</h3>
          </div>
          <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold text-emerald-300">Top 1</span>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-[1.3fr_.7fr]">
          <div className="rounded-xl border border-white/10 bg-white/[.035] p-4">
            <p className="text-xs font-semibold text-slate-400">{best.provider}</p>
            <p className="mt-1 text-base font-black text-white">{best.tariffName}</p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-300">
              <span>AP {cents(best.workPriceCt)}</span>
              <span>GP {euro(best.basePriceYear)} / Jahr</span>
            </div>
          </div>
          <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[.07] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[.14em] text-emerald-300">Mögliche Ersparnis</p>
            <p className="mt-1 text-2xl font-black text-white">{saving > 0 ? euro(saving) : "0,00 €"}</p>
            <p className="mt-1 text-[10px] text-slate-400">pro Jahr gegenüber deiner Rechnung</p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between rounded-xl bg-black/15 px-3 py-2.5 text-xs">
          <span className="text-slate-400">Deine berechneten Jahreskosten</span>
          <span className="font-bold text-white">{euro(currentAnnual)}</span>
        </div>
        <div className="mt-3 flex items-center justify-between rounded-xl bg-black/15 px-3 py-2.5 text-xs">
          <span className="text-slate-400">{best.tariffName}</span>
          <span className="font-bold text-[#8ce4ff]">{euro(best.annual)} / Jahr</span>
        </div>

        {matches.length > 1 && (
          <div className="mt-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">Weitere hinterlegte Tarife</p>
            <div className="space-y-2">
              {matches.slice(1, 3).map((t, i) => (
                <div key={t.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[.025] px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-white">{i + 2}. {t.provider} · {t.tariffName}</p>
                    <p className="mt-0.5 text-[10px] text-slate-500">AP {cents(t.workPriceCt)} · GP {euro(t.basePriceYear)}</p>
                  </div>
                  <span className="shrink-0 text-xs font-bold text-slate-200">{euro(t.annual)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="mt-4 text-[10px] leading-4 text-slate-500">Hinweis: Das Ergebnis basiert auf den aktuell hinterlegten öffentlichen Referenztarifen. Die konkrete Verfügbarkeit an der Lieferadresse muss vor einem Wechsel bestätigt werden.</p>
      </div>
    </div>
  );
}
