const benefits = [
  ["01", "Kostenlos & unverbindlich", "Sie erhalten zuerst eine klare Einschätzung. Entscheiden müssen Sie danach nichts, was Sie nicht möchten."],
  ["02", "Persönlich statt kompliziert", "Keine Tarifbegriffe ohne Erklärung. Ich zeige Ihnen verständlich, was sich bei Ihrem Vertrag wirklich ändern würde."],
  ["03", "Privat & Gewerbe", "Ob Haushalt oder kleiner Betrieb: Wir schauen auf Ihren aktuellen Verbrauch und Ihr konkretes Einsparpotenzial."],
];

export function Benefits() {
  return <section className="container py-20"><div className="grid gap-5 md:grid-cols-3">{benefits.map(([num,title,text]) => <article key={num} className="glass rounded-3xl p-7"><div className="text-sm font-bold text-[#19b7ff]">{num}</div><h3 className="mt-8 text-xl font-bold">{title}</h3><p className="mt-3 leading-7 text-slate-400">{text}</p></article>)}</div></section>;
}
