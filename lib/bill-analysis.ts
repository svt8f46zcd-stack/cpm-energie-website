export type BillAnalysisField = {
  value: string | number | null;
  confidence: "high" | "medium" | "low" | "unknown";
  source: "document" | "not_detected";
};

export type BillAnalysisResult = {
  energyType: BillAnalysisField;
  provider: BillAnalysisField;
  annualConsumptionKwh: BillAnalysisField;
  workPriceCtPerKwh: BillAnalysisField;
  basePriceEurPerYear: BillAnalysisField;
  monthlyPaymentEur: BillAnalysisField;
  billingPeriod: BillAnalysisField;
  contractEnd: BillAnalysisField;
  cancellationPeriod: BillAnalysisField;
  address: BillAnalysisField;
};

export const BILL_ANALYSIS_FIELDS: Array<keyof BillAnalysisResult> = [
  "energyType",
  "provider",
  "annualConsumptionKwh",
  "workPriceCtPerKwh",
  "basePriceEurPerYear",
  "monthlyPaymentEur",
  "billingPeriod",
  "contractEnd",
  "cancellationPeriod",
  "address",
];

export function emptyBillAnalysis(): BillAnalysisResult {
  const empty = (): BillAnalysisField => ({ value: null, confidence: "unknown", source: "not_detected" });
  return {
    energyType: empty(),
    provider: empty(),
    annualConsumptionKwh: empty(),
    workPriceCtPerKwh: empty(),
    basePriceEurPerYear: empty(),
    monthlyPaymentEur: empty(),
    billingPeriod: empty(),
    contractEnd: empty(),
    cancellationPeriod: empty(),
    address: empty(),
  };
}

export async function analyzeBill(file: File): Promise<BillAnalysisResult> {
  const endpoint = process.env.NEXT_PUBLIC_BILL_ANALYSIS_URL;
  if (!endpoint) throw new Error("BILL_ANALYSIS_ENDPOINT_MISSING");

  const body = new FormData();
  body.append("file", file, file.name);

  const response = await fetch(endpoint, { method: "POST", body });
  if (!response.ok) throw new Error("BILL_ANALYSIS_FAILED");

  const result = (await response.json()) as BillAnalysisResult;
  return result;
}
