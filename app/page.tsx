import Link from "next/link";
import { Benefits } from "@/components/Benefits";
import { CTASection } from "@/components/CTASection";
import { SavingsCalculator } from "@/components/SavingsCalculator";
import EnergyOrbSection from "@/components/EnergyOrbSection";

export default function Home() {
  return <>
    <section className="relative overflow-hidden border-b border-white/10">
      <div className="absolute -left-32 top-10 h-80 w-80 rounded-full bg-[#19b7ff]/15 blur-3xl" />
      <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-blue-900/20 blur-3xl" />
      <div className="container relative grid min-h-[700px] items-center gap-8 py-16 md:grid-cols-[1.05fr_.95fr] md:py-24">
        <div>
          <p className="mb-5 inline-flex rounded-full border border-[#19b7ff]/30 bg-[#19b7ff]/10 px-4 py-2 text-sm font-semibold text-[#66d5ff]">CPM Energie · Strom & Gas</p>
          <h1 className="max-w-3xl text-5xl font-black leading-[1.02] tracking-[-.04em] md:text-7xl">Viele Haushalte zahlen zu viel für <span className="gradient-text">Strom und Gas.</span></h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">Ich prüfe Ihren aktuellen Tarif kostenlos und unverbindlich und zeige Ihnen, ob ein Wechsel sinnvoll sein kann.</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row"><Link href="/ersparnisrechner" className="rounded-full bg-[#19b7ff] px-7 py-4 text-center font-bold text-[#03101c] hover:bg-white">Jetzt kostenlos prüfen</Link><Link href="/so-funktionierts" className="rounded-full border border-white/15 px-7 py-4 text-center font-bold text-white hover:bg-white/5">So funktioniert's</Link></div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400"><span>✓ kostenlos</span><span>✓ unverbindlich</span><span>✓ persönlich</span></div>
        </div>
        <div className="relative flex min-h-[520px] items-center justify-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(25,183,255,.16),transparent_60%)]" />
          <EnergyOrbSection />
          <div className="absolute bottom-6 left-1/2 w-[min(90%,360px)] -translate-x-1/2 rounded-2xl border border-white/10 bg-[#06111dcc] px-5 py-4 text-center backdrop-blur-xl">
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-[#66d5ff]">Energie intelligent prüfen</p>
            <p className="mt-2 text-sm text-slate-300">Modern, persönlich und ohne komplizierte Tariflisten.</p>
          </div>
        </div>
      </div>
    </section>
    <section className="container -mt-16 relative z-10 pb-20"><div className="glass rounded-[2rem] p-6 shadow-2xl shadow-black/30 md:p-8"><p className="text-sm font-semibold text-[#19b7ff]">Schneller Check</p><h2 className="mt-2 text-2xl font-bold">Was zahlen Sie aktuell?</h2><p className="mt-3 text-slate-400">Geben Sie Ihren ungefähren Verbrauch ein und bekommen Sie eine erste Orientierung.</p><div className="mt-7"><SavingsCalculator/></div></div></section>
    <Benefits/>
    <section className="container py-8 pb-24"><div className="grid gap-6 md:grid-cols-3"><div><p className="text-4xl font-black">01</p><h3 className="mt-3 text-xl font-bold">Anfrage senden</h3><p className="mt-2 text-slate-400">Sie schicken uns Ihre Daten und Ihren aktuellen Tarif.</p></div><div><p className="text-4xl font-black">02</p><h3 className="mt-3 text-xl font-bold">Tarif prüfen</h3><p className="mt-2 text-slate-400">Wir schauen uns Kosten, Verbrauch und mögliche Alternativen an.</p></div><div><p className="text-4xl font-black">03</p><h3 className="mt-3 text-xl font-bold">Sie entscheiden</h3><p className="mt-2 text-slate-400">Sie erhalten eine klare Rückmeldung und entscheiden selbst.</p></div></div></section>
    <CTASection/>
  </>;
}
