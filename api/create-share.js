// ═══════════════════════════════════════════════════════════
// api/create-share.js — Vercel serverless function
// Maakt een nieuwe deel-link aan: shares/{shareId} in Firestore,
// alleen bereikbaar met de eigenaar-PIN (zelfde OWNER_PIN als
// owner-login.js). Het aanmaken zelf gebeurt via de Admin SDK,
// dus dit negeert de Firestore-rules volledig (bewust — deze
// route IS de bewaker, niet de rules).
// ═══════════════════════════════════════════════════════════

import { getAdminFirestore, checkOwnerPin } from './_lib/firebaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Alleen POST toegestaan' });
  }

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
