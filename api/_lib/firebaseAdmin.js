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
