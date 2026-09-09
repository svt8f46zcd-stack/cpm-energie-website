import type { BillAnalysisResult as Analysis } from "@/lib/bill-analysis-v3";
import { BillRecipient } from "@/components/BillRecipient";

type NamedAnalysis = Analysis & { firstName?: { value: string | null }; lastName?: { value: string | null } };
type Card = { key: keyof Analysis; label: string; value: string };

const LABELS: Array<[keyof Analysis, string]> = [
  ["energyType", "Energieart"],
  ["provider", "Anbieter"],
  ["tariffName", "Tarif"],
  ["annualConsumptionKwh", "Jahresverbrauch"],
  ["workPriceCtPerKwh", "Arbeitspreis"],
  ["basePriceEurPerYear", "Grundpreis"],
  ["monthlyPaymentEur", "Monatlicher Abschlag"],
  ["billingPeriod", "Abrechnungszeitraum"],
  ["contractEnd", "Vertragsende"],
  ["cancellationPeriod", "Kündigungsfrist"],
  ["address", "Verbrauchsstelle"],
];

function displayValue(key: keyof Analysis, value: string | number | null) {
  if (value === null) return "Nicht erkannt";
  if (key === "workPriceCtPerKwh") return `${Number(value).toFixed(2).replace(".", ",")} ct/kWh`;
  if (key === "basePriceEurPerYear") return `${Number(value).toFixed(2).replace(".", ",")} €/Jahr`;
  if (key === "monthlyPaymentEur") return `${Number(value).toFixed(2).replace(".", ",")} €`;
  if (key === "annualConsumptionKwh") return `${Number(value).toLocaleString("de-DE")} kWh`;
  return String(value);
}

export function BillAnalysisResult({ analysis, onContinue }: { analysis: NamedAnalysis; onContinue?: () => void }) {
  const cards: Card[] = LABELS.map(([key, label]) => ({ key, label, value: displayValue(key, analysis[key].value) }));
  const priceCards = cards.filter(({ key }) => key === "workPriceCtPerKwh" || key === "basePriceEurPerYear");
  const detailCards = cards.filter(({ key }) => key !== "workPriceCtPerKwh" && key !== "basePriceEurPerYear");

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-[#08131f]">
      <div className="border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-slate-500">Ergebnis</p>
            <p className="mt-0.5 text-base font-bold text-white">Rechnung erfolgreich erkannt</p>
          </div>
          <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">Automatisch</span>
        </div>
      </div>

      <div className="grid grid-cols-1 divide-y divide-white/10 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        {priceCards.map((card) => <div key={String(card.key)} className="px-4 py-4"><p className="text-[10px] font-semibold uppercase tracking-[.15em] text-slate-500">{card.label}</p><p className="mt-1 text-xl font-bold text-white">{card.value}</p></div>)}
      </div>

      <div className="grid grid-cols-1 border-t border-white/10 sm:grid-cols-2 lg:grid-cols-3">
        {detailCards.map((card) => <div key={String(card.key)} className="min-w-0 border-b border-white/10 px-4 py-3 sm:[&:nth-child(odd)]:border-r lg:[&:nth-child(3n)]:border-r-0"><p className="text-[10px] font-semibold uppercase tracking-[.15em] text-slate-500">{card.label}</p><p className={`mt-1 break-words text-sm font-semibold ${card.value === "Nicht erkannt" ? "text-slate-500" : "text-slate-200"}`}>{card.value}</p></div>)}
      </div>

      <BillRecipient firstName={analysis.firstName} lastName={analysis.lastName} />
      {onContinue && <div className="border-t border-white/10 p-4"><button type="button" onClick={onContinue} className="w-full rounded-xl bg-[#19b7ff] px-4 py-3 text-sm font-bold text-[#03101c]">Mit diesen Daten weiter</button></div>}
    </div>
  );
}
