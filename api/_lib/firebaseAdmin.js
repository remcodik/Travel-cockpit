// ═══════════════════════════════════════════════════════════
// api/_lib/firebaseAdmin.js — gedeelde Firebase Admin-init
// Bestandsnaam begint met _ zodat Vercel dit NIET als eigen
// endpoint publiceert (alleen de bestanden direct in api/ worden
// routes).
//
// Verwacht twee Vercel environment variables:
//   FIREBASE_SERVICE_ACCOUNT_KEY  — de volledige service-account
//     JSON (Firebase Console → Projectinstellingen → Service
//     accounts → Genereer nieuwe privésleutel), base64-gecodeerd
//     zodat newlines in de private key niet breken in de env-var UI.
//   OWNER_PIN — een door jou gekozen code, alleen bekend bij jou,
//     die toegang geeft tot het beheren van deel-links en (als
//     eigenaar) tot alle reizen.
// ═══════════════════════════════════════════════════════════

import admin from 'firebase-admin';

let app = null;

export function getAdminApp() {
  if (app) return app;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY ontbreekt als Vercel environment variable');
  }

  let serviceAccount;
  try {
    const jsonStr = raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
    serviceAccount = JSON.parse(jsonStr);
  } catch (err) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY kon niet gelezen worden — verwacht base64 van de service-account JSON: ' + err.message);
  }

  app = admin.apps.length
    ? admin.app()
    : admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

  return app;
}

export function getAdminAuth() {
  return admin.auth(getAdminApp());
}

export function getAdminFirestore() {
  return admin.firestore(getAdminApp());
}

// Simpele, constant-tijd-achtige vergelijking om timing-verschillen bij
// het vergelijken van de PIN te verkleinen (geen harde garantie, maar
// beter dan een directe === op user-input van onbekende lengte).
export function checkOwnerPin(candidate) {
  const expected = process.env.OWNER_PIN || '';
  if (!expected) throw new Error('OWNER_PIN is niet ingesteld als Vercel environment variable');
  if (typeof candidate !== 'string' || candidate.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= candidate.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

// ── Sessiecontrole voor AI-endpoints ──
// Verwacht een Firebase ID-token (Authorization: Bearer ...) van een
// ingelogde bezoeker: eigenaar (PIN) of deel-link. Zonder sessie geen
// AI-aanroep, zodat niet iedereen met de URL het Anthropic-tegoed kan
// opmaken. Geeft het gedecodeerde token terug, of stuurt zelf 401.
export async function requireSession(req, res) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: 'Niet ingelogd' });
    return null;
  }
  try {
    return await getAdminAuth().verifyIdToken(token);
  } catch {
    res.status(401).json({ error: 'Ongeldige of verlopen sessie' });
    return null;
  }
}

// ── PIN met pogingenlimiet ──
// Zonder limiet is een korte PIN met een script te raden. Per IP max
// PIN_MAX_FAILS mislukte pogingen per PIN_WINDOW_MS, plus een globale
// rem zodat wisselende IP's het niet omzeilen. Tellers staan in
// Firestore (_rate/*); de rules geven clients daar geen toegang
// (niet-gematchte paden zijn standaard dicht), de Admin SDK wel.
const PIN_MAX_FAILS = 5;
const PIN_GLOBAL_MAX_FAILS = 30;
const PIN_WINDOW_MS = 15 * 60 * 1000;

function clientIp(req) {
  const fwd = String(req.headers['x-forwarded-for'] || '');
  return (fwd.split(',')[0] || req.socket?.remoteAddress || 'onbekend').trim();
}

async function failureCount(ref, now) {
  const snap = await ref.get();
  const d = snap.exists ? snap.data() : null;
  if (!d || now - d.windowStart > PIN_WINDOW_MS) return 0;
  return d.fails || 0;
}

async function recordFailure(ref, now) {
  const db = getAdminFirestore();
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const d = snap.exists ? snap.data() : null;
    if (!d || now - d.windowStart > PIN_WINDOW_MS) {
      tx.set(ref, { windowStart: now, fails: 1 });
    } else {
      tx.update(ref, { fails: (d.fails || 0) + 1 });
    }
  });
}

// Geeft { ok: true } bij juiste PIN, { ok: false, locked } anders.
export async function verifyPinWithLimit(req, pin) {
  const db = getAdminFirestore();
  const now = Date.now();
  const ipKey = clientIp(req).replace(/[^a-zA-Z0-9]/g, '_').slice(0, 100);
  const ipRef = db.collection('_rate').doc(`pin_ip_${ipKey}`);
  const globalRef = db.collection('_rate').doc('pin_global');

  const [ipFails, globalFails] = await Promise.all([failureCount(ipRef, now), failureCount(globalRef, now)]);
  if (ipFails >= PIN_MAX_FAILS || globalFails >= PIN_GLOBAL_MAX_FAILS) {
    return { ok: false, locked: true };
  }
  if (checkOwnerPin(pin)) return { ok: true };

  await Promise.all([recordFailure(ipRef, now), recordFailure(globalRef, now)]);
  return { ok: false, locked: false };
}
