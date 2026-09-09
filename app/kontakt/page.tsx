import { Suspense } from "react";
import { ContactFormStatic } from "@/components/ContactFormStatic";

export const metadata = { title: "Kontakt" };

const WHATSAPP_URL = "https://wa.me/4917661077323?text=Hallo%20CPM%20Energie%2C%20ich%20m%C3%B6chte%20meinen%20Strom-%20oder%20Gastarif%20pr%C3%BCfen%20lassen.";

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
          <ContactFormStatic />
        </Suspense>
        <div className="mt-5 rounded-2xl border border-[#25D366]/20 bg-[#25D366]/5 p-5 text-center">
          <p className="text-sm font-bold text-white">Lieber direkt schreiben?</p>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-[#25D366] px-6 py-3.5 font-bold text-[#03101c] transition hover:brightness-110 sm:w-auto">WhatsApp Nachricht senden</a>
          <p className="mt-2 text-xs text-slate-500">0176 61077323</p>
        </div>
      </div>
    </section>
  );
}
