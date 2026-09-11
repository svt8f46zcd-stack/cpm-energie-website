import { checkCompliance, extractPrices, fetchText, htmlToText, normalizeOffer } from "../lib.mjs";

export const provider = {
  id: "lichtblick",
  name: "LichtBlick",
  baseUrl: "https://www.lichtblick.de",
  agbUrl: "https://www.lichtblick.de/veroeffentlichungen/",
  partner: true,
  tariffNames: { strom: "LichtBlick ÖkoStrom Referenztarif", gas: "LichtBlick Gas Referenztarif" },
  sources: {
    strom: "https://www.lichtblick.de/strom/",
    gas: "https://www.lichtblick.de/gas/",
  },
};

export async function parse() {
  const compliance = await checkCompliance(provider);
  if (!compliance.eligible) return { provider, compliance, offers: [] };
  const offers = [];
  for (const energy of ["strom", "gas"]) {
    try {
      const html = await fetchText(provider.sources[energy]);
      const text = htmlToText(html);
      const prices = extractPrices(text, energy);
      if (prices) offers.push(normalizeOffer(provider, energy, prices, text, provider.sources[energy], compliance));
    } catch (error) {
      console.warn(`[lichtblick:${energy}] ${error.message}`);
    }
  }
  return { provider, compliance, offers };
}
