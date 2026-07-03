// ═══════════════════════════════════════════════════════════
// api/redeem-share.js — Vercel serverless function
// Publiek endpoint (geen PIN nodig — de shareId zelf is het
// geheim, zoals een Google Docs-deel-link). Zoekt shares/{id}
// op; als niet herroepen, mint een custom token met de rechten
// van die specifieke link (scope + tripId als claims). De
// browser logt daarmee anoniem in bij Firebase; de Firestore-
// rules controleren vervolgens die claims bij elke lees/schrijf-
// actie.
// ═══════════════════════════════════════════════════════════

import { getAdminAuth, getAdminFirestore } from './_lib/firebaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Alleen GET toegestaan' });
  }

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
