"use client";

import { FormEvent, useMemo, useState } from "react";

type FormDataState = {
  vorname: string; nachname: string; telefon: string; email: string;
  strasse: string; hausnummer: string; plz: string; ort: string;
  personen: string; verbrauch: string; anbieter: string; abschlag: string;
  vertragsende: string; waermepumpe: string; eauto: string; nachts: string;
  erreichbar: string; whatsapp: boolean;
};

const initialData: FormDataState = {
  vorname: "", nachname: "", telefon: "", email: "", strasse: "", hausnummer: "",
  plz: "", ort: "", personen: "", verbrauch: "", anbieter: "", abschlag: "",
  vertragsende: "", waermepumpe: "", eauto: "", nachts: "", erreichbar: "", whatsapp: false,
};

const steps = ["Verbrauch", "Tarif", "Haushalt", "Kontakt"] as const;
const SUBMIT_URL = "https://formsubmit.co/ajax/cristiano02moreira@gmail.com";
const CONSENT_VERSION = "strom-lead-telefon-2026-09-v1";

function cleanPhone(value: string) { return value.replace(/[^0-9+]/g, ""); }
function scoreLead(data: FormDataState) {
  let score = 0;
  if (data.plz.length === 5) score += 15;
  if (data.verbrauch) score += 20;
  if (data.anbieter) score += 10;
  if (data.abschlag) score += 10;
  if (data.vertragsende) score += 10;
  if (data.telefon) score += 20;
  if (data.erreichbar) score += 5;
  if (data.whatsapp) score += 5;
  if (data.email) score += 5;
  return Math.min(score, 100);
}

export default function StromLeadForm() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormDataState>(initialData);
  const [consent, setConsent] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const progress = ((step + 1) / steps.length) * 100;
  const leadScore = useMemo(() => scoreLead(data), [data]);

  function update<K extends keyof FormDataState>(key: K, value: FormDataState[K]) {
    setData(current => ({ ...current, [key]: value }));
    setError("");
  }

  function validateCurrentStep() {
    if (step === 0) {
      if (!/^\d{5}$/.test(data.plz)) return "Bitte gib eine gültige fünfstellige PLZ ein.";
      if (!data.ort.trim()) return "Bitte gib deinen Wohnort ein.";
      if (!data.verbrauch) return "Bitte wähle deinen ungefähren Jahresverbrauch.";
    }
    if (step === 1) {
      if (!data.anbieter) return "Bitte wähle deinen aktuellen Stromanbieter.";
      if (!data.abschlag) return "Bitte wähle deinen aktuellen monatlichen Abschlag.";
    }
    if (step === 2) {
      if (!data.personen) return "Bitte wähle die Anzahl der Personen im Haushalt.";
      if (!data.vertragsende) return "Bitte wähle, wann dein Vertrag endet oder ob du es nicht weißt.";
    }
    if (step === 3) {
      if (!data.vorname.trim() || !data.nachname.trim()) return "Bitte gib deinen Vor und Nachnamen ein.";
      if (cleanPhone(data.telefon).length < 8) return "Bitte gib eine gültige Telefonnummer ein.";
      if (!privacyConsent) return "Bitte bestätige die Verarbeitung deiner Angaben.";
      if (!consent) return "Bitte erteile die ausdrückliche Einwilligung für den Rückruf.";
    }
    return "";
  }

  function next() {
    const message = validateCurrentStep();
    if (message) { setError(message); return; }
    setError("");
    setStep(current => Math.min(current + 1, steps.length - 1));
  }
  function back() { setError(""); setStep(current => Math.max(current - 1, 0)); }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = validateCurrentStep();
    if (message) { setError(message); return; }
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams(window.location.search);
      const timestamp = new Date().toISOString();
      const leadId = `CPM-STROM-${timestamp.replace(/\D/g, "").slice(0, 14)}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
      const form = new FormData();
      form.set("_subject", `🔥 Strom Lead | ${leadId} | ${data.plz} | ${data.verbrauch} kWh`);
      form.set("_template", "table"); form.set("_captcha", "false");
      form.set("lead_id", leadId); form.set("lead_type", "Stromvergleich Privatkunde");
      form.set("lead_status", "Neu | Rückruf angefordert"); form.set("lead_score", `${leadScore}/100`);
      form.set("created_at", timestamp); form.set("vorname", data.vorname.trim());
      form.set("nachname", data.nachname.trim()); form.set("telefon", cleanPhone(data.telefon));
      form.set("email", data.email.trim()); form.set("strasse", `${data.strasse.trim()} ${data.hausnummer.trim()}`.trim());
      form.set("plz", data.plz); form.set("ort", data.ort.trim()); form.set("personen_im_haushalt", data.personen);
      form.set("jahresverbrauch_kwh", data.verbrauch); form.set("aktueller_anbieter", data.anbieter);
      form.set("monatlicher_abschlag", data.abschlag); form.set("vertragsende", data.vertragsende);
      form.set("waermepumpe", data.waermepumpe || "Nicht angegeben"); form.set("e_auto", data.eauto || "Nicht angegeben");
      form.set("nachts_strom", data.nachts || "Nicht angegeben"); form.set("erreichbarkeit", data.erreichbar || "Nicht angegeben");
      form.set("whatsapp_aktiv", data.whatsapp ? "Ja" : "Nein"); form.set("telefonwerbung_einwilligung", consent ? "Ja" : "Nein");
      form.set("datenschutz_einwilligung", privacyConsent ? "Ja" : "Nein"); form.set("consent_text_version", CONSENT_VERSION);
      form.set("consent_timestamp", timestamp); form.set("source_url", window.location.href);
      form.set("referrer", document.referrer || "Direktaufruf");
      for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) form.set(key, params.get(key) || "");
      form.set("user_agent", navigator.userAgent);
      const response = await fetch(SUBMIT_URL, { method: "POST", body: form, headers: { Accept: "application/json" } });
      const payload = await response.json().catch(() => null);
      if (!response.ok || (payload && payload.success === false)) throw new Error("SEND_FAILED");
      setSent(true);
    } catch {
      setError("Die Anfrage konnte gerade nicht gesendet werden. Bitte prüfe deine Internetverbindung und versuche es erneut.");
    } finally { setLoading(false); }
  }

  if (sent) return (
    <div className="mx-auto max-w-2xl rounded-[2rem] border border-emerald-400/20 bg-emerald-400/10 p-8 text-center shadow-2xl shadow-black/20">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/15 text-3xl text-emerald-300">✓</div>
      <p className="mt-5 text-sm font-black uppercase tracking-[.18em] text-emerald-300">Anfrage angekommen</p>
      <h2 className="mt-3 text-3xl font-black text-white">Dein Stromcheck ist bei CPM Energie.</h2>
      <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-300">Ich prüfe deine Angaben und melde mich telefonisch zu deiner Anfrage. Wenn du WhatsApp ausgewählt hast, kann ich dich auch dort kontaktieren.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-white/10 bg-white/[.03] p-4"><strong className="block text-white">{data.plz}</strong><span className="text-xs text-slate-500">PLZ</span></div><div className="rounded-2xl border border-white/10 bg-white/[.03] p-4"><strong className="block text-white">{data.verbrauch} kWh</strong><span className="text-xs text-slate-500">Jahresverbrauch</span></div><div className="rounded-2xl border border-white/10 bg-white/[.03] p-4"><strong className="block text-white">{data.anbieter}</strong><span className="text-xs text-slate-500">aktueller Anbieter</span></div></div>
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#06111d]/95 shadow-2xl shadow-black/30 backdrop-blur-xl">
      <div className="border-b border-white/10 px-5 py-5 sm:px-7"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.18em] text-[#19b7ff]">CPM Energie Stromcheck</p><p className="mt-1 text-sm text-slate-400">Schritt {step + 1} von {steps.length}</p></div><span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">kostenlos</span></div><div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#19b7ff] transition-all duration-300" style={{ width: `${progress}%` }} /></div><div className="mt-3 grid grid-cols-4 gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">{steps.map((label, index) => <span key={label} className={index <= step ? "text-white" : ""}>{label}</span>)}</div></div>
      <form onSubmit={submit} className="p-5 sm:p-7">
        {step === 0 && <div className="space-y-5"><div><h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Was zahlst du aktuell?</h1><p className="mt-2 text-sm leading-6 text-slate-400">Wir brauchen nur die wichtigsten Eckdaten, damit die Anfrage wirklich brauchbar ist.</p></div><div className="grid gap-3 sm:grid-cols-2"><Field label="PLZ"><input value={data.plz} onChange={e => update("plz", e.target.value.replace(/\D/g, "").slice(0, 5))} inputMode="numeric" autoComplete="postal-code" placeholder="55116" className="lead-input" /></Field><Field label="Ort"><input value={data.ort} onChange={e => update("ort", e.target.value)} autoComplete="address-level2" placeholder="Mainz" className="lead-input" /></Field></div><Field label="Jährlicher Stromverbrauch"><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{["bis 2.000", "2.000 bis 3.500", "3.500 bis 5.000", "über 5.000"].map(value => <Choice key={value} active={data.verbrauch === value} onClick={() => update("verbrauch", value)}>{value}<span className="block text-[11px] font-normal text-slate-500">kWh/Jahr</span></Choice>)}</div></Field><p className="text-xs leading-5 text-slate-500">Wenn du deinen Verbrauch nicht kennst, findest du ihn auf deiner letzten Stromrechnung.</p></div>}
        {step === 1 && <div className="space-y-5"><div><h2 className="text-3xl font-black tracking-tight text-white">Wie läuft dein aktueller Tarif?</h2><p className="mt-2 text-sm leading-6 text-slate-400">Damit kann ich später gezielt prüfen, ob sich ein Vergleich lohnt.</p></div><Field label="Aktueller Stromanbieter"><select value={data.anbieter} onChange={e => update("anbieter", e.target.value)} className="lead-input"><option value="">Bitte auswählen</option><option>Vattenfall</option><option>E.ON</option><option>EnBW</option><option>Yello</option><option>LichtBlick</option><option>eprimo</option><option>LEAG</option><option>SWM</option><option>Stadtwerke</option><option>Andere</option><option>Weiß ich nicht</option></select></Field><Field label="Monatlicher Abschlag"><div className="grid grid-cols-3 gap-2">{["bis 70 €", "70 bis 120 €", "über 120 €"].map(value => <Choice key={value} active={data.abschlag === value} onClick={() => update("abschlag", value)}>{value}</Choice>)}</div></Field><Field label="Vertragsende"><div className="grid grid-cols-2 gap-2">{["innerhalb 3 Monate", "3 bis 12 Monate", "später", "weiß ich nicht"].map(value => <Choice key={value} active={data.vertragsende === value} onClick={() => update("vertragsende", value)}>{value}</Choice>)}</div></Field></div>}
        {step === 2 && <div className="space-y-5"><div><h2 className="text-3xl font-black tracking-tight text-white">Noch drei kurze Fragen.</h2><p className="mt-2 text-sm leading-6 text-slate-400">Damit wird aus einem Kontakt ein qualifizierter Strom Lead.</p></div><Field label="Personen im Haushalt"><div className="grid grid-cols-4 gap-2">{["1", "2", "3", "4+"].map(value => <Choice key={value} active={data.personen === value} onClick={() => update("personen", value)}>{value}</Choice>)}</div></Field><Field label="Wärmepumpe"><div className="grid grid-cols-3 gap-2">{["Ja", "Nein", "Weiß nicht"].map(value => <Choice key={value} active={data.waermepumpe === value} onClick={() => update("waermepumpe", value)}>{value}</Choice>)}</div></Field><Field label="E Auto oder Wallbox"><div className="grid grid-cols-3 gap-2">{["Ja", "Nein", "Weiß nicht"].map(value => <Choice key={value} active={data.eauto === value} onClick={() => update("eauto", value)}>{value}</Choice>)}</div></Field><Field label="Strom wird häufig nachts benötigt"><div className="grid grid-cols-3 gap-2">{["Ja", "Nein", "Weiß nicht"].map(value => <Choice key={value} active={data.nachts === value} onClick={() => update("nachts", value)}>{value}</Choice>)}</div></Field></div>}
        {step === 3 && <div className="space-y-5"><div><h2 className="text-3xl font-black tracking-tight text-white">Wohin soll ich mich melden?</h2><p className="mt-2 text-sm leading-6 text-slate-400">Deine Kontaktdaten werden erst am Ende abgefragt. Kein unnötiges Ausfüllen.</p></div><div className="grid gap-3 sm:grid-cols-2"><Field label="Vorname"><input value={data.vorname} onChange={e => update("vorname", e.target.value)} autoComplete="given-name" placeholder="Vorname" className="lead-input" /></Field><Field label="Nachname"><input value={data.nachname} onChange={e => update("nachname", e.target.value)} autoComplete="family-name" placeholder="Nachname" className="lead-input" /></Field><Field label="Telefonnummer"><input value={data.telefon} onChange={e => update("telefon", e.target.value)} type="tel" inputMode="tel" autoComplete="tel" placeholder="0176 12345678" className="lead-input" /></Field><Field label="E Mail optional"><input value={data.email} onChange={e => update("email", e.target.value)} type="email" autoComplete="email" placeholder="name@beispiel.de" className="lead-input" /></Field><Field label="Straße optional"><input value={data.strasse} onChange={e => update("strasse", e.target.value)} autoComplete="street-address" placeholder="Musterstraße" className="lead-input" /></Field><Field label="Hausnummer optional"><input value={data.hausnummer} onChange={e => update("hausnummer", e.target.value)} placeholder="1" className="lead-input" /></Field></div><Field label="Wann bist du am besten erreichbar?"><div className="grid grid-cols-3 gap-2">{["Vormittags", "Mittags", "Abends"].map(value => <Choice key={value} active={data.erreichbar === value} onClick={() => update("erreichbar", value)}>{value}</Choice>)}</div></Field><label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/[.025] p-4 text-xs leading-5 text-slate-400"><input type="checkbox" checked={data.whatsapp} onChange={e => update("whatsapp", e.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-[#19b7ff]" /><span><strong className="text-white">WhatsApp bevorzugt</strong><br />Wenn aktiviert, darf CPM Energie die angegebene Rufnummer auch über WhatsApp für die Bearbeitung deiner Stromanfrage kontaktieren.</span></label><label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/[.025] p-4 text-xs leading-5 text-slate-400"><input type="checkbox" checked={privacyConsent} onChange={e => setPrivacyConsent(e.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-[#19b7ff]" /><span>Ich willige ein, dass CPM Energie meine Angaben zur Bearbeitung meiner Stromanfrage verarbeitet. Ich kann diese Einwilligung jederzeit widerrufen. Die Datenschutzhinweise habe ich zur Kenntnis genommen.</span></label><label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#19b7ff]/30 bg-[#19b7ff]/5 p-4 text-xs leading-5 text-slate-300"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-[#19b7ff]" /><span><strong className="text-white">Rückruf ausdrücklich gewünscht</strong><br />Ich möchte von CPM Energie telefonisch zu Stromtarifen und einer Tarifberatung kontaktiert werden. Meine Einwilligung gilt für diesen Zweck und kann jederzeit widerrufen werden.</span></label></div>}
        {error && <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</div>}
        <div className="mt-6 flex gap-3">{step > 0 && <button type="button" onClick={back} className="rounded-full border border-white/10 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-white/5">Zurück</button>}{step < steps.length - 1 ? <button type="button" onClick={next} className="flex-1 rounded-full bg-[#19b7ff] px-6 py-3.5 text-sm font-black text-[#03101c] shadow-[0_10px_30px_rgba(25,183,255,.18)] transition hover:brightness-110">Weiter →</button> : <button type="submit" disabled={loading} className="flex-1 rounded-full bg-[#19b7ff] px-6 py-3.5 text-sm font-black text-[#03101c] shadow-[0_10px_30px_rgba(25,183,255,.18)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Anfrage wird übermittelt …" : "Stromcheck anfordern →"}</button>}</div><p className="mt-4 text-center text-[11px] leading-5 text-slate-500">Kostenlos und unverbindlich. Ein Stromvergleich ist keine automatische Beauftragung eines Anbieterwechsels.</p>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">{label}</span>{children}</label>; }
function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) { return <button type="button" onClick={onClick} className={`min-h-12 rounded-xl border px-3 py-3 text-left text-sm font-bold transition ${active ? "border-[#19b7ff] bg-[#19b7ff]/10 text-white" : "border-white/10 bg-white/[.025] text-slate-300 hover:border-white/20 hover:bg-white/[.05]"}`}>{children}</button>; }
