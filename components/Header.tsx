"use client";

import { useState } from "react";

const BASE = process.env.NEXT_PUBLIC_GITHUB_PAGES === "true" ? "/cpm-energie-website" : "";
const links = [
  ["Startseite", `${BASE}/`],
  ["Ersparnisrechner", `${BASE}/ersparnisrechner/`],
  ["So funktioniert's", `${BASE}/so-funktionierts/`],
  ["Über mich", `${BASE}/ueber-mich/`],
  ["Impressum", `${BASE}/impressum/`],
] as const;

const LOGO_SRC = `${BASE}/logo-cpm-energie.svg?v=20260911-1`;

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="site-header-inner container">
        <a href={`${BASE}/`} aria-label="CPM Energie Startseite" className="site-header-logo">
          <img src={LOGO_SRC} alt="CPM Energie – Mehr Möglichkeiten für Morgen" width={1050} height={475} draggable={false} />
        </a>

        <div className="site-header-direct">
          <a href="tel:+4917661077323" aria-label="CPM Energie anrufen">0176 61077323</a>
          <a href="https://wa.me/4917661077323" target="_blank" rel="noopener noreferrer" aria-label="CPM Energie über WhatsApp kontaktieren">WhatsApp</a>
        </div>

        <nav className="site-header-nav" aria-label="Hauptnavigation">
          {links.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
          <a href={`${BASE}/kontakt/`} className="site-header-cta">Kostenlos prüfen</a>
        </nav>

        <button onClick={() => setOpen(!open)} className="site-header-menu" aria-label={open ? "Menü schließen" : "Menü öffnen"} aria-expanded={open} type="button">
          {open ? "×" : "☰"}
        </button>
      </div>

      {open && (
        <nav className="site-header-mobile-nav container" aria-label="Mobile Navigation">
          {links.map(([label, href]) => <a onClick={() => setOpen(false)} key={href} href={href}>{label}</a>)}
          <a onClick={() => setOpen(false)} href="tel:+4917661077323">0176 61077323</a>
          <a onClick={() => setOpen(false)} href="https://wa.me/4917661077323" target="_blank" rel="noopener noreferrer">WhatsApp</a>
          <a onClick={() => setOpen(false)} href={`${BASE}/kontakt/`} className="site-header-cta">Kostenlos prüfen</a>
        </nav>
      )}
    </header>
  );
}
