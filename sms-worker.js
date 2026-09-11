/*
 * CPM Energie SMS verification template for Cloudflare Workers.
 *
 * Required Worker secrets:
 *   TWILIO_ACCOUNT_SID
 *   TWILIO_AUTH_TOKEN
 *   TWILIO_FROM
 *
 * Deploy this file as a separate Worker. Never put these values in the
 * GitHub Pages frontend. Configure the frontend to call the Worker URL
 * only after the Worker is deployed and protected with rate limiting.
 */

const ALLOWED_ORIGIN = 'https://svt8f46zcd-stack.github.io';

function corsHeaders(origin) {
  const allowed = origin === ALLOWED_ORIGIN || origin === 'https://cpm-energie.de';
  return {
    'Access-Control-Allow-Origin': allowed ? origin : ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
    'Vary': 'Origin'
  };
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders(origin) });
}

function normalizePhone(value) {
  return String(value || '').replace(/[^+\d]/g, '').replace(/^00/, '+');
}

function validGermanMobile(value) {
  const phone = normalizePhone(value);
  return /^(?:\+49|0049)1[5-7]\d{8,9}$/.test(phone) || /^01[5-7]\d{8,9}$/.test(phone);
}

function createCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendTwilioSms(env, phone, message) {
  const credentials = btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`);
  const body = new URLSearchParams({
    To: phone,
    From: env.TWILIO_FROM,
    Body: message
  });

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  });

  if (!response.ok) throw new Error('Twilio request failed');
  return response.json();
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405, origin);

    try {
      const payload = await request.json();
      const phone = normalizePhone(payload.phone);
      if (!validGermanMobile(phone)) return json({ error: 'Ungültige Mobilfunknummer' }, 400, origin);

      // TODO production hardening:
      // 1. Add Cloudflare Rate Limiting or Durable Object throttling.
      // 2. Store only a short lived, hashed verification state.
      // 3. Expire codes after 5 minutes and limit attempts.
      // 4. Add bot protection before sending paid SMS messages.
      // 5. Do not log phone numbers or verification codes.
      // 6. Validate the requesting Origin against an explicit allowlist.

      const code = createCode();
      await sendTwilioSms(env, phone, `CPM Energie: Dein Verifizierungscode lautet ${code}. Gültig für 5 Minuten.`);

      // Demo response only. Never return the code in production.
      return json({ ok: true, verificationRequired: true, expiresInSeconds: 300 }, 200, origin);
    } catch (error) {
      console.error('SMS worker error');
      return json({ error: 'SMS konnte nicht gesendet werden' }, 500, origin);
    }
  }
};
