// ═══════════════════════════════════════════════════════════
// api/owner-login.js — Vercel serverless function
// PIN (alleen bekend bij de eigenaar) -> Firebase custom token
// met volledige, blijvende toegang tot alle reizen. Dit is de
// enige manier waarop de eigenaar zelf inlogt — geen wachtwoord-
// account, alleen een code die jij kiest via de OWNER_PIN
// environment variable.
// ═══════════════════════════════════════════════════════════

import { getAdminAuth, checkOwnerPin } from './_lib/firebaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Alleen POST toegestaan' });
  }

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
