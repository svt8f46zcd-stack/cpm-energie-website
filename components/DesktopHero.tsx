import EnergyOrbSection from "@/components/EnergyOrbSection";
import HeroAddressCheck from "@/components/HeroAddressCheck";

const HERO_IMAGE = "https://images.unsplash.com/photo-1785125674389-9d0b74531ba5?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=85&w=2200";

export function DesktopHero() {
  return (
    <section className="desktop-hero relative isolate min-h-[820px] overflow-hidden border-b border-white/10 bg-[#020914]">
      <div className="absolute inset-0 -z-20 bg-cover bg-center bg-no-repeat scale-[1.02] motion-safe:animate-[heroDrift_18s_ease-in-out_infinite_alternate]" style={{ backgroundImage: `url(${HERO_IMAGE})` }} />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(2,9,20,.98)_0%,rgba(2,9,20,.9)_28%,rgba(2,9,20,.48)_55%,rgba(2,9,20,.12)_100%)]" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(2,9,20,.94)_0%,transparent_34%,rgba(2,9,20,.18)_100%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-80 bg-[radial-gradient(circle_at_72%_28%,rgba(25,183,255,.16),transparent_24%),radial-gradient(circle_at_84%_72%,rgba(255,190,80,.12),transparent_26%)]" />
      <div className="pointer-events-none absolute right-[18%] top-[23%] h-2 w-2 rounded-full bg-white shadow-[0_0_18px_7px_rgba(255,215,120,.45)] motion-safe:animate-[pulse_3s_ease-in-out_infinite]" />
      <div className="container relative grid min-h-[820px] items-center gap-8 py-14 md:grid-cols-[1.02fr_.98fr] md:py-20">
        <div className="relative z-20">
          <p className="mb-5 inline-flex rounded-full border border-[#19b7ff]/35 bg-[#031527]/75 px-4 py-2 text-sm font-semibold text-[#74dcff] shadow-lg shadow-black/20 backdrop-blur-xl">100% kostenlos & unverbindlich</p>
          <h1 className="max-w-3xl text-5xl font-black leading-[1.01] tracking-[-.045em] text-white md:text-7xl">Dein Energievergleich für eine bessere <span className="gradient-text">Zukunft.</span></h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200/90 md:text-xl">Spare bares Geld und finde schnell, einfach und sicher den passenden Strom- und Gastarif.</p>
          <HeroAddressCheck />
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-slate-300"><span>✓ kostenlos</span><span>✓ unverbindlich</span><span>✓ persönlich</span></div>
        </div>
        <div className="relative flex min-h-[610px] items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[#19b7ff]/10 blur-3xl motion-safe:animate-[sceneGlow_6s_ease-in-out_infinite]" />
          <div className="relative z-10 w-full drop-shadow-[0_28px_50px_rgba(0,0,0,.5)]"><EnergyOrbSection /></div>
          <div className="absolute right-0 top-1/2 z-20 w-[220px] -translate-y-1/2 space-y-3">
            <div className="rounded-2xl border border-white/15 bg-[#06111dcc] p-4 shadow-xl backdrop-blur-xl"><p className="text-sm font-bold text-white">Saubere Energie</p><p className="mt-1 text-xs text-slate-300">aus Windkraft</p></div>
            <div className="rounded-2xl border border-white/15 bg-[#06111dcc] p-4 shadow-xl backdrop-blur-xl"><p className="text-sm font-bold text-white">Nachhaltige Energie</p><p className="mt-1 text-xs text-slate-300">aus Sonnenkraft</p></div>
            <div className="rounded-2xl border border-white/15 bg-[#06111dcc] p-4 shadow-xl backdrop-blur-xl"><p className="text-sm font-bold text-white">Gemeinsam für morgen</p><p className="mt-1 text-xs text-slate-300">moderne Versorgung</p></div>
          </div>
        </div>
      </div>
    </section>
  );
}
