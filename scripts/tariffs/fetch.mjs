import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";
import { writeJson } from "./lib.mjs";
import * as vattenfall from "./providers/vattenfall.mjs";
import * as lichtblick from "./providers/lichtblick.mjs";
import * as eon from "./providers/eon.mjs";
import * as enbw from "./providers/enbw.mjs";
import * as yello from "./providers/yello.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const outputFile = path.join(root, "data", "tariffs-live.json");
const providers = [vattenfall, lichtblick, eon, enbw, yello];

async function readPrevious() {
  try { return JSON.parse(await fs.readFile(outputFile, "utf8")); }
  catch { return { generatedAt: null, offers: [], providers: {} }; }
}

const previous = await readPrevious();
const offers = [];
const providerStatus = {};

for (const module of providers) {
  const id = module.provider.id;
  const oldOffers = (previous.offers || []).filter((offer) => offer.providerId === id);
  try {
    const result = await module.parse();
    providerStatus[id] = {
      name: module.provider.name,
      partner: module.provider.partner,
      robotsAllowed: result.compliance?.robotsAllowed ?? false,
      agbFetched: result.compliance?.agbFetched ?? false,
      agbNoExplicitAutomationBan: result.compliance?.agbNoExplicitAutomationBan ?? false,
      eligible: result.compliance?.eligible ?? false,
      sourceUrls: module.provider.sources,
      agbUrl: module.provider.agbUrl,
      lastRun: new Date().toISOString(),
      offersFound: result.offers.length,
      error: result.compliance?.reason || null,
    };
    if (result.offers.length) offers.push(...result.offers);
    else if (oldOffers.length) offers.push(...oldOffers.map((offer) => ({ ...offer, retainedAfterParserFailure: true })));
  } catch (error) {
    console.error(`[${id}] isolated failure: ${error.message}`);
    providerStatus[id] = {
      name: module.provider.name,
      partner: module.provider.partner,
      eligible: false,
      sourceUrls: module.provider.sources,
      agbUrl: module.provider.agbUrl,
      lastRun: new Date().toISOString(),
      offersFound: 0,
      error: error.message,
    };
    if (oldOffers.length) offers.push(...oldOffers.map((offer) => ({ ...offer, retainedAfterParserFailure: true })));
  }
}

const deduped = [...new Map(offers.map((offer) => [`${offer.providerId}:${offer.energyType}`, offer])).values()];
const output = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  method: "official-public-source-scrape",
  marketCoverage: "selected-provider-set",
  disclaimer: "Unverbindliche Beispielrechnung. Dieses Dataset ist keine vollständige Marktübersicht. PLZ-spezifische Verfügbarkeit, Boni, Netzentgelte und Vertragsbedingungen müssen vor Abschluss geprüft werden.",
  providers: providerStatus,
  offers: deduped,
};
await writeJson(outputFile, output);
console.log(`Wrote ${deduped.length} tariff offers to ${outputFile}`);
for (const [id, status] of Object.entries(providerStatus)) console.log(`${id}: eligible=${status.eligible} offers=${status.offersFound ?? 0} error=${status.error ?? "none"}`);
