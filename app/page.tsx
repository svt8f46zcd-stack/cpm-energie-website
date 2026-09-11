"use client";

import Image from "next/image";
import { useState } from "react";
import { CTASection } from "@/components/CTASection";
import { BillFeatures } from "@/components/BillFeatures";
import { BillFlow } from "@/components/BillFlow";
import { ResponsiveHero } from "@/components/ResponsiveHero";

type BillFlowState = "idle" | "uploading" | "analyzing" | "success" | "error";
const BASE = process.env.NEXT_PUBLIC_GITHUB_PAGES === "true" ? "/cpm-energie-website" : "";

const marqueeItems = [
  "Strom & Gas",
  "Arbeitspreis",
  "Grundpreis",
  "Verbrauch",
  "Tarifprüfung",
  "Persönlicher Ansprechpartner",
];

export default function Home() {
  const [billFlowState, setBillFlowState] = useState<BillFlowState>("idle");

  return (
    <>
      <div id="rechnung-pruefen">
        <ResponsiveHero onStatusChange={setBillFlowState} />
      </div>

      <div className="cpm-home-marquee" aria-label="CPM Energie Leistungsübersicht">
        <div className="cpm-home-marquee-track">
          {[...marqueeItems, ...marqueeItems].map((item, index) => (
            <span key={`${item}-${index}`}><b />{item}</span>
          ))}
        </div>
      </div>

      <BillFlow status={billFlowState} />
      <BillFeatures />

      <section className="cpm-section cpm-section-dark" id="transparenz" aria-labelledby="transparenz-heading">
        <div className="container">
          <p className="cpm-eyebrow">Vertrauensarchitektur</p>
          <h2 id="transparenz-heading" className="cpm-section-title">Erst verstehen. Dann entscheiden.</h2>
          <p className="cpm-section-copy">CPM Energie stellt die entscheidenden Tarifdaten in den Mittelpunkt. Keine undurchsichtige Ergebnisliste, sondern eine nachvollziehbare Grundlage für deine Entscheidung.</p>

          <div className="cpm-architecture">
            <article className="cpm-architecture-card">
              <span className="cpm-architecture-label">Das Problem</span>
              <h3>Tariflisten ohne Kontext</h3>
              <p>Ein günstiger Monatsbeitrag sagt wenig aus, wenn Verbrauch, Arbeitspreis, Grundpreis und Vertragsdetails nicht zusammen betrachtet werden.</p>
              <div className="cpm-architecture-list">
                <div><i>×</i> Preise wirken günstiger als sie sind</div>
                <div><i>×</i> Wichtige Tarifdaten sind schwer vergleichbar</div>
                <div><i>×</i> Der persönliche Ansprechpartner fehlt</div>
              </div>
            </article>
            <article className="cpm-architecture-card good">
              <span className="cpm-architecture-label">CPM Ansatz</span>
              <h3>Rechnung als Ausgangspunkt</h3>
              <p>Wir strukturieren die Daten deiner Rechnung, erklären die relevanten Werte und zeigen dir verständlich, worauf du beim Vergleich achten solltest.</p>
              <div className="cpm-architecture-list">
                <div><i>✓</i> Verbrauch und Arbeitspreis im Blick</div>
                <div><i>✓</i> Grundpreis und Tarifdetails nachvollziehbar</div>
                <div><i>✓</i> Persönliche Erklärung statt anonymer Liste</div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="cpm-section" id="tools" aria-labelledby="tools-heading">
        <div className="container">
          <p className="cpm-eyebrow">Werkzeuge</p>
          <h2 id="tools-heading" className="cpm-section-title">Weniger Tarifchaos. Mehr Klarheit.</h2>
          <p className="cpm-section-copy">Die wichtigsten Schritte an einem Ort. Starte mit deiner Rechnung oder nutze den Rechner für einen ersten Überblick.</p>
          <div className="cpm-tools-grid">
            <a className="cpm-tool-card" href={`${BASE}/ersparnisrechner/`}>
              <span className="cpm-tool-number">01 · RECHNER</span>
              <h3>Ersparnisrechner</h3>
              <p>Verbrauch, Arbeitspreis und Grundpreis eingeben und die mögliche Differenz transparent berechnen.</p>
              <span className="cpm-tool-link">Rechner öffnen →</span>
            </a>
            <a className="cpm-tool-card" href={`${BASE}/ersparnisrechner/`}>
              <span className="cpm-tool-number">02 · VERGLEICH</span>
              <h3>Tarifvergleich</h3>
              <p>Entscheidende Tarifwerte verstehen und Angebote nicht nur nach einem scheinbar niedrigen Monatsbetrag beurteilen.</p>
              <span className="cpm-tool-link">Vergleich starten →</span>
            </a>
            <a className="cpm-tool-card" href={`${BASE}/kontakt/`}>
              <span className="cpm-tool-number">03 · PERSÖNLICH</span>
              <h3>Direkter Ansprechpartner</h3>
              <p>Wenn etwas unklar ist, kannst du die Analyse persönlich besprechen und die nächsten Schritte selbst entscheiden.</p>
              <span className="cpm-tool-link">Kontakt aufnehmen →</span>
            </a>
          </div>
        </div>
      </section>

      <section className="cpm-section cpm-section-dark" aria-labelledby="process-heading">
        <div className="container">
          <p className="cpm-eyebrow">So funktioniert's</p>
          <h2 id="process-heading" className="cpm-section-title">Von der Rechnung zur klaren Entscheidung.</h2>
          <div className="cpm-steps">
            <div className="cpm-step"><span>01</span><h3>Rechnung hochladen</h3><p>Nutze deine letzte Strom oder Gasrechnung als Datengrundlage.</p></div>
            <div className="cpm-step"><span>02</span><h3>Daten prüfen</h3><p>Verbrauch, Arbeitspreis und Grundpreis werden strukturiert betrachtet.</p></div>
            <div className="cpm-step"><span>03</span><h3>Ergebnis verstehen</h3><p>Die relevanten Werte werden verständlich und ohne Fachsprache erklärt.</p></div>
            <div className="cpm-step"><span>04</span><h3>Selbst entscheiden</h3><p>Du entscheidest, ob und wie du weiter vorgehen möchtest.</p></div>
          </div>
        </div>
      </section>

      <section className="cpm-section" aria-labelledby="personal-heading">
        <div className="container">
          <div className="grid items-center gap-12 md:grid-cols-[.8fr_1.2fr] md:gap-20">
            <div className="mx-auto w-full max-w-[380px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b1117] shadow-2xl shadow-black/30">
              <div className="aspect-[4/5] overflow-hidden bg-[#0b1117]">
                <Image src={`${BASE}/cristiano.svg`} alt="Cristiano Moreira, persönlicher Ansprechpartner von CPM Energie" width={600} height={900} priority={false} className="h-full w-full object-cover object-center" />
              </div>
            </div>
            <div className="max-w-2xl">
              <p className="cpm-eyebrow">Persönlich bei Fragen</p>
              <h2 id="personal-heading" className="cpm-section-title">Digital geprüft. Persönlich erklärt.</h2>
              <p className="cpm-section-copy">Deine Rechnung liefert die Fakten. Wenn du danach Fragen hast, bekommst du einen persönlichen Ansprechpartner statt einer anonymen Tarifliste.</p>
              <a href={`${BASE}/kontakt/`} className="cpm-tool-link inline-flex">Persönlich sprechen →</a>
            </div>
          </div>
        </div>
      </section>

      <section className="cpm-section pt-0" aria-label="Abschluss">
        <div className="container">
          <div className="cpm-final-cta">
            <p className="cpm-eyebrow">Der nächste Schritt</p>
            <h2 className="mt-3">Mach aus deiner Rechnung eine klare Entscheidungsgrundlage.</h2>
            <p>Lade deine letzte Strom oder Gasrechnung hoch und starte die Prüfung kostenlos und unverbindlich.</p>
            <a href={`${BASE}/kontakt/rechnung/`}>Rechnung prüfen →</a>
          </div>
        </div>
      </section>

      <CTASection />
    </>
  );
}
