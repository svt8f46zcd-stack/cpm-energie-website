import { CTASection } from "@/components/CTASection";
import { DesktopHero } from "@/components/DesktopHero";
import { MobileHero } from "@/components/MobileHero";

const providers = ["E.ON", "goldgas", "ENTEGA", "eprimo", "Yello", "Vattenfall", "Mainova", "RheinEnergie", "EWE", "LichtBlick"];
const ASSET_BASE = "/cpm-energie-website";

const benefits = [
  { number: "01", title: "Rechnung statt Schätzen", text: "Lade deine Strom oder Gasrechnung hoch. Die wichtigsten Angaben werden direkt aus dem Dokument ausgelesen." },
  { number: "02", title: "Daten automatisch prüfen", text: "Anbieter, Tarif, Verbrauch, Arbeits und Grundpreis sowie weitere erkennbare Vertragsdaten werden strukturiert zusammengeführt." },
  { number: "03", title: "Klarheit statt Tarifdschungel", text: "Du siehst nachvollziehbar, was auf deiner Rechnung steht. Erst danach entscheidest du, ob du ein Angebot möchtest." },
];

const reasons = [
  ["Mehrseitige Rechnungen", "Mehrere Bilder oder eine PDF können gemeinsam verarbeitet werden."],
  ["Strom & Gas", "Ein Ablauf für beide Energiearten, ohne unnötige Eingaben."],
  ["Persönlich", "Keine anonyme Tarifstrecke. Bei Fragen hast du einen direkten Ansprechpartner."],
  ["Ohne Wechselzwang", "Eine Prüfung ist noch keine Entscheidung. Du bestimmst, was als Nächstes passiert."],
];

export default function Home() {
  return (
    <>
      <div className="desktop-only" id="top"><DesktopHero /></div>
      <div className="mobile-only" id="top"><MobileHero /></div>

      <div className="cpm-marquee" aria-label="Anbieter aus dem CPM Energie Portfolio">
        <div className="cpm-marquee-track">
          {[...providers, ...providers].map((provider, index) => (
            <span key={`${provider}-${index}`}><i aria-hidden="true">✦</i>{provider}</span>
          ))}
        </div>
      </div>

      <main>
        <section className="container py-16 md:py-24" aria-labelledby="positioning-heading">
          <div className="grid items-end gap-8 md:grid-cols-[1.1fr_.9fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.22em] text-[#66d5ff]">Tarifprüfung neu gedacht</p>
              <h2 id="positioning-heading" className="mt-3 max-w-4xl text-3xl font-black leading-tight tracking-[-.035em] text-white md:text-5xl">Deine Rechnung ist die Grundlage. Nicht irgendein Vergleichsportal.</h2>
            </div>
            <p className="max-w-xl text-base leading-7 text-slate-400 md:justify-self-end md:text-lg">CPM Energie macht aus einer unübersichtlichen Rechnung eine verständliche Grundlage für deine Entscheidung. Schnell, strukturiert und persönlich begleitet.</p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {benefits.map((item) => (
              <article key={item.number} className="group rounded-3xl border border-white/10 bg-white/[.035] p-6 transition duration-300 hover:-translate-y-1 hover:border-[#19b7ff]/30 hover:bg-white/[.05]">
                <div className="flex items-center justify-between"><span className="text-xs font-black tracking-[.18em] text-[#66d5ff]">{item.number}</span><span className="h-2 w-2 rounded-full bg-[#19b7ff] shadow-[0_0_14px_rgba(25,183,255,.65)]" /></div>
                <h3 className="mt-8 text-xl font-bold text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-white/10 bg-[#071321]" aria-labelledby="process-heading">
          <div className="container py-16 md:py-24">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[.22em] text-[#66d5ff]">Der Ablauf</p>
              <h2 id="process-heading" className="mt-3 text-3xl font-black tracking-[-.035em] text-white md:text-5xl">Von der Rechnung zur klaren Entscheidung.</h2>
              <p className="mt-4 text-base leading-7 text-slate-400 md:text-lg">Keine zehn Formulare. Keine unnötigen Zwischenschritte. Der Prozess ist auf das reduziert, was für eine saubere Tarifprüfung wirklich gebraucht wird.</p>
            </div>

            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {benefits.map((item, index) => (
                <div key={item.number} className="relative rounded-3xl border border-white/10 bg-[#0b1b30]/70 p-6 backdrop-blur-xl">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#19b7ff]/25 bg-[#19b7ff]/10 text-sm font-black text-[#8ce4ff]">{index + 1}</div>
                  <h3 className="mt-6 text-lg font-bold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{item.text}</p>
                  {index < 2 && <div className="pointer-events-none absolute right-[-18px] top-11 hidden text-2xl text-[#19b7ff]/40 md:block">→</div>}
                </div>
              ))}
            </div>

            <div className="mt-10 rounded-3xl border border-[#19b7ff]/15 bg-[radial-gradient(circle_at_80%_20%,rgba(25,183,255,.12),transparent_35%),rgba(255,255,255,.025)] p-6 md:p-8">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div><p className="text-sm font-bold text-white">Bereit für deine Rechnung?</p><p className="mt-1 text-sm text-slate-400">Der Upload oben ist bereits der Start der Prüfung. Mehrseitige Rechnungen sind vorgesehen.</p></div>
                <a href="#top" className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#19b7ff] px-6 py-3 text-sm font-bold text-[#03101c] shadow-[0_12px_30px_rgba(25,183,255,.18)] transition hover:brightness-110">Rechnung prüfen →</a>
              </div>
            </div>
          </div>
        </section>

        <section className="container py-16 md:py-24" aria-labelledby="why-heading">
          <div className="grid gap-10 md:grid-cols-[.8fr_1.2fr] md:items-start">
            <div className="md:sticky md:top-24">
              <p className="text-xs font-bold uppercase tracking-[.22em] text-[#66d5ff]">Warum CPM Energie</p>
              <h2 id="why-heading" className="mt-3 text-3xl font-black tracking-[-.035em] text-white md:text-5xl">Weniger Eingabe. Mehr Klarheit.</h2>
              <p className="mt-5 max-w-md text-base leading-7 text-slate-400">Die Website soll nicht wie ein komplizierter Tarifrechner wirken. Sie soll eine Sache sehr gut machen: deine Rechnung verstehen und dich sauber zur nächsten Entscheidung führen.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {reasons.map(([title, text], index) => (
                <article key={title} className="rounded-3xl border border-white/10 bg-white/[.035] p-6 md:p-7">
                  <span className="text-xs font-black text-[#66d5ff]">0{index + 1}</span>
                  <h3 className="mt-6 text-lg font-bold text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-[#050d18]" aria-labelledby="personal-heading">
          <div className="container grid gap-10 py-16 md:grid-cols-[.65fr_1.35fr] md:items-center md:py-20">
            <div className="mx-auto w-full max-w-sm overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b1b30] shadow-2xl shadow-black/30">
              <div className="aspect-[4/5] overflow-hidden"><img src={`${ASSET_BASE}/cristiano.svg`} alt="Cristiano Moreira, persönliche Energieberatung bei CPM Energie" className="h-full w-full object-cover" /></div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[.22em] text-[#66d5ff]">Persönlich statt anonym</p>
              <h2 id="personal-heading" className="mt-3 max-w-3xl text-3xl font-black tracking-[-.035em] text-white md:text-5xl">Technik im Hintergrund. Ein echter Ansprechpartner vorne.</h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400 md:text-lg">Die automatische Rechnungserkennung nimmt dir Arbeit ab. Wenn es um die eigentliche Entscheidung geht, bleibt es persönlich. Du bekommst keine Blackbox und keinen Druck, sondern eine verständliche Grundlage.</p>
              <div className="mt-8 flex flex-wrap gap-3"><a href="/cpm-energie-website/ueber-mich/" className="rounded-full border border-white/15 bg-white/[.04] px-5 py-3 text-sm font-bold text-white transition hover:bg-white/[.08]">Mehr über mich</a><a href="/cpm-energie-website/kontakt/" className="rounded-full bg-[#19b7ff] px-5 py-3 text-sm font-bold text-[#03101c] transition hover:brightness-110">Kontakt aufnehmen</a></div>
            </div>
          </div>
        </section>

        <CTASection />
      </main>
    </>
  );
}
