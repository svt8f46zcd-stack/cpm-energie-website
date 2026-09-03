import Link from "next/link";

export function Footer() {
  return <footer className="border-t border-white/10 bg-[#040b15] py-10">
    <div className="container flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div><div className="text-lg font-black">CPM <span className="text-[#19b7ff]">ENERGIE</span></div><p className="mt-2 text-sm text-slate-500">Persönliche Tarifprüfung für Strom und Gas.</p></div>
      <div className="flex gap-5 text-sm text-slate-400"><Link href="/impressum">Impressum</Link><Link href="/datenschutz">Datenschutz</Link><Link href="/kontakt">Kontakt</Link></div>
    </div>
  </footer>;
}
