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
      // FIX: een User-Agent die zichzelf als bot identificeert
      // ("TravelCockpitBot/1.0") wordt door veel gewone restaurant-/
      // horecasites (Cloudflare, Wordfence, en andere basis bot-weringen op
      // gedeelde hosting) standaard geblokkeerd — dit is één lichte,
      // eenmalige aanvraag namens de gebruiker voor hun eigen, zelf
      // opgeslagen link, geen crawler, dus een gewone browser-UA is hier
      // gepast en veel minder kwetsbaar voor zo'n blokkade.
      response = await fetch(parsed.toString(), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'nl,en;q=0.8',
        },
        redirect: 'follow',
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
    if (!response.ok) return null;

    const html = await readBounded(response, 1_500_000);
    const info = extractPageInfo(html, parsed);
    if (!info.title && !info.description && !info.excerpt && !info.image) return null;
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

// Titel/beschrijving/foto uit Open Graph-meta (breed ondersteund door
// restaurant-/attractiesites en Komoot) met JSON-LD als aanvulling. Voor
// eet-/drinkgelegenheden (schema.org Restaurant/CafeOrCoffeeShop/Bar/
// FoodEstablishment) ook keuken/prijsklasse eruit halen — precies het
// soort concreets ("Italiaans, €€") dat een AI-omschrijving specifiek
// maakt in plaats van "lijkt een lokaal restaurant te zijn". Zonder
// og:description als terugval een korte, opgeschoonde bodytekst-excerpt
// — sommige sites laten die meta gewoon leeg/generiek. og:image is de
// eigen foto van de plek zelf — veel betrouwbaarder dan een Wikipedia-
// zoekopdracht op naam, die bij een klein restaurant/café al snel een
// totaal ongerelateerd artikel kan raken.
function extractPageInfo(html, pageUrl) {
  // Twitter Card-tags als extra terugval na Open Graph — veel sites
  // gebouwd met een moderne pagebuilder (Framer/Webflow/Squarespace, zoals
  // een restaurant-onepager) vullen die minstens even betrouwbaar als
  // og:title/og:description.
  let title = matchMetaContent(html, 'og:title') || matchMetaName(html, 'twitter:title') || matchTitleTag(html);
  let description = matchMetaContent(html, 'og:description') || matchMetaName(html, 'twitter:description') || matchMetaName(html, 'description');
  let image = matchMetaContent(html, 'og:image') || matchMetaName(html, 'twitter:image');
  let cuisine = null;
  let priceRange = null;

  const ldJsonBlocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const block of ldJsonBlocks) {
    try {
      const data = JSON.parse(block[1].trim());
      const items = flattenGraph(Array.isArray(data) ? data : [data]);
      for (const item of items) {
        if (!title && item && item.name) title = item.name;
        if (!description && item && item.description) description = item.description;
        if (!image && item && item.image) {
          image = Array.isArray(item.image) ? item.image[0] : (item.image.url || item.image);
        }
        if (!cuisine && item && item.servesCuisine) {
          cuisine = Array.isArray(item.servesCuisine) ? item.servesCuisine.join(', ') : item.servesCuisine;
        }
        if (!priceRange && item && item.priceRange) priceRange = item.priceRange;
      }
    } catch {
      // geen bruikbare JSON in dit blok — volgende proberen
    }
  }

  const excerpt = description ? null : extractBodyExcerpt(html);

  // Relatieve og:image-paden ("/uploads/foto.jpg") komen zo vaak voor dat
  // ze zonder dit gewoon kapotte <img>'s zouden geven — tegen de eigen
  // pagina-URL resolven maakt er altijd een absolute URL van.
  let resolvedImage = null;
  if (image) {
    try {
      resolvedImage = new URL(image, pageUrl).toString();
    } catch {
      resolvedImage = null;
    }
  }

  return {
    title: title ? decodeHtmlEntities(title).slice(0, 200) : null,
    description: description ? decodeHtmlEntities(description).slice(0, 600) : null,
    cuisine: cuisine ? decodeHtmlEntities(String(cuisine)).slice(0, 150) : null,
    priceRange: priceRange ? decodeHtmlEntities(String(priceRange)).slice(0, 20) : null,
    excerpt,
    image: resolvedImage,
  };
}

// Best-effort, ruwe terugval als er geen og:description/meta-omschrijving
// is: script/style/nav/header/footer eruit, tags eruit, whitespace
// opgeschoond, eerste stuk leesbare tekst. Bewust niet gebruikt als de
// nette meta-omschrijving er al is — dit is veel ruis-gevoeliger.
function extractBodyExcerpt(html) {
  let body = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  let text = body ? body[1] : html;
  text = text
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<header[\s\S]*?<\/header>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  text = decodeHtmlEntities(text);
  return text.length > 40 ? text.slice(0, 800) : null;
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
