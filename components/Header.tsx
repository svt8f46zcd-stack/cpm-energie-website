"use client";

import Link from "next/link";
import { useState } from "react";

const links = [
  ["Startseite", "/"],
  ["Ersparnisrechner", "/ersparnisrechner"],
  ["So funktioniert's", "/so-funktionierts"],
  ["Über mich", "/ueber-mich"],
];

const ASSET_BASE = "/cpm-energie-website";
const LOGO_SRC = `${ASSET_BASE}/logo-cpm-header.svg?v=20260905-7`;

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="site-header-inner container">
        <Link href="/" aria-label="CPM Energie Startseite" className="site-header-logo">
          <img
            src={LOGO_SRC}
            alt="CPM Energie – Mehr Möglichkeiten für Morgen"
            width={1536}
            height={768}
            draggable={false}
          />
        </Link>

        <nav className="site-header-nav" aria-label="Hauptnavigation">
          {links.map(([label, href]) => (
            <Link key={href} href={href}>{label}</Link>
          ))}
          <Link href="/kontakt" className="site-header-cta">Kostenlos prüfen</Link>
        </nav>

        <button
          onClick={() => setOpen(!open)}
          className="site-header-menu"
          aria-label={open ? "Menü schließen" : "Menü öffnen"}
          aria-expanded={open}
          type="button"
        >
          {open ? "×" : "☰"}
        </button>
      </div>

      {open && (
        <nav className="site-header-mobile-nav container" aria-label="Mobile Navigation">
          {links.map(([label, href]) => (
            <Link onClick={() => setOpen(false)} key={href} href={href}>{label}</Link>
          ))}
          <Link onClick={() => setOpen(false)} href="/kontakt" className="site-header-cta">Kostenlos prüfen</Link>
        </nav>
      )}
    </header>
  );
}
