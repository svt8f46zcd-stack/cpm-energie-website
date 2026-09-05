"use client";

import HeroAddressCheck from "@/components/HeroAddressCheck";
import BillUpload from "@/components/BillUpload";

const HERO_IMAGE = "/cpm-energie-website/hero-cpm-background.svg?v=20260905-3";
const BILL_CONTACT_PATH = "/cpm-energie-website/kontakt/rechnung/";
const PERSONAL_IMAGE = "/cpm-energie-website/cristiano.svg?v=20260905-2";

export function MobileHero() {
  return (
    <section className="mobile-hero relative isolate overflow-hidden border-b border-white/10 bg-[#020914]">
      <div className="absolute inset-0 -z-20 bg-cover bg-center bg-no-repeat motion-safe:animate-[mobileHeroDrift_16s_ease-in-out_infinite_alternate]" style={{ backgroundImage: `url(${HERO_IMAGE})` }} />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(2,9,20,.38)_0%,rgba(2,9,20,.25)_30%,rgba(2,9,20,.70)_72%,#020914_100%)]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_72%_35%,rgba(25,183,255,.16),transparent_34%)]" />

      <div className="relative mx-auto flex min-h-[1050px] w-full max-w-[620px] flex-col px-4 pb-8 pt-8">
        <div className="text-center">
          <p className="mx-auto inline-flex rounded-full border border-[#19b7ff]/40 bg-[#031527]/90 px-3.5 py-2 text-xs font-bold text-[#8be3ff] shadow-lg backdrop-blur-xl">Strom & Gas · kostenlos & unverbindlich</p>
          <h1 className="mt-5 text-[2.5rem] font-black leading-[.98] tracking-[-.045em] text-white">Prüfe, ob dein <span className="gradient-text">Strom oder Gas</span> Tarif noch passt.</h1>
          <p className="mx-auto mt-4 max-w-[500px] text-base leading-7 text-slate-100/95">Rechnung hochladen, Daten automatisch erfassen lassen und verständlich sehen, welche Möglichkeiten du hast.</p>
        </div>

        <div className="mx-auto mt-5 grid w-full max-w-[520px] grid-cols-3 gap-2">
          <div className="rounded-xl border border-white/10 bg-[#06111dcc] px-2 py-3 text-center backdrop-blur-xl"><span className="text-[10px] font-black text-[#66d5ff]">01</span><p className="mt-1 text-[11px] font-bold text-white">Hochladen</p></div>
          <div className="rounded-xl border border-white/10 bg-[#06111dcc] px-2 py-3 text-center backdrop-blur-xl"><span className="text-[10px] font-black text-[#66d5ff]">02</span><p className="mt-1 text-[11px] font-bold text-white">Prüfen</p></div>
          <div className="rounded-xl border border-white/10 bg-[#06111dcc] px-2 py-3 text-center backdrop-blur-xl"><span className="text-[10px] font-black text-[#66d5ff]">03</span><p className="mt-1 text-[11px] font-bold text-white">Entscheiden</p></div>
        </div>

        <div className="mx-auto mt-5 w-full max-w-[520px] rounded-2xl border border-white/10 bg-[#06111dcc] p-3.5 shadow-xl shadow-black/30 backdrop-blur-xl"><div className="flex items-center gap-3"><div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-[#19b7ff]/50 bg-[#19b7ff]/10 shadow-[0_0_22px_rgba(25,183,255,.18)]"><img src={PERSONAL_IMAGE} alt="Cristiano von CPM Energie" className="h-full w-full object-cover" /></div><div className="min-w-0"><p className="text-sm font-bold text-white">Persönlich statt anonym</p><p className="mt-0.5 text-xs leading-5 text-slate-300">Automatische Datenerfassung, persönliche Beratung und keine Wechselpflicht.</p></div></div></div>

        <div className="relative mx-auto mt-5 w-full max-w-[520px]"><div className="absolute -inset-4 rounded-[2rem] bg-[#19b7ff]/10 blur-2xl motion-safe:animate-[mobileEnergyGlow_4s_ease-in-out_infinite]" /><div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-[#06111dcc] p-4 shadow-2xl shadow-black/40 backdrop-blur-xl"><div className="mb-4"><p className="text-base font-bold text-white">Jetzt Tarif prüfen</p><p className="mt-1 text-xs leading-5 text-slate-300">Wähle den schnellsten Weg: Rechnung hochladen oder Adresse eingeben.</p></div><HeroAddressCheck /><BillUpload onContinue={() => window.location.assign(BILL_CONTACT_PATH)} /></div></div>

        <div className="mt-auto grid grid-cols-3 gap-2.5 pt-5 text-center text-[11px] font-semibold text-slate-200"><div className="rounded-xl border border-white/10 bg-[#06111dcc] px-2 py-2.5 backdrop-blur-md">✓ kostenlos</div><div className="rounded-xl border border-white/10 bg-[#06111dcc] px-2 py-2.5 backdrop-blur-md">✓ unverbindlich</div><div className="rounded-xl border border-white/10 bg-[#06111dcc] px-2 py-2.5 backdrop-blur-md">✓ persönlich</div></div>
      </div>
    </section>
  );
}
