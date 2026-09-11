/* CPM Energie static lead funnel */
const premiumStyle = document.createElement('link');
premiumStyle.rel = 'stylesheet';
premiumStyle.href = './premium.css';
document.head.appendChild(premiumStyle);

/* Mobile first polish: loaded after the base stylesheet so the responsive rules win. */
const mobileStyle = document.createElement('style');
mobileStyle.textContent = `
@media (max-width: 760px) {
  html { scroll-padding-top: 68px; }
  body { overflow-x: hidden; }
  .container { width: min(100% - 28px, 560px); }
  .header-inner { height: 64px; gap: 10px; }
  .logo { gap: 6px; }
  .logo-cpm { font-size: 20px; }
  .logo-energy { font-size: 9px; letter-spacing: .16em; }
  .nav { display: none; }
  .nav-cta { padding: 10px 12px; min-height: 42px; border-radius: 11px; font-size: 11px; white-space: nowrap; }
  .hero-inner { display: flex; flex-direction: column; align-items: stretch; gap: 24px; min-height: 0; padding-top: 34px; padding-bottom: 42px; }
  .hero-copy { padding: 0 4px; }
  .eyebrow { font-size: 9px; letter-spacing: .14em; }
  .hero h1 { margin-top: 15px; font-size: clamp(42px, 13vw, 58px); line-height: .96; letter-spacing: -.06em; }
  .hero-lead { margin-top: 18px; font-size: 14px; line-height: 1.6; color: #aebed0; }
  .hero-points { grid-template-columns: repeat(3, 1fr); gap: 0; margin-top: 22px; }
  .hero-points div { min-width: 0; padding: 12px 7px 12px 0; display: block; }
  .hero-points div:not(:first-child) { padding-left: 8px; border-left: 1px solid var(--line); }
  .hero-points b, .hero-points span { display: block; }
  .hero-points b { margin-bottom: 5px; font-size: 9px; }
  .hero-points span { font-size: 10px; line-height: 1.25; }
  .security-note { margin-top: 16px; gap: 9px; }
  .security-icon { width: 30px; height: 30px; flex: 0 0 30px; border-radius: 9px; }
  .security-note strong { font-size: 11px; }
  .security-note small { font-size: 9px; }
  .check-card { width: 100%; border-radius: 20px; box-shadow: 0 24px 65px rgba(0,0,0,.38), inset 0 1px 0 rgba(255,255,255,.08); }
  .card-header { padding: 19px 17px 16px; gap: 10px; }
  .card-overline { font-size: 8px; letter-spacing: .13em; }
  .card-header h2 { font-size: 21px; }
  .secure-badge { padding: 6px 8px; font-size: 9px; }
  .progress-area { padding: 14px 17px 0; }
  .progress-info { font-size: 10px; }
  .step-labels { font-size: 8px; letter-spacing: .04em; }
  .check-card form { padding: 19px 17px 20px; }
  .step-title { gap: 10px; margin-bottom: 20px; }
  .step-title > span { width: 33px; height: 33px; flex-basis: 33px; border-radius: 10px; }
  .step-title h3 { font-size: 17px; }
  .step-title p { font-size: 11px; line-height: 1.45; }
  .field { margin-bottom: 15px; }
  .field label, .field-label { margin-bottom: 6px; font-size: 10px; }
  .field input, .field select { height: 56px; min-height: 56px; border-radius: 12px; font-size: 16px; }
  .input-box input { padding-left: 38px; }
  .input-box input { padding-right: 78px; }
  .input-symbol { left: 12px; }
  .input-unit { right: 12px; font-size: 9px; }
  .hint { padding: 11px 12px; gap: 8px; }
  .hint p { font-size: 9px; line-height: 1.45; }
  .primary-btn, .secondary-btn { min-height: 56px; border-radius: 12px; font-size: 12px; touch-action: manipulation; }
  .button-row { grid-template-columns: 1fr; gap: 8px; }
  .button-row .primary-btn { order: 1; }
  .button-row .secondary-btn { order: 2; }
  .microcopy { font-size: 8px; line-height: 1.45; }
  .two-col { grid-template-columns: 1fr; gap: 0; }
  .consent-card { margin-top: 9px; padding: 11px; gap: 9px; }
  .consent-card strong { font-size: 10px; }
  .consent-card small { font-size: 8px; }
  .custom-check { width: 20px; height: 20px; flex-basis: 20px; }
  .privacy-row { align-items: flex-start; font-size: 9px; line-height: 1.45; }
  .trust-inner { grid-template-columns: 1fr 1fr; padding-top: 8px; padding-bottom: 8px; }
  .trust-inner > div, .trust-inner > div:first-child { padding: 10px 9px; border-right: 0; border-bottom: 1px solid #e6edf2; }
  .trust-inner > div:nth-child(odd) { border-right: 1px solid #e6edf2; }
  .trust-inner > div:nth-child(3), .trust-inner > div:nth-child(4) { border-bottom: 0; }
  .trust-inner span { width: 28px; height: 28px; font-size: 11px; }
  .trust-inner strong { font-size: 9px; }
  .trust-inner small { font-size: 8px; line-height: 1.3; }
  .section-inner { padding-top: 58px; padding-bottom: 58px; }
  .section-heading h2, .personal-grid h2 { font-size: clamp(31px, 9vw, 42px); }
  .section-heading p { margin-top: 15px; font-size: 13px; line-height: 1.65; }
  .process-grid { grid-template-columns: 1fr; gap: 11px; margin-top: 28px; }
  .process-grid article { min-height: 0; padding: 20px; border-radius: 17px; }
  .process-grid article h3 { margin-top: 17px; font-size: 17px; }
  .process-grid article p { font-size: 12px; line-height: 1.55; }
  .transparency-layout, .personal-grid { grid-template-columns: 1fr; gap: 25px; }
  .dark-section h2 { font-size: clamp(30px, 8.5vw, 40px); line-height: 1.05; }
  .dark-section p { font-size: 13px; line-height: 1.65; }
  .tariff-card { padding: 15px; border-radius: 17px; }
  .tariff-item { padding: 12px 0; gap: 9px; }
  .tariff-item > div { min-width: 0; }
  .tariff-item strong { font-size: 11px; }
  .tariff-item small { font-size: 8px; }
  .tariff-item > b { font-size: 9px; white-space: nowrap; }
  .person-card { min-height: 220px; }
  .person-points { display: grid; grid-template-columns: 1fr; gap: 8px; }
  .outline-btn { width: 100%; justify-content: center; min-height: 54px; }
  .faq-grid { grid-template-columns: 1fr; gap: 9px; }
  .faq-grid details { padding: 16px; border-radius: 14px; }
  .faq-grid summary { font-size: 12px; line-height: 1.4; }
  .faq-grid details p { font-size: 11px; line-height: 1.55; }
  .final-section { padding: 66px 0; }
  .final-inner h2 { font-size: clamp(34px, 10vw, 48px); }
  .final-inner p { font-size: 13px; line-height: 1.6; }
  .final-btn { width: 100%; }
  .privacy { padding: 48px 0; }
  .privacy h2 { font-size: 28px; }
  .privacy p { font-size: 11px; line-height: 1.6; }
  .hero-grid { background-size: 44px 44px; }
  .orb-a { width: 360px; height: 360px; right: -210px; top: -150px; }
  .orb-b { width: 280px; height: 280px; left: -190px; bottom: -160px; }
}

@media (max-width: 380px) {
  .container { width: calc(100% - 22px); }
  .nav-cta { padding-inline: 9px; font-size: 10px; }
  .hero h1 { font-size: 40px; }
  .hero-points span { font-size: 9px; }
  .card-header h2 { font-size: 19px; }
  .check-card form { padding-inline: 14px; }
}

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
}
`;
document.head.appendChild(mobileStyle);

const FORMSPREE_ENDPOINT = 'https://formspree.io/f/REPLACE_WITH_FORM_ID';
const form = document.querySelector('#lead-form');
const steps = [...document.querySelectorAll('.step')];
const progressBar = document.querySelector('#progress-bar');
const progressText = document.querySelector('#progress-text');
const stepLabels = [...document.querySelectorAll('.step-labels span')];
const formStatus = document.querySelector('#form-status');
const success = document.querySelector('#success');
const leadIdOutput = document.querySelector('#lead-id');
let currentStep = 1;

function normalizePhone(value) {
  const raw = String(value).trim().replace(/[^+\d]/g, '').replace(/^00/, '+');
  if (/^1[5-7]\d{8,9}$/.test(raw)) return `+49${raw}`;
  return raw;
}

function isValidGermanPhone(value) {
  const phone = normalizePhone(value);
  return /^(?:\+49|0049|0)(?:1[5-7]\d{8,9}|[2-9]\d{5,12})$/.test(phone);
}

function isValidPlz(value) { return /^\d{5}$/.test(String(value).trim()); }
function isValidConsumption(value) {
  const kwh = Number(String(value).replace(/\./g, '').replace(/,/g, '.').replace(/\s/g, ''));
  return Number.isFinite(kwh) && kwh >= 500 && kwh <= 100000;
}

function luhnCheck(value) {
  const digits = String(value).replace(/\D/g, '');
  if (!digits) return false;
  let sum = 0; let doubleDigit = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = Number(digits[i]);
    if (doubleDigit) { digit *= 2; if (digit > 9) digit -= 9; }
    sum += digit; doubleDigit = !doubleDigit;
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
    if (!isValidPlz(document.querySelector('#plz').value)) { setError('plz', 'Bitte gib eine gültige fünfstellige PLZ ein.'); valid = false; }
    if (!isValidConsumption(document.querySelector('#verbrauch').value)) { setError('verbrauch', 'Bitte gib einen Jahresverbrauch zwischen 500 und 100.000 kWh ein.'); valid = false; }
  }
  if (stepNumber === 2) {
    ['vorname','nachname','strasse','taetigkeit'].forEach((id) => {
      if (document.getElementById(id).value.trim().length < 2) { setError(id, 'Bitte ausfüllen.'); valid = false; }
    });
    const date = document.querySelector('#geburtsdatum').value;
    if (!date) { setError('geburtsdatum', 'Bitte gib dein Geburtsdatum ein.'); valid = false; }
    else {
      const birth = new Date(`${date}T00:00:00`); const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const birthdayPassed = today.getMonth() > birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
      if (!birthdayPassed) age -= 1;
      if (age < 18 || age > 100) { setError('geburtsdatum', 'Bitte gib ein gültiges Geburtsdatum für eine volljährige Person ein.'); valid = false; }
    }
  }
  if (stepNumber === 3) {
    if (!isValidGermanPhone(document.querySelector('#telefon').value)) { setError('telefon', 'Bitte gib eine gültige deutsche Telefonnummer ein.'); valid = false; }
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
  stepLabels.forEach((label, index) => label.classList.toggle('active', index + 1 === currentStep));
  steps.forEach((step) => step.classList.toggle('hidden', Number(step.dataset.step) !== currentStep));
}

function makeLeadId() {
  const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
  return `CPM-STROM-${stamp}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

function collectData() {
  const data = Object.fromEntries(new FormData(form).entries());
  data.telefon = normalizePhone(data.telefon);
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
  if (isValidGermanPhone(value)) { status.textContent = '✓ Telefonnummer sieht gültig aus.'; status.style.color = '#0c9a78'; }
  else { status.textContent = 'Bitte prüfe die Telefonnummer.'; status.style.color = '#c58b21'; }
}

document.querySelectorAll('[data-next]').forEach((button) => button.addEventListener('click', () => {
  const next = Number(button.dataset.next);
  if (!validateStep(currentStep)) return;
  currentStep = next; updateProgress();
  document.querySelector('#stromcheck').scrollIntoView({ behavior: 'smooth', block: 'start' });
  const firstField = document.querySelector(`.step[data-step="${currentStep}"] input, .step[data-step="${currentStep}"] select`);
  if (firstField) window.setTimeout(() => firstField.focus({ preventScroll: true }), 350);
}));

document.querySelectorAll('[data-prev]').forEach((button) => button.addEventListener('click', () => {
  currentStep = Number(button.dataset.prev); updateProgress();
  document.querySelector('#stromcheck').scrollIntoView({ behavior: 'smooth', block: 'start' });
}));

document.querySelector('#telefon').addEventListener('input', setPhoneStatus);
document.querySelector('#plz').addEventListener('input', (event) => { event.target.value = event.target.value.replace(/\D/g, '').slice(0, 5); });
document.querySelector('#verbrauch').addEventListener('input', (event) => { event.target.value = event.target.value.replace(/[^\d.,]/g, '').slice(0, 8); });

document.querySelector('#geburtsdatum').setAttribute('max', new Date().toISOString().slice(0, 10));

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!validateStep(3)) return;
  if (FORMSPREE_ENDPOINT.includes('REPLACE_WITH_FORM_ID')) {
    formStatus.textContent = 'Formular ist noch nicht produktiv verbunden. Bitte den Formspree Endpoint in script.js hinterlegen.';
    return;
  }
  const data = collectData();
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true; submitButton.textContent = 'Wird sicher übertragen …'; formStatus.textContent = '';
  try {
    const response = await fetch(FORMSPREE_ENDPOINT, { method:'POST', headers:{ Accept:'application/json','Content-Type':'application/json' }, body:JSON.stringify(data) });
    if (!response.ok) throw new Error(`Formspree ${response.status}`);
    leadIdOutput.textContent = data.lead_id;
    document.querySelectorAll('.step').forEach((step) => step.classList.add('hidden'));
    success.classList.remove('hidden'); progressBar.style.width = '100%'; progressText.textContent = 'Anfrage abgeschlossen';
    stepLabels.forEach((label) => label.classList.remove('active')); stepLabels[2].classList.add('active');
  } catch (error) {
    console.error(error); formStatus.textContent = 'Die Anfrage konnte gerade nicht übertragen werden. Bitte versuche es erneut.';
    submitButton.disabled = false; submitButton.innerHTML = 'Check unverbindlich anfragen <span>→</span>';
  }
});

window.CPMValidation = { isValidGermanPhone, isValidPlz, isValidConsumption, luhnCheck };
updateProgress();
