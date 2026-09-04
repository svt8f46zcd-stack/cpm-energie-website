const OCR = "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";
const PDF = "https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.54/build/pdf.mjs";
let ocrPromise: Promise<void> | null = null;
let pdfPromise: Promise<any> | null = null;
declare global { interface Window { Tesseract?: any } }

type Confidence = "high" | "medium" | "unknown";
type NameResult = { firstName: string | null; lastName: string | null; confidence: Confidence };

function loadOcr() {
  if (typeof document === "undefined") return Promise.reject(new Error("OCR_LIBRARY_LOAD_FAILED"));
  if (window.Tesseract) return Promise.resolve();
  if (ocrPromise) return ocrPromise;
  ocrPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[data-cpm-name-ocr="${OCR}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("OCR_LIBRARY_LOAD_FAILED")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = OCR;
    script.async = true;
    script.dataset.cpmNameOcr = OCR;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("OCR_LIBRARY_LOAD_FAILED"));
    document.head.appendChild(script);
  });
  return ocrPromise;
}

async function pdfjs() {
  if (pdfPromise) return pdfPromise;
  const dynamicImport = new Function("u", "return import(u)") as (u: string) => Promise<any>;
  pdfPromise = dynamicImport(PDF);
  return pdfPromise;
}

function cleanName(value: string) {
  return value
    .replace(/[|]/g, " ")
    .replace(/[^A-Za-zÀ-ÖØ-öø-ÿ' -]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const honorific = /^(?:herr|frau|herrn|fr\.?|hr\.?)\s+/i;
const fieldPrefix = /^(?:vorname|vorn\.?|nachname|familienname|name|kund(?:e|in)|vertragspartner(?:in)?|rechnungs?empfänger(?:in)?|name\s+des\s+(?:kunden|kundin))\s*[:.=\-]?\s*/i;
const contextHeading = /(?:ihre\s+daten|persönliche\s+daten|rechnungsadresse|lieferadresse|verbrauchsstelle|kundendaten|rechnungsempfänger|rechnungsempfaenger|vertragspartner)/i;
const streetLine = /\b(?:straße|strasse|str\.?|weg|allee|platz|ring|gasse|ufer|chaussee)\b|\b\d{5}\b/i;
const addressNoise = /(?:kundennummer|kunden.?nr|vertragsnummer|vertragskonto|mandatsreferenz|rechnungsnummer|rechnungsdatum|geburtsdatum|telefon|email|e-mail|www\.|https?:\/\/|iban|bic|bank|seite\s*\d|strom|gas|energie|rechnung|tarif|verbrauch|abschlag|arbeitspreis|grundpreis|netto|brutto|mwst|kwh|ct\s*\/\s*kwh|€|eur|jahr|monat|tage|zeitraum|messstelle|zähler|zaehler|markt|netz|lieferant|lieferung|bonus|entgelt|umlage|steuer)/i;
const badWord = /^(?:the|your|their|electric|energy|invoice|customer|account|summary|total|page|amount|meter|reading|verbrauch|abrechnung|strom|gas|energie|rechnung|kunde|kundin|name|adresse|anschrift|daten|ihre|persönliche|vertragspartner|rechnungs?empfänger|lieferadresse|verbrauchsstelle|eon|e\.on|optimalstrom)$/i;
const corrupted = /(?:zv|vz|vb|bv|gq|qg|qx|xq|jv|vj|wq|qw|kq|qk)/i;

function normalizeToken(token: string) {
  return token
    .replace(/[0O](?=[a-zäöü])/g, "o")
    .replace(/[1lI](?=[a-zäöü])/g, "l")
    .replace(/\s+/g, "")
    .trim();
}

function validToken(token: string) {
  const value = normalizeToken(token);
  if (value.length < 2 || value.length > 35) return false;
  if (!/^[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ'’-]*$/.test(value)) return false;
  if (badWord.test(value) || addressNoise.test(value) || corrupted.test(value)) return false;
  if (/(.)\1\1/.test(value.toLocaleLowerCase("de-DE"))) return false;
  const lower = value.toLocaleLowerCase("de-DE");
  const vowels = (lower.match(/[aeiouäöü]/g) || []).length;
  if (value.length >= 7 && vowels / value.length < 0.22) return false;
  if (value.length >= 10 && /[^aeiouäöü]{4,}/i.test(value)) return false;
  return true;
}

function candidate(value: string) {
  const withoutTitle = value.replace(honorific, "");
  const parts = cleanName(withoutTitle).split(" ").filter(Boolean).map(normalizeToken);
  if (parts.length < 2 || parts.length > 4) return null;
  if (!parts.every(validToken)) return null;
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

function candidateFromAdjacentLines(lines: string[], index: number) {
  const current = lines[index] || "";
  const next = lines[index + 1] || "";

  if (honorific.test(current)) {
    const direct = candidate(current);
    if (direct) return direct;
  }
  if (honorific.test(next)) {
    const direct = candidate(next);
    if (direct) return direct;
  }

  const strippedCurrent = current.replace(fieldPrefix, "").trim();
  const strippedNext = next.replace(fieldPrefix, "").trim();
  const joined = `${strippedCurrent} ${strippedNext}`.trim();
  const pair = candidate(joined);
  if (pair) return pair;

  return null;
}

function extractName(text: string): NameResult {
  const lines = text
    .split(/\n+/)
    .map(v => v.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  let firstName: string | null = null;
  let lastName: string | null = null;
  let confidence: Confidence = "unknown";

  // 1. Highest confidence: explicit Vorname/Nachname or salutation.
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const firstMatch = line.match(/^(?:vorname|vorn\.?)\s*[:.=\-]?\s*(.+)$/i);
    if (firstMatch) {
      const p = candidate(`X ${firstMatch[1]}`);
      if (p) firstName = p.lastName;
    }

    const lastMatch = line.match(/^(?:nachname|familienname)\s*[:.=\-]?\s*(.+)$/i);
    if (lastMatch) {
      const value = cleanName(lastMatch[1]);
      if (value.split(" ").length === 1 && validToken(value)) lastName = normalizeToken(value);
    }

    if (honorific.test(line)) {
      const p = candidate(line);
      if (p) return { ...p, confidence: "high" };
    }
  }
  if (firstName && lastName) return { firstName, lastName, confidence: "high" };

  // 2. Explicit customer/recipient labels. Never accept a line containing billing noise.
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!/(?:rechnungs?empfänger|vertragspartner|kunde(?:n)?daten|name\s+des\s+kunden|kund(?:e|in))/i.test(line)) continue;

    const inline = line.replace(/.*?(?:rechnungs?empfänger|vertragspartner(?:in)?|kunde(?:n)?daten|name\s+des\s+kunden|kund(?:e|in))\s*[:.=\-]?\s*/i, "").trim();
    if (inline && !addressNoise.test(inline)) {
      const p = candidate(inline);
      if (p) return { ...p, confidence: "high" };
    }

    for (let j = i + 1; j <= Math.min(i + 5, lines.length - 1); j++) {
      if (streetLine.test(lines[j]) || addressNoise.test(lines[j])) continue;
      const p = candidate(lines[j]);
      if (p) return { ...p, confidence: "high" };
      const pair = candidateFromAdjacentLines(lines, j);
      if (pair) return { ...pair, confidence: "high" };
    }
  }

  // 3. Name directly before the street/ZIP line. This is common on utility bills.
  for (let i = 1; i < lines.length; i++) {
    if (!streetLine.test(lines[i])) continue;
    const previous = lines[i - 1];
    if (addressNoise.test(previous)) continue;
    const p = candidate(previous);
    if (p) return { ...p, confidence: "high" };
    const pair = candidateFromAdjacentLines(lines, i - 2);
    if (pair) return { ...pair, confidence: "high" };
  }

  // 4. Context block: accept only clean two-token names, never arbitrary OCR fragments.
  for (let i = 0; i < lines.length; i++) {
    if (!contextHeading.test(lines[i])) continue;
    for (let j = i + 1; j <= Math.min(i + 4, lines.length - 1); j++) {
      if (streetLine.test(lines[j]) || addressNoise.test(lines[j])) continue;
      const p = candidate(lines[j]);
      if (p) return { ...p, confidence: "medium" };
    }
  }

  return { firstName: null, lastName: null, confidence: "unknown" };
}

function copySource(source: unknown) {
  if (typeof document === "undefined") return null;
  if (!(source instanceof HTMLCanvasElement) && !(source instanceof HTMLImageElement)) return null;
  const canvas = document.createElement("canvas");
  canvas.width = source instanceof HTMLCanvasElement ? source.width : source.naturalWidth || source.width;
  canvas.height = source instanceof HTMLCanvasElement ? source.height : source.naturalHeight || source.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0);
  return canvas;
}

function enhance(source: unknown, mode: "color" | "gray" | "threshold") {
  const original = copySource(source);
  if (!original) return source;
  const scale = Math.max(2, Math.min(3.5, 1800 / Math.max(original.width, original.height) * 2));
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(original.width * scale);
  canvas.height = Math.ceil(original.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return original;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(original, 0, 0, canvas.width, canvas.height);
  if (mode === "color") return canvas;

  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < data.data.length; i += 4) {
    const luminance = 0.299 * data.data[i] + 0.587 * data.data[i + 1] + 0.114 * data.data[i + 2];
    const value = mode === "threshold"
      ? (luminance < 185 ? 0 : 255)
      : Math.max(0, Math.min(255, (luminance - 128) * 1.65 + 128));
    data.data[i] = data.data[i + 1] = data.data[i + 2] = value;
  }
  ctx.putImageData(data, 0, 0);
  return canvas;
}

async function imageCanvas(file: File) {
  return new Promise<HTMLCanvasElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth || image.width;
      canvas.height = image.naturalHeight || image.height;
      const ctx = canvas.getContext("2d");
      URL.revokeObjectURL(url);
      if (!ctx) return reject(new Error("IMAGE_DECODE_FAILED"));
      ctx.drawImage(image, 0, 0);
      resolve(canvas);
    };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("IMAGE_DECODE_FAILED")); };
    image.src = url;
  });
}

async function recognizeSource(source: unknown) {
  await loadOcr();
  if (!window.Tesseract) throw new Error("OCR_LIBRARY_LOAD_FAILED");
  const modes: Array<"color" | "gray" | "threshold"> = ["color", "gray", "threshold"];
  const texts: string[] = [];
  for (const mode of modes) {
    const result = await window.Tesseract.recognize(
      enhance(source, mode),
      "deu",
      { logger: () => undefined, tessedit_pageseg_mode: mode === "color" ? 6 : 11, preserve_interword_spaces: "1", user_defined_dpi: "300" },
    );
    const text = String(result?.data?.text || "");
    if (text.trim()) texts.push(text);
    const found = extractName(text);
    if (found.firstName && found.lastName && found.confidence === "high") return found;
  }

  let best: NameResult = { firstName: null, lastName: null, confidence: "unknown" };
  for (const text of texts) {
    const found = extractName(text);
    if (found.confidence === "high") return found;
    if (found.confidence === "medium" && best.confidence === "unknown") best = found;
  }
  return best;
}

async function recognizeImage(file: File) {
  return recognizeSource(await imageCanvas(file));
}

async function recognizePdf(file: File) {
  const pdf = await pdfjs();
  const documentProxy = await pdf.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  let best: NameResult = { firstName: null, lastName: null, confidence: "unknown" };
  for (let pageNumber = 1; pageNumber <= Math.min(12, documentProxy.numPages); pageNumber++) {
    const page = await documentProxy.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 2.6 });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;
    await page.render({ canvasContext: ctx, viewport }).promise;
    const found = await recognizeSource(canvas);
    if (found.confidence === "high") return found;
    if (found.confidence === "medium" && best.confidence === "unknown") best = found;
  }
  return best;
}

export async function analyzeBillNames(files: File[]) {
  let best: NameResult = { firstName: null, lastName: null, confidence: "unknown" };
  for (const file of files.slice(0, 12)) {
    const result = file.type === "application/pdf" ? await recognizePdf(file) : await recognizeImage(file);
    if (result.confidence === "high" && result.firstName && result.lastName) return result;
    if (result.confidence === "medium" && best.confidence === "unknown") best = result;
  }
  return best;
}
