"use client";

import BillUpload from "@/components/BillUpload";
import { CPMEnergyFlow } from "@/components/CPMEnergyFlow";

type BillFlowState = "idle" | "uploading" | "analyzing" | "success" | "error";
type DesktopHeroProps = { onStatusChange?: (status: BillFlowState) => void };

const isGitHubPages = process.env.NEXT_PUBLIC_GITHUB_PAGES === "true";
const getBillContactPath = () => `${window.location.pathname.startsWith("/cpm-energie-website") ? "/cpm-energie-website" : ""}/kontakt/rechnung/`;

export function DesktopHero({ onStatusChange }: DesktopHeroProps) {
  return (
    <section className="hero-premium relative isolate overflow-hidden border-b border-white/10 bg-[#020914]" aria-labelledby="hero-heading">
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_72%_35%,rgba(25,183,255,.16),transparent_32%),linear-gradient(135deg,#020914_0%,#06182b_55%,#020914_100%)]" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(2,9,20,.98)_0%,rgba(2,9,20,.86)_55%,rgba(2,9,20,.58)_100%)]" />

      <div className="container relative z-10 grid min-h-[760px] items-center gap-14 py-20 lg:grid-cols-[1.05fr_.75fr]">
        <div className="w-full max-w-3xl">
          <div className="hero-kicker">Strom &amp; Gas · kostenlos &amp; unverbindlich</div>
          <h1 id="hero-heading" className="mt-6 max-w-3xl text-5xl font-black leading-[.93] tracking-[-.06em] text-white md:text-7xl xl:text-[5.25rem]">Zahlst du zu viel für <span className="gradient-text">Strom oder Gas?</span></h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-200 md:text-xl">Lade deine letzte Rechnung hoch. Wir lesen die entscheidenden Tarifdaten aus und machen sichtbar, was du aktuell bezahlst.</p>

          <div className="mt-8 max-w-2xl rounded-[1.9rem] border border-white/10 bg-[#06111dcc] p-5 shadow-2xl shadow-black/30 backdrop-blur-xl md:p-6">
            <BillUpload onStatusChange={onStatusChange} onContinue={() => window.location.assign(getBillContactPath())} />
            <div className="mt-4 rounded-xl border border-emerald-400/10 bg-emerald-400/5 px-3 py-2 text-center text-xs leading-5 text-slate-400">Sicher übertragen · nur zur Tarifprüfung verwendet · keine Wechselpflicht</div>
          </div>

          <div className="hero-proof">
            <span>Kostenlos</span>
            <span>Unverbindlich</span>
            <span>Persönlich erklärt</span>
          </div>
        </div>

        <div className="hidden lg:block">
          {isGitHubPages ? (
            <div className="cpm-energy-stage mx-auto w-full max-w-[440px]">
              <CPMEnergyFlow />
            </div>
          ) : (
            <div className="hero-dashboard mx-auto w-full max-w-[440px]">
              <div className="hero-dashboard-head">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[.18em] text-slate-500">CPM Energie</div>
                  <div className="mt-1 text-sm font-extrabold text-white">Tarifprüfung</div>
                </div>
                <span className="hero-dashboard-dot" aria-label="Prüfung aktiv" />
              </div>
              <div className="hero-dashboard-body space-y-4">
                <div className="hero-dashboard-card">
                  <div className="text-[11px] font-bold uppercase tracking-[.14em] text-slate-500">Deine Rechnung</div>
                  <div className="hero-metric mt-4">
                    <div>
                      <small>Verbrauch</small>
                      <strong>3.240 <span className="text-base font-bold text-slate-400">kWh</span></strong>
                    </div>
                    <div className="text-right"><small>Arbeits­preis</small><strong className="text-[1.45rem]">31,8 <span className="text-sm text-slate-400">ct/kWh</span></strong></div>
                  </div>
                  <div className="hero-mini-bar"><i /></div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="hero-dashboard-card">
                    <small className="text-[11px] font-semibold text-slate-500">Grundpreis</small>
                    <div className="mt-2 text-xl font-black text-white">168 €</div>
                    <div className="mt-1 text-[11px] text-slate-500">pro Jahr</div>
                  </div>
                  <div className="hero-dashboard-card">
                    <small className="text-[11px] font-semibold text-slate-500">Analyse</small>
                    <div className="mt-2 text-xl font-black text-[#9fe8ff]">Bereit</div>
                    <div className="mt-1 text-[11px] text-slate-500">klar &amp; nachvollziehbar</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#19b7ff]/15 bg-[#19b7ff]/[.06] p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#19b7ff]/10 text-sm text-[#7de0ff]">✓</div>
                    <div>
                      <div className="text-sm font-extrabold text-white">Erst verstehen. Dann entscheiden.</div>
                      <p className="mt-1 text-xs leading-5 text-slate-400">Keine Tarifliste ohne Kontext. Deine Rechnung ist die Grundlage.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
