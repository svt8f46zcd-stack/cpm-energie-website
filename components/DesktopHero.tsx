"use client";

import BillUpload from "@/components/BillUpload";

const BILL_CONTACT_PATH = "/cpm-energie-website/kontakt/rechnung/";

export function DesktopHero() {
  return (
    <section className="relative isolate overflow-hidden border-b border-white/10 bg-[#020914]" aria-labelledby="hero-heading">
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_72%_35%,rgba(25,183,255,.16),transparent_32%),linear-gradient(135deg,#020914_0%,#06182b_55%,#020914_100%)]" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(2,9,20,.98)_0%,rgba(2,9,20,.86)_55%,rgba(2,9,20,.62)_100%)]" />

      <div className="container flex min-h-[720px] items-center py-20">
        <div className="w-full max-w-3xl">
          <h1 id="hero-heading" className="max-w-3xl text-5xl font-black leading-[.95] tracking-[-.055em] text-white md:text-7xl">
            Zahlst du zu viel für <span className="gradient-text">Strom oder Gas?</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200 md:text-xl">
            Lade deine letzte Rechnung hoch. Wir analysieren die wichtigsten Tarifdaten und zeigen dir verständlich, wo du stehst.
          </p>

          <div className="mt-8 max-w-2xl rounded-[1.75rem] border border-white/10 bg-[#06111dcc] p-5 shadow-2xl shadow-black/30 backdrop-blur-xl">
            <BillUpload onContinue={() => window.location.assign(BILL_CONTACT_PATH)} />
            <p className="mt-3 text-center text-xs leading-5 text-slate-400">Deine Rechnung wird nur für die Prüfung verwendet.</p>
          </div>

          <p className="mt-5 text-sm font-semibold text-slate-300">Kostenlos · unverbindlich · keine Wechselpflicht</p>
        </div>
      </div>
    </section>
  );
}
