import Link from "next/link";

export function CTASection() {
  return (
    <section className="container py-20 md:py-28" aria-labelledby="final-cta-heading">
      <div className="overflow-hidden rounded-[2rem] border border-[#19b7ff]/25 bg-gradient-to-br from-[#0b2944] to-[#081426] p-8 text-center md:p-14">
        <p className="text-xs font-bold uppercase tracking-[.22em] text-[#66d5ff]">CPM Energie</p>
        <h2 id="final-cta-heading" className="mt-3 text-3xl font-black tracking-[-.04em] text-white md:text-5xl">Bereit für Klarheit?</h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">Lade deine aktuelle Rechnung hoch und erfahre, welche Tarifdaten darin stecken.</p>
        <Link href="#rechnung-pruefen" className="mt-8 inline-flex rounded-full bg-[#19b7ff] px-7 py-4 font-bold text-[#03101c] transition hover:bg-white">Rechnung kostenlos prüfen</Link>
        <p className="mt-3 text-xs font-semibold text-slate-400">Kostenlos · unverbindlich · keine Wechselpflicht</p>
      </div>
    </section>
  );
}
