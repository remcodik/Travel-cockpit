// ═══════════════════════════════════════════════════════════
// api/revoke-share.js — Vercel serverless function
// Zet een deel-link op revoked:true — de link blijft bestaan
// (voor overzicht/geschiedenis) maar redeem-share.js weigert 'm
// vanaf nu. Alleen met de eigenaar-PIN.
// ═══════════════════════════════════════════════════════════

import { getAdminFirestore, checkOwnerPin } from './_lib/firebaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Alleen POST toegestaan' });
  }

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
