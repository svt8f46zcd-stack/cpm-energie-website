import { AutomatedTariffCalculator } from "@/components/AutomatedTariffCalculator";
import Link from "next/link";

export const metadata = { title: "Ersparnisrechner", description: "Automatischer Preisvergleich für Strom und Gas auf Basis öffentlicher Anbieterpreise." };

export default function RechnerPage() {
  return <section className="container py-16 md:py-24"><div className="mx-auto max-w-4xl text-center"><p className="text-sm font-bold uppercase tracking-[.2em] text-[#19b7ff]">Ersparnisrechner</p><h1 className="mt-4 text-4xl font-black md:text-6xl">Strom und Gas automatisch vergleichen</h1><p className="mt-5 text-lg leading-8 text-slate-400">Keine pauschalen Richtwerte mehr. Der Rechner nutzt die zuletzt automatisiert eingelesenen öffentlichen Anbieterpreise und rechnet sie auf deinen Jahresverbrauch um.</p></div><div className="mx-auto mt-10 max-w-5xl"><AutomatedTariffCalculator /></div><div className="mt-8 text-center"><Link href="/kontakt/rechnung" className="inline-flex rounded-full bg-[#19b7ff] px-7 py-4 font-bold text-[#03101c]">Rechnung kostenlos prüfen lassen</Link></div></section>;
}
