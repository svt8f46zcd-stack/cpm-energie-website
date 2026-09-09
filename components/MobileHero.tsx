"use client";

import BillUpload from "@/components/BillUpload";

const HERO_IMAGE = "/cpm-energie-website/hero-cpm-background.svg?v=20260905-3";
const BILL_CONTACT_PATH = "/cpm-energie-website/kontakt/rechnung/";

export function MobileHero() {
  return (
    <section className="relative isolate overflow-hidden border-b border-white/10 bg-[#020914]">
      <div className="absolute inset-0 -z-20 bg-cover bg-center bg-no-repeat motion-safe:animate-[mobileHeroDrift_16s_ease-in-out_infinite_alternate]" style={{ backgroundImage: `url(${HERO_IMAGE})` }} />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(2,9,20,.4)_0%,rgba(2,9,20,.55)_38%,rgba(2,9,20,.96)_78%,#020914_100%)]" />

      <div className="mx-auto flex min-h-[80vh] w-full max-w-[620px] flex-col justify-center px-4 py-12">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[.22em] text-[#66d5ff]">CPM Energie</p>
          <h1 className="mt-5 text-[2.65rem] font-black leading-[.96] tracking-[-.05em] text-white">Zahlst du zu viel für <span className="gradient-text">Strom oder Gas?</span></h1>
          <p className="mx-auto mt-5 max-w-[500px] text-base leading-7 text-slate-100/90">Lade deine letzte Rechnung hoch. Wir analysieren die wichtigsten Tarifdaten und zeigen dir verständlich, wo du stehst.</p>
        </div>

        <div className="relative mx-auto mt-7 w-full max-w-[520px]">
          <div className="absolute -inset-4 rounded-[2rem] bg-[#19b7ff]/10 blur-2xl" />
          <div className="relative rounded-[2rem] border border-white/15 bg-[#06111dcc] p-4 shadow-2xl shadow-black/40 backdrop-blur-xl">
            <BillUpload onContinue={() => window.location.assign(BILL_CONTACT_PATH)} />
          </div>
        </div>

        <p className="mt-5 text-center text-xs font-semibold text-slate-300">Kostenlos · unverbindlich · keine Wechselpflicht</p>
      </div>
    </section>
  );
}
