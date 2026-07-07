// ═══════════════════════════════════════════════════════════
// api/geocode.js — Vercel serverless function
// Zoekt coördinaten op bij een vrije-tekst adres/plaatsnaam via
// OpenStreetMap Nominatim (gratis, geen API-sleutel) — gebruikt
// wanneer een verblijf een adres/plaatsnaam heeft maar geen
// coördinaten (bv. alleen de plaatsnaam ingevuld, geen boekingslink
// beschikbaar om uit te extraheren). Server-side i.p.v. rechtstreeks
// vanuit de client: Nominatim's gebruiksvoorwaarden vereisen een
// herkenbare, vaste User-Agent per applicatie.
// ═══════════════════════════════════════════════════════════

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Alleen GET toegestaan' });
  }

  const { q } = req.query;
  if (!q || typeof q !== 'string' || !q.trim()) {
    return res.status(400).json({ error: 'Geef een zoekterm op (?q=...)' });
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q.trim())}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    let response;
    try {
      response = await fetch(url, {
        headers: { 'User-Agent': 'TravelCockpit/1.0 (persoonlijke reisplanner-app)' },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      return res.status(200).json({ found: false });
    }

    const results = await response.json();
    if (!Array.isArray(results) || results.length === 0) {
      return res.status(200).json({ found: false });
    }

    const best = results[0];
    const lat = parseFloat(best.lat);
    const lng = parseFloat(best.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(200).json({ found: false });
    }

    return res.status(200).json({ found: true, lat, lng, displayName: best.display_name || null });
  } catch (err) {
    console.error('geocode fout:', err);
    return res.status(200).json({ found: false });
  }
}
