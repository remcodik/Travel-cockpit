// ═══════════════════════════════════════════════════════════
// api/geocode.js — Vercel serverless function
// Zoekt coördinaten op bij een vrije-tekst adres/plaatsnaam via
// OpenStreetMap Nominatim (gratis, geen API-sleutel) — gebruikt
// wanneer een verblijf een adres/plaatsnaam heeft maar geen
// coördinaten (bv. alleen de plaatsnaam ingevuld, geen boekingslink
// beschikbaar om uit te extraheren). Server-side i.p.v. rechtstreeks
// vanuit de client: Nominatim's gebruiksvoorwaarden vereisen een
// herkenbare, vaste User-Agent per applicatie.
//
// Handelt ook ?mapsUrl=... af: verkorte Google Maps-links
// (maps.app.goo.gl/... — wat de "Delen"-knop naast een neergezette
// speld in de Google Maps-app altijd genereert) bevatten geen
// coördinaten totdat de link daadwerkelijk bezocht wordt. Dat kan niet
// client-side (CORS/redirect-beperkingen), dus dat gebeurt hier
// server-side i.p.v. dat de gebruiker de link zelf eerst in een browser
// moet openen om de "volledige" link te kopiëren. BEWUST niet als los
// bestand in api/ (Vercel Hobby-limiet van 12 functies per deployment,
// zie docs/10-issues/32-vercel-function-limit-alle-deploys-faalden.md) —
// hergebruikt in plaats daarvan dit al bestaande endpoint.
// ═══════════════════════════════════════════════════════════

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Alleen GET toegestaan' });
  }

  const { q, mapsUrl } = req.query;
  if (mapsUrl && typeof mapsUrl === 'string' && mapsUrl.trim()) {
    return handleMapsUrl(mapsUrl.trim(), res);
  }
  if (!q || typeof q !== 'string' || !q.trim()) {
    return res.status(400).json({ error: 'Geef een zoekterm op (?q=...) of een Maps-link (?mapsUrl=...)' });
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

// Alleen Google-domeinen toestaan — dit endpoint haalt een door de
// gebruiker aangeleverde URL server-side op, dus geen open proxy voor
// willekeurige hosts.
function isAllowedMapsHost(hostname) {
  const h = hostname.toLowerCase();
  return h === 'goo.gl' || h.endsWith('.goo.gl') || h === 'google.com' || h.endsWith('.google.com');
}

async function handleMapsUrl(rawUrl, res) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return res.status(400).json({ error: 'Ongeldige URL' });
  }
  if (!['http:', 'https:'].includes(parsed.protocol) || !isAllowedMapsHost(parsed.hostname)) {
    return res.status(400).json({ error: 'Alleen Google Maps-links toegestaan' });
  }

  try {
    // Verkorte links (maps.app.goo.gl/...) geven pas hun echte, volledige
    // google.com/maps/...-URL prijs ná de redirect — vandaar server-side
    // met redirect:'follow' i.p.v. de link zelf te parsen.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    let response;
    try {
      response = await fetch(parsed.toString(), {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TravelCockpitBot/1.0)' },
        redirect: 'follow',
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    const finalUrl = response.url || parsed.toString();
    const coords = extractLatLngFromMapsUrl(finalUrl);
    if (!coords) return res.status(200).json({ found: false });
    return res.status(200).json({ found: true, lat: coords.lat, lng: coords.lng });
  } catch (err) {
    console.error('geocode (mapsUrl) fout:', err);
    return res.status(200).json({ found: false });
  }
}

// Zelfde extractielogica als extractLatLngFromMapsUrl() in
// js/screen-accommodation.js (bewust in sync houden bij wijzigingen aan een
// van beide) — "!3d{lat}!4d{lng}" is de daadwerkelijk gemarkeerde plek,
// betrouwbaarder dan "@lat,lng" (het kaartbeeld-midden op deelmoment, dat
// kan afwijken als de kaart was uitgezoomd/verschoven — zie
// docs/10-issues voor de Hirtshals/Engeland-bug die dat veroorzaakte).
function extractLatLngFromMapsUrl(url) {
  const markerMatch = url.match(/!3d(-?\d{1,3}\.\d+)!4d(-?\d{1,3}\.\d+)/);
  if (markerMatch) return { lat: parseFloat(markerMatch[1]), lng: parseFloat(markerMatch[2]) };
  const qMatch = url.match(/[?&]q=(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/);
  if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
  const llMatch = url.match(/[?&]ll=(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/);
  if (llMatch) return { lat: parseFloat(llMatch[1]), lng: parseFloat(llMatch[2]) };
  const atMatch = url.match(/@(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/);
  if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
  return null;
}
