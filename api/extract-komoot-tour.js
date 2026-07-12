// ═══════════════════════════════════════════════════════════
// api/extract-komoot-tour.js — Vercel serverless function
// Best-effort afstand/duur/hoogtewinst ophalen uit een Komoot-
// routelink door de paginabron server-side te lezen. Komoot heeft
// geen publieke data-API — dit zoekt naar cijfers die Komoot zelf al
// in de HTML meestuurt (Open Graph-beschrijving, of de ingebouwde
// staat die de pagina gebruikt om zichzelf te tekenen). Lukt dit
// niet (bijv. omdat Komoot het verzoek blokkeert, zoals bij eerder
// onderzoek gebeurde), dan geeft dit endpoint gewoon "found: false"
// terug — geen gok, de gebruiker vult dan zelf aan. Fragiel van aard:
// Komoot kan dit op elk moment laten stoppen door hun markup of
// bot-detectie te wijzigen.
// ═══════════════════════════════════════════════════════════

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Alleen GET toegestaan' });
  }

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Geef een url op' });

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return res.status(400).json({ error: 'Ongeldige URL' });
  }
  const host = parsed.hostname.toLowerCase();
  if (host !== 'komoot.com' && host !== 'www.komoot.com') {
    return res.status(400).json({ error: 'Alleen komoot.com-links toegestaan' });
  }
  if (!/^\/tour\/\d+/.test(parsed.pathname)) {
    return res.status(400).json({ error: 'Geen herkenbare Komoot-tourlink' });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    let response;
    try {
      // FIX: een zelf-identificerende bot-UA is precies het soort verzoek
      // dat Komoot's bot-detectie eerder al blokkeerde (zie dossier
      // hierboven) — een browser-UA is minder kwetsbaar daarvoor.
      response = await fetch(parsed.toString(), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        redirect: 'follow',
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      return res.status(200).json({ found: false });
    }

    const html = await readBounded(response, 2_000_000);
    const info = { ...extractTourStats(html), ...extractStartCoords(html) };
    const found = !!(info.distance_km || info.duration_minutes || info.elevation_gain_m || (info.lat != null && info.lng != null));
    return res.status(200).json({ found, ...info });
  } catch (err) {
    console.error('extract-komoot-tour fout:', err);
    return res.status(200).json({ found: false });
  }
}

async function readBounded(response, maxBytes) {
  if (!response.body || !response.body.getReader) {
    const text = await response.text();
    return text.slice(0, maxBytes);
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let received = 0;
  let html = '';
  while (received < maxBytes) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.length;
    html += decoder.decode(value, { stream: true });
  }
  reader.cancel().catch(() => {});
  return html;
}

// Twee onafhankelijke pogingen, allebei best-effort:
// 1. De ruwe getallen die Komoot's eigen frontend-app in de pagina
//    meestuurt om zichzelf mee te tekenen (meters/seconden, als die
//    er nog net zo uitzien als toen dit geschreven werd).
// 2. De Open Graph-beschrijving, die vaak een leesbare samenvatting
//    bevat ("12,3 km · 3:45 u · 450 hm").
function extractTourStats(html) {
  const distanceMatch = html.match(/"distance"\s*:\s*(\d+(?:\.\d+)?)/);
  const durationMatch = html.match(/"duration"\s*:\s*(\d+(?:\.\d+)?)/);
  const elevationMatch = html.match(/"elevation_up"\s*:\s*(\d+(?:\.\d+)?)/);

  if (distanceMatch || durationMatch || elevationMatch) {
    return {
      distance_km: distanceMatch ? Math.round(parseFloat(distanceMatch[1]) / 100) / 10 : null,
      duration_minutes: durationMatch ? Math.round(parseFloat(durationMatch[1]) / 60) : null,
      elevation_gain_m: elevationMatch ? Math.round(parseFloat(elevationMatch[1])) : null,
    };
  }

  const ogDescMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i);
  if (ogDescMatch) {
    const desc = ogDescMatch[1];
    const km = desc.match(/(\d+(?:[.,]\d+)?)\s*km/i);
    const hm = desc.match(/(\d+)\s*hm/i);
    const hours = desc.match(/(\d+):(\d+)\s*h/i) || desc.match(/(\d+(?:[.,]\d+)?)\s*u\b/i);
    return {
      distance_km: km ? parseFloat(km[1].replace(',', '.')) : null,
      duration_minutes: hours
        ? (hours[2] !== undefined ? parseInt(hours[1], 10) * 60 + parseInt(hours[2], 10) : Math.round(parseFloat(hours[1].replace(',', '.')) * 60))
        : null,
      elevation_gain_m: hm ? parseInt(hm[1], 10) : null,
    };
  }

  return { distance_km: null, duration_minutes: null, elevation_gain_m: null };
}

// Best-effort startpunt-coördinaten uit dezelfde pagina — geen aparte
// aanroep nodig, de HTML is al opgehaald voor extractTourStats().
// Onbevestigd/fragiel: Komoot heeft geen publieke data-API, dit gokt op
// waarschijnlijke veldnamen in de ingebouwde paginastaat (start_point) en,
// als terugval, de generieke Open Graph plaats-meta-tags (zelfde patroon
// als api/extract-listing.js). Levert null als geen van beide iets
// oplevert — nooit een verzonnen locatie.
function extractStartCoords(html) {
  const latThenLng = html.match(/"start_point"\s*:\s*\{[^}]*?"lat"\s*:\s*(-?\d+(?:\.\d+)?)[^}]*?"lng"\s*:\s*(-?\d+(?:\.\d+)?)/);
  if (latThenLng) return { lat: parseFloat(latThenLng[1]), lng: parseFloat(latThenLng[2]) };

  const lngThenLat = html.match(/"start_point"\s*:\s*\{[^}]*?"lng"\s*:\s*(-?\d+(?:\.\d+)?)[^}]*?"lat"\s*:\s*(-?\d+(?:\.\d+)?)/);
  if (lngThenLat) return { lat: parseFloat(lngThenLat[2]), lng: parseFloat(lngThenLat[1]) };

  const latMeta = matchMetaContent(html, 'place:location:latitude');
  const lngMeta = matchMetaContent(html, 'place:location:longitude');
  if (latMeta && lngMeta) {
    return { lat: parseFloat(latMeta), lng: parseFloat(lngMeta) };
  }

  return { lat: null, lng: null };
}

function matchMetaContent(html, property) {
  const re1 = new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i');
  const re2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i');
  const m = html.match(re1) || html.match(re2);
  return m ? m[1] : null;
}
