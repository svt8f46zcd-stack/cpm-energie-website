import { Benefits } from "@/components/Benefits";
import { CTASection } from "@/components/CTASection";
import { DesktopHero } from "@/components/DesktopHero";
import { MobileHero } from "@/components/MobileHero";

export default function Home() {
  return <>
    <div className="desktop-only"><DesktopHero /></div>
    <div className="mobile-only"><MobileHero /></div>

    <Benefits />
    <section className="container py-8 pb-24"><div className="grid gap-6 md:grid-cols-3"><div><p className="text-4xl font-black">01</p><h3 className="mt-3 text-xl font-bold">Anfrage senden</h3><p className="mt-2 text-slate-400">Sie schicken uns Ihre Daten und Ihren aktuellen Tarif.</p></div><div><p className="text-4xl font-black">02</p><h3 className="mt-3 text-xl font-bold">Tarif prüfen</h3><p className="mt-2 text-slate-400">Wir schauen uns Kosten, Verbrauch und mögliche Alternativen an.</p></div><div><p className="text-4xl font-black">03</p><h3 className="mt-3 text-xl font-bold">Sie entscheiden</h3><p className="mt-2 text-slate-400">Sie erhalten eine klare Rückmeldung und entscheiden selbst.</p></div></div></section>
    <CTASection />
  </>;
}
