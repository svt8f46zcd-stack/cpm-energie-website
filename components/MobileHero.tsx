"use client";

import BillUpload from "@/components/BillUpload";

type BillFlowState = "idle" | "uploading" | "analyzing" | "success" | "error";
type MobileHeroProps = { onStatusChange?: (status: BillFlowState) => void };

const getBillContactPath = () => `${window.location.pathname.startsWith("/cpm-energie-website") ? "/cpm-energie-website" : ""}/kontakt/rechnung/`;

export function MobileHero({ onStatusChange }: MobileHeroProps) {
  return (
    <section className="mobile-hero hero-premium relative isolate overflow-hidden border-b border-white/10 bg-[#020914]" aria-labelledby="mobile-hero-heading">
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_50%_18%,rgba(25,183,255,.19),transparent_38%),linear-gradient(180deg,#06182b_0%,#020914_82%)]" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(2,9,20,.42)_0%,rgba(2,9,20,.76)_42%,#020914_90%)]" />

      <div className="mx-auto flex min-h-[calc(100svh-68px)] w-full max-w-[620px] flex-col justify-center px-4 py-12">
        <div className="text-center">
          <div className="hero-kicker">Strom &amp; Gas · kostenlos</div>
          <h1 id="mobile-hero-heading" className="mt-5 text-[2.7rem] font-black leading-[.94] tracking-[-.055em] text-white sm:text-5xl">Zahlst du zu viel für <span className="gradient-text">Strom oder Gas?</span></h1>
          <p className="mx-auto mt-5 max-w-[500px] text-base leading-7 text-slate-100/90">Lade deine letzte Rechnung hoch. Wir lesen die wichtigsten Tarifdaten aus und zeigen dir verständlich, wo du stehst.</p>
        </div>

        <div className="relative mx-auto mt-7 w-full max-w-[520px]">
          <div className="absolute -inset-5 rounded-[2.4rem] bg-[#19b7ff]/10 blur-3xl" />
          <div className="relative rounded-[2rem] border border-white/15 bg-[#06111dcc] p-4 shadow-2xl shadow-black/50 backdrop-blur-xl">
            <BillUpload onStatusChange={onStatusChange} onContinue={() => window.location.assign(getBillContactPath())} />
            <div className="mt-3 rounded-xl border border-emerald-400/10 bg-emerald-400/5 px-3 py-2 text-center text-xs leading-5 text-slate-400">Sicher übertragen · kostenlos · keine Wechselpflicht</div>
          </div>
        </div>

        <div className="hero-proof mx-auto mt-5 justify-center">
          <span>Kostenlos</span>
          <span>Unverbindlich</span>
          <span>Persönlich</span>
        </div>
      </div>
    </section>
  );
}
