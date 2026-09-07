"use client";

import HeroAddressCheck from "@/components/HeroAddressCheck";
import BillUpload from "@/components/BillUpload";

const HERO_IMAGE = "/cpm-energie-website/hero-cpm-background.svg?v=20260905-3";
const BILL_CONTACT_PATH = "/cpm-energie-website/kontakt/rechnung/";

export function MobileHero() {
  return (
    <section className="mobile-hero relative isolate overflow-hidden border-b border-white/10 bg-[#020914]">
      <div className="absolute inset-0 -z-20 bg-cover bg-center bg-no-repeat motion-safe:animate-[mobileHeroDrift_16s_ease-in-out_infinite_alternate]" style={{ backgroundImage: `url(${HERO_IMAGE})` }} />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(2,9,20,.35)_0%,rgba(2,9,20,.32)_28%,rgba(2,9,20,.78)_68%,#020914_100%)]" />

      <div className="relative mx-auto flex min-h-[900px] w-full max-w-[620px] flex-col px-4 pb-8 pt-10">
        <div className="text-center">
          <p className="mx-auto inline-flex rounded-full border border-[#19b7ff]/40 bg-[#031527]/90 px-3.5 py-2 text-xs font-bold text-[#8be3ff] shadow-lg backdrop-blur-xl">Strom & Gas · kostenlos & unverbindlich</p>
          <h1 className="mt-6 text-[2.65rem] font-black leading-[.96] tracking-[-.05em] text-white">Zahlst du zu viel für <span className="gradient-text">Strom oder Gas?</span></h1>
          <p className="mx-auto mt-5 max-w-[500px] text-base leading-7 text-slate-100/90">Lade deine letzte Rechnung hoch. Wir zeigen dir, was darin steckt und ob dein Tarif noch passt.</p>
        </div>

        <div className="relative mx-auto mt-7 w-full max-w-[520px]"><div className="absolute -inset-4 rounded-[2rem] bg-[#19b7ff]/10 blur-2xl" /><div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-[#06111dcc] p-4 shadow-2xl shadow-black/40 backdrop-blur-xl"><div className="mb-4"><p className="text-base font-bold text-white">Rechnung kostenlos prüfen</p><p className="mt-1 text-xs leading-5 text-slate-300">PDF oder Foto genügt.</p></div><HeroAddressCheck /><BillUpload onContinue={() => window.location.assign(BILL_CONTACT_PATH)} /></div></div>

        <div className="mt-auto flex justify-center gap-5 pt-6 text-center text-[11px] font-semibold text-slate-200"><span>✓ kostenlos</span><span>✓ unverbindlich</span><span>✓ persönlich</span></div>
      </div>
    </section>
  );
}
