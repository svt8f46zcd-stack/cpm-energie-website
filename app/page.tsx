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
            <div className="relative mx-auto w-full max-w-xl">
              <div className="absolute -inset-8 rounded-[3rem] bg-[#19b7ff]/5 blur-3xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-[#1b3b58] bg-[#061a2d] p-7 shadow-2xl shadow-black/25 sm:p-9">
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <p className="text-[14px] uppercase tracking-[.28em] text-[#91a4c0]">Beispielanalyse</p>
                    <h3 className="mt-4 text-[30px] font-extrabold leading-none tracking-[-.035em] text-white sm:text-[34px]">Energierechnung</h3>
                  </div>
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] bg-[#0b3150] text-[34px] leading-none text-[#67d7ff]">✦</div>
                </div>
                <div className="mt-10 border-t border-[#20384e] pt-8">
                  <div className="space-y-4">
                    {[['Jahresverbrauch','3.842 kWh'],['Arbeitspreis','31,4 ct/kWh'],['Grundpreis','168 € / Jahr'],['Jahreskosten','1.374 €']].map(([label,value]) => <div key={label} className="flex min-h-[82px] items-center justify-between gap-6 rounded-[28px] border border-[#213d56] bg-[#102238] px-6 py-5 sm:px-8"><span className="text-[20px] font-medium text-[#9aabc3] sm:text-[23px]">{label}</span><span className="text-right text-[22px] font-extrabold tracking-[-.025em] text-white sm:text-[25px]">{value}</span></div>)}
                  </div>
                  <p className="mt-6 text-[17px] text-[#758ba8] sm:text-[19px]">Darstellung dient als Beispiel.</p>
                </div>
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
