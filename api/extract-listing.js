// ═══════════════════════════════════════════════════════════
// api/extract-listing.js — Vercel serverless function
// Best-effort adres/locatie ophalen uit een verblijf-link
// (Booking.com, Airbnb, hotel-site, etc.) door de paginabron
// server-side te lezen en te zoeken naar gestructureerde data
// (JSON-LD schema.org Hotel/LodgingBusiness/Place, of Open
// Graph place:location-meta). Lukt dit niet, dan geeft dit
// endpoint gewoon "found: false" terug — geen gok, de gebruiker
// vult dan zelf aan. Fragiel van aard: sites kunnen dit op elk
// moment laten stoppen door hun markup te wijzigen.
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
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return res.status(400).json({ error: 'Alleen http/https toegestaan' });
  }
  if (isBlockedHost(parsed.hostname)) {
    return res.status(400).json({ error: 'Deze host is niet toegestaan' });
  }

  try {
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

    if (!response.ok) {
      return res.status(200).json({ found: false });
    }

    const html = await readBounded(response, 1_500_000);
    const info = extractListingInfo(html);
    const found = !!(info.address || (info.lat != null && info.lng != null));
    return res.status(200).json({ found, ...info });
  } catch (err) {
    console.error('extract-listing fout:', err);
    return res.status(200).json({ found: false });
  }
}

// Loopback/private/link-local IP's blokkeren — dit endpoint haalt een door
// de gebruiker aangeleverde URL server-side op, dus moet voorkomen dat het
// als proxy naar interne netwerkadressen misbruikt kan worden.
function isBlockedHost(hostname) {
  const h = hostname.toLowerCase();
  if (h === 'localhost' || h.endsWith('.local') || h === '0.0.0.0') return true;
  const ipv4 = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [a, b] = ipv4.slice(1).map(Number);
    if (a === 127 || a === 10 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
  }
  if (h === '::1' || h.startsWith('fe80:') || h.startsWith('fc') || h.startsWith('fd')) return true;
  return false;
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

function extractListingInfo(html) {
  const ldJsonBlocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const block of ldJsonBlocks) {
    try {
      const data = JSON.parse(block[1].trim());
      const items = flattenGraph(Array.isArray(data) ? data : [data]);
      for (const item of items) {
        const addr = item && item.address;
        if (addr && typeof addr === 'object' && (addr.streetAddress || addr.addressLocality)) {
          const parts = [addr.streetAddress, addr.postalCode, addr.addressLocality, addr.addressCountry]
            .filter(Boolean);
          const geo = item.geo || {};
          return {
            name: item.name || null,
            address: parts.join(', ') || null,
            lat: geo.latitude != null ? parseFloat(geo.latitude) : null,
            lng: geo.longitude != null ? parseFloat(geo.longitude) : null,
          };
        }
      }
    } catch {
      // dit blok was geen bruikbare JSON — volgende proberen
    }
  }

  const latMeta = matchMetaContent(html, 'place:location:latitude');
  const lngMeta = matchMetaContent(html, 'place:location:longitude');
  if (latMeta && lngMeta) {
    return { name: null, address: null, lat: parseFloat(latMeta), lng: parseFloat(lngMeta) };
  }

  return { name: null, address: null, lat: null, lng: null };
}

function matchMetaContent(html, property) {
  const re1 = new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i');
  const re2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i');
  const m = html.match(re1) || html.match(re2);
  return m ? m[1] : null;
}

function flattenGraph(items) {
  const out = [];
  for (const item of items) {
    if (!item) continue;
    if (item['@graph']) out.push(...flattenGraph(item['@graph']));
    else out.push(item);
  }
  return out;
}
