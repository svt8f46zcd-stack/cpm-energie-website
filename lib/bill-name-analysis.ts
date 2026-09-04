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
function cleanName(value: string) { return value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ' -]/g, " ").replace(/\s+/g, " ").trim(); }
function validParts(parts: string[]) {
  if (parts.length < 2 || parts.length > 5) return false;
  const bad = /^(strom|gas|rechnung|energie|kunden|nummer|adresse|straße|strasse|vertrag|anbieter|bank|iban|bic|seite|datum|betrag|tarif|abschlag|verbrauch)$/i;
  return parts.every(p => p.length >= 2 && /^[A-Za-zÀ-ÖØ-öø-ÿ'-]+$/.test(p) && !bad.test(p));
}
function extractName(text: string) {
  const lines = text.split(/\n+/).map(v => v.trim()).filter(Boolean);
  const firstRe = /^(?:vorname|vorn\.?)[\s:.-]+(.+)$/i;
  const lastRe = /^(?:nachname|familienname)[\s:.-]+(.+)$/i;
  const customerRe = /^(?:kunde|kundin|vertragspartner|vertragspartnerin|rechnungs?empfänger|rechnungsempfängerin|name des kunden|name der kundin)[\s:.:/-]*(.+)$/i;
  let first: string | null = null; let last: string | null = null; let confidence: "high" | "medium" | "unknown" = "unknown";
  for (const line of lines) {
    const fm = line.match(firstRe); if (fm) { const p = cleanName(fm[1]).split(" ").filter(Boolean); if (p.length) first = p[0]; }
    const lm = line.match(lastRe); if (lm) { const p = cleanName(lm[1]).split(" ").filter(Boolean); if (p.length) last = p.join(" "); }
    const cm = line.match(customerRe); if (cm) { const p = cleanName(cm[1]).split(" ").filter(Boolean); if (validParts(p)) { first ??= p[0]; last ??= p.slice(1).join(" "); confidence = "high"; } }
    if (/^(?:herr|frau|hr\.?|fr\.?)\s+/i.test(line)) { const p = cleanName(line.replace(/^(?:herr|frau|hr\.?|fr\.?)\s+/i, "")).split(" ").filter(Boolean); if (validParts(p)) { first ??= p[0]; last ??= p.slice(1).join(" "); confidence = confidence === "unknown" ? "medium" : confidence; } }
  }
  if (first && last) return { firstName: first, lastName: last, confidence };
  for (let i = 0; i < lines.length; i++) {
    if (!/(kunde|vertragspartner|rechnungs?empfänger|ihre daten|persönliche daten|anschrift)/i.test(lines[i])) continue;
    for (const candidate of lines.slice(i, i + 4)) {
      const p = cleanName(candidate).split(" ").filter(Boolean);
      if (validParts(p)) return { firstName: p[0], lastName: p.slice(1).join(" "), confidence: "medium" as const };
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
  let firstName: string | null = null; let lastName: string | null = null; let confidence: "high" | "medium" | "unknown" = "unknown";
  for (const file of files.slice(0, 12)) {
    if (file.type === "application/pdf") continue;
    const result = extractName(await recognize(file));
    if (!firstName && result.firstName) firstName = result.firstName;
    if (!lastName && result.lastName) lastName = result.lastName;
    if (result.confidence === "high") confidence = "high"; else if (result.confidence === "medium" && confidence === "unknown") confidence = "medium";
    if (firstName && lastName && confidence === "high") break;
  }
  return { firstName, lastName, confidence };
}
