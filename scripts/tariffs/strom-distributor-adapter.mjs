import { validateTariffPrices } from "./lib.mjs";

/**
 * Normalizes a structured StromDistributor/egON style offer into the CPM tariff schema.
 *
 * This adapter deliberately does not contain credentials or a guessed endpoint. The
 * authenticated portal shown in the sales screenshots must provide an authorized
 * JSON/API response or an official export before it can be wired into the cron job.
 */
export function normalizeDistributorOffer(raw, context = {}) {
  const energyType = String(raw.energyType ?? raw.energy ?? "strom").toLowerCase();
  const workPriceCt = Number(raw.workPriceCt ?? raw.arbeitspreisCt ?? raw.arbeitspreis);
  const basePriceYear = Number(raw.basePriceYear ?? raw.grundpreisYear ?? raw.grundpreis);
  if (!Number.isFinite(workPriceCt) || !Number.isFinite(basePriceYear)) return null;

  const validation = validateTariffPrices(workPriceCt, basePriceYear, energyType);
  if (!validation.valid) return null;

  const bonus = Number(raw.bonus ?? raw.neukundenbonus ?? raw.kundenbonus ?? 0);
  const firstYearPrice = Number(raw.firstYearPrice ?? raw.priceFirstYear ?? raw.preisIm1Jahr);
  const monthlyBasePrice = Number(raw.monthlyBasePrice ?? raw.grundpreisMonth ?? basePriceYear / 12);

  return {
    id: String(raw.id ?? `${String(raw.providerId ?? raw.provider ?? "provider").toLowerCase()}-${energyType}-${String(raw.tariffName ?? raw.tarifName ?? "tarif").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`),
    provider: String(raw.provider ?? raw.anbieter ?? "Unbekannter Anbieter"),
    providerId: String(raw.providerId ?? raw.anbieterId ?? "unknown"),
    tariffName: String(raw.tariffName ?? raw.tarifName ?? "Referenztarif"),
    energyType,
    workPriceCt,
    basePriceYear,
    monthlyBasePrice,
    firstYearPrice: Number.isFinite(firstYearPrice) ? firstYearPrice : undefined,
    bonus: Number.isFinite(bonus) ? bonus : 0,
    minimumContractMonths: Number(raw.minimumContractMonths ?? raw.mindestlaufzeitMonate) || undefined,
    cancellationPeriodWeeks: Number(raw.cancellationPeriodWeeks ?? raw.kuendigungsfristWochen) || undefined,
    priceGuaranteeUntil: raw.priceGuaranteeUntil ?? raw.preisgarantieBis ?? null,
    networkFeesIncluded: Boolean(raw.networkFeesIncluded ?? raw.netzentgelteBeruecksichtigt),
    paymentCount: Number(raw.paymentCount ?? raw.abschlaege) || undefined,
    digitalSignature: Boolean(raw.digitalSignature ?? raw.digitaleUnterschrift),
    availability: raw.availability ?? "postal_code_unverified",
    postalCodes: Array.isArray(raw.postalCodes) ? raw.postalCodes : undefined,
    minConsumptionKwh: Number(raw.minConsumptionKwh ?? raw.minVerbrauchKwh) || 1,
    maxConsumptionKwh: Number(raw.maxConsumptionKwh ?? raw.maxVerbrauchKwh) || 100000,
    validFrom: raw.validFrom ?? raw.gueltigAb ?? null,
    sourceUrl: context.sourceUrl ?? raw.sourceUrl ?? "",
    sourceLabel: context.sourceLabel ?? raw.sourceLabel ?? "StromDistributor/egON strukturierte Tarifdaten",
    retrievedAt: context.retrievedAt ?? new Date().toISOString(),
    dataQuality: "authorized_structured_feed",
    disclaimer: "Unverbindliche Beispielrechnung. PLZ-spezifische Verfügbarkeit und Vertragsbedingungen müssen vor Abschluss bestätigt werden.",
  };
}

export function normalizeDistributorPayload(payload, context = {}) {
  const rows = Array.isArray(payload) ? payload : Array.isArray(payload?.offers) ? payload.offers : Array.isArray(payload?.tariffs) ? payload.tariffs : [];
  return rows.map((row) => normalizeDistributorOffer(row, context)).filter(Boolean);
}
