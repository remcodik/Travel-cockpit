// ═══════════════════════════════════════════════════════════
// api/_lib/fetchPageContext.js — gedeelde helper (geen eigen route,
// telt dus niet mee voor Vercel's functie-limiet — zie
// docs/10-issues/32-vercel-function-limit-alle-deploys-faalden.md)
//
// Haalt een korte, feitelijke samenvatting op van een door de
// gebruiker opgeslagen link (Komoot-tour, restaurant/attractie-site,
// etc.) zodat api/enrich-activity.js de AI kan laten schrijven over
// de daadwerkelijke, gelinkte plek in plaats van te gokken op basis
// van alleen de activiteitnaam. Best-effort en bewust beperkt tot
// metadata (titel/beschrijving) — geen volledige pagina-scrape.
// ═══════════════════════════════════════════════════════════

export async function fetchPageContext(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (!['http:', 'https:'].includes(parsed.protocol) || isBlockedHost(parsed.hostname)) {
    return null;
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
    if (!response.ok) return null;

    const html = await readBounded(response, 1_500_000);
    const info = extractPageInfo(html);
    if (!info.title && !info.description) return null;
    return info;
  } catch (err) {
    console.error('fetchPageContext fout:', err);
    return null;
  }
}

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

// Titel/beschrijving uit Open Graph-meta (breed ondersteund door
// restaurant-/attractiesites en Komoot) met JSON-LD name/description
// als aanvulling — geen ruwe bodytekst, dat is te ruis-gevoelig om
// zomaar in een AI-prompt te plakken.
function extractPageInfo(html) {
  let title = matchMetaContent(html, 'og:title') || matchTitleTag(html);
  let description = matchMetaContent(html, 'og:description') || matchMetaName(html, 'description');

  const ldJsonBlocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const block of ldJsonBlocks) {
    try {
      const data = JSON.parse(block[1].trim());
      const items = flattenGraph(Array.isArray(data) ? data : [data]);
      for (const item of items) {
        if (!title && item && item.name) title = item.name;
        if (!description && item && item.description) description = item.description;
      }
    } catch {
      // geen bruikbare JSON in dit blok — volgende proberen
    }
  }

  return {
    title: title ? decodeHtmlEntities(title).slice(0, 200) : null,
    description: description ? decodeHtmlEntities(description).slice(0, 600) : null,
  };
}

function matchMetaContent(html, property) {
  const re1 = new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i');
  const re2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i');
  const m = html.match(re1) || html.match(re2);
  return m ? m[1] : null;
}

function matchMetaName(html, name) {
  const re1 = new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i');
  const re2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, 'i');
  const m = html.match(re1) || html.match(re2);
  return m ? m[1] : null;
}

function matchTitleTag(html) {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m ? m[1] : null;
}

function decodeHtmlEntities(str) {
  return str
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&nbsp;/g, ' ');
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
