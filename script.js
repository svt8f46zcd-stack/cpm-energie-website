/* CPM Energie static lead funnel
 * Configure FORMSPREE_ENDPOINT before production use.
 */

const FORMSPREE_ENDPOINT = 'https://formspree.io/f/REPLACE_WITH_FORM_ID';
const form = document.querySelector('#lead-form');
const steps = [...document.querySelectorAll('.step')];
const progressBar = document.querySelector('#progress-bar');
const progressText = document.querySelector('#progress-text');
const formStatus = document.querySelector('#form-status');
const success = document.querySelector('#success');
const leadIdOutput = document.querySelector('#lead-id');
let currentStep = 1;

function normalizePhone(value) {
  return value.replace(/[^+\d]/g, '').replace(/^00/, '+');
}

function isValidGermanPhone(value) {
  const phone = normalizePhone(value);
  return /^(?:\+49|0049|0)(?:1[5-7]\d{8,9}|[2-9]\d{5,12})$/.test(phone);
}

function isValidPlz(value) {
  return /^\d{5}$/.test(value.trim());
}

function isValidConsumption(value) {
  const kwh = Number(value.replace(/\./g, '').replace(/,/g, '.').replace(/\s/g, ''));
  return Number.isFinite(kwh) && kwh >= 500 && kwh <= 100000;
}

// Luhn is intentionally not used to "validate" a phone number: phone numbers
// do not have a Luhn checksum. This helper is available for future numeric
// verification references if a downstream system defines one.
function luhnCheck(value) {
  const digits = String(value).replace(/\D/g, '');
  if (!digits) return false;
  let sum = 0;
  let doubleDigit = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = Number(digits[i]);
    if (doubleDigit) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    doubleDigit = !doubleDigit;
  }
  return sum % 10 === 0;
}

function setError(name, message = '') {
  const error = document.querySelector(`[data-error-for="${name}"]`);
  if (error) error.textContent = message;
  const field = document.getElementById(name);
  if (field) field.setAttribute('aria-invalid', message ? 'true' : 'false');
}

function clearStepErrors(step) {
  step.querySelectorAll('.field-error').forEach((el) => { el.textContent = ''; });
  step.querySelectorAll('[aria-invalid="true"]').forEach((el) => el.setAttribute('aria-invalid', 'false'));
  formStatus.textContent = '';
}

function validateStep(stepNumber) {
  const step = document.querySelector(`.step[data-step="${stepNumber}"]`);
  clearStepErrors(step);
  let valid = true;

  if (stepNumber === 1) {
    const plz = document.querySelector('#plz').value;
    const consumption = document.querySelector('#verbrauch').value;
    if (!isValidPlz(plz)) { setError('plz', 'Bitte gib eine gültige fünfstellige PLZ ein.'); valid = false; }
    if (!isValidConsumption(consumption)) { setError('verbrauch', 'Bitte gib einen Jahresverbrauch zwischen 500 und 100.000 kWh ein.'); valid = false; }
  }

  if (stepNumber === 2) {
    ['vorname', 'nachname', 'strasse', 'taetigkeit'].forEach((id) => {
      const value = document.getElementById(id).value.trim();
      if (value.length < 2) { setError(id, 'Bitte ausfüllen.'); valid = false; }
    });
    const date = document.querySelector('#geburtsdatum').value;
    if (!date) { setError('geburtsdatum', 'Bitte gib dein Geburtsdatum ein.'); valid = false; }
    else {
      const birth = new Date(`${date}T00:00:00`);
      const age = new Date().getFullYear() - birth.getFullYear() - (new Date() < new Date(new Date().getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0);
      if (age < 18 || age > 100) { setError('geburtsdatum', 'Bitte gib ein gültiges Geburtsdatum für eine volljährige Person ein.'); valid = false; }
    }
  }

  if (stepNumber === 3) {
    const phone = document.querySelector('#telefon').value;
    if (!isValidGermanPhone(phone)) { setError('telefon', 'Bitte gib eine gültige deutsche Telefonnummer ein.'); valid = false; }
    if (!document.querySelector('#heizung').value) { setError('heizung', 'Bitte auswählen.'); valid = false; }
    if (!document.querySelector('#erreichbarkeit').value) { setError('erreichbarkeit', 'Bitte auswählen.'); valid = false; }
    if (!document.querySelector('#callback-consent').checked) { setError('callback-consent', 'Für einen Rückruf ist deine ausdrückliche Zustimmung erforderlich.'); valid = false; }
    if (!document.querySelector('#privacy').checked) { setError('privacy', 'Bitte bestätige die Datenschutzhinweise.'); valid = false; }
  }

  return valid;
}

function updateProgress() {
  const percent = (currentStep / steps.length) * 100;
  progressBar.style.width = `${percent}%`;
  progressText.textContent = `Schritt ${currentStep} von ${steps.length}`;
  steps.forEach((step) => step.classList.toggle('hidden', Number(step.dataset.step) !== currentStep));
}

function makeLeadId() {
  const now = new Date();
  const stamp = now.toISOString().replace(/\D/g, '').slice(0, 14);
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `CPM-STROM-${stamp}-${random}`;
}

function collectData() {
  const data = Object.fromEntries(new FormData(form).entries());
  data.whatsapp_optin = document.querySelector('#whatsapp').checked ? 'ja' : 'nein';
  data.callback_consent = document.querySelector('#callback-consent').checked ? 'ja' : 'nein';
  data.privacy_consent = document.querySelector('#privacy').checked ? 'ja' : 'nein';
  data.lead_id = makeLeadId();
  data.created_at = new Date().toISOString();
  data.source = window.location.href;
  data.referrer = document.referrer || '';
  data.user_agent = navigator.userAgent;
  data.consent_version = '2026-09-12';
  data.consent_timestamp = new Date().toISOString();
  return data;
}

function setPhoneStatus() {
  const value = document.querySelector('#telefon').value;
  const status = document.querySelector('#phone-status');
  if (!value) { status.textContent = ''; return; }
  if (isValidGermanPhone(value)) {
    status.textContent = 'Telefonnummer sieht gültig aus.';
    status.className = 'mt-1 text-xs text-emerald-400';
  } else {
    status.textContent = 'Bitte prüfe die Telefonnummer.';
    status.className = 'mt-1 text-xs text-amber-400';
  }
}

document.querySelectorAll('[data-next]').forEach((button) => {
  button.addEventListener('click', () => {
    const next = Number(button.dataset.next);
    if (!validateStep(currentStep)) return;
    currentStep = next;
    updateProgress();
    document.querySelector('#lead-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

document.querySelectorAll('[data-prev]').forEach((button) => {
  button.addEventListener('click', () => {
    currentStep = Number(button.dataset.prev);
    updateProgress();
  });
});

document.querySelector('#telefon').addEventListener('input', setPhoneStatus);

document.querySelector('#plz').addEventListener('input', (event) => {
  event.target.value = event.target.value.replace(/\D/g, '').slice(0, 5);
});

document.querySelector('#verbrauch').addEventListener('input', (event) => {
  event.target.value = event.target.value.replace(/[^\d.,]/g, '').slice(0, 7);
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!validateStep(3)) return;

  if (FORMSPREE_ENDPOINT.includes('REPLACE_WITH_FORM_ID')) {
    formStatus.textContent = 'Formular ist noch nicht produktiv verbunden. Bitte den Formspree Endpoint in script.js hinterlegen.';
    formStatus.className = 'mt-4 text-center text-sm text-amber-300';
    return;
  }

  const data = collectData();
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = 'Wird sicher übertragen …';
  formStatus.textContent = '';

  try {
    const response = await fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) throw new Error(`Formspree ${response.status}`);

    leadIdOutput.textContent = data.lead_id;
    document.querySelectorAll('.step').forEach((step) => step.classList.add('hidden'));
    success.classList.remove('hidden');
    progressBar.style.width = '100%';
    progressText.textContent = 'Anfrage abgeschlossen';
  } catch (error) {
    console.error(error);
    formStatus.textContent = 'Die Anfrage konnte gerade nicht übertragen werden. Bitte versuche es erneut.';
    formStatus.className = 'mt-4 text-center text-sm text-red-300';
    submitButton.disabled = false;
    submitButton.innerHTML = 'Jetzt unverbindlich prüfen <span>→</span>';
  }
});

// Keep the helper available for future SMS or CRM reference validation.
window.CPMValidation = { isValidGermanPhone, isValidPlz, isValidConsumption, luhnCheck };
updateProgress();
