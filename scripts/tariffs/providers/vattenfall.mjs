import { checkCompliance, extractPrices, fetchText, htmlToText, normalizeOffer } from "../lib.mjs";

export const provider = {
  id: "vattenfall",
  name: "Vattenfall",
  baseUrl: "https://www.vattenfall.de",
  agbUrl: "https://www.vattenfall.de/agb",
  partner: true,
  tariffNames: { strom: "Vattenfall Strom Referenztarif", gas: "Vattenfall Gas Referenztarif" },
  sources: {
    strom: "https://www.vattenfall.de/strom/stromtarife",
    gas: "https://www.vattenfall.de/gas/gastarife",
  },
};

export async function parse() {
  const compliance = await checkCompliance(provider);
  if (!compliance.eligible) return { provider, compliance, offers: [] };
  const offers = [];
  for (const energy of ["strom", "gas"]) {
    try {
      const html = await fetchText(provider.sources[energy]);
      const prices = extractPrices(htmlToText(html), energy);
      if (prices) offers.push(normalizeOffer(provider, energy, prices, htmlToText(html), provider.sources[energy], compliance));
    } catch (error) {
      console.warn(`[vattenfall:${energy}] ${error.message}`);
    }
  }
  return { provider, compliance, offers };
}
