import { Benefits } from "@/components/Benefits";
import { CTASection } from "@/components/CTASection";
import { DesktopHero } from "@/components/DesktopHero";
import { MobileHero } from "@/components/MobileHero";

export default function Home() {
  return <>
    <div className="desktop-only"><DesktopHero /></div>
    <div className="mobile-only"><MobileHero /></div>

    <section className="container py-16 md:py-24">
      <div className="mx-auto max-w-5xl text-center">
        <p className="text-sm font-bold uppercase tracking-[.18em] text-[#66d5ff]">CPM Energie</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-white md:text-5xl">Energieberatung, bei der du selbst entscheidest.</h2>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-400 md:text-lg">Wir vergleichen deinen bestehenden Tarif nachvollziehbar und zeigen dir, welche Möglichkeiten du hast. Keine Prüfgebühr und kein Wechselzwang.</p>
        <div className="mt-10 grid gap-4 text-left md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[.035] p-6"><div className="text-2xl">✓</div><h3 className="mt-3 font-bold text-white">Kostenlose Prüfung</h3><p className="mt-2 text-sm leading-6 text-slate-400">Die Tarifprüfung ist für dich unverbindlich.</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/[.035] p-6"><div className="text-2xl">↗</div><h3 className="mt-3 font-bold text-white">Klarer Vergleich</h3><p className="mt-2 text-sm leading-6 text-slate-400">Wir erklären dir Kosten und Alternativen verständlich.</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/[.035] p-6"><div className="text-2xl">◉</div><h3 className="mt-3 font-bold text-white">Du entscheidest</h3><p className="mt-2 text-sm leading-6 text-slate-400">Eine Beratung verpflichtet dich zu keinem Wechsel.</p></div>
        </div>
      </div>
    </section>

    <section className="container pb-16 md:pb-24"><div className="rounded-3xl border border-white/10 bg-[#06111d]/80 p-7 md:p-10"><div className="grid gap-8 md:grid-cols-3"><div><p className="text-xs font-bold uppercase tracking-widest text-[#66d5ff]">01</p><h3 className="mt-2 text-xl font-bold text-white">Adresse angeben</h3><p className="mt-2 text-sm leading-6 text-slate-400">PLZ und Straße eingeben. Den Ort erkennen wir automatisch.</p></div><div><p className="text-xs font-bold uppercase tracking-widest text-[#66d5ff]">02</p><h3 className="mt-2 text-xl font-bold text-white">Tarif prüfen</h3><p className="mt-2 text-sm leading-6 text-slate-400">Wir schauen uns Verbrauch, Anbieter und Tarif an.</p></div><div><p className="text-xs font-bold uppercase tracking-widest text-[#66d5ff]">03</p><h3 className="mt-2 text-xl font-bold text-white">Entscheidung treffen</h3><p className="mt-2 text-sm leading-6 text-slate-400">Du bekommst eine verständliche Einschätzung und entscheidest selbst.</p></div></div></div></section>
    <CTASection />
  </>;
}
