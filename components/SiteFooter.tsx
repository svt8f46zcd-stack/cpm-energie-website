import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#020914]">
      <div className="container flex flex-col gap-6 py-10 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-black text-white">CPM Energie</p>
          <p className="mt-1">Strom & Gas verständlich geprüft.</p>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Footer Navigation">
          <Link href="/impressum/" className="transition hover:text-white">Impressum</Link>
          <Link href="/datenschutz/" className="transition hover:text-white">Datenschutz</Link>
          <Link href="/kontakt/" className="transition hover:text-white">Kontakt</Link>
        </nav>
      </div>
    </footer>
  );
}
