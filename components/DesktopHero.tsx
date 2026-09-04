import EnergyOrbSection from "@/components/EnergyOrbSection";
import HeroAddressCheck from "@/components/HeroAddressCheck";

const HERO_IMAGE = "https://images.unsplash.com/photo-1785125674389-9d0b74531ba5?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=85&w=2400";

export function DesktopHero() {
  return (
    <section className="desktop-hero relative isolate min-h-[820px] overflow-hidden border-b border-white/10 bg-[#020914]">
      <div className="absolute inset-0 -z-20 bg-cover bg-center bg-no-repeat scale-[1.02] motion-safe:animate-[heroDrift_18s_ease-in-out_infinite_alternate]" style={{ backgroundImage: `url(${HERO_IMAGE})` }} />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(2,9,20,.98)_0%,rgba(2,9,20,.88)_30%,rgba(2,9,20,.40)_58%,rgba(2,9,20,.08)_100%)]" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(2,9,20,.96)_0%,transparent_38%,rgba(2,9,20,.14)_100%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_72%_28%,rgba(25,183,255,.18),transparent_25%),radial-gradient(circle_at_84%_72%,rgba(255,190,80,.14),transparent_28%)]" />
      <div className="container relative grid min-h-[820px] items-center gap-8 py-14 md:grid-cols-[1.02fr_.98fr] md:py-20">
        <div className="relative z-20">
          <p className="mb-5 inline-flex rounded-full border border-[#19b7ff]/35 bg-[#031527]/75 px-4 py-2 text-sm font-semibold text-[#74dcff] shadow-lg shadow-black/20 backdrop-blur-xl">Kostenlos & unverbindlich</p>
          <h1 className="max-w-3xl text-5xl font-black leading-[1.01] tracking-[-.045em] text-white md:text-7xl">Dein Energievergleich für eine bessere <span className="gradient-text">Zukunft.</span></h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200/90 md:text-xl">Wir prüfen deinen aktuellen Strom- und Gastarif und zeigen dir verständlich, ob sich ein Wechsel für dich lohnt.</p>
          <HeroAddressCheck />
          <div className="mt-5 grid max-w-xl grid-cols-3 gap-2 text-xs sm:gap-3 sm:text-sm">
            <div className="rounded-xl border border-white/10 bg-[#06111dcc] px-3 py-3 text-center backdrop-blur-xl"><strong className="block text-white">100 % kostenlos</strong><span className="text-slate-400">keine Prüfgebühr</span></div>
            <div className="rounded-xl border border-white/10 bg-[#06111dcc] px-3 py-3 text-center backdrop-blur-xl"><strong className="block text-white">Kein Wechselzwang</strong><span className="text-slate-400">du entscheidest</span></div>
            <div className="rounded-xl border border-white/10 bg-[#06111dcc] px-3 py-3 text-center backdrop-blur-xl"><strong className="block text-white">Persönlich</strong><span className="text-slate-400">direkter Kontakt</span></div>
          </div>
          <p className="mt-4 max-w-xl text-xs leading-5 text-slate-400">Transparente Beratung statt undurchsichtiger Tarifversprechen. Deine Angaben nutzen wir nur, um deine Anfrage zu bearbeiten.</p>
        </div>
        <div className="relative flex min-h-[610px] items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[#19b7ff]/10 blur-3xl motion-safe:animate-[sceneGlow_6s_ease-in-out_infinite]" />
          <div className="relative z-10 w-full drop-shadow-[0_28px_50px_rgba(0,0,0,.5)]"><EnergyOrbSection /></div>
        </div>
      </div>
    </section>
  );
}
