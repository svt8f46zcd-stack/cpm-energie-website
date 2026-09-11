"use client";

import Image from "next/image";
import BillUpload from "@/components/BillUpload";

type BillFlowState = "idle" | "uploading" | "analyzing" | "success" | "error";
type MobileHeroProps = { onStatusChange?: (status: BillFlowState) => void };

const BASE = process.env.NEXT_PUBLIC_GITHUB_PAGES === "true" ? "/cpm-energie-website" : "";
const getBillContactPath = () => `${window.location.pathname.startsWith("/cpm-energie-website") ? "/cpm-energie-website" : ""}/kontakt/rechnung/`;

export function MobileHero({ onStatusChange }: MobileHeroProps) {
  return (
    <section className="mobile-hero hero-premium relative isolate overflow-hidden border-b border-white/10 bg-[#06090d]" aria-labelledby="mobile-hero-heading">
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_50%_18%,rgba(25,183,255,.16),transparent_38%),linear-gradient(180deg,#06131f_0%,#06090d_88%)]" />

      <div className="mx-auto flex min-h-[calc(100svh-68px)] w-full max-w-[620px] flex-col px-4 py-10">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.025] p-3">
          <Image
            src={`${BASE}/cristiano.svg`}
            alt="Cristiano Moreira, persönlicher Ansprechpartner von CPM Energie"
            width={70}
            height={70}
            priority
            className="h-[70px] w-[58px] shrink-0 rounded-xl object-cover object-center"
          />
          <div>
            <p className="text-sm font-black text-white">Cristiano Moreira</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">Persönliche Energieberatung aus Rheinhessen</p>
          </div>
        </div>

        <div className="mt-7 text-center">
          <div className="hero-kicker">Kostenlos · Unverbindlich · DSGVO-orientiert</div>
          <h1 id="mobile-hero-heading" className="mt-5 text-[2.65rem] font-black leading-[.94] tracking-[-.055em] text-white sm:text-5xl">
            Kein Tarif-Dschungel. Kein automatischer Wechsel. <span className="gradient-text">Nur ehrliche Klarheit.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-[500px] text-base leading-7 text-slate-100/90">
            Lade deine letzte Strom- oder Gasrechnung hoch. Ich analysiere persönlich Arbeitspreis, Grundpreis und die relevanten Tarifdaten.
          </p>
        </div>

        <div className="relative mx-auto mt-7 w-full max-w-[520px]">
          <div className="absolute -inset-5 rounded-[2.4rem] bg-[#19b7ff]/10 blur-3xl" />
          <div className="relative rounded-[2rem] border border-white/15 bg-[#06111dcc] p-4 shadow-2xl shadow-black/50 backdrop-blur-xl">
            <BillUpload onStatusChange={onStatusChange} onContinue={() => window.location.assign(getBillContactPath())} />

            <div className="mt-3 grid gap-2">
              <div className="cpm-upload-trust"><b>🔒</b><span><strong>Sicher übertragen</strong><small>HTTPS/TLS über GitHub Pages</small></span></div>
              <div className="cpm-upload-trust"><b>🛡</b><span><strong>Keine Wechselpflicht</strong><small>Das Hochladen schließt keinen Vertrag</small></span></div>
              <div className="cpm-upload-trust"><b>✓</b><span><strong>Kostenlos</strong><small>Keine Registrierung erforderlich</small></span></div>
            </div>

            <p className="mt-3 text-center text-[11px] leading-5 text-slate-500">
              Deine Rechnung wird für die angefragte Tarifprüfung verarbeitet. Weitere Informationen findest du in den
              <a href={`${BASE}/datenschutz/`} className="ml-1 text-slate-300 underline">Datenschutzhinweisen</a>.
            </p>
          </div>
        </div>

        <div className="mt-5 flex justify-center gap-4 text-xs font-bold text-slate-400">
          <a href="https://wa.me/4917661077323" target="_blank" rel="noopener noreferrer" className="text-white">WhatsApp</a>
          <a href="tel:+4917661077323" className="text-white">0176 61077323</a>
          <a href={`${BASE}/impressum/`} className="text-white underline">Impressum</a>
        </div>
      </div>
    </section>
  );
}
