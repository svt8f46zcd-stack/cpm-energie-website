import type { BillAnalysisResult as Analysis } from "@/lib/bill-analysis-v3";
import tariffs from "@/data/tariffs.json";

type Props = { analysis: Analysis };
type Tariff = (typeof tariffs)[number] & {
  minConsumptionKwh?: number;
  maxConsumptionKwh?: number;
  validUntil?: string;
  availability?: string;
  postalCodes?: string[];
  networkAreas?: string[];
  priceAsOf?: string;
};

type Match = Tariff & {
  annual: number;
  firstYear: number;
  bonus: number;
  savings: number;
};

const euro = (n: number) => `${n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
const cents = (n: number) => `${n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 3 })} ct/kWh`;
const today = new Date();
const isoToday = today.toISOString().slice(0, 10);

function annualCost(t: Tariff, consumption: number) {
  return t.basePriceYear + (consumption * t.workPriceCt) / 100;
}

function extractPlz(value: unknown) {
  if (typeof value !== "string") return null;
  const m = value.match(/\b(\d{5})\b/);
  return m?.[1] ?? null;
}

function isDateValid(t: Tariff) {
  if (t.validFrom && t.validFrom > isoToday) return false;
  if (t.validUntil && t.validUntil < isoToday) return false;
  return true;
}

function regionVerified(t: Tariff, plz: string | null) {
  if (t.availability === "nationwide") return true;
  if (!plz) return false;
  if (Array.isArray(t.postalCodes) && t.postalCodes.includes(plz)) return true;
  return false;
}

function hasCompletePrice(t: Tariff) {
  return Number.isFinite(t.workPriceCt) && t.workPriceCt > 0 && Number.isFinite(t.basePriceYear) && t.basePriceYear >= 0;
}

export function BillTariffMatch({ analysis }: Props) {
  const consumption = typeof analysis.annualConsumptionKwh.value === "number" && analysis.annualConsumptionKwh.value > 0
    ? analysis.annualConsumptionKwh.value
    : null;
  const currentWork = typeof analysis.workPriceCtPerKwh.value === "number" && analysis.workPriceCtPerKwh.value > 0
    ? analysis.workPriceCtPerKwh.value
    : null;
  const currentBase = typeof analysis.basePriceEurPerYear.value === "number" && analysis.basePriceEurPerYear.value >= 0
    ? analysis.basePriceEurPerYear.value
    : null;
  const type = String(analysis.energyType.value || "").trim().toLowerCase();
  const plz = extractPlz(analysis.address.value);

  const missing: string[] = [];
  if (consumption === null) missing.push("Jahresverbrauch");
  if (currentWork === null) missing.push("Arbeitspreis");
  if (currentBase === null) missing.push("Grundpreis");
  if (!["strom", "gas"].includes(type)) missing.push("Energieart");
  if (!plz) missing.push("PLZ der Lieferadresse");

  if (missing.length) {
    return (
      <div className="mx-4 mb-4 rounded-2xl border border-amber-400/20 bg-amber-400/[.05] p-4 sm:mx-6">
        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-amber-300">Tarifvergleich noch nicht belastbar</p>
        <p className="mt-1 text-sm font-bold text-white">Noch kein belastbarer Vergleich</p>
        <p className="mt-1 text-xs leading-5 text-slate-400">
          Für einen seriösen Vergleich fehlen: {missing.join(", ")}. Ohne PLZ darf kein regionaler Tarif als günstigster Tarif ausgegeben werden.
        </p>
      </div>
    );
  }

  const currentAnnual = currentBase! + (consumption! * currentWork!) / 100;
  const candidates = (tariffs as Tariff[])
    .filter((t) => t.energyType === type)
    .filter((t) => hasCompletePrice(t))
    .filter((t) => isDateValid(t))
    .filter((t) => consumption! >= (t.minConsumptionKwh ?? 0) && consumption! <= (t.maxConsumptionKwh ?? Number.POSITIVE_INFINITY))
    .filter((t) => regionVerified(t, plz));

  const matches: Match[] = candidates
    .map((t) => {
      const annual = annualCost(t, consumption!);
      const bonus = 0;
      return { ...t, annual, firstYear: Math.max(0, annual - bonus), bonus, savings: currentAnnual - annual };
    })
    .sort((a, b) => a.annual - b.annual);

  if (!matches.length) {
    return (
      <div className="mx-4 mb-4 rounded-2xl border border-amber-400/20 bg-amber-400/[.05] p-4 sm:mx-6">
        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-amber-300">Automatischer Tarifvergleich</p>
        <h3 className="mt-1 text-lg font-black text-white">Noch kein belastbarer Vergleich</h3>
        <p className="mt-1 text-xs leading-5 text-slate-400">
          Die hinterlegten Tarife sind für die erkannte Lieferregion nicht verifiziert. Deshalb wird bewusst kein Tarif als „günstigster“ dargestellt.
        </p>
      </div>
    );
  }

  const best = matches[0];
  const saving = Math.max(0, best.savings);

  return (
    <div className="mx-4 mb-4 overflow-hidden rounded-2xl border border-[#19b7ff]/25 bg-gradient-to-br from-[#0a2840] to-[#071b2d] sm:mx-6">
      <div className="border-b border-white/10 px-4 py-4 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#66d5ff]">Belastbarer Tarifvergleich</p>
            <h3 className="mt-1 text-lg font-black text-white">Beste belastbare Option</h3>
          </div>
          <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold text-emerald-300">verifiziert</span>
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
              {best.validFrom && <span>gültig ab {best.validFrom}</span>}
            </div>
          </div>
          <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[.07] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[.14em] text-emerald-300">Mögliche Ersparnis</p>
            <p className="mt-1 text-2xl font-black text-white">{saving > 0 ? euro(saving) : "0,00 €"}</p>
            <p className="mt-1 text-[10px] text-slate-400">pro Jahr auf gleicher Kostenbasis</p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between rounded-xl bg-black/15 px-3 py-2.5 text-xs">
          <span className="text-slate-400">Deine berechneten Jahreskosten</span>
          <span className="font-bold text-white">{euro(currentAnnual)}</span>
        </div>
        <div className="mt-3 flex items-center justify-between rounded-xl bg-black/15 px-3 py-2.5 text-xs">
          <span className="text-slate-400">Beste belastbare Option</span>
          <span className="font-bold text-[#8ce4ff]">{euro(best.annual)} / Jahr</span>
        </div>

        {matches.length > 1 && (
          <div className="mt-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">Weitere verifizierte Optionen</p>
            <div className="space-y-2">
              {matches.slice(1, 4).map((t, i) => (
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

        <p className="mt-4 text-[10px] leading-4 text-slate-500">
          Vergleichsbasis: Arbeitspreis + Grundpreis bei erkanntem Jahresverbrauch. Boni werden nur berücksichtigt, wenn sie im Datensatz ausdrücklich als garantiert und anwendbar hinterlegt sind. Verfügbarkeit und Vertragsdaten müssen vor dem Wechsel final bestätigt werden.
        </p>
      </div>
    </div>
  );
}
