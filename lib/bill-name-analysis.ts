const OCR = "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";
let ocrPromise: Promise<void> | null = null;
declare global { interface Window { Tesseract?: any } }

function loadOcr() {
  if (typeof document === "undefined") return Promise.reject(new Error("OCR_LIBRARY_LOAD_FAILED"));
  if (window.Tesseract) return Promise.resolve();
  if (ocrPromise) return ocrPromise;
  ocrPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[data-cpm-name-ocr="${OCR}"]`);
    if (existing) { existing.addEventListener("load", () => resolve(), { once: true }); existing.addEventListener("error", () => reject(new Error("OCR_LIBRARY_LOAD_FAILED")), { once: true }); return; }
    const script = document.createElement("script"); script.src = OCR; script.async = true; script.dataset.cpmNameOcr = OCR; script.onload = () => resolve(); script.onerror = () => reject(new Error("OCR_LIBRARY_LOAD_FAILED")); document.head.appendChild(script);
  });
  return ocrPromise;
}

function cleanName(value: string) {
  return value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ' -]/g, " ").replace(/\s+/g, " ").trim();
}

// Rechnungs-OCR produziert häufig Tabellenfragmente wie "CZ kWh Mh".
// Diese dürfen niemals als Rechnungsempfänger durchrutschen.
const badExact = /^(strom|gas|rechnung|energie|kunden|kunde|kundin|nummer|adresse|anschrift|straße|strasse|weg|allee|platz|ring|gasse|vertrag|vertragspartner|anbieter|bank|iban|bic|seite|datum|betrag|tarif|abschlag|verbrauch|preis|zahlung|konto|service|kontakt|telefon|email|e-mail|gebühr|summe|arbeitspreis|grundpreis|netto|brutto|mwst|kwh|ct|eur|euro|monat|jahr|tage|menge|zeitraum|messstelle|zähler|zaehler|zählernummer|markt|netz|lieferant|lieferung|bonus|entgelt|umlage|steuer)$/i;
const badFragment = /(?:\bkwh\b|\bkw\b|\bct\/?kwh\b|\beur\b|€|\bnetto\b|\bbrutto\b|\bmwst\b|\b(?:arbeits|grund|zähl|zaehler|verbrauch|abschlag|mess|markt|netz|liefer)preis\b|\b(?:abrechnungs|vertrags|zahlungs)zeitraum\b|\bseite\s*\d|\d)/i;
const suspiciousOcrToken = /^(?:[A-Z]{1,3}|[A-Za-z]*[A-Z][A-Za-z]*[A-Z][A-Za-z]*)$/;

function validNameToken(token: string) {
  if (token.length < 2 || token.length > 35) return false;
  if (!/^[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ'-]*$/.test(token)) return false;
  if (badExact.test(token) || badFragment.test(token)) return false;
  // Kurze reine Großbuchstaben sind bei OCR sehr oft Tabellen-/Codefragmente.
  if (suspiciousOcrToken.test(token) && token.length <= 4) return false;
  // Gemischte Tokens wie "kWh" oder "Mh2" sind keine plausiblen Namen.
  if (/[a-z][A-Z][a-z]/.test(token)) return false;
  return true;
}

function validParts(parts: string[]) {
  if (parts.length < 2 || parts.length > 5) return false;
  return parts.every(validNameToken);
}

function candidateFromText(value: string) {
  const parts = cleanName(value).split(" ").filter(Boolean);
  return validParts(parts) ? { firstName: parts[0], lastName: parts.slice(1).join(" ") } : null;
}

function extractName(text: string) {
  const lines = text.split(/\n+/).map(v => v.trim()).filter(Boolean);
  const firstRe = /^(?:vorname|vorn\.?)[\s:.-]+(.+)$/i;
  const lastRe = /^(?:nachname|familienname)[\s:.-]+(.+)$/i;
  const customerRe = /^(?:kunde|kundin|vertragspartner|vertragspartnerin|rechnungs?empfänger|rechnungsempfängerin|name des kunden|name der kundin)[\s:.:/-]*(.+)$/i;
  const salutationRe = /^(?:herr|frau|herrn|fr\.?|hr\.?)\s+(.+)$/i;
  let first: string | null = null;
  let last: string | null = null;
  let confidence: "high" | "medium" | "unknown" = "unknown";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fm = line.match(firstRe);
    if (fm) { const p = candidateFromText(fm[1]); if (p) { first = p.firstName; last ??= p.lastName; confidence = "high"; } }
    const lm = line.match(lastRe);
    if (lm) { const value = cleanName(lm[1]); if (validNameToken(value)) { last = value; confidence = "high"; } }
    const cm = line.match(customerRe);
    if (cm) { const p = candidateFromText(cm[1]); if (p) { first ??= p.firstName; last ??= p.lastName; confidence = "high"; } }
    const sm = line.match(salutationRe);
    if (sm) { const p = candidateFromText(sm[1]); if (p) { first ??= p.firstName; last ??= p.lastName; confidence = "high"; } }

    const context = /(?:ihre daten|persönliche daten|rechnungsadresse|lieferadresse|verbrauchsstelle|anschrift|adresse|kundendaten)/i.test(line);
    if (context) {
      for (const candidate of lines.slice(i + 1, i + 7)) {
        if (badFragment.test(candidate)) continue;
        const p = candidateFromText(candidate.replace(/^(?:herr|frau|herrn|fr\.?|hr\.?)\s+/i, ""));
        if (p) { first ??= p.firstName; last ??= p.lastName; confidence = confidence === "unknown" ? "high" : confidence; break; }
      }
    }

    // OCR may put the name on one line and the street on the next.
    const next = lines[i + 1] || "";
    if (/\b(?:straße|strasse|weg|allee|platz|ring|gasse)\b|\b\d{5}\b/i.test(next)) {
      const cleaned = line.replace(/^(?:herr|frau|herrn|fr\.?|hr\.?)\s+/i, "");
      if (!badFragment.test(cleaned)) {
        const p = candidateFromText(cleaned);
        if (p) return { firstName: p.firstName, lastName: p.lastName, confidence: "high" as const };
      }
    }
  }

  if (first && last) return { firstName: first, lastName: last, confidence };

  // Conservative fallback: only inspect a small block around explicit customer headings.
  for (let i = 0; i < lines.length; i++) {
    if (!/(kunde|vertragspartner|rechnungs?empfänger|ihre daten|persönliche daten|anschrift|rechnungsadresse|lieferadresse|verbrauchsstelle|kundendaten)/i.test(lines[i])) continue;
    for (const candidate of lines.slice(i + 1, i + 7)) {
      if (badFragment.test(candidate)) continue;
      const p = candidateFromText(candidate.replace(/^(?:herr|frau|herrn|fr\.?|hr\.?)\s+/i, ""));
      if (p) return { firstName: p.firstName, lastName: p.lastName, confidence: "medium" as const };
    }
  }

  return { firstName: null, lastName: null, confidence: "unknown" as const };
}

async function recognize(file: File) {
  await loadOcr();
  if (!window.Tesseract) throw new Error("OCR_LIBRARY_LOAD_FAILED");
  const result = await window.Tesseract.recognize(file, "deu", { logger: () => undefined });
  return String(result?.data?.text || "");
}

export async function analyzeBillNames(files: File[]) {
  let firstName: string | null = null;
  let lastName: string | null = null;
  let confidence: "high" | "medium" | "unknown" = "unknown";
  for (const file of files.slice(0, 12)) {
    if (file.type === "application/pdf") continue;
    const result = extractName(await recognize(file));
    if (!firstName && result.firstName) firstName = result.firstName;
    if (!lastName && result.lastName) lastName = result.lastName;
    if (result.confidence === "high") confidence = "high";
    else if (result.confidence === "medium" && confidence === "unknown") confidence = "medium";
    if (firstName && lastName && confidence === "high") break;
  }
  return { firstName, lastName, confidence };
}
