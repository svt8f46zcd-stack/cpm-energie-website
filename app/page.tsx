import { CTASection } from "@/components/CTASection";
import { DesktopHero } from "@/components/DesktopHero";
import { MobileHero } from "@/components/MobileHero";

const reasons = [
  {
    title: "Deine Rechnung im Mittelpunkt",
    text: "Keine komplizierte Tarifstrecke. Deine aktuelle Rechnung ist die Grundlage für die Prüfung.",
  },
  {
    title: "Strom & Gas",
    text: "Ein klarer Ablauf für beide Energiearten, ohne unnötige Eingaben.",
  },
  {
    title: "Persönlich begleitet",
    text: "Die Analyse wird digital unterstützt. Bei Fragen hast du einen direkten Ansprechpartner.",
  },
];

export default function Home() {
  return (
    <>
      <div className="desktop-only" id="top">
        <DesktopHero />
      </div>
      <div className="mobile-only" id="top">
        <MobileHero />
      </div>

      <main>
        <section className="container py-16 md:py-24" aria-labelledby="positioning-heading">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-xs font-bold uppercase tracking-[.22em] text-[#66d5ff]">Tarifprüfung, anders gedacht</p>
            <h2
              id="positioning-heading"
              className="mt-3 text-3xl font-black leading-tight tracking-[-.035em] text-white md:text-5xl"
            >
              Deine Rechnung. Deine Daten. Eine klare Entscheidung.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-400 md:text-lg">
              Statt dich durch unzählige Felder zu schicken, starten wir mit dem, was du bereits hast: deiner aktuellen
              Strom oder Gasrechnung.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {reasons.map((item, index) => (
              <article
                key={item.title}
                className="rounded-3xl border border-white/10 bg-white/[.035] p-6 transition duration-300 hover:-translate-y-1 hover:border-[#19b7ff]/30 hover:bg-white/[.05]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black tracking-[.18em] text-[#66d5ff]">0{index + 1}</span>
                  <span className="h-2 w-2 rounded-full bg-[#19b7ff] shadow-[0_0_14px_rgba(25,183,255,.65)]" />
                </div>
                <h3 className="mt-8 text-xl font-bold text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-white/10 bg-[#071321]" aria-labelledby="process-heading">
          <div className="container py-16 md:py-24">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-bold uppercase tracking-[.22em] text-[#66d5ff]">So funktioniert es</p>
              <h2 id="process-heading" className="mt-3 text-3xl font-black tracking-[-.035em] text-white md:text-5xl">
                Drei Schritte. Mehr musst du nicht tun.
              </h2>
            </div>

            <div className="mt-12 grid gap-4 md:grid-cols-3">
              <div className="relative rounded-3xl border border-white/10 bg-[#0b1b30]/70 p-6 backdrop-blur-xl">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#19b7ff]/25 bg-[#19b7ff]/10 text-sm font-black text-[#8ce4ff]">1</div>
                <h3 className="mt-6 text-lg font-bold text-white">Rechnung hochladen</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">Foto oder PDF genügt. Auch mehrere Seiten sind möglich.</p>
                <div className="pointer-events-none absolute right-[-18px] top-11 hidden text-2xl text-[#19b7ff]/40 md:block">→</div>
              </div>

              <div className="relative rounded-3xl border border-white/10 bg-[#0b1b30]/70 p-6 backdrop-blur-xl">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#19b7ff]/25 bg-[#19b7ff]/10 text-sm font-black text-[#8ce4ff]">2</div>
                <h3 className="mt-6 text-lg font-bold text-white">Tarif prüfen lassen</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">Relevante Vertragsdaten wie Verbrauch und Preise werden strukturiert betrachtet.</p>
                <div className="pointer-events-none absolute right-[-18px] top-11 hidden text-2xl text-[#19b7ff]/40 md:block">→</div>
              </div>

              <div className="rounded-3xl border border-[#19b7ff]/20 bg-[#0b1b30]/70 p-6 shadow-[0_0_45px_rgba(25,183,255,.08)] backdrop-blur-xl">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#19b7ff]/25 bg-[#19b7ff]/10 text-sm font-black text-[#8ce4ff]">3</div>
                <h3 className="mt-6 text-lg font-bold text-white">Klarheit erhalten</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">Du siehst verständlich, ob dein aktueller Tarif passt und was als Nächstes sinnvoll ist.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#050d18]" aria-labelledby="personal-heading">
          <div className="container py-16 md:py-20">
            <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-[auto_1fr] md:items-center">
              <div className="mx-auto flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-[#19b7ff]/25 bg-[radial-gradient(circle_at_50%_35%,rgba(25,183,255,.22),transparent_55%),#0b1b30] shadow-[0_0_50px_rgba(25,183,255,.10)]">
                <img src="/cpm-energie-website/cristiano.svg?v=20260905-2" alt="Cristiano Moreira" className="h-full w-full object-cover" />
              </div>
              <div className="text-center md:text-left">
                <p className="text-xs font-bold uppercase tracking-[.22em] text-[#66d5ff]">Persönlich statt anonym</p>
                <h2 id="personal-heading" className="mt-3 text-3xl font-black tracking-[-.035em] text-white md:text-4xl">
                  Digitale Prüfung. Persönliche Beratung.
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
                  Die Technik hilft bei der Datenerfassung. Wenn es um die eigentliche Entscheidung geht, hast du einen
                  echten Ansprechpartner.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3 md:justify-start">
                  <a
                    href="/cpm-energie-website/ueber-mich/"
                    className="rounded-full border border-white/15 bg-white/[.04] px-5 py-3 text-sm font-bold text-white transition hover:bg-white/[.08]"
                  >
                    Mehr über mich
                  </a>
                  <a
                    href="/cpm-energie-website/kontakt/"
                    className="rounded-full bg-[#19b7ff] px-5 py-3 text-sm font-bold text-[#03101c] transition hover:brightness-110"
                  >
                    Kontakt aufnehmen
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <CTASection />
      </main>
    </>
  );
}
