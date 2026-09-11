"use client";

import { FormEvent, useState } from "react";

type EnergyType = "strom" | "gas";

type ApiResult = {
  ergebnis?: {
    ersparnis_pro_jahr_eur?: number | string | null;
    guenstigster_anbieter?: string | null;
  };
  wechseln?: boolean | string | null;
  zusammenfassung?: string | null;
  error?: string | null;
  message?: string | null;
};

const API_URL = "https://wechselpilot.com/api/ersparnis";

function parseNumber(value: string) {
  const normalized = value.replace(",", ".").trim();
  if (!normalized) return null;
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

export function WechselpilotTariffCheck() {
  const [type, setType] = useState<EnergyType>("strom");
  const [plz, setPlz] = useState("");
  const [consumption, setConsumption] = useState("");
  const [workPrice, setWorkPrice] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [result, setResult] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);

    if (!/^\d{5}$/.test(plz)) {
      setError("Bitte gib eine gültige fünfstellige deutsche PLZ ein.");
      return;
    }

    const kwh = parseNumber(consumption);
    if (kwh === null || kwh <= 0 || kwh > 1000000) {
      setError("Bitte gib einen realistischen Jahresverbrauch in kWh ein.");
      return;
    }

    const work = parseNumber(workPrice);
    const base = parseNumber(basePrice);

    if (work !== null && (work <= 0 || work > 200)) {
      setError("Der Arbeitspreis muss zwischen 0 und 200 ct/kWh liegen.");
      return;
    }

    if (base !== null && (base < 0 || base > 500)) {
      setError("Der Grundpreis muss zwischen 0 und 500 € pro Monat liegen.");
      return;
    }

    const params = new URLSearchParams({
      plz,
      verbrauch: String(kwh),
      typ: type,
      brutto: "true",
    });

    if (work !== null) params.set("arbeitspreis", String(work));
    if (base !== null) params.set("grundpreis", String(base));

    setLoading(true);

    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 15000);

      const response = await fetch(`${API_URL}?${params.toString()}`, {
        method: "GET",
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });

      window.clearTimeout(timeout);

      let data: ApiResult = {};
      try {
        data = (await response.json()) as ApiResult;
      } catch {
        data = {};
      }

      if (response.status === 429) {
        throw new Error("Die Berechnung ist momentan ausgelastet. Bitte versuche es in einigen Minuten erneut.");
      }

      if (!response.ok) {
        throw new Error(data.message || data.error || "Die Berechnung konnte nicht durchgeführt werden.");
      }

      setResult(data);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("Die Berechnung hat zu lange gedauert. Bitte versuche es erneut.");
      } else {
        setError(err instanceof Error ? err.message : "Die Berechnung konnte nicht durchgeführt werden.");
      }
    } finally {
      setLoading(false);
    }
  }

  const savings = result?.ergebnis?.ersparnis_pro_jahr_eur;
  const savingsNumber = typeof savings === "number" ? savings : Number(savings);
  const hasSavings = Number.isFinite(savingsNumber);

  return (
    <section className="cpm-section" id="tarifcheck" aria-labelledby="tarifcheck-heading">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <p className="cpm-eyebrow">Direkter Tarifcheck</p>
          <h2 id="tarifcheck-heading" className="cpm-section-title">Keine Rechnung zur Hand? Berechne dein mögliches Einsparpotenzial.</h2>
          <p className="cpm-section-copy mx-auto">Gib deine PLZ und deinen Jahresverbrauch ein. Arbeitspreis und Grundpreis kannst du ergänzen, damit die Berechnung deine aktuelle Situation besser berücksichtigt.</p>
        </div>

        <div className="mx-auto mt-10 grid max-w-5xl gap-6 lg:grid-cols-[1.05fr_.95fr] lg:items-start">
          <form onSubmit={handleSubmit} className="rounded-[2rem] border border-white/10 bg-[#0b1b30]/80 p-5 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-7">
            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-black/10 p-1.5" role="group" aria-label="Energieart">
              <button type="button" onClick={() => setType("strom")} aria-pressed={type === "strom"} className={`rounded-xl px-4 py-3 text-sm font-extrabold transition ${type === "strom" ? "bg-[#19b7ff] text-[#02111d] shadow-lg shadow-cyan-500/20" : "text-slate-300 hover:bg-white/5"}`}>Strom</button>
              <button type="button" onClick={() => setType("gas")} aria-pressed={type === "gas"} className={`rounded-xl px-4 py-3 text-sm font-extrabold transition ${type === "gas" ? "bg-[#19b7ff] text-[#02111d] shadow-lg shadow-cyan-500/20" : "text-slate-300 hover:bg-white/5"}`}>Gas</button>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-white">PLZ</span>
                <input value={plz} onChange={(e) => setPlz(e.target.value.replace(/\D/g, "").slice(0, 5))} inputMode="numeric" autoComplete="postal-code" maxLength={5} placeholder="z. B. 55278" className="w-full rounded-xl border border-white/10 bg-[#06101f] px-4 py-3.5 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/10" required />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-white">Jahresverbrauch</span>
                <div className="relative">
                  <input value={consumption} onChange={(e) => setConsumption(e.target.value.replace(/[^0-9,.]/g, ""))} inputMode="decimal" placeholder={type === "strom" ? "z. B. 3.500" : "z. B. 15.000"} className="w-full rounded-xl border border-white/10 bg-[#06101f] px-4 py-3.5 pr-16 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/10" required />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">kWh/Jahr</span>
                </div>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-white">Arbeitspreis <span className="font-normal text-slate-500">optional</span></span>
                <div className="relative">
                  <input value={workPrice} onChange={(e) => setWorkPrice(e.target.value.replace(/[^0-9,.]/g, ""))} inputMode="decimal" placeholder="z. B. 34,5" className="w-full rounded-xl border border-white/10 bg-[#06101f] px-4 py-3.5 pr-14 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/10" />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">ct/kWh</span>
                </div>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-white">Grundpreis <span className="font-normal text-slate-500">optional</span></span>
                <div className="relative">
                  <input value={basePrice} onChange={(e) => setBasePrice(e.target.value.replace(/[^0-9,.]/g, ""))} inputMode="decimal" placeholder="z. B. 12,90" className="w-full rounded-xl border border-white/10 bg-[#06101f] px-4 py-3.5 pr-14 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/10" />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">€/Monat</span>
                </div>
              </label>
            </div>

            {error && <div role="alert" className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</div>}

            <button type="submit" disabled={loading} className="mt-6 flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#37c7ff] to-[#0c9fe5] px-5 py-4 text-sm font-black text-[#02111d] shadow-lg shadow-cyan-500/20 transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60">
              {loading ? "Berechnung läuft …" : "Einsparpotenzial berechnen"}
            </button>

            <p className="mt-4 text-center text-xs leading-5 text-slate-500">Die Berechnung ist unverbindlich. Für die Ersparnisberechnung werden nur die eingegebenen Tarifdaten an Wechselpilot übertragen. Es wird kein Wechsel ausgelöst.</p>
          </form>

          <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#102641] to-[#071321] p-5 shadow-2xl shadow-black/20 sm:p-7" aria-live="polite">
            {!result && !loading && (
              <div className="flex min-h-[330px] flex-col justify-center">
                <span className="text-xs font-black uppercase tracking-[.18em] text-cyan-300">Dein Ergebnis</span>
                <h3 className="mt-3 text-2xl font-black tracking-tight text-white">Was kann ein Wechsel rechnerisch bringen?</h3>
                <p className="mt-4 text-sm leading-6 text-slate-400">Nach der Berechnung zeigen wir dir das von Wechselpilot ermittelte jährliche Einsparpotenzial und, sofern vorhanden, den günstigsten Anbieter der Berechnung.</p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <div className="rounded-2xl border border-white/8 bg-white/[.035] p-4"><strong className="block text-sm text-white">Verbrauch</strong><span className="mt-1 block text-xs text-slate-500">Deine wichtigste Vergleichsgröße</span></div>
                  <div className="rounded-2xl border border-white/8 bg-white/[.035] p-4"><strong className="block text-sm text-white">Arbeitspreis</strong><span className="mt-1 block text-xs text-slate-500">Dein aktueller Preis je kWh</span></div>
                </div>
              </div>
            )}

            {loading && <div className="flex min-h-[330px] flex-col items-center justify-center text-center"><div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-cyan-300" /><h3 className="mt-5 text-xl font-black text-white">Tarifdaten werden berechnet</h3><p className="mt-2 text-sm text-slate-400">PLZ, Verbrauch und deine optionalen Preisangaben werden ausgewertet.</p></div>}

            {result && !loading && (
              <div>
                <span className="text-xs font-black uppercase tracking-[.18em] text-cyan-300">Berechnung abgeschlossen</span>
                {hasSavings ? <><div className="mt-3 text-5xl font-black tracking-tight text-white">{formatEuro(savingsNumber)}</div><p className="mt-1 text-sm font-bold text-slate-400">mögliches Einsparpotenzial pro Jahr</p></> : <p className="mt-5 text-lg font-bold text-white">Für diese Angaben wurde kein numerisches Einsparpotenzial zurückgegeben.</p>}

                <div className="mt-7 space-y-3">
                  {result.ergebnis?.guenstigster_anbieter && <div className="rounded-2xl border border-white/8 bg-white/[.035] p-4"><span className="block text-xs font-bold uppercase tracking-wider text-slate-500">Günstigster Anbieter laut Berechnung</span><strong className="mt-1 block text-base text-white">{result.ergebnis.guenstigster_anbieter}</strong></div>}
                  {result.zusammenfassung && <div className="rounded-2xl border border-cyan-400/10 bg-cyan-400/[.045] p-4"><span className="block text-xs font-bold uppercase tracking-wider text-cyan-300">Einordnung</span><p className="mt-1 text-sm leading-6 text-slate-300">{result.zusammenfassung}</p></div>}
                </div>

                <div className="mt-6 border-t border-white/8 pt-5 text-xs leading-5 text-slate-500">Die Berechnung stammt von Wechselpilot und ist eine Prognose auf Basis der übermittelten Angaben. Die tatsächliche Ersparnis kann abweichen. Ein Vertrag wird durch diese Berechnung nicht abgeschlossen.</div>
                <a href="#rechnung-pruefen" className="mt-5 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2.5 text-sm font-extrabold text-cyan-200 transition hover:bg-cyan-400/15">Rechnung persönlich prüfen lassen →</a>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
