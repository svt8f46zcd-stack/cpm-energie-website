const FLOW_ITEMS = [
  { number: "01", title: "Rechnung", text: "Deine Abrechnung" },
  { number: "02", title: "Analyse", text: "Tarifdaten geprüft" },
  { number: "03", title: "Ergebnis", text: "Klar verständlich" },
] as const;

export function BillFlow() {
  return (
    <section className="border-y border-white/10 bg-[#06111d]" aria-labelledby="flow-heading">
      <div className="container py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[.22em] text-[#66d5ff]">Dein Weg zur Klarheit</p>
          <h2 id="flow-heading" className="mt-3 text-3xl font-black tracking-[-.04em] text-white md:text-5xl">Rechnung → Analyse → Ergebnis</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-400 md:text-lg">Ein klarer Prozess ohne Tarifdschungel.</p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl items-center gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
          <div className="flow-card flow-card-one">
            <span className="flow-icon">{FLOW_ITEMS[0].number}</span>
            <span><strong>{FLOW_ITEMS[0].title}</strong><small>{FLOW_ITEMS[0].text}</small></span>
          </div>
          <span className="flow-arrow" aria-hidden="true">→</span>
          <div className="flow-card flow-card-two">
            <span className="flow-icon">{FLOW_ITEMS[1].number}</span>
            <span><strong>{FLOW_ITEMS[1].title}</strong><small>{FLOW_ITEMS[1].text}</small></span>
          </div>
          <span className="flow-arrow" aria-hidden="true">→</span>
          <div className="flow-card flow-card-three">
            <span className="flow-icon">{FLOW_ITEMS[2].number}</span>
            <span><strong>{FLOW_ITEMS[2].title}</strong><small>{FLOW_ITEMS[2].text}</small></span>
          </div>
        </div>
      </div>
    </section>
  );
}
