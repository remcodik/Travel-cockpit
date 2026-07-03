// ═══════════════════════════════════════════════════════════
// api/list-shares.js — Vercel serverless function
// Geeft alle deel-links terug (voor het "Deel-links beheren"-
// scherm), alleen met de eigenaar-PIN.
// ═══════════════════════════════════════════════════════════

import { getAdminFirestore, checkOwnerPin } from './_lib/firebaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Alleen POST toegestaan' });
  }

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
