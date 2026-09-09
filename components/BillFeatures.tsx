const FEATURES = [
  { title: "Verbrauch", text: "Jahresverbrauch in kWh" },
  { title: "Arbeitspreis", text: "Preis pro kWh" },
  { title: "Grundpreis", text: "Fixkosten pro Jahr" },
  { title: "Vertragslaufzeit", text: "Vertragsende und Fristen" },
] as const;

export function BillFeatures() {
  return (
    <section className="border-y border-white/10 bg-[#071321]" aria-labelledby="features-heading">
      <div className="container py-20 md:py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[.22em] text-[#66d5ff]">Tarifdaten</p>
          <h2 id="features-heading" className="mt-3 text-3xl font-black tracking-[-.04em] text-white md:text-5xl">Was wir aus deiner Rechnung prüfen</h2>
        </div>
        <div className="mt-10 grid max-w-5xl gap-px overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/10 md:grid-cols-2">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="bg-[#071321] p-6 md:p-8">
              <div className="flex items-start gap-4">
                <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#19b7ff]/10 text-sm font-black text-[#66d5ff]">✓</span>
                <div><h3 className="text-lg font-black text-white">{feature.title}</h3><p className="mt-1 text-sm leading-6 text-slate-400">{feature.text}</p></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
