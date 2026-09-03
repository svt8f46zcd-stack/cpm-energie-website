import { SavingsCalculator } from "@/components/SavingsCalculator";
import Link from "next/link";

export const metadata = { title: "Ersparnisrechner", description: "Erste Orientierung zum möglichen Einsparpotenzial bei Strom und Gas." };

export default function RechnerPage() { return <section className="container py-20 md:py-28"><div className="mx-auto max-w-3xl text-center"><p className="text-sm font-bold uppercase tracking-[.2em] text-[#19b7ff]">Ersparnisrechner</p><h1 className="mt-4 text-4xl font-black md:text-6xl">Rechnen Sie grob vor, was möglich sein könnte.</h1><p className="mt-5 text-lg leading-8 text-slate-400">Eine erste Orientierung in weniger als einer Minute. Für eine echte Prüfung schauen wir uns Ihren aktuellen Tarif an.</p></div><div className="mx-auto mt-12 max-w-4xl"><SavingsCalculator/></div><div className="mt-8 text-center"><Link href="/kontakt" className="inline-flex rounded-full bg-[#19b7ff] px-7 py-4 font-bold text-[#03101c]">Tarif jetzt kostenlos prüfen lassen</Link></div></section>; }
