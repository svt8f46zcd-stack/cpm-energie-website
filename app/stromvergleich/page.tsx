import Link from "next/link";
import StromLeadForm from "@/components/StromLeadForm";
import LeadFormStyles from "@/components/LeadFormStyles";

export const metadata = {
  title: "Stromvergleich kostenlos prüfen | CPM Energie",
  description: "Stromkosten kostenlos prüfen lassen. Verbrauch, Anbieter und Tarifdaten angeben und persönliche Rückmeldung von CPM Energie erhalten.",
};

export default function StromvergleichPage() {
  return (
    <main>
      <LeadFormStyles />
      <section className="relative overflow-hidden border-b border-white/10 py-14 sm:py-20">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-[#19b7ff]/10 blur-3xl" />
        <div className="container relative">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#19b7ff]/20 bg-[#19b7ff]/5 px-4 py-2 text-xs font-black uppercase tracking-[.18em] text-[#8be3ff]">CPM Energie · Stromvergleich</span>
            <h1 className="mt-6 text-4xl font-black tracking-tight text-white sm:text-6xl">Zahlst du zu viel für deinen Strom?</h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">Gib uns deine wichtigsten Tarifdaten. Wir prüfen, ob sich ein genauer Stromvergleich für dich lohnt und melden uns persönlich bei dir.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs font-bold text-slate-400"><span className="rounded-full border border-white/10 bg-white/[.03] px-3 py-2">✓ kostenlos</span><span className="rounded-full border border-white/10 bg-white/[.03] px-3 py-2">✓ unverbindlich</span><span className="rounded-full border border-white/10 bg-white/[.03] px-3 py-2">✓ persönlicher Ansprechpartner</span></div>
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-14">
        <div className="container">
          <StromLeadForm />
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[.02] py-12 sm:py-16">
        <div className="container">
          <div className="mx-auto max-w-4xl">
            <div className="grid gap-4 sm:grid-cols-3">
              <article className="rounded-2xl border border-white/10 bg-white/[.025] p-5"><span className="text-xs font-black uppercase tracking-wider text-[#19b7ff]">01</span><h2 className="mt-3 text-lg font-black text-white">Daten statt Rätsel</h2><p className="mt-2 text-sm leading-6 text-slate-400">Verbrauch, Anbieter, Abschlag und Vertragsstatus ergeben ein brauchbares Bild deiner aktuellen Situation.</p></article>
              <article className="rounded-2xl border border-white/10 bg-white/[.025] p-5"><span className="text-xs font-black uppercase tracking-wider text-[#19b7ff]">02</span><h2 className="mt-3 text-lg font-black text-white">Persönlich erklärt</h2><p className="mt-2 text-sm leading-6 text-slate-400">Du bekommst keinen anonymen Tarifkatalog, sondern einen direkten Ansprechpartner für deine Anfrage.</p></article>
              <article className="rounded-2xl border border-white/10 bg-white/[.025] p-5"><span className="text-xs font-black uppercase tracking-wider text-[#19b7ff]">03</span><h2 className="mt-3 text-lg font-black text-white">Du entscheidest</h2><p className="mt-2 text-sm leading-6 text-slate-400">Die Anfrage selbst beauftragt keinen Anbieterwechsel. Erst nach deiner Entscheidung geht es weiter.</p></article>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="container text-center">
          <p className="text-sm text-slate-500">Du möchtest lieber eine Rechnung prüfen?</p>
          <Link href="/kontakt/rechnung/" className="mt-3 inline-flex rounded-full border border-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/5">Rechnung hochladen →</Link>
        </div>
      </section>
    </main>
  );
}
