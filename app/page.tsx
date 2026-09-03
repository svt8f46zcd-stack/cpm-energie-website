import Link from "next/link";
import { Benefits } from "@/components/Benefits";
import { CTASection } from "@/components/CTASection";
import EnergyOrbSection from "@/components/EnergyOrbSection";
import HeroAddressCheck from "@/components/HeroAddressCheck";

export default function Home() {
  return <>
    <section className="relative overflow-hidden border-b border-white/10">
      <div className="absolute -left-32 top-10 h-80 w-80 rounded-full bg-[#19b7ff]/15 blur-3xl" />
      <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-blue-900/20 blur-3xl" />
      <div className="container relative grid min-h-[760px] items-center gap-6 py-12 md:grid-cols-[1.02fr_.98fr] md:py-16">
        <div className="relative z-10">
          <p className="mb-5 inline-flex rounded-full border border-[#19b7ff]/30 bg-[#19b7ff]/10 px-4 py-2 text-sm font-semibold text-[#66d5ff]">CPM Energie · Strom & Gas</p>
          <h1 className="max-w-3xl text-5xl font-black leading-[1.02] tracking-[-.04em] md:text-7xl">Viele Haushalte zahlen zu viel für <span className="gradient-text">Strom und Gas.</span></h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">Ich prüfe Ihren aktuellen Tarif kostenlos und unverbindlich und zeige Ihnen, ob ein Wechsel sinnvoll sein kann.</p>
          <HeroAddressCheck />
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400"><span>✓ kostenlos</span><span>✓ unverbindlich</span><span>✓ persönlich</span></div>
        </div>
        <div className="relative flex min-h-[520px] items-center justify-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(25,183,255,.16),transparent_60%)]" />
          <EnergyOrbSection />
          <div className="absolute bottom-4 left-1/2 w-[min(90%,390px)] -translate-x-1/2 rounded-2xl border border-white/10 bg-[#06111dcc] px-5 py-4 text-center backdrop-blur-xl">
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-[#66d5ff]">Erneuerbare Energie</p>
            <p className="mt-2 text-sm text-slate-300">Windkraft · Sonnenenergie · moderne Versorgung</p>
          </div>
        </div>
      </div>
    </section>
    <Benefits />
    <section className="container py-8 pb-24"><div className="grid gap-6 md:grid-cols-3"><div><p className="text-4xl font-black">01</p><h3 className="mt-3 text-xl font-bold">Anfrage senden</h3><p className="mt-2 text-slate-400">Sie schicken uns Ihre Daten und Ihren aktuellen Tarif.</p></div><div><p className="text-4xl font-black">02</p><h3 className="mt-3 text-xl font-bold">Tarif prüfen</h3><p className="mt-2 text-slate-400">Wir schauen uns Kosten, Verbrauch und mögliche Alternativen an.</p></div><div><p className="text-4xl font-black">03</p><h3 className="mt-3 text-xl font-bold">Sie entscheiden</h3><p className="mt-2 text-slate-400">Sie erhalten eine klare Rückmeldung und entscheiden selbst.</p></div></div></section>
    <CTASection />
  </>;
}
