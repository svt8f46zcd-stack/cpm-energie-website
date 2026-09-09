import { Suspense } from "react";
import { ContactForm } from "@/components/ContactForm";

export const metadata = { title: "Kontakt" };

export default function KontaktPage() {
  return (
    <section className="container py-20 md:py-28">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-bold uppercase tracking-[.2em] text-[#19b7ff]">Kontakt</p>
        <h1 className="mt-4 text-4xl font-black md:text-6xl">Lassen Sie Ihren Tarif prüfen.</h1>
        <p className="mt-5 text-lg leading-8 text-slate-400">Schicken Sie uns kurz Ihre Daten. Die Prüfung ist kostenlos und unverbindlich.</p>
      </div>

      <div className="mx-auto mt-12 max-w-3xl">
        <Suspense fallback={<div className="glass rounded-[2rem] p-9 text-center text-slate-400">Formular wird geladen…</div>}>
          <ContactForm />
        </Suspense>
        <div className="mt-5 rounded-2xl border border-[#25D366]/20 bg-[#25D366]/5 p-5 text-center">
          <p className="text-sm font-bold text-white">Lieber direkt schreiben?</p>
          <p className="mt-1 text-sm text-slate-400">Deine WhatsApp Nummer wird nach Hinterlegung direkt mit diesem Button verbunden.</p>
          <span className="mt-4 inline-flex cursor-not-allowed rounded-full border border-white/10 px-6 py-3 text-sm font-bold text-slate-500">WhatsApp Kontakt</span>
        </div>
      </div>
    </section>
  );
}
