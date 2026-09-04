import { Suspense } from "react";
import HeroLeadForm from "@/components/HeroLeadForm";

export const metadata = { title: "Abrechnung prüfen" };

export default function RechnungKontaktPage() {
  return <section className="container py-16 md:py-24">
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-bold uppercase tracking-[.2em] text-[#19b7ff]">CPM Energie</p>
      <h1 className="mt-4 text-4xl font-black tracking-tight text-white md:text-6xl">Deine Abrechnung ist schon da.</h1>
      <p className="mt-5 text-base leading-7 text-slate-400 md:text-lg">Nur noch deine Kontaktdaten, dann kann ich die Prüfung starten.</p>
    </div>
    <div className="mx-auto mt-10 max-w-2xl">
      <Suspense fallback={<div className="glass rounded-[2rem] p-8 text-center text-slate-400">Formular wird geladen…</div>}>
        <HeroLeadForm />
      </Suspense>
    </div>
  </section>;
}
