import EnergyOrbSection from "@/components/EnergyOrbSection";
import HeroAddressCheck from "@/components/HeroAddressCheck";
import BillUpload from "@/components/BillUpload";

const HERO_IMAGE = "https://images.unsplash.com/photo-1785125674389-9d0b74531ba5?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=85&w=2400";

export function DesktopHero() {
  return (
    <section className="desktop-hero relative isolate min-h-[900px] overflow-hidden border-b border-white/10 bg-[#020914]">
      <div className="absolute inset-0 -z-20 bg-cover bg-center bg-no-repeat scale-[1.02] motion-safe:animate-[heroDrift_18s_ease-in-out_infinite_alternate]" style={{ backgroundImage: `url(${HERO_IMAGE})` }} />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(2,9,20,.98)_0%,rgba(2,9,20,.90)_32%,rgba(2,9,20,.48)_60%,rgba(2,9,20,.10)_100%)]" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(2,9,20,.97)_0%,transparent_38%,rgba(2,9,20,.14)_100%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_72%_28%,rgba(25,183,255,.18),transparent_25%),radial-gradient(circle_at_84%_72%,rgba(255,190,80,.14),transparent_28%)]" />

      <div className="container relative grid min-h-[900px] items-center gap-10 py-14 md:grid-cols-[1.04fr_.96fr] md:py-20">
        <div className="relative z-20">
          <p className="mb-5 inline-flex rounded-full border border-[#19b7ff]/35 bg-[#031527]/75 px-4 py-2 text-sm font-semibold text-[#74dcff] shadow-lg shadow-black/20 backdrop-blur-xl">Kostenlos & unverbindlich</p>
          <h1 className="max-w-3xl text-5xl font-black leading-[1.01] tracking-[-.045em] text-white md:text-7xl">Du zahlst vielleicht zu viel für <span className="gradient-text">Strom oder Gas.</span></h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200/90 md:text-xl">Ich prüfe deinen aktuellen Tarif anhand deiner Rechnung und zeige dir klar, was du heute zahlst und welche Alternativen für dich infrage kommen.</p>
          <div className="mt-6 max-w-2xl rounded-2xl border border-white/10 bg-[#06111dcc] p-4 shadow-xl shadow-black/20 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-[#19b7ff]/40 bg-[#0b1b30]">
                <img src="/cristiano.svg" alt="Cristiano Moreira, persönliche Energieberatung" className="h-full w-full object-cover" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Persönlich statt Portal</p>
                <p className="mt-0.5 text-sm leading-5 text-slate-400">Ich schaue mir deinen Tarif an. Du bekommst eine klare Einschätzung und entscheidest selbst.</p>
              </div>
            </div>
          </div>
          <HeroAddressCheck />
          <BillUpload />
          <div className="mt-5 grid max-w-xl grid-cols-3 gap-2 text-xs sm:gap-3 sm:text-sm">
            <div className="rounded-xl border border-white/10 bg-[#06111dcc] px-3 py-3 text-center backdrop-blur-xl"><strong className="block text-white">100 % kostenlos</strong><span className="text-slate-400">keine Prüfgebühr</span></div>
            <div className="rounded-xl border border-white/10 bg-[#06111dcc] px-3 py-3 text-center backdrop-blur-xl"><strong className="block text-white">Kein Wechselzwang</strong><span className="text-slate-400">du entscheidest</span></div>
            <div className="rounded-xl border border-white/10 bg-[#06111dcc] px-3 py-3 text-center backdrop-blur-xl"><strong className="block text-white">Direkt mit mir</strong><span className="text-slate-400">persönliche Beratung</span></div>
          </div>
          <p className="mt-4 max-w-xl text-xs leading-5 text-slate-400">Kein anonymer Tarifdschungel. Ich zeige dir verständlich, was in deiner Rechnung steckt und was ein Wechsel bedeuten kann.</p>
        </div>

        <div className="relative flex min-h-[610px] items-center justify-center">
          <div className="absolute inset-8 rounded-full bg-[#19b7ff]/10 blur-3xl motion-safe:animate-[sceneGlow_6s_ease-in-out_infinite]" />
          <div className="relative z-10 w-full max-w-[500px] overflow-hidden rounded-[2rem] border border-white/15 bg-[#06111dcc] shadow-2xl shadow-black/50 backdrop-blur-xl">
            <div className="relative aspect-[3/4] overflow-hidden bg-[#0b1b30]">
              <img src="/cristiano.svg" alt="Cristiano Moreira" className="h-full w-full object-cover object-center" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#020914] via-[#020914]/55 to-transparent px-7 pb-7 pt-24">
                <p className="text-xs font-bold uppercase tracking-[.2em] text-[#66d5ff]">CPM Energie</p>
                <h2 className="mt-2 text-2xl font-black text-white">Dein Tarif. Meine Prüfung.</h2>
                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-300">Transparent, persönlich und ohne Druck zum Wechsel.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
