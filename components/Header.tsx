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
const LOGO_SRC = `${ASSET_BASE}/logo-cpm-header.svg?v=20260905-6`;

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full max-w-[100vw] overflow-x-clip border-b border-white/10 bg-[#06101f]/98 backdrop-blur-xl">
      <div className="container flex h-[128px] min-w-0 items-center justify-between gap-4 sm:h-[142px]">
        <Link href="/" aria-label="CPM Energie Startseite" className="block h-[112px] w-[224px] shrink-0 sm:h-[124px] sm:w-[248px]">
          <img
            src={LOGO_SRC}
            alt="CPM Energie – Mehr Möglichkeiten für Morgen"
            className="block h-full w-full object-contain"
            width="1536"
            height="768"
            draggable="false"
          />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="text-sm text-slate-300 transition hover:text-white">{label}</Link>
          ))}
          <Link href="/kontakt" className="rounded-full bg-[#19b7ff] px-5 py-2.5 text-sm font-bold text-[#03101c] transition hover:bg-white">Kostenlos prüfen</Link>
        </nav>

        <button onClick={() => setOpen(!open)} className="shrink-0 rounded-xl border border-white/10 px-3.5 py-2.5 text-xl leading-none text-white" aria-label={open ? "Menü schließen" : "Menü öffnen"} aria-expanded={open}>
          {open ? "×" : "☰"}
        </button>
      </div>

      {open && (
        <nav className="container flex flex-col gap-4 border-t border-white/10 py-5 md:hidden">
          {links.map(([label, href]) => (
            <Link onClick={() => setOpen(false)} key={href} href={href} className="text-slate-200">{label}</Link>
          ))}
          <Link onClick={() => setOpen(false)} href="/kontakt" className="rounded-full bg-[#19b7ff] px-5 py-3 text-center font-bold text-[#03101c]">Kostenlos prüfen</Link>
        </nav>
      )}
    </header>
  );
}
