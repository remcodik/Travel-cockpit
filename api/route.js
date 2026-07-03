// ═══════════════════════════════════════════════════════════
// api/route.js — Vercel serverless function
// Echte rijroute (via wegen) tussen een reeks waypoints, via
// OpenRouteService — vervangt de handgetekende rechte lijnen in
// js/data.js (DRIVE_PATHS) voor het autogedeelte van de route.
// Ferry-segmenten blijven een rechte lijn (geen "auto-routing"-
// equivalent voor zeeroutes), zie docs/10-issues/08-restplan-
// openstaande-punten.md, punt 1 (N7).
//
// ORS_API_KEY staat als Vercel environment variable (gratis tier
// aan te vragen op openrouteservice.org).
// ═══════════════════════════════════════════════════════════

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Alleen GET toegestaan' });
  }

  const apiKey = process.env.ORS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ORS_API_KEY ontbreekt in Vercel environment variables' });
  }

  const { coords } = req.query;
  if (!coords || typeof coords !== 'string') {
    return res.status(400).json({ error: 'Geef coords op als "lat1,lng1;lat2,lng2;..."' });
  }

  let points;
  try {
    points = coords.split(';').map(pair => {
      const [lat, lng] = pair.split(',').map(Number);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
        throw new Error('ongeldig punt');
      }
      return [lng, lat]; // OpenRouteService verwacht [lng, lat]
    });
  } catch {
    return res.status(400).json({ error: 'Ongeldige coördinaten' });
  }
  if (points.length < 2 || points.length > 15) {
    return res.status(400).json({ error: 'Tussen de 2 en 15 waypoints verwacht' });
  }

  try {
    const response = await fetch('https://api.openrouteservice.org/v2/directions/driving-car/geojson', {
      method: 'POST',
      headers: {
        Authorization: apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ coordinates: points }),
    });

    const bodyText = await response.text();
    if (!response.ok) {
      return res.status(502).json({
        error: `OpenRouteService gaf HTTP ${response.status}`,
        message: bodyText.slice(0, 300),
      });
    }

    let data;
    try {
      data = JSON.parse(bodyText);
    } catch {
      return res.status(502).json({ error: 'OpenRouteService antwoord was geen geldige JSON' });
    }

    const geometry = data.features && data.features[0] && data.features[0].geometry;
    if (!geometry || !Array.isArray(geometry.coordinates)) {
      return res.status(502).json({ error: 'Onverwacht antwoord van OpenRouteService' });
    }

    const route = geometry.coordinates.map(([lng, lat]) => [lat, lng]);
    return res.status(200).json({ route });
  } catch (err) {
    console.error('route fout:', err);
    return res.status(500).json({ error: 'Route ophalen mislukt', message: err.message });
  }
}
