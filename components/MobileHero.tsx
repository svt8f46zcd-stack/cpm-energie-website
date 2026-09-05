"use client";

import HeroAddressCheck from "@/components/HeroAddressCheck";
import BillUpload from "@/components/BillUpload";

const HERO_IMAGE = "https://images.unsplash.com/photo-1785125674389-9d0b74531ba5?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=85&w=1600";
const BILL_CONTACT_PATH = "/cpm-energie-website/kontakt/rechnung/";
const PERSONAL_IMAGE = "/cpm-energie-website/cristiano.svg?v=20260905-1";

export function MobileHero() {
  return (
    <section className="mobile-hero relative isolate overflow-hidden border-b border-white/10 bg-[#020914]">
      <div className="absolute inset-0 -z-20 bg-cover bg-[center_35%] bg-no-repeat motion-safe:animate-[mobileHeroDrift_16s_ease-in-out_infinite_alternate]" style={{ backgroundImage: `url(${HERO_IMAGE})` }} />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(2,9,20,.68)_0%,rgba(2,9,20,.56)_30%,rgba(2,9,20,.92)_66%,#020914_100%)]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_32%,rgba(25,183,255,.24),transparent_34%)]" />
      <div className="relative mx-auto flex min-h-[980px] w-full max-w-[620px] flex-col px-5 pb-10 pt-10">
        <div className="text-center"><p className="mx-auto inline-flex rounded-full border border-[#19b7ff]/40 bg-[#031527]/80 px-3.5 py-2 text-xs font-bold text-[#8be3ff] shadow-lg backdrop-blur-xl">100% kostenlos & unverbindlich</p><h1 className="mt-5 text-[2.55rem] font-black leading-[.98] tracking-[-.045em] text-white">Du zahlst vielleicht zu viel für <span className="gradient-text">Strom oder Gas.</span></h1><p className="mx-auto mt-4 max-w-[480px] text-base leading-7 text-slate-200/90">Ich prüfe deinen aktuellen Tarif und zeige dir klar, was du zahlst und welche Alternativen für dich infrage kommen.</p></div>
        <div className="mx-auto mt-6 w-full max-w-[520px] rounded-2xl border border-white/10 bg-[#06111dcc] p-3.5 shadow-xl shadow-black/30 backdrop-blur-xl"><div className="flex items-center gap-3"><div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-[#19b7ff]/50 bg-[#19b7ff]/10 shadow-[0_0_22px_rgba(25,183,255,.18)]"><img src={PERSONAL_IMAGE} alt="Cristiano von CPM Energie" className="h-full w-full object-cover" /></div><div className="min-w-0"><p className="text-sm font-bold text-white">Persönlich statt Portal</p><p className="mt-0.5 text-xs leading-5 text-slate-400">Ich prüfe deine Rechnung. Du entscheidest selbst.</p></div></div></div>
        <div className="relative mx-auto mt-5 w-full max-w-[520px]"><div className="absolute -inset-4 rounded-[2rem] bg-[#19b7ff]/10 blur-2xl motion-safe:animate-[mobileEnergyGlow_4s_ease-in-out_infinite]" /><div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-[#06111dcc] p-4 shadow-2xl shadow-black/40 backdrop-blur-xl"><div className="mb-4 flex items-center justify-between"><div><p className="text-sm font-bold text-white">Tarif kostenlos prüfen</p><p className="mt-0.5 text-xs text-slate-400">Rechnung hochladen oder Verbrauch eingeben</p></div><div className="relative flex h-11 w-11 items-center justify-center rounded-full border border-[#19b7ff]/40 bg-[#19b7ff]/10"><span className="absolute h-2.5 w-2.5 rounded-full bg-[#75dcff] shadow-[0_0_18px_5px_rgba(25,183,255,.65)] motion-safe:animate-[energyPulse_2.4s_ease-in-out_infinite]" /><span className="h-7 w-7 rounded-full border border-[#75dcff]/35" /></div></div><HeroAddressCheck /><BillUpload onContinue={() => window.location.assign(BILL_CONTACT_PATH)} /></div></div>
        <div className="mt-auto grid grid-cols-3 gap-2.5 pt-6 text-center text-[11px] font-semibold text-slate-300"><div className="rounded-xl border border-white/10 bg-white/5 px-2 py-2.5 backdrop-blur-md">✓ kostenlos</div><div className="rounded-xl border border-white/10 bg-white/5 px-2 py-2.5 backdrop-blur-md">✓ unverbindlich</div><div className="rounded-xl border border-white/10 bg-white/5 px-2 py-2.5 backdrop-blur-md">✓ persönlich</div></div>
      </div>
    </section>
  );
}
