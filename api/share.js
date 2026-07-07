// ═══════════════════════════════════════════════════════════
// api/share.js — Vercel serverless function (geconsolideerd)
// Combineert owner-login, create/list/revoke-share en redeem-share in
// één functie. Vercel's Hobby-plan staat max. 12 serverless functions
// per deployment toe — deze 5 nauw verwante, allemaal op dezelfde
// _lib/firebaseAdmin.js leunende eindpunten samen (los van de overige
// 8 API-routes) duwden het totaal naar 13, waardoor élke deploy sinds
// het toevoegen van api/geocode.js faalde (zie
// docs/10-issues/32-vercel-function-limit-alle-deploys-faalden.md).
//
// Routing:
//   GET  /api/share?id=...                              → redeem-share (publiek, geen PIN)
//   POST /api/share  { action: 'login', pin }             → owner-login
//   POST /api/share  { action: 'create', pin, scope, tripId, label } → create-share
//   POST /api/share  { action: 'list', pin }               → list-shares
//   POST /api/share  { action: 'revoke', pin, shareId, revoked } → revoke-share
// ═══════════════════════════════════════════════════════════

import { getAdminAuth, getAdminFirestore, checkOwnerPin } from './_lib/firebaseAdmin.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return handleRedeem(req, res);
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Alleen GET of POST toegestaan' });
  }

  const { action } = req.body || {};
  switch (action) {
    case 'login': return handleLogin(req, res);
    case 'create': return handleCreate(req, res);
    case 'list': return handleList(req, res);
    case 'revoke': return handleRevoke(req, res);
    default: return res.status(400).json({ error: 'Onbekende of ontbrekende action' });
  }
}

// ── Publiek: deel-link inwisselen (geen PIN nodig — de shareId zelf is
// het geheim, zoals een Google Docs-deel-link). Zoekt shares/{id} op;
// als niet herroepen, mint een custom token met de rechten van die
// specifieke link (scope + tripId als claims). ──
async function handleRedeem(req, res) {
  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Geef een share-id op' });
  }
  try {
    const db = getAdminFirestore();
    const snap = await db.collection('shares').doc(id).get();
    if (!snap.exists) {
      return res.status(404).json({ error: 'Deze deel-link bestaat niet (meer)' });
    }
    const share = snap.data();
    if (share.revoked) {
      return res.status(403).json({ error: 'Deze deel-link is ingetrokken' });
    }
    const token = await getAdminAuth().createCustomToken(`share-${id}`, {
      owner: false,
      scope: share.scope,
      tripId: share.tripId || null,
      allTrips: !share.tripId,
      shareId: id,
    });
    return res.status(200).json({ token, scope: share.scope, tripId: share.tripId || null });
  } catch (err) {
    console.error('redeem-share fout:', err);
    return res.status(500).json({ error: 'Inwisselen mislukt', message: err.message });
  }
}

// ── PIN (alleen bekend bij de eigenaar) -> Firebase custom token met
// volledige, blijvende toegang tot alle reizen. ──
async function handleLogin(req, res) {
  const { pin } = req.body || {};
  try {
    if (!checkOwnerPin(pin)) {
      return res.status(401).json({ error: 'Onjuiste code' });
    }
    const token = await getAdminAuth().createCustomToken('owner', {
      owner: true,
      allTrips: true,
      scope: 'edit',
    });
    return res.status(200).json({ token });
  } catch (err) {
    console.error('owner-login fout:', err);
    return res.status(500).json({ error: 'Inloggen mislukt', message: err.message });
  }
}

// ── Nieuwe deel-link aanmaken: shares/{shareId} in Firestore, alleen
// bereikbaar met de eigenaar-PIN. Gebeurt via de Admin SDK, dus dit
// negeert de Firestore-rules volledig (bewust — deze route IS de
// bewaker, niet de rules). ──
async function handleCreate(req, res) {
  const { pin, scope, tripId, label } = req.body || {};
  if (!checkOwnerPin(pin)) {
    return res.status(401).json({ error: 'Onjuiste code' });
  }
  if (scope !== 'view' && scope !== 'edit') {
    return res.status(400).json({ error: 'scope moet "view" of "edit" zijn' });
  }
  if (tripId !== null && typeof tripId !== 'string') {
    return res.status(400).json({ error: 'tripId moet een string zijn, of null voor alle reizen' });
  }
  try {
    const db = getAdminFirestore();
    const ref = db.collection('shares').doc();
    const doc = {
      scope,
      tripId: tripId || null,
      label: typeof label === 'string' ? label.slice(0, 100) : '',
      revoked: false,
      createdAt: new Date().toISOString(),
    };
    await ref.set(doc);

    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const url = `${proto}://${host}/?share=${ref.id}`;

    return res.status(200).json({ shareId: ref.id, url, ...doc });
  } catch (err) {
    console.error('create-share fout:', err);
    return res.status(500).json({ error: 'Aanmaken mislukt', message: err.message });
  }
}

// ── Geeft alle deel-links terug (voor het "Deel-links beheren"-scherm),
// alleen met de eigenaar-PIN. ──
async function handleList(req, res) {
  const { pin } = req.body || {};
  if (!checkOwnerPin(pin)) {
    return res.status(401).json({ error: 'Onjuiste code' });
  }
  try {
    const db = getAdminFirestore();
    const snap = await db.collection('shares').orderBy('createdAt', 'desc').get();
    const shares = snap.docs.map(doc => ({ shareId: doc.id, ...doc.data() }));
    return res.status(200).json({ shares });
  } catch (err) {
    console.error('list-shares fout:', err);
    return res.status(500).json({ error: 'Ophalen mislukt', message: err.message });
  }
}

// ── Zet een deel-link op revoked:true — de link blijft bestaan (voor
// overzicht/geschiedenis) maar handleRedeem() weigert 'm vanaf nu.
// Alleen met de eigenaar-PIN. ──
async function handleRevoke(req, res) {
  const { pin, shareId, revoked } = req.body || {};
  if (!checkOwnerPin(pin)) {
    return res.status(401).json({ error: 'Onjuiste code' });
  }
  if (typeof shareId !== 'string' || !shareId) {
    return res.status(400).json({ error: 'shareId ontbreekt' });
  }
  try {
    const db = getAdminFirestore();
    const ref = db.collection('shares').doc(shareId);
    const snap = await ref.get();
    if (!snap.exists) {
      return res.status(404).json({ error: 'Deel-link niet gevonden' });
    }
    await ref.update({ revoked: revoked !== false });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('revoke-share fout:', err);
    return res.status(500).json({ error: 'Bijwerken mislukt', message: err.message });
  }
}
