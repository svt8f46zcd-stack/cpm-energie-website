"use client";

import HeroAddressCheck from "@/components/HeroAddressCheck";
import BillUpload from "@/components/BillUpload";

const HERO_IMAGE = "/cpm-energie-website/hero-cpm-background.svg?v=20260905-3";
const BILL_CONTACT_PATH = "/cpm-energie-website/kontakt/rechnung/";
const ASSET_BASE = "/cpm-energie-website";

export function DesktopHero() {
  return (
    <section className="desktop-hero relative isolate min-h-[760px] overflow-hidden border-b border-white/10 bg-[#020914]">
      <div className="absolute inset-0 -z-20 bg-cover bg-center bg-no-repeat scale-[1.02] motion-safe:animate-[heroDrift_18s_ease-in-out_infinite_alternate]" style={{ backgroundImage: `url(${HERO_IMAGE})` }} />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(2,9,20,.96)_0%,rgba(2,9,20,.82)_38%,rgba(2,9,20,.34)_68%,rgba(2,9,20,.10)_100%)]" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(2,9,20,.94)_0%,transparent_55%,rgba(2,9,20,.12)_100%)]" />

      <div className="container relative grid min-h-[760px] items-center gap-12 py-16 md:grid-cols-[1.05fr_.95fr]">
        <div className="relative z-20 max-w-2xl">
          <p className="inline-flex rounded-full border border-[#19b7ff]/35 bg-[#031527]/80 px-4 py-2 text-sm font-bold text-[#74dcff] backdrop-blur-xl">Strom & Gas · kostenlos & unverbindlich</p>
          <h1 className="mt-6 max-w-2xl text-5xl font-black leading-[.98] tracking-[-.05em] text-white md:text-7xl">Zahlst du zu viel für <span className="gradient-text">Strom oder Gas?</span></h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-100/90 md:text-xl">Lade deine letzte Rechnung hoch. Wir zeigen dir, was darin steckt und ob dein aktueller Tarif noch passt.</p>

          <div className="mt-7 max-w-xl rounded-[1.75rem] border border-white/10 bg-[#06111dcc] p-5 shadow-2xl shadow-black/30 backdrop-blur-xl">
            <div className="mb-4"><p className="text-base font-bold text-white">Rechnung kostenlos prüfen</p><p className="mt-1 text-sm text-slate-400">PDF oder Foto genügt.</p></div>
            <HeroAddressCheck />
            <BillUpload onContinue={() => window.location.assign(BILL_CONTACT_PATH)} />
          </div>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-slate-300"><span>✓ 100 % kostenlos</span><span>✓ Keine Wechselpflicht</span><span>✓ Persönlicher Ansprechpartner</span></div>
        </div>

        <div className="relative hidden min-h-[560px] items-center justify-center md:flex">
          <div className="absolute inset-8 rounded-full bg-[#19b7ff]/10 blur-3xl motion-safe:animate-[sceneGlow_6s_ease-in-out_infinite]" />
          <div className="relative z-10 w-full max-w-[430px] overflow-hidden rounded-[2rem] border border-white/15 bg-[#06111dcc] shadow-2xl shadow-black/50 backdrop-blur-xl">
            <div className="relative aspect-[4/5] overflow-hidden bg-[#0b1b30]"><img src={`${ASSET_BASE}/cristiano.svg`} alt="Cristiano Moreira" className="h-full w-full object-cover object-center" /><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#020914] via-[#020914]/60 to-transparent px-7 pb-7 pt-28"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#66d5ff]">CPM Energie</p><h2 className="mt-2 text-2xl font-black text-white">Deine Rechnung. Meine Prüfung.</h2><p className="mt-2 text-sm leading-6 text-slate-300">Digital analysiert. Persönlich erklärt.</p></div></div>
          </div>
        </div>
      </div>
    </section>
  );
}
