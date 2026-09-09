"use client";

type BillFlowState = "idle" | "uploading" | "analyzing" | "success" | "error";

type BillFlowProps = {
  status: BillFlowState;
};

const FLOW_STEPS = [
  { id: "uploading", title: "Rechnung", text: "Deine Abrechnung wird eingelesen" },
  { id: "analyzing", title: "Analyse", text: "Tarifdaten werden geprüft" },
  { id: "success", title: "Ergebnis", text: "Deine Daten sind bereit" },
] as const;

export function BillFlow({ status }: BillFlowProps) {
  const activeIndex = status === "success" ? 2 : status === "analyzing" ? 1 : status === "uploading" ? 0 : -1;

  return (
    <section className="border-y border-white/10 bg-[#06111d]" aria-labelledby="flow-heading">
      <div className="container py-16 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[.22em] text-[#66d5ff]">Dein Weg zur Klarheit</p>
          <h2 id="flow-heading" className="mt-3 text-3xl font-black tracking-[-.04em] text-white md:text-5xl">Rechnung → Analyse → Ergebnis</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-400 md:text-lg">Ein klarer Prozess ohne Tarifdschungel.</p>
        </div>

        <div className="mx-auto mt-10 grid max-w-5xl gap-3 md:grid-cols-3">
          {FLOW_STEPS.map((step, index) => {
            const isActive = index === activeIndex;
            const isComplete = index < activeIndex;
            return (
              <div key={step.id} className={`rounded-[1.5rem] border p-5 transition-all duration-300 ${isActive ? "border-[#19b7ff]/40 bg-[#19b7ff]/10 shadow-[0_0_15px_rgba(25,183,255,0.1)]" : isComplete ? "border-emerald-400/20 bg-emerald-400/[.04]" : "border-white/10 bg-white/[.025]"}`}>
                <div className="flex items-center gap-4">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-black transition-colors ${isActive ? "bg-[#19b7ff] text-[#03101c]" : isComplete ? "bg-emerald-400/10 text-emerald-300" : "bg-white/[.05] text-slate-500"}`} aria-hidden="true">
                    {isComplete ? "✓" : `0${index + 1}`}
                  </span>
                  <div>
                    <h3 className="font-black text-white">{step.title}</h3>
                    <p className="mt-1 text-sm leading-5 text-slate-400">{step.text}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
