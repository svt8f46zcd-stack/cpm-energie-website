import { CTASection } from "@/components/CTASection";
import { DesktopHero } from "@/components/DesktopHero";
import { MobileHero } from "@/components/MobileHero";

const steps = [
  { number: "01", title: "Rechnung hochladen", text: "Foto oder PDF deiner aktuellen Strom oder Gasrechnung genügt." },
  { number: "02", title: "Tarif analysieren", text: "Verbrauch, Preise und erkennbare Vertragsdaten werden strukturiert geprüft." },
  { number: "03", title: "Klarheit bekommen", text: "Du erfährst verständlich, wo du mit deinem aktuellen Tarif stehst." },
];

const highlights = ["Keine komplizierte Eingabe", "Strom & Gas", "Kostenlos & unverbindlich", "Persönlicher Ansprechpartner"];

export default function Home() {
  return (
    <>
      <div className="desktop-only" id="top"><DesktopHero /></div>
      <div className="mobile-only" id="top"><MobileHero /></div>

      <main>
        <section className="container py-16 md:py-24" aria-labelledby="invoice-heading">
          <div className="grid items-center gap-10 md:grid-cols-[1fr_.9fr] md:gap-16">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.22em] text-[#66d5ff]">Deine Rechnung im Mittelpunkt</p>
              <h2 id="invoice-heading" className="mt-3 max-w-3xl text-3xl font-black leading-tight tracking-[-.04em] text-white md:text-5xl">Nicht hunderte Tarife. Erst einmal deine Rechnung verstehen.</h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-400 md:text-lg">Du musst keinen komplizierten Vergleich ausfüllen. Eine aktuelle Rechnung reicht für den ersten Check.</p>
              <div className="mt-7 flex flex-wrap gap-2">
                {highlights.map((item) => <span key={item} className="rounded-full border border-white/10 bg-white/[.035] px-4 py-2 text-sm text-slate-300"><span className="mr-2 text-[#66d5ff]">✓</span>{item}</span>)}
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-md">
              <div className="absolute -inset-6 rounded-[2.5rem] bg-[#19b7ff]/5 blur-3xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b1b30]/90 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-5"><div><p className="text-xs uppercase tracking-[.18em] text-slate-500">Tarifanalyse</p><p className="mt-1 font-bold text-white">Deine Energierechnung</p></div><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#19b7ff]/10 text-[#66d5ff]">✦</div></div>
                <div className="space-y-3 pt-5">{[['Jahresverbrauch','3.842 kWh'],['Arbeitspreis','31,4 ct/kWh'],['Grundpreis','168 € / Jahr'],['Jahreskosten','1.374 €']].map(([label,value]) => <div key={label} className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[.025] px-4 py-3"><span className="text-sm text-slate-400">{label}</span><span className="text-sm font-bold text-white">{value}</span></div>)}</div>
                <div className="mt-4 rounded-2xl border border-[#19b7ff]/15 bg-[#19b7ff]/5 px-4 py-3 text-sm text-slate-300"><span className="mr-2 text-[#66d5ff]">●</span> Werte werden aus deiner Rechnung erkannt</div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-[#071321]" aria-labelledby="process-heading">
          <div className="container py-16 md:py-24">
            <div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[.22em] text-[#66d5ff]">Einfacher Ablauf</p><h2 id="process-heading" className="mt-3 text-3xl font-black tracking-[-.04em] text-white md:text-5xl">Von der Rechnung zur Klarheit.</h2><p className="mt-4 text-base leading-7 text-slate-400 md:text-lg">Drei Schritte. Keine unnötigen Formulare.</p></div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">{steps.map((step,index) => <article key={step.number} className="relative rounded-3xl border border-white/10 bg-[#0b1b30]/70 p-6 backdrop-blur-xl md:p-7"><div className="flex items-center justify-between"><span className="text-sm font-black tracking-[.18em] text-[#66d5ff]">{step.number}</span><span className="h-2 w-2 rounded-full bg-[#19b7ff] shadow-[0_0_14px_rgba(25,183,255,.65)]" /></div><h3 className="mt-8 text-xl font-bold text-white">{step.title}</h3><p className="mt-3 text-sm leading-6 text-slate-400">{step.text}</p>{index < 2 && <div className="pointer-events-none absolute right-[-18px] top-12 hidden text-2xl text-[#19b7ff]/40 md:block">→</div>}</article>)}</div>
          </div>
        </section>

        <section className="container py-16 md:py-24" aria-labelledby="difference-heading">
          <div className="grid gap-10 md:grid-cols-[.8fr_1.2fr] md:items-center">
            <div><p className="text-xs font-bold uppercase tracking-[.22em] text-[#66d5ff]">Der Unterschied</p><h2 id="difference-heading" className="mt-3 text-3xl font-black tracking-[-.04em] text-white md:text-5xl">Digitale Prüfung. Persönliche Beratung.</h2></div>
            <div className="rounded-[2rem] border border-white/10 bg-white/[.035] p-7 md:p-9"><p className="text-lg leading-8 text-slate-300 md:text-xl">Die Technik übernimmt die Analyse. Wenn es um deine Entscheidung geht, bleibt es persönlich. Du bekommst eine verständliche Grundlage statt einer unübersichtlichen Liste mit Angeboten.</p><div className="mt-7 flex items-center gap-4 border-t border-white/10 pt-6"><div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#19b7ff]/30 bg-[#19b7ff]/10 font-black text-white">CPM</div><div><p className="font-bold text-white">Cristiano Moreira</p><p className="text-sm text-slate-500">CPM Energie</p></div></div></div>
          </div>
        </section>

        <CTASection />
      </main>
    </>
  );
}
