"use client";

import dynamic from "next/dynamic";
import BillUpload from "@/components/BillUpload";

type BillFlowState = "idle" | "uploading" | "analyzing" | "success" | "error";
type DesktopHeroProps = { onStatusChange?: (status: BillFlowState) => void };

const isGitHubPages = process.env.NEXT_PUBLIC_GITHUB_PAGES === "true";
const CPMEnergyFlow = dynamic(
  () => import("@/components/CPMEnergyFlow").then((mod) => mod.CPMEnergyFlow),
  { ssr: false },
);
const getBillContactPath = () => `${window.location.pathname.startsWith("/cpm-energie-website") ? "/cpm-energie-website" : ""}/kontakt/rechnung/`;

const events = [
  ["RECHNUNG", "Eingang erkannt"],
  ["VERBRAUCH", "Jahresverbrauch strukturiert"],
  ["ARBEITSPREIS", "Preis je kWh identifiziert"],
  ["GRUNDPREIS", "Fixkosten identifiziert"],
];

export function DesktopHero({ onStatusChange }: DesktopHeroProps) {
  return (
    <section className="hero-premium relative isolate overflow-hidden border-b border-white/10 bg-[#06090d]" aria-labelledby="hero-heading">
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_78%_38%,rgba(25,183,255,.14),transparent_28%),radial-gradient(circle_at_8%_80%,rgba(163,230,53,.035),transparent_25%),linear-gradient(135deg,#06090d_0%,#071016_58%,#05080b_100%)]" />
      <div className="absolute inset-0 -z-10 opacity-50 bg-[linear-gradient(rgba(255,255,255,.022)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.022)_1px,transparent_1px)] bg-[size:72px_72px]" />

      <div className="container relative z-10 grid min-h-[760px] items-center gap-14 py-20 lg:grid-cols-[1.08fr_.72fr]">
        <div className="w-full max-w-3xl">
          <div className="hero-kicker">Strom &amp; Gas · kostenlos &amp; unverbindlich</div>
          <h1 id="hero-heading" className="mt-6 max-w-3xl text-5xl font-black leading-[.93] tracking-[-.06em] text-white md:text-7xl xl:text-[5.15rem]">Strom &amp; Gas vergleichen. <span className="gradient-text">Klar.</span> Einfach. Nachvollziehbar.</h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300 md:text-xl">Lade deine letzte Rechnung hoch. Wir strukturieren Verbrauch, Arbeitspreis und Grundpreis, damit du zuerst verstehst, was du aktuell bezahlst.</p>

          <div className="mt-8 max-w-2xl rounded-[1.9rem] border border-white/10 bg-[#0b1117]/90 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl md:p-6">
            <BillUpload onStatusChange={onStatusChange} onContinue={() => window.location.assign(getBillContactPath())} />
            <div className="mt-4 rounded-xl border border-[#a3e635]/10 bg-[#a3e635]/[.035] px-3 py-2 text-center text-xs leading-5 text-slate-400">Sicher übertragen · nur zur Tarifprüfung verwendet · keine Wechselpflicht</div>
          </div>

          <div className="hero-proof"><span>Kostenlos</span><span>Unverbindlich</span><span>Persönlich erklärt</span></div>
        </div>

        <div className="hidden lg:block">
          {isGitHubPages ? (
            <div className="cpm-energy-stage mx-auto w-full max-w-[440px]"><CPMEnergyFlow /></div>
          ) : (
            <div className="cpm-live-panel mx-auto w-full max-w-[440px]" aria-label="Live Transparenzprotokoll">
              <div className="cpm-live-head">
                <div><div className="cpm-live-label">LIVE-TRANSPARENZPROTOKOLL</div><div className="cpm-live-title">Tarifanalyse</div></div>
                <span className="cpm-live-status"><i /> AKTIV</span>
              </div>
              <div className="cpm-live-body">
                <div className="cpm-live-summary"><span>ANALYSEBASIS</span><strong>Deine Rechnung</strong><small>keine Schätzung</small></div>
                <div className="cpm-live-feed">
                  {events.map(([label, text], index) => <div className="cpm-live-event" key={label}><span className="cpm-live-time">0{index + 1}</span><div><b>{label}</b><p>{text}</p></div><em>✓</em></div>)}
                </div>
                <div className="cpm-live-result"><span>ERGEBNIS</span><strong>transparent aufbereitet</strong><p>Entscheidungsgrundlage statt Tarifchaos.</p></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
