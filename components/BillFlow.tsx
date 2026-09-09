const STEPS = [
  { number: "01", title: "Rechnung", text: "Deine aktuelle Abrechnung" },
  { number: "02", title: "Analyse", text: "Tarifdaten strukturiert geprüft" },
  { number: "03", title: "Ergebnis", text: "Klar und verständlich erklärt" },
] as const;

export function BillFlow() {
  return (
    <section className="container py-20 md:py-28" aria-labelledby="flow-heading">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-bold uppercase tracking-[.22em] text-[#66d5ff]">Von der Rechnung zur Klarheit</p>
        <h2 id="flow-heading" className="mt-3 text-3xl font-black tracking-[-.04em] text-white md:text-5xl">Einfach hochladen. Wir machen die Zahlen verständlich.</h2>
      </div>
      <div className="mx-auto mt-12 grid max-w-5xl gap-4 md:grid-cols-3">
        {STEPS.map((step, index) => (
          <div key={step.number} className="relative rounded-[1.5rem] border border-white/10 bg-white/[.035] p-6 text-center">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-[#19b7ff]/30 bg-[#19b7ff]/10 text-sm font-black text-[#66d5ff]">{step.number}</span>
            <h3 className="mt-5 text-xl font-black text-white">{step.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">{step.text}</p>
            {index < STEPS.length - 1 && <span className="absolute -right-3 top-1/2 hidden text-[#19b7ff]/60 md:block" aria-hidden="true">→</span>}
          </div>
        ))}
      </div>
    </section>
  );
}
