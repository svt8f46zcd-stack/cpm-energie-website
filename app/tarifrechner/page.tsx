import { AutomatedTariffCalculator } from "@/components/AutomatedTariffCalculator";

export const metadata = {
  title: "Tarifrechner Strom & Gas",
  description: "Automatischer Tarifvergleich mit Arbeitspreis, Grundpreis, Preis im 1. Jahr, Bonus und Vertragsmerkmalen.",
};

export default function TarifrechnerPage() {
  return <section className="container py-16 md:py-24"><div className="mx-auto max-w-4xl text-center"><p className="text-sm font-bold uppercase tracking-[.2em] text-[#19b7ff]">CPM Energie Tarifrechner</p><h1 className="mt-4 text-4xl font-black md:text-6xl">Strom & Gas Tarife automatisch vergleichen</h1><p className="mt-5 text-lg leading-8 text-slate-400">PLZ und Jahresverbrauch eingeben. Die Vergleichslogik ist auf strukturierte Vertriebstarifdaten ausgelegt und berücksichtigt neben Arbeitspreis und Grundpreis auch Preis im 1. Jahr, Boni und Vertragsmerkmale.</p></div><div className="mx-auto mt-10 max-w-5xl"><AutomatedTariffCalculator /></div></section>;
}
