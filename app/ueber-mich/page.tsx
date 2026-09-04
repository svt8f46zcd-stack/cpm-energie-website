import Image from "next/image";
import Link from "next/link";

export const metadata = { title: "Über mich | CPM Energie" };

export default function AboutPage() {
  return (
    <section className="container py-16 md:py-24">
      <div className="grid items-center gap-10 md:grid-cols-[0.82fr_1.18fr] md:gap-16">
        <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-[#071322] shadow-2xl shadow-black/30">
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#03101c]/55 via-transparent to-transparent pointer-events-none" />
          <Image
            src="/cpm-energie-website/cristiano.svg"
            alt="Cristiano Patricio Moreira, CPM Energie"
            width={600}
            height={900}
            priority
            className="h-auto w-full object-cover"
          />
          <div className="absolute bottom-5 left-5 right-5 z-20 rounded-2xl border border-white/15 bg-[#071322]/75 p-4 backdrop-blur-md">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#19b7ff]">CPM Energie</p>
            <p className="mt-1 text-base font-bold text-white">Persönliche Energieberatung</p>
          </div>
        </div>

        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#19b7ff]">Über CPM Energie</p>
          <h1 className="mt-4 text-4xl font-black leading-tight md:text-6xl">Persönliche Beratung statt Tarifchaos.</h1>
          <p className="mt-6 text-lg leading-8 text-slate-300">
            Ich bin Cristiano Patricio Moreira und unterstütze Privat- und Gewerbekunden dabei, ihre Strom- und Gaskosten besser zu verstehen und unnötige Kosten zu vermeiden.
          </p>
          <p className="mt-5 leading-7 text-slate-400">
            Mir ist wichtig, dass Sie nachvollziehen können, was angeboten wird, was es kostet und ob ein Wechsel für Sie überhaupt sinnvoll ist.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-300">
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">Strom & Gas</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">Privat & Gewerbe</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">Persönliche Beratung</span>
          </div>
          <Link href="/kontakt" className="mt-8 inline-flex rounded-full bg-[#19b7ff] px-7 py-4 font-bold text-[#03101c] transition hover:brightness-110">
            Kontakt aufnehmen
          </Link>
        </div>
      </div>
    </section>
  );
}
