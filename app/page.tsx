import { CTASection } from "@/components/CTASection";
import { DesktopHero } from "@/components/DesktopHero";
import { MobileHero } from "@/components/MobileHero";

export default function Home() {
  return (
    <>
      <div className="desktop-only" id="top"><DesktopHero /></div>
      <div className="mobile-only" id="top"><MobileHero /></div>

      <main>
        <section className="container py-16 md:py-24" aria-labelledby="analysis-heading">
          <div className="grid items-center gap-10 md:grid-cols-[.95fr_1.05fr] md:gap-16">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.22em] text-[#66d5ff]">Deine Rechnung im Mittelpunkt</p>
              <h2 id="analysis-heading" className="mt-3 max-w-2xl text-3xl font-black leading-tight tracking-[-.04em] text-white md:text-5xl">Nicht hunderte Tarife. Erst einmal deine Rechnung verstehen.</h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-400 md:text-lg">Eine aktuelle Rechnung reicht für den ersten Check. Die wichtigen Zahlen werden strukturiert erfasst und verständlich eingeordnet.</p>
            </div>
            <div className="relative mx-auto w-full max-w-md">
              <div className="absolute -inset-6 rounded-[2.5rem] bg-[#19b7ff]/5 blur-3xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b1b30]/90 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-5"><div><p className="text-xs uppercase tracking-[.18em] text-slate-500">Beispielanalyse</p><p className="mt-1 font-bold text-white">Energierechnung</p></div><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#19b7ff]/10 text-[#66d5ff]">✦</span></div>
                <div className="space-y-3 pt-5">{[['Jahresverbrauch','3.842 kWh'],['Arbeitspreis','31,4 ct/kWh'],['Grundpreis','168 € / Jahr'],['Jahreskosten','1.374 €']].map(([label,value]) => <div key={label} className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[.025] px-4 py-3"><span className="text-sm text-slate-400">{label}</span><span className="text-sm font-bold text-white">{value}</span></div>)}</div>
                <p className="mt-4 text-xs text-slate-500">Darstellung dient als Beispiel.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-[#071321]" aria-labelledby="personal-heading">
          <div className="container py-14 md:py-18">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-bold uppercase tracking-[.22em] text-[#66d5ff]">CPM Energie</p>
              <h2 id="personal-heading" className="mt-3 text-3xl font-black tracking-[-.04em] text-white md:text-5xl">Digital geprüft. Persönlich erklärt.</h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-400 md:text-lg">Keine anonyme Tarifliste. Du bekommst eine klare Grundlage und einen persönlichen Ansprechpartner.</p>
              <div className="mt-7 flex flex-wrap justify-center gap-3 text-sm font-semibold text-slate-300"><span className="rounded-full border border-white/10 bg-white/[.035] px-4 py-2">Strom & Gas</span><span className="rounded-full border border-white/10 bg-white/[.035] px-4 py-2">Kostenlos & unverbindlich</span><span className="rounded-full border border-white/10 bg-white/[.035] px-4 py-2">Keine Wechselpflicht</span></div>
            </div>
          </div>
        </section>

        <CTASection />
      </main>
    </>
  );
}
