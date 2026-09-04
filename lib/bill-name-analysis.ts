const OCR = "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";
const PDF = "https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.54/build/pdf.mjs";
let ocrPromise: Promise<void> | null = null;
let pdfPromise: Promise<any> | null = null;
declare global { interface Window { Tesseract?: any } }

type Confidence = "high" | "medium" | "unknown";
type NameResult = { firstName: string | null; lastName: string | null; confidence: Confidence };
type NameCandidate = NameResult & { score: number };

const TITLE = /^(?:herr|frau|herrn|fr\.?|hr\.?|mr\.?|mrs\.?|ms\.?)\s+/i;
const LABEL = /^(?:vorname|vorn\.?|first\s*name|nachname|familienname|last\s*name|surname|name|kundenname|kunde(?:n|in)?|vertragspartner(?:in)?|rechnungs?empfänger(?:in)?|rechnungsempfänger|name\s+des\s+kunden)\s*[:.=\-]?\s*/i;
const LABEL_INLINE = /(?:vorname|first\s*name|nachname|familienname|last\s*name|surname|kundenname|vertragspartner(?:in)?|rechnungs?empfänger(?:in)?|rechnungsempfänger|name\s+des\s+kunden)\s*[:.=\-]?\s*/i;
const CONTEXT = /(?:ihre\s+daten|persönliche\s+daten|rechnungsadresse|rechnungsanschrift|lieferadresse|verbrauchsstelle|kundendaten|rechnungsempfänger|rechnungsempfaenger|vertragspartner|anschrift|adresse)/i;
const STREET = /\b(?:straße|strasse|str\.?|weg|allee|platz|ring|gasse|ufer|chaussee|stieg|steig|promenade|damm)\b|\b\d{5}\b/i;
const POSTCODE = /\b\d{5}\b/;
const ADDRESS_NOISE = /(?:kundennummer|kunden.?nr|kundennr|vertragsnummer|vertragskonto|mandatsreferenz|rechnungsnummer|rechnungsdatum|geburtsdatum|telefon|mobil|email|e-mail|www\.|https?:\/\/|iban|bic|bank|seite\s*\d|strom|gas|energie|rechnung|tarif|verbrauch|abschlag|arbeitspreis|grundpreis|netto|brutto|mwst|kwh|ct\s*\/\s*kwh|€|eur|jahr|monat|tage|zeitraum|messstelle|zähler|zaehler|markt|netz|lieferant|lieferung|bonus|entgelt|umlage|steuer|abbuchung|zahlung|betrag|summe|kosten|preis|gutschrift)/i;
const BAD_WORD = /^(?:the|your|their|electric|energy|invoice|customer|account|summary|total|page|amount|meter|reading|verbrauch|abrechnung|strom|gas|energie|rechnung|kunde|kundin|name|adresse|anschrift|daten|ihre|persönliche|vertragspartner|rechnungs?empfänger|lieferadresse|verbrauchsstelle|eon|e\.on|optimalstrom|seite)$/i;
const OCR_GARBAGE = /(?:sabrez|veib|bezeich|erkannt|sicherheit|high|medium|unknown|rechnungsposition|zusammengeführt|zusammengefuehrt)/i;
const COMPANY_WORDS = /^(?:eon|e\.on|enbw|vattenfall|yello|yello\s+strom|mainova|ente ga|entega|goldgas|rwe|innogy|swm|stadtwerke|lichtblick|naturstrom|enercity|eprimo|octopus|lekker|1komma5|tibber)$/i;
const NAME_PARTICLES = /^(?:von|van|de|der|den|da|dos|do|di|du|la|le|del|zu|zum|zur)$/i;

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

function clean(value: string) {
  return value
    .replace(/[|•·]/g, " ")
    .replace(/[\u0000-\u001F]/g, " ")
    .replace(/[^A-Za-zÀ-ÖØ-öø-ÿÄÖÜäöüß'’\- ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeToken(token: string) {
  let value = token
    .replace(/[“”„]/g, "")
    .replace(/[0O](?=[a-zäöüß])/g, "o")
    .replace(/[1I](?=[a-zäöüß])/g, "l")
    .trim();
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function validToken(token: string) {
  const value = normalizeToken(token);
  const lower = value.toLocaleLowerCase("de-DE");
  if (value.length < 2 || value.length > 35) return false;
  if (!/^[A-Za-zÀ-ÖØ-öø-ÿÄÖÜäöüß][A-Za-zÀ-ÖØ-öø-ÿÄÖÜäöüß'’\-]*$/.test(value)) return false;
  if (BAD_WORD.test(lower) || COMPANY_WORDS.test(lower) || ADDRESS_NOISE.test(lower) || OCR_GARBAGE.test(lower)) return false;
  if (/\d/.test(value)) return false;
  if (/(.)\1\1/.test(lower)) return false;
  const letters = lower.replace(/[^a-zäöüß]/g, "");
  const vowels = (letters.match(/[aeiouäöü]/g) || []).length;
  if (letters.length >= 7 && vowels / letters.length < 0.20) return false;
  if (letters.length >= 11 && /[^aeiouäöü]{5,}/i.test(letters)) return false;
  return true;
}

function makeCandidate(value: string): { firstName: string; lastName: string } | null {
  const withoutTitle = value.replace(TITLE, "");
  const parts = clean(withoutTitle).split(" ").filter(Boolean).map(normalizeToken);
  if (parts.length < 2 || parts.length > 5) return null;
  if (!parts.every(validToken)) return null;

  let first = parts[0];
  let lastParts = parts.slice(1);
  if (NAME_PARTICLES.test(lastParts[0])) {
    lastParts = lastParts.slice(0, 3).concat(lastParts.slice(3));
  }
  const last = lastParts.join(" ");
  if (!validToken(first) || !last || last.length > 55) return null;
  if (first.toLocaleLowerCase("de-DE") === last.toLocaleLowerCase("de-DE")) return null;
  return { firstName: first, lastName: last };
}

function scoreName(c: { firstName: string; lastName: string }, source: string, bonus: number) {
  const first = c.firstName.toLocaleLowerCase("de-DE");
  const last = c.lastName.toLocaleLowerCase("de-DE");
  let score = bonus;
  if (TITLE.test(source)) score += 45;
  if (/\b(?:vorname|nachname|familienname|first\s*name|last\s*name|surname)\b/i.test(source)) score += 55;
  if (/^[A-ZÄÖÜ][a-zäöüß'’\-]+\s+[A-ZÄÖÜ][a-zäöüß'’\-]+(?:\s+[A-ZÄÖÜ][a-zäöüß'’\-]+)?$/.test(c.firstName + " " + c.lastName)) score += 10;
  if (first.length >= 3) score += 4;
  if (last.length >= 4) score += 4;
  if (NAME_PARTICLES.test(last.split(" ")[0])) score += 3;
  return score;
}

function resultFromCandidates(candidates: NameCandidate[]): NameResult {
  if (!candidates.length) return { firstName: null, lastName: null, confidence: "unknown" };
  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];
  const second = candidates[1];
  const margin = second ? best.score - second.score : 99;
  if (best.score >= 100 && margin >= 12) return { firstName: best.firstName, lastName: best.lastName, confidence: "high" };
  if (best.score >= 72 && margin >= 8) return { firstName: best.firstName, lastName: best.lastName, confidence: "medium" };
  return { firstName: null, lastName: null, confidence: "unknown" };
}

function linesFromText(text: string) {
  return text.split(/\n+/).map(v => v.replace(/\s+/g, " ").trim()).filter(Boolean);
}

function extractName(text: string): NameResult {
  const lines = linesFromText(text);
  const candidates: NameCandidate[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const next = lines[i + 1] || "";
    const prev = lines[i - 1] || "";

    const titleCandidate = makeCandidate(line);
    if (titleCandidate && TITLE.test(line)) candidates.push({ ...titleCandidate, confidence: "high", score: scoreName(titleCandidate, line, 105) });

    const explicit = line.match(/^(?:vorname|vorn\.?|first\s*name)\s*[:.=\-]?\s*(.+)$/i);
    if (explicit) {
      const first = clean(explicit[1]).split(" ")[0];
      const nextLast = clean(next.replace(/^(?:nachname|familienname|last\s*name|surname)\s*[:.=\-]?\s*/i, ""));
      if (validToken(first) && validToken(nextLast) && !ADDRESS_NOISE.test(nextLast)) candidates.push({ firstName: normalizeToken(first), lastName: normalizeToken(nextLast), confidence: "high", score: 155 });
      const pair = makeCandidate(`${first} ${nextLast}`);
      if (pair) candidates.push({ ...pair, confidence: "high", score: 150 });
    }

    const explicitLast = line.match(/^(?:nachname|familienname|last\s*name|surname)\s*[:.=\-]?\s*(.+)$/i);
    if (explicitLast) {
      const firstLine = clean(prev.replace(/^(?:vorname|vorn\.?|first\s*name)\s*[:.=\-]?\s*/i, ""));
      const last = clean(explicitLast[1]);
      if (validToken(firstLine) && validToken(last)) candidates.push({ firstName: normalizeToken(firstLine), lastName: normalizeToken(last), confidence: "high", score: 150 });
    }

    if (LABEL_INLINE.test(line) && !ADDRESS_NOISE.test(line)) {
      const value = clean(line.replace(LABEL_INLINE, ""));
      const pair = makeCandidate(value);
      if (pair) candidates.push({ ...pair, confidence: "high", score: scoreName(pair, line, 135) });
    }

    if (/(?:rechnungs?empfänger|vertragspartner|kundendaten|kundenname|name\s+des\s+kunden)/i.test(line)) {
      const inline = clean(line.replace(/.*?(?:rechnungs?empfänger|vertragspartner(?:in)?|kundendaten|kundenname|name\s+des\s+kunden)\s*[:.=\-]?\s*/i, ""));
      const pair = makeCandidate(inline);
      if (pair) candidates.push({ ...pair, confidence: "high", score: scoreName(pair, line, 140) });
      for (let j = i + 1; j <= Math.min(i + 4, lines.length - 1); j++) {
        if (ADDRESS_NOISE.test(lines[j]) || STREET.test(lines[j])) continue;
        const p = makeCandidate(lines[j]);
        if (p) candidates.push({ ...p, confidence: "high", score: scoreName(p, lines[j], 125 - (j - i) * 8) });
      }
    }

    if (STREET.test(line)) {
      for (let j = Math.max(0, i - 3); j < i; j++) {
        const possible = lines[j];
        if (ADDRESS_NOISE.test(possible) || POSTCODE.test(possible) || STREET.test(possible)) continue;
        const p = makeCandidate(possible);
        if (p) candidates.push({ ...p, confidence: "high", score: scoreName(p, possible, 125 - (i - j) * 12) });
      }
    }

    if (CONTEXT.test(line)) {
      for (let j = i + 1; j <= Math.min(i + 4, lines.length - 1); j++) {
        const possible = lines[j];
        if (ADDRESS_NOISE.test(possible) || STREET.test(possible) || POSTCODE.test(possible)) continue;
        const p = makeCandidate(possible);
        if (p) candidates.push({ ...p, confidence: "medium", score: scoreName(p, possible, 82 - (j - i) * 10) });
      }
    }
  }

  return resultFromCandidates(candidates);
}

function spatialLines(words: any[]) {
  const usable = (words || [])
    .filter(w => String(w?.text || "").trim())
    .map(w => ({ text: String(w.text).trim(), x: Number(w?.bbox?.x0 || 0), y: Number(w?.bbox?.y0 || 0), conf: Number(w?.confidence ?? 0) }))
    .filter(w => w.conf >= 20 || w.text.length > 2)
    .sort((a, b) => a.y - b.y || a.x - b.x);
  const groups: Array<{ y: number; words: typeof usable }> = [];
  for (const word of usable) {
    const last = groups[groups.length - 1];
    if (!last || Math.abs(last.y - word.y) > 18) groups.push({ y: word.y, words: [word] });
    else last.words.push(word);
  }
  return groups.map(g => g.words.sort((a, b) => a.x - b.x).map(w => w.text).join(" "));
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
  const maxDimension = Math.max(original.width, original.height);
  const scale = Math.max(2, Math.min(3.2, 2600 / Math.max(1, maxDimension)));
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
    const value = mode === "threshold" ? (luminance < 175 ? 0 : 255) : Math.max(0, Math.min(255, (luminance - 128) * 1.8 + 128));
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
  const allTexts: string[] = [];
  const allSpatial: string[] = [];

  for (const mode of modes) {
    const result = await window.Tesseract.recognize(
      enhance(source, mode),
      "deu+eng",
      {
        logger: () => undefined,
        tessedit_pageseg_mode: mode === "color" ? 6 : 11,
        preserve_interword_spaces: "1",
        user_defined_dpi: "300",
      },
    );
    const text = String(result?.data?.text || "");
    if (text.trim()) allTexts.push(text);
    const spatial = spatialLines(result?.data?.words || []);
    if (spatial.length) allSpatial.push(spatial.join("\n"));

    const direct = extractName(spatial.join("\n"));
    if (direct.confidence === "high") return direct;
    const fallback = extractName(text);
    if (fallback.confidence === "high") return fallback;
  }

  const merged = [...allSpatial, ...allTexts];
  const candidates = merged.map(extractName);
  const high = candidates.find(v => v.confidence === "high");
  if (high) return high;
  return candidates.find(v => v.confidence === "medium") || { firstName: null, lastName: null, confidence: "unknown" };
}

async function extractPdfText(page: any) {
  try {
    const content = await page.getTextContent({ normalizeWhitespace: true, disableCombineTextItems: false });
    const items = (content?.items || []).filter((item: any) => typeof item?.str === "string" && item.str.trim());
    if (!items.length) return "";
    const positioned = items.map((item: any) => ({
      text: String(item.str).trim(),
      x: Number(item.transform?.[4] || 0),
      y: Number(item.transform?.[5] || 0),
    })).sort((a: any, b: any) => b.y - a.y || a.x - b.x);
    const lines: Array<{ y: number; items: typeof positioned }> = [];
    for (const item of positioned) {
      const last = lines[lines.length - 1];
      if (!last || Math.abs(last.y - item.y) > 4) lines.push({ y: item.y, items: [item] });
      else last.items.push(item);
    }
    return lines.map(line => line.items.sort((a: any, b: any) => a.x - b.x).map((item: any) => item.text).join(" ")).join("\n");
  } catch {
    return "";
  }
}

async function recognizeImage(file: File) {
  return recognizeSource(await imageCanvas(file));
}

async function recognizePdf(file: File) {
  const pdf = await pdfjs();
  const documentProxy = await pdf.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  let best: NameResult = { firstName: null, lastName: null, confidence: "unknown" };
  for (let pageNumber = 1; pageNumber <= Math.min(20, documentProxy.numPages); pageNumber++) {
    const page = await documentProxy.getPage(pageNumber);

    // Digital PDFs are checked before OCR. This is exact text extraction and avoids OCR corruption completely.
    const nativeText = await extractPdfText(page);
    if (nativeText) {
      const found = extractName(nativeText);
      if (found.confidence === "high") return found;
      if (found.confidence === "medium" && best.confidence === "unknown") best = found;
    }

    const viewport = page.getViewport({ scale: 2.8 });
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
  for (const file of files) {
    try {
      const found = file.type === "application/pdf" || /\.pdf$/i.test(file.name)
        ? await recognizePdf(file)
        : await recognizeImage(file);
      if (found.confidence === "high") return found;
      if (found.confidence === "medium" && best.confidence === "unknown") best = found;
    } catch {
      // One unreadable page/file must never prevent the remaining invoice pages from being analysed.
    }
  }
  return best;
}
