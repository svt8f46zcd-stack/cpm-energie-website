"use client";

import HeroAddressCheck from "@/components/HeroAddressCheck";
import BillUpload from "@/components/BillUpload";

const HERO_IMAGE = "/cpm-energie-website/hero-cpm-background.svg?v=20260905-3";
const BILL_CONTACT_PATH = "/cpm-energie-website/kontakt/rechnung/";
const ASSET_BASE = "/cpm-energie-website";

export function DesktopHero() {
  return (
    <section className="desktop-hero relative isolate min-h-[900px] overflow-hidden border-b border-white/10 bg-[#020914]">
      <div className="absolute inset-0 -z-20 bg-cover bg-center bg-no-repeat scale-[1.02] motion-safe:animate-[heroDrift_18s_ease-in-out_infinite_alternate]" style={{ backgroundImage: `url(${HERO_IMAGE})` }} />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(2,9,20,.94)_0%,rgba(2,9,20,.78)_34%,rgba(2,9,20,.30)_64%,rgba(2,9,20,.08)_100%)]" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(2,9,20,.90)_0%,transparent_48%,rgba(2,9,20,.10)_100%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_72%_28%,rgba(25,183,255,.18),transparent_25%),radial-gradient(circle_at_84%_72%,rgba(255,190,80,.12),transparent_28%)]" />

      <div className="container relative grid min-h-[900px] items-center gap-10 py-14 md:grid-cols-[1.12fr_.88fr] md:py-20">
        <div className="relative z-20">
          <p className="mb-5 inline-flex rounded-full border border-[#19b7ff]/35 bg-[#031527]/85 px-4 py-2 text-sm font-bold text-[#74dcff] shadow-lg shadow-black/20 backdrop-blur-xl">Strom & Gas · kostenlos & unverbindlich</p>
          <h1 className="max-w-3xl text-5xl font-black leading-[1.01] tracking-[-.045em] text-white md:text-7xl">Prüfe, ob dein <span className="gradient-text">Strom oder Gas</span> Tarif noch passt.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-100/95 md:text-xl">Lade deine aktuelle Rechnung hoch. CPM Energie liest die wichtigen Tarifdaten aus, prüft deinen aktuellen Stand und zeigt dir verständlich, welche Möglichkeiten du hast.</p>

          <div className="mt-6 grid max-w-2xl grid-cols-3 gap-2.5">
            <div className="rounded-2xl border border-white/10 bg-[#06111dcc] p-4 backdrop-blur-xl"><span className="text-xs font-black text-[#66d5ff]">01</span><p className="mt-2 text-sm font-bold text-white">Rechnung hochladen</p><p className="mt-1 text-xs leading-5 text-slate-400">PDF oder Foto</p></div>
            <div className="rounded-2xl border border-white/10 bg-[#06111dcc] p-4 backdrop-blur-xl"><span className="text-xs font-black text-[#66d5ff]">02</span><p className="mt-2 text-sm font-bold text-white">Daten prüfen</p><p className="mt-1 text-xs leading-5 text-slate-400">Verbrauch & Preise</p></div>
            <div className="rounded-2xl border border-white/10 bg-[#06111dcc] p-4 backdrop-blur-xl"><span className="text-xs font-black text-[#66d5ff]">03</span><p className="mt-2 text-sm font-bold text-white">Entscheidung treffen</p><p className="mt-1 text-xs leading-5 text-slate-400">Ohne Wechselzwang</p></div>
          </div>

          <div className="mt-5 max-w-2xl rounded-2xl border border-white/10 bg-[#06111dcc] p-4 shadow-xl shadow-black/20 backdrop-blur-xl">
            <div className="flex items-center gap-3"><div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-[#19b7ff]/40 bg-[#0b1b30]"><img src={`${ASSET_BASE}/cristiano.svg`} alt="Cristiano Moreira, persönliche Energieberatung" className="h-full w-full object-cover" /></div><div><p className="text-sm font-bold text-white">Persönlich statt anonym</p><p className="mt-0.5 text-sm leading-5 text-slate-300">Die Technik übernimmt die Datenerfassung. Die Entscheidung bleibt bei dir.</p></div></div>
          </div>

          <HeroAddressCheck />
          <BillUpload onContinue={() => window.location.assign(BILL_CONTACT_PATH)} />

          <div className="mt-5 flex max-w-2xl flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-slate-300"><span>✓ 100 % kostenlos</span><span>✓ Mehrseitige Rechnungen möglich</span><span>✓ Keine Wechselpflicht</span><span>✓ Persönlicher Ansprechpartner</span></div>
        </div>

        <div className="relative flex min-h-[610px] items-center justify-center">
          <div className="absolute inset-8 rounded-full bg-[#19b7ff]/10 blur-3xl motion-safe:animate-[sceneGlow_6s_ease-in-out_infinite]" />
          <div className="relative z-10 w-full max-w-[500px] overflow-hidden rounded-[2rem] border border-white/15 bg-[#06111dcc] shadow-2xl shadow-black/50 backdrop-blur-xl">
            <div className="relative aspect-[3/4] overflow-hidden bg-[#0b1b30]"><img src={`${ASSET_BASE}/cristiano.svg`} alt="Cristiano Moreira" className="h-full w-full object-cover object-center" /><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#020914] via-[#020914]/55 to-transparent px-7 pb-7 pt-24"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#66d5ff]">CPM Energie</p><h2 className="mt-2 text-2xl font-black text-white">Dein Tarif. Meine Prüfung.</h2><p className="mt-2 max-w-sm text-sm leading-6 text-slate-300">Verständlich geprüft. Transparent erklärt. Du entscheidest selbst.</p></div></div>
          </div>
        </div>
      </div>
    </section>
  );
}
