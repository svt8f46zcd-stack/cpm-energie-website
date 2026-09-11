"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import BillUpload from "@/components/BillUpload";

type BillFlowState = "idle" | "uploading" | "analyzing" | "success" | "error";
type DesktopHeroProps = { onStatusChange?: (status: BillFlowState) => void };

const isGitHubPages = process.env.NEXT_PUBLIC_GITHUB_PAGES === "true";
const BASE = isGitHubPages ? "/cpm-energie-website" : "";
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

      <div className="container relative z-10 grid min-h-[780px] items-center gap-12 py-16 lg:grid-cols-[1.08fr_.72fr]">
        <div className="w-full max-w-3xl">
          <div className="hero-kicker">Kostenlos · Unverbindlich · DSGVO-orientiert</div>

          <h1 id="hero-heading" className="mt-6 max-w-3xl text-5xl font-black leading-[.93] tracking-[-.06em] text-white md:text-7xl xl:text-[5.05rem]">
            Kein Tarif-Dschungel. Kein automatischer Wechsel. <span className="gradient-text">Nur ehrliche Klarheit.</span>
          </h1>

          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300 md:text-xl">
            Lade deine letzte Strom- oder Gasrechnung hoch. Ich analysiere persönlich Arbeitspreis, Grundpreis und die relevanten Tarifdaten, damit du genau verstehst, was du aktuell bezahlst.
          </p>

          <div className="mt-7 flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[.025] p-4">
            <Image
              src={`${BASE}/cristiano.svg`}
              alt="Cristiano Moreira, persönlicher Ansprechpartner von CPM Energie"
              width={84}
              height={84}
              priority
              className="h-[84px] w-[70px] shrink-0 rounded-xl object-cover object-center"
            />
            <div>
              <p className="text-sm font-black text-white">Cristiano Moreira</p>
              <p className="mt-1 text-sm leading-6 text-slate-400">
                „Mein Ziel ist nicht, dir einen neuen Vertrag zu verkaufen, sondern dir absolute Klarheit über deine Energiekosten zu geben.“
              </p>
            </div>
          </div>

          <div className="mt-6 max-w-2xl rounded-[1.9rem] border border-white/10 bg-[#0b1117]/90 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl md:p-6">
            <BillUpload onStatusChange={onStatusChange} onContinue={() => window.location.assign(getBillContactPath())} />

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <div className="cpm-upload-trust"><b>🔒</b><span><strong>Sicher übertragen</strong><small>HTTPS/TLS über GitHub Pages</small></span></div>
              <div className="cpm-upload-trust"><b>🛡</b><span><strong>Keine Wechselpflicht</strong><small>Prüfung ist keine Zustimmung</small></span></div>
              <div className="cpm-upload-trust"><b>✓</b><span><strong>Kostenlos</strong><small>Keine Registrierung nötig</small></span></div>
            </div>

            <div className="mt-3 text-center text-[11px] leading-5 text-slate-500">
              Die Rechnung wird für die angefragte Tarifprüfung verarbeitet. Es wird durch das Hochladen kein Energievertrag abgeschlossen.
              <a href={`${BASE}/datenschutz/`} className="ml-1 text-slate-300 underline">Datenschutz</a>
              <span className="mx-1">·</span>
              <a href={`${BASE}/impressum/`} className="text-slate-300 underline">Impressum</a>
            </div>
          </div>

          <div className="hero-proof"><span>Kostenlos</span><span>Keine Wechselpflicht</span><span>Persönlich erklärt</span></div>
        </div>

        <div className="hidden lg:block">
          <div className="cpm-hero-visual-stack">
            <div className="cpm-hero-photo-card">
              <Image
                src={`${BASE}/cristiano.svg`}
                alt="Cristiano Moreira von CPM Energie"
                width={620}
                height={900}
                className="cpm-hero-main-photo"
                priority
              />
              <div className="cpm-hero-photo-caption">
                <strong>Persönlich erreichbar</strong>
                <span>Telefon · WhatsApp · E-Mail</span>
              </div>
            </div>

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
      </div>
    </section>
  );
}
