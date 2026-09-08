export type UniversalConsumption = number | null;
export type UniversalPrices = { workPriceCtPerKwh: number | null; basePriceEurPerYear: number | null };

function normalize(raw:string){return raw.replace(/\u00a0/g," ").replace(/[‐‑‒–—]/g,"-").replace(/\r/g,"\n").replace(/k\s*[wvw]\s*[hn]/gi,"kWh").replace(/kwh/gi,"kWh").replace(/kw\s*h/gi,"kWh").replace(/c\s*t\s*\/\s*k\s*w\s*h/gi,"ct/kWh").replace(/c\s*t\s*\/\s*kwh/gi,"ct/kWh").replace(/c[au]\s*\/?\s*kwh/gi,"ct/kWh").replace(/c\s*t\s*kwh/gi,"ct/kWh").replace(/grund[o0]reis|grundpre[i1]s|grundoeis|grundprels/gi,"Grundpreis").replace(/arbeit\s*(?:s|ss)?\s*pre[i1]s|arbeitspre[il]s|ar[bp]atspre[i1]s/gi,"Arbeitspreis").replace(/verbrauchspre[il]s|verbrauch\s*spre[i1]s/gi,"Verbrauchspreis").replace(/jahresstromverbrauch|jahresverbrauch/gi,"Jahresverbrauch").replace(/abg[o0]r[o0]chneter\s+verbrauch|abger[e3]chneter\s+verbrauch/gi,"Abgerechneter Verbrauch").replace(/sum[mn]e/gi,"Summe").replace(/gesamtverbrauch/gi,"Gesamtverbrauch").replace(/ihr\s+stromverbrauch/gi,"Ihr Stromverbrauch").replace(/ihr\s+verbrauch/gi,"Ihr Verbrauch").replace(/[ \t]+/g," ");}

function num(raw:string){let s=raw.replace(/\s/g,"").replace(/[^0-9,.+-]/g,"");if(!s)return null;const c=s.lastIndexOf(","),d=s.lastIndexOf(".");if(c>=0&&d>=0)s=c>d?s.replace(/\./g,"").replace(",","."):s.replace(/,/g,"");else if(c>=0)s=s.replace(/\./g,"").replace(",",".");else if(/^[-+]?\d{1,3}(?:\.\d{3})+$/.test(s))s=s.replace(/\./g,"");const n=Number(s);return Number.isFinite(n)?n:null;}

const PROVIDER_ALIASES:Record<string,RegExp>={
 EON:/\bE\.?\s*ON\b|Energie Deutschland/i,
 ENTEGA:/\bENTEGA\b/i,
 EnBW:/\bEnBW\b/i,
 Vattenfall:/\bVattenfall\b/i,
 Mainova:/\bMainova\b/i,
 SWM:/\bSWM\b|Stadtwerke München/i,
 Yello:/\bYello\b/i,
 eprimo:/\beprimo\b/i,
 EWE:/\bEWE\b/i,
 ESWE:/\bESWE\b/i,
 Süwag:/\bS[üu]wag\b/i,
 EWR:/\bEWR\b/i,
 MVV:/\bMVV\b/i,
 RheinEnergie:/\bRheinEnergie\b/i,
 Naturstrom:/\bNaturstrom\b/i,
 LichtBlick:/\bLichtBlick\b/i,
 Octopus:/\bOctopus\s*Energy\b/i,
 Tibber:/\bTibber\b/i,
 Stadtwerke:/\bStadtwerke\b/i,
};

export function detectProvider(raw:string){for(const [name,re] of Object.entries(PROVIDER_ALIASES))if(re.test(raw))return name;return null;}

function candidateKwh(text:string){const out:{n:number;score:number;context:string}[]=[];const re=/(\d{1,3}(?:[.\s]\d{3})+(?:,\d+)?|\d{4,8}(?:,\d+)?|\d{1,3}(?:[,.]\d{1,3})?)\s*kWh\b/gi;for(const m of text.matchAll(re)){const n=num(m[1]);if(n===null||n<50||n>100000)returnNext(out,m,n);}
 function returnNext(a:any[],m:RegExpMatchArray,n:number){const i=m.index??0;const context=text.slice(Math.max(0,i-180),Math.min(text.length,i+180));let score=0;if(/Summe|Gesamtverbrauch|Gesamt\b/i.test(context))score+=100;if(/Ihr Verbrauch|Ihr Stromverbrauch|Abgerechneter Verbrauch|Jahresverbrauch/i.test(context))score+=95;if(/Verbrauch in diesem Abrechnungszeitraum/i.test(context))score+=92;if(/Verbrauch\s+dieses\s+Abrechnungszeitraums/i.test(context))score+=92;if(/Verbrauchsvergleich|Vorjahr|letzten Abrechnungszeitraum|Jahresverbrauchsprognose|Prognose|Entlastungskontingent|Durchschnitt/i.test(context))score-=90;if(/kWh\/Tag|pro Tag/i.test(context))score-=50;if(n>50000)score-=60;if(n>=100&&n<=100000)score+=10;a.push({n,score,context});}}
 return out;
}

export function extractUniversalConsumption(raw:string):UniversalConsumption{
 const t=normalize(raw);const c=candidateKwh(t);if(!c.length)return null;
 const explicit=c.filter(x=>x.score>=100);if(explicit.length){const sane=explicit.filter(x=>x.n<50000);return (sane.length?sane:explicit).sort((a,b)=>b.score-a.score||b.n-a.n)[0].n;}
 const strong=c.filter(x=>x.score>=90&&x.n<50000);if(strong.length)return strong.sort((a,b)=>b.score-a.score||b.n-a.n)[0].n;
 const totals=c.filter(x=>x.score>=10&&x.n<50000);if(totals.length)return totals.sort((a,b)=>b.score-a.score||b.n-a.n)[0].n;
 return c.sort((a,b)=>b.score-a.score)[0].n;
}

function priceNumber(raw:string){const n=num(raw);return n!==null&&n>=5&&n<=100?n:null;}
function baseNumber(raw:string){const n=num(raw);return n!==null&&n>=10&&n<=10000?n:null;}

export function extractUniversalPrices(raw:string):UniversalPrices{
 const t=normalize(raw);const works:{n:number;score:number}[]=[];const bases:{n:number;score:number}[]=[];
 const priceRe=/(Arbeitspreis|Verbrauchspreis|Verbrauchspreis\s+pro\s+kWh|Verbrauchspreis\s+je\s+kWh)([\s\S]{0,420}?)(\d{1,3}[,.]\d{1,4})\s*(?:Cent|ct|c|cu|ca)\s*\/?\s*kWh/gi;
 for(const m of t.matchAll(priceRe)){const n=priceNumber(m[3]);if(n===null)continue;const ctx=m[0];let score=100;if(/Stromsteuer|EEG|Umlage|Netzentgelt|Konzessionsabgabe|Referenzpreis|Entlastung/i.test(ctx))score-=80;if(/Ihr Strompreis|Ihre Preise/i.test(ctx))score+=10;works.push({n,score});}
 for(const m of t.matchAll(/(\d{1,3}[,.]\d{1,4})\s*(?:Cent|ct|c|cu|ca)\s*\/?\s*kWh/gi)){const n=priceNumber(m[1]);if(n===null)continue;const ctx=t.slice(Math.max(0,(m.index??0)-180),Math.min(t.length,(m.index??0)+180));let score=30;if(/Arbeitspreis|Verbrauchspreis|Ihr Strompreis|Ihre Preise/i.test(ctx))score+=50;if(/Stromsteuer|EEG|Umlage|Netzentgelt|Konzessionsabgabe|Referenzpreis/i.test(ctx))score-=70;works.push({n,score});}
 const baseRe=/(Grundpreis|Grundgebühr|Grundentgelt|Bereitstellungspreis)([\s\S]{0,360}?)(\d{1,5}[,.]\d{1,2})\s*(?:€|EUR|E|Eu)?\s*(?:\/\s*)?(?:Jahr|jährlich|year)/gi;
 for(const m of t.matchAll(baseRe)){const n=baseNumber(m[3]);if(n!==null)bases.push({n,score:100});}
 for(const m of t.matchAll(/(\d{1,5}[,.]\d{1,2})\s*(?:€|EUR|E|Eu)\s*\/\s*(?:Jahr|jährlich|year)/gi)){const n=baseNumber(m[1]);if(n!==null){const ctx=t.slice(Math.max(0,(m.index??0)-180),Math.min(t.length,(m.index??0)+180));let score=/Grundpreis|Grundgebühr|Grundentgelt|Bereitstellungspreis/i.test(ctx)?90:20;if(/Zahlung|Abschlag|Rechnungsbetrag|Gutschrift/i.test(ctx))score-=70;bases.push({n,score});}}
 const monthly=[...t.matchAll(/(Grundpreis|Grundgebühr|Grundentgelt|Bereitstellungspreis)([\s\S]{0,180}?)(\d{1,4}[,.]\d{1,2})\s*(?:€|EUR|E|Eu)\s*\/?\s*(?:Monat|monatlich|month)/gi)].map(m=>baseNumber(m[3])).filter((x):x is number=>x!==null);for(const n of monthly)bases.push({n:n*12,score:95});
 works.sort((a,b)=>b.score-a.score||b.n-a.n);bases.sort((a,b)=>b.score-a.score||b.n-a.n);
 return {workPriceCtPerKwh:works.length?works[0].n:null,basePriceEurPerYear:bases.length?bases[0].n:null};
}

export const UNIVERSAL_INVOICE_FORMATS=["E.ON","ENTEGA","EnBW","Vattenfall","Mainova","SWM","Yello","eprimo","EWE","ESWE","Süwag","EWR","MVV","RheinEnergie","Naturstrom","LichtBlick","Octopus Energy","Tibber","Stadtwerke","regionale Stadtwerke","Grundversorger","Gasversorger"];
