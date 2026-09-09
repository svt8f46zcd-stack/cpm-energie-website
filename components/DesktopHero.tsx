"use client";

import BillUpload from "@/components/BillUpload";

const HERO_IMAGE = "/cpm-energie-website/hero-cpm-background.svg?v=20260905-3";
const BILL_CONTACT_PATH = "/cpm-energie-website/kontakt/rechnung/";

export function DesktopHero() {
  return (
    <section className="relative isolate overflow-hidden border-b border-white/10 bg-[#020914]">
      <div className="absolute inset-0 -z-20 bg-cover bg-center bg-no-repeat scale-[1.02] motion-safe:animate-[heroDrift_18s_ease-in-out_infinite_alternate]" style={{ backgroundImage: `url(${HERO_IMAGE})` }} />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(2,9,20,.97)_0%,rgba(2,9,20,.88)_45%,rgba(2,9,20,.42)_75%,rgba(2,9,20,.15)_100%)]" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(2,9,20,.98)_0%,transparent_65%,rgba(2,9,20,.2)_100%)]" />

      <div className="container grid min-h-[760px] items-center gap-16 py-20 md:grid-cols-[1.05fr_.95fr]">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[.22em] text-[#66d5ff]">CPM Energie</p>
          <h1 className="mt-5 max-w-2xl text-5xl font-black leading-[.96] tracking-[-.05em] text-white md:text-7xl">Zahlst du zu viel für <span className="gradient-text">Strom oder Gas?</span></h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-200 md:text-xl">Lade deine letzte Rechnung hoch. Wir analysieren die wichtigsten Tarifdaten und zeigen dir verständlich, wo du stehst.</p>
          <div className="mt-7 max-w-xl rounded-[1.75rem] border border-white/10 bg-[#06111dcc] p-5 shadow-2xl shadow-black/30 backdrop-blur-xl">
            <BillUpload onContinue={() => window.location.assign(BILL_CONTACT_PATH)} />
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-300">Kostenlos · unverbindlich · keine Wechselpflicht</p>
        </div>

        <div className="relative hidden min-h-[500px] items-center justify-center md:flex">
          <div className="absolute inset-10 rounded-full bg-[#19b7ff]/10 blur-3xl motion-safe:animate-[sceneGlow_6s_ease-in-out_infinite]" />
          <div className="relative z-10 w-full max-w-[400px] overflow-hidden rounded-[2rem] border border-white/15 bg-[#06111dcc] shadow-2xl shadow-black/50 backdrop-blur-xl">
            <div className="aspect-[4/5] overflow-hidden bg-[#0b1b30]">
              <img src="/cpm-energie-website/cristiano.svg" alt="Persönlicher Ansprechpartner von CPM Energie" className="h-full w-full object-cover object-center" />
            </div>
            <div className="border-t border-white/10 px-6 py-5">
              <p className="text-xs font-bold uppercase tracking-[.2em] text-[#66d5ff]">Persönlich erklärt</p>
              <p className="mt-2 text-xl font-black text-white">Deine Rechnung. Klar verstanden.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
