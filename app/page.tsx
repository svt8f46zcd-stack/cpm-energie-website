"use client";

import { useState } from "react";
import Link from "next/link";
import { CTASection } from "@/components/CTASection";
import { BillFeatures } from "@/components/BillFeatures";
import { BillFlow } from "@/components/BillFlow";
import { CPMTariffList } from "@/components/CPMTariffList";
import { ResponsiveHero } from "@/components/ResponsiveHero";
import { WechselpilotTariffCheck } from "@/components/WechselpilotTariffCheck";

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

      <section className="cpm-trust-first" aria-labelledby="cpm-trust-heading">
        <div className="container">
          <div className="cpm-trust-first-heading">
            <p className="cpm-eyebrow">Warum CPM Energie</p>
            <h2 id="cpm-trust-heading" className="cpm-section-title">Vertrauen vor dem ersten Klick.</h2>
            <p className="cpm-section-copy">Bevor du eine Rechnung hochlädst, sollst du wissen, wer sie prüft, warum sie geprüft wird und dass eine Analyse keine Zustimmung zu einem Anbieterwechsel ist.</p>
          </div>

          <div className="cpm-trust-grid">
            <article className="cpm-trust-card"><span className="cpm-trust-icon">🔒</span><h3>Sichere Datenübertragung</h3><p>Die Website wird verschlüsselt über HTTPS ausgeliefert. Deine Rechnung wird für die von dir angeforderte Prüfung verarbeitet. Keine Weitergabe an Werbenetzwerke.</p></article>
            <article className="cpm-trust-card"><span className="cpm-trust-icon">👤</span><h3>Persönliche Prüfung</h3><p>Du hast einen direkten Ansprechpartner. Die relevanten Werte wie Verbrauch, Arbeitspreis und Grundpreis werden verständlich eingeordnet.</p></article>
            <article className="cpm-trust-card"><span className="cpm-trust-icon">✓</span><h3>Absolute Entscheidungsfreiheit</h3><p>Die Prüfung selbst ist keine Zustimmung zu einem neuen Energievertrag. Du entscheidest, ob du danach überhaupt etwas ändern möchtest.</p></article>
            <article className="cpm-trust-card"><span className="cpm-trust-icon">☎</span><h3>Direkt erreichbar</h3><p>Fragen kannst du direkt mit Cristiano Moreira besprechen, per Telefon, WhatsApp oder über das Kontaktformular.</p></article>
          </div>

          <div className="cpm-contact-trust">
            <div><strong>Lieber direkt sprechen?</strong><span>Keine Warteschleife, kein anonymer Chat.</span></div>
            <div className="cpm-contact-actions"><a href="tel:+4917661077323">0176 61077323</a><a href="https://wa.me/4917661077323" target="_blank" rel="noopener noreferrer">WhatsApp</a><Link href="/stromvergleich/">Stromkosten prüfen</Link></div>
          </div>
        </div>
      </section>

      <div className="cpm-home-marquee" aria-label="CPM Energie Leistungsübersicht"><div className="cpm-home-marquee-track">{[...marqueeItems, ...marqueeItems].map((item, index) => <span key={`${item}-${index}`}><b />{item}</span>)}</div></div>

      <BillFlow status={billFlowState} />
      <WechselpilotTariffCheck />
      <CPMTariffList />
      <BillFeatures />

      <section className="cpm-section cpm-section-dark" id="transparenz" aria-labelledby="transparenz-heading">
        <div className="container">
          <p className="cpm-eyebrow">Vertrauensarchitektur</p>
          <h2 id="transparenz-heading" className="cpm-section-title">Erst verstehen. Dann entscheiden.</h2>
          <p className="cpm-section-copy">CPM Energie stellt die entscheidenden Tarifdaten in den Mittelpunkt. Keine undurchsichtige Ergebnisliste, sondern eine nachvollziehbare Grundlage für deine Entscheidung.</p>
          <div className="cpm-architecture">
            <article className="cpm-architecture-card"><span className="cpm-architecture-label">Herkömmliches Portal</span><h3>Viele Angebote, wenig Einordnung</h3><p>Tarife lassen sich nur sinnvoll vergleichen, wenn Verbrauch, Arbeitspreis, Grundpreis und Vertragsdetails gemeinsam betrachtet werden.</p><div className="cpm-architecture-list"><div><i>×</i> Tarifdaten können schwer einzuordnen sein</div><div><i>×</i> Boni können den ersten Eindruck beeinflussen</div><div><i>×</i> Persönlicher Ansprechpartner fehlt häufig</div></div></article>
            <article className="cpm-architecture-card good"><span className="cpm-architecture-label">CPM Energie</span><h3>Rechnung als Ausgangspunkt</h3><p>Wir beginnen mit deinen tatsächlichen Rechnungsdaten und erklären die Werte, die für eine fundierte Entscheidung wichtig sind.</p><div className="cpm-architecture-list"><div><i>✓</i> Verbrauch und Arbeitspreis im Blick</div><div><i>✓</i> Grundpreis und Tarifdetails nachvollziehbar</div><div><i>✓</i> Persönliche Erklärung statt Tarifchaos</div></div></article>
          </div>
        </div>
      </section>

      <section className="cpm-proof-section" aria-labelledby="kundenstimmen-heading"><div className="container"><p className="cpm-eyebrow">Kundenstimmen</p><h2 id="kundenstimmen-heading" className="cpm-section-title">Echte Stimmen statt erfundener Versprechen.</h2><p className="cpm-section-copy">Hier werden ausschließlich freigegebene Kundenstimmen mit echtem Foto und korrekten Angaben veröffentlicht. Bis zur bestätigten Freigabe werden keine Bewertungen oder Ersparnisse erfunden.</p><div className="cpm-testimonial-pending"><strong>Deine echte Kundenstimme gehört hierhin.</strong><span>Foto, vollständiger Name, Ort und Wortlaut erst nach ausdrücklicher Freigabe veröffentlichen.</span></div></div></section>

      <section className="cpm-section" id="partner" aria-labelledby="partner-heading"><div className="container"><p className="cpm-eyebrow">Vertriebspartnerschaften</p><h2 id="partner-heading" className="cpm-section-title">Beratung mit direktem Ansprechpartner.</h2><p className="cpm-section-copy">CPM Energie vermittelt Energieverträge als Vertriebspartner. Eine Vertriebspartnerschaft bedeutet, dass CPM Energie Kunden berät und Verträge für den jeweiligen Anbieter vermittelt. Der eigentliche Energieliefervertrag wird mit dem jeweiligen Anbieter geschlossen.</p><div className="cpm-partner-badges"><div><strong>Vattenfall</strong><span>Vertriebspartner</span></div><div><strong>LichtBlick</strong><span>Vertriebspartner</span></div></div></div></section>

      <section className="cpm-section cpm-section-dark" aria-labelledby="process-heading"><div className="container"><p className="cpm-eyebrow">So funktioniert's</p><h2 id="process-heading" className="cpm-section-title">Von der Rechnung zur klaren Entscheidung.</h2><div className="cpm-steps"><div className="cpm-step"><span>01</span><h3>Rechnung hochladen</h3><p>Nutze deine letzte Strom- oder Gasrechnung als Datengrundlage.</p></div><div className="cpm-step"><span>02</span><h3>Daten prüfen</h3><p>Verbrauch, Arbeitspreis und Grundpreis werden strukturiert betrachtet.</p></div><div className="cpm-step"><span>03</span><h3>Ergebnis verstehen</h3><p>Die relevanten Werte werden verständlich und ohne Fachsprache erklärt.</p></div><div className="cpm-step"><span>04</span><h3>Selbst entscheiden</h3><p>Du entscheidest, ob und wie du weiter vorgehen möchtest.</p></div></div></div></section>

      <section className="cpm-section" aria-labelledby="personal-heading"><div className="container"><div className="grid items-center gap-12 md:grid-cols-[.8fr_1.2fr] md:gap-20"><div className="mx-auto w-full max-w-[380px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b1117] shadow-2xl shadow-black/30"><div className="aspect-[4/5] overflow-hidden bg-[#0b1117]"><img src={`${BASE}/cristiano.svg`} alt="Cristiano Moreira, persönlicher Ansprechpartner von CPM Energie" width="600" height="900" loading="lazy" className="h-full w-full object-cover object-center" /></div></div><div className="max-w-2xl"><p className="cpm-eyebrow">Persönlich bei Fragen</p><h2 id="personal-heading" className="cpm-section-title">Digital geprüft. Persönlich erklärt.</h2><p className="cpm-section-copy">„Mein Ziel ist nicht, dir einen neuen Vertrag zu verkaufen, sondern dir absolute Klarheit über deine Energiekosten zu geben.“</p><div className="cpm-personal-actions"><a href="tel:+4917661077323">Anrufen</a><a href="https://wa.me/4917661077323" target="_blank" rel="noopener noreferrer">WhatsApp</a><a href={`${BASE}/kontakt/`}>Kontakt</a></div></div></div></div></section>

      <section className="cpm-section pt-0" aria-label="Abschluss"><div className="container"><div className="cpm-final-cta"><p className="cpm-eyebrow">Der nächste Schritt</p><h2 className="mt-3">Mach aus deiner Rechnung eine klare Entscheidungsgrundlage.</h2><p>Lade deine letzte Strom- oder Gasrechnung hoch und starte die Prüfung kostenlos und unverbindlich.</p><div className="cpm-decision-strip"><span><b>✓</b> Kostenlos</span><span><b>✓</b> Keine Wechselpflicht</span></div><div className="flex flex-wrap gap-3"><a href="#rechnung-pruefen">Rechnung prüfen →</a><Link href="/stromvergleich/">Stromkosten prüfen →</Link></div></div></div></section>

      <CTASection />
    </>
  );
}
