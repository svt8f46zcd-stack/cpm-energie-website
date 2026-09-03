import Link from "next/link";

export function CTASection() {
  return <section className="container pb-24"><div className="overflow-hidden rounded-[2rem] border border-[#19b7ff]/25 bg-gradient-to-br from-[#0b2944] to-[#081426] p-8 md:p-14"><div className="max-w-2xl"><p className="text-sm font-bold uppercase tracking-[.2em] text-[#19b7ff]">Nächster Schritt</p><h2 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">Was könnten Sie jeden Monat sparen?</h2><p className="mt-5 text-lg leading-8 text-slate-300">Lassen Sie Ihren aktuellen Strom- oder Gastarif kostenlos prüfen. Ohne Verpflichtung.</p><Link href="/ersparnisrechner" className="mt-8 inline-flex rounded-full bg-[#19b7ff] px-7 py-4 font-bold text-[#03101c] hover:bg-white">Ersparnis prüfen</Link></div></div></section>;
}
