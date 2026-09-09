import type { BillAnalysisResult as Analysis } from "@/lib/bill-analysis-v3";
import { BillRecipient } from "@/components/BillRecipient";

type NamedAnalysis = Analysis & { firstName?: { value: string | null }; lastName?: { value: string | null } };

type Props = { analysis: NamedAnalysis; onSubmitted?: () => void };

function formatValue(key: keyof Analysis, value: string | number | null) {
  if (value == null) return null;
  if (key === "annualConsumptionKwh") return `${Number(value).toLocaleString("de-DE")} kWh`;
  if (key === "workPriceCtPerKwh") return `${Number(value).toFixed(2).replace(".", ",")} ct/kWh`;
  if (key === "basePriceEurPerYear") return `${Number(value).toFixed(2).replace(".", ",")} € / Jahr`;
  return String(value);
}

export function BillAnalysisResult({ analysis, onSubmitted }: Props) {
  const cards = [
    { key: "annualConsumptionKwh" as const, label: "Verbrauch", value: formatValue("annualConsumptionKwh", analysis.annualConsumptionKwh.value), large: true },
    { key: "workPriceCtPerKwh" as const, label: "Arbeitspreis", value: formatValue("workPriceCtPerKwh", analysis.workPriceCtPerKwh.value), large: true },
    { key: "basePriceEurPerYear" as const, label: "Grundpreis", value: formatValue("basePriceEurPerYear", analysis.basePriceEurPerYear.value), large: false },
    { key: "contractEnd" as const, label: "Vertragsende", value: formatValue("contractEnd", analysis.contractEnd.value), large: false },
  ].filter((card) => card.value !== null);

  return (
    <div className="mt-4 overflow-hidden rounded-[30px] border border-[#1b3b58] bg-[#061a2d] shadow-2xl shadow-black/25">
      <div className="border-b border-white/10 px-5 py-4 sm:px-7">
        <span className="text-[11px] font-bold text-emerald-400">✓ Rechnung erfolgreich analysiert</span>
        {analysis.provider.value && <p className="mt-2 text-xs font-semibold uppercase tracking-[.18em] text-slate-500">{String(analysis.provider.value)}</p>}
      </div>
      <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-6">
        {cards.map((card) => (
          <div key={card.key} className="rounded-2xl border border-white/10 bg-white/[.035] p-4 sm:p-5">
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">{card.label}</p>
            <p className={`mt-2 font-black tracking-[-.03em] text-white ${card.large ? "text-3xl sm:text-4xl" : "text-xl sm:text-2xl"}`}>{card.value}</p>
          </div>
        ))}
      </div>
      <div className="mx-4 mb-4 flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[.025] p-3 sm:mx-6 sm:mb-6 sm:p-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-[#19b7ff]/30 bg-[#0b1b30] sm:h-20 sm:w-20">
          <img src="/cpm-energie-website/cristiano.svg" alt="Cristiano Moreira, persönlicher Ansprechpartner von CPM Energie" className="h-full w-full object-cover" loading="lazy" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-white">Digital geprüft. Persönlich erklärt.</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">Wenn du möchtest, schaue ich mir deine Tarifdaten persönlich an und erkläre dir, was du daraus machen kannst.</p>
          <p className="mt-2 text-[11px] font-semibold text-[#66d5ff]">Cristiano · CPM Energie</p>
        </div>
      </div>
      <BillRecipient analysis={analysis} onSubmitted={onSubmitted} />
    </div>
  );
}
