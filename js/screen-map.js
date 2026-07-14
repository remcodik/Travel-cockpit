// ═══════════════════════════════════════════════════════════
// screen-map.js — Kaartscherm met Leaflet/OpenStreetMap
// ═══════════════════════════════════════════════════════════

let leafletMap = null;
let gpsMarker = null;
let gpsTrack = [];
let gpsPolyline = null;
let accommodationMarkers = [];
let activityMarkers = [];
let routeLines = [];
let mapFilterAccId = null;
let mapShowFullRoute = false;

// ── Echte routing via wegen (N7) ────────────────────────────
// In-memory + localStorage-cache zodat de kaart niet bij elk bezoek
// opnieuw dezelfde route bij OpenRouteService opvraagt (respecteert de
// rate limit van de gratis tier, en is meteen sneller bij een herbezoek).
const routeMemoryCache = {};
const ROUTE_CACHE_PREFIX = 'tc_route_';

function routeCacheKey(waypoints) {
  return waypoints.map(p => `${p[0].toFixed(4)},${p[1].toFixed(4)}`).join(';');
}

async function fetchRealRoute(waypoints) {
  const key = routeCacheKey(waypoints);
  if (routeMemoryCache[key]) return routeMemoryCache[key];

  try {
    const cached = localStorage.getItem(ROUTE_CACHE_PREFIX + key);
    if (cached) {
      const parsed = JSON.parse(cached);
      routeMemoryCache[key] = parsed;
      return parsed;
    }
  } catch { /* corrupte cache-entry negeren, gewoon opnieuw ophalen */ }

  try {
    const resp = await fetch(`/api/route?coords=${encodeURIComponent(key)}`);
    if (!resp.ok) return null;
    const data = await resp.json();
    if (!data.route || !Array.isArray(data.route)) return null;
    routeMemoryCache[key] = data.route;
    try { localStorage.setItem(ROUTE_CACHE_PREFIX + key, JSON.stringify(data.route)); } catch { /* quota vol, geen probleem */ }
    return data.route;
  } catch {
    return null;
  }
}

function initMap() {
  const loadingEl = document.getElementById('map-loading');

  if (leafletMap) {
    // Kaart bestaat al, scherm was net verborgen (display:none).
    // Leaflet meet zijn container-grootte verkeerd als die niet zichtbaar was.
    setTimeout(() => {
      try {
        leafletMap.invalidateSize();
      } catch (e) {
        reportMapError(e);
      }
      if (loadingEl) loadingEl.classList.add('hidden');
    }, 100);
    // FIX: pins, filterchips, routelijnen/routestrip én gezichtsveld
    // opnieuw opbouwen bij elk bezoek — anders bleven ze na het wisselen
    // van reis (Fase B) de vorige reis tonen, omdat dit vroeger alleen bij
    // de allereerste kaart-load gebeurde. De routelijnen ontbraken hier
    // tot nu toe helemaal: die werden alléén bij het aanmaken van de kaart
    // getekend, dus de Noorwegen-route bleef op de kaart staan, welke reis
    // er ook actief was.
    mapFilterAccId = null;
    renderMapFilterChips();
    renderMapMarkers();
    renderMapRoutes();
    renderMapRouteStrip();
    fitMapToAllPins();
    return;
  }

  if (typeof L === 'undefined') {
    reportMapError(new Error('Leaflet (L) is niet geladen — controleer netwerkverbinding met cdnjs.cloudflare.com'));
    return;
  }

  const container = document.getElementById('leaflet-map');
  if (!container) {
    reportMapError(new Error('Kaart-container #leaflet-map niet gevonden in DOM'));
    return;
  }

  // Wacht tot het scherm daadwerkelijk zichtbaar is (display:flex) voordat
  // Leaflet wordt geïnitialiseerd, anders is de containergrootte 0×0.
  // setTimeout met 50ms is robuuster dan requestAnimationFrame hiervoor,
  // omdat het ook na CSS-transities en browser-reflow-vertraging werkt.
  setTimeout(() => {
    try {
      leafletMap = L.map(container, { zoomControl: false }).setView([61.0, 8.0], 7);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 18,
      }).addTo(leafletMap);

      L.control.zoom({ position: 'bottomright' }).addTo(leafletMap);

      gpsPolyline = L.polyline([], { color: '#C5512B', weight: 3, opacity: 0.85 }).addTo(leafletMap);

      renderMapFilterChips();
      renderMapMarkers();
      renderMapRoutes();
      renderMapRouteStrip();
      fitMapToAllPins();

      // Nogmaals invalidateSize na de eerste render, voor de zekerheid.
      setTimeout(() => {
        try { leafletMap.invalidateSize(); } catch (e) { reportMapError(e); }
        if (loadingEl) loadingEl.classList.add('hidden');
      }, 200);
    } catch (e) {
      reportMapError(e);
    }
  }, 50);
}

function reportMapError(e) {
  console.error('Kaart-fout:', e);
  const banner = document.getElementById('debug-banner');
  if (banner) {
    banner.classList.add('show');
    banner.textContent += `❌ KAART-FOUT: ${e.message}\n${e.stack || ''}\n\n`;
  }
  const loadingEl = document.getElementById('map-loading');
  if (loadingEl) {
    loadingEl.innerHTML = `<p class="mono" style="color:var(--summit);text-align:center;padding:0 20px">Kaart kon niet laden.<br>${e.message}</p>`;
  }
}

// Geen 0/0 (ontbrekende coördinaten worden zonder invoer stilzwijgend 0,
// zie readAccommodationFormFields() in js/screen-accommodation.js) en geen
// NaN — zo'n verblijf heeft feitelijk geen bruikbare locatie.
function isValidLatLng(lat, lng) {
  return Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0);
}

// ── Routelijnen per reis ────────────────────────────────────
// FIX: de handgetekende Noorwegen-route (DRIVE_PATHS/FERRY_PATHS,
// js/data.js) werd voorheen onvoorwaardelijk op de kaart getekend — óók
// als een heel andere reis actief was. Die hoort alleen bij de
// standaardreis; elke andere reis krijgt een generieke route Thuis →
// verblijven (op check-in-volgorde) → Thuis, opgebouwd uit haar eigen
// verblijven. Lijnen worden bijgehouden in routeLines zodat ze bij het
// wisselen van reis ook echt van de kaart verdwijnen.
function renderMapRoutes() {
  if (!leafletMap) return;
  routeLines.forEach(l => l.remove());
  routeLines = [];

  const isDefaultTrip = getCurrentTripId() === DEFAULT_TRIP_ID;

  // Rijroutes: meteen de rechte lijn tonen (nooit een lege kaart), en op
  // de achtergrond de echte, wegen-volgende route erbij vragen (N7) —
  // vervangt de rechte lijn zodra die binnen is. Faalt dat (geen
  // ORS_API_KEY ingesteld, netwerkfout, rate limit), dan blijft gewoon de
  // rechte lijn staan — geen zichtbare fout.
  const drivePaths = isDefaultTrip ? DRIVE_PATHS : buildTripDrivePaths();
  drivePaths.forEach(path => {
    const line = L.polyline(path, { color: '#0E3A2E', weight: 2.5, opacity: 0.65 }).addTo(leafletMap);
    routeLines.push(line);
    fetchRealRoute(path).then(real => {
      if (real && real.length > 1) line.setLatLngs(real);
    }).catch(() => {});
  });
  // Ferryroutes blijven rechte lijnen — er bestaat geen "auto-routing"-
  // equivalent voor zeeroutes (zie 08-restplan-openstaande-punten.md).
  // Alleen de standaardreis heeft handmatig ingetekende ferry-etappes.
  if (isDefaultTrip) {
    FERRY_PATHS.forEach(path => {
      routeLines.push(L.polyline(path, { color: '#1B5A8A', weight: 2.5, opacity: 0.7, dashArray: '8,5' }).addTo(leafletMap));
    });
  }
}

// Thuis → verblijf 1 → verblijf 2 → ... → Thuis, als losse etappes
// (zelfde vorm als DRIVE_PATHS) zodat fetchRealRoute() per etappe kan
// vervangen. Verblijven zonder geldige coördinaten worden overgeslagen.
function buildTripDrivePaths() {
  const stops = ACCOMMODATIONS
    .filter(a => isValidLatLng(a.lat, a.lng))
    .map(a => [a.lat, a.lng]);
  if (stops.length === 0) return [];
  const points = [[HOME_LAT, HOME_LNG], ...stops, [HOME_LAT, HOME_LNG]];
  const paths = [];
  for (let i = 0; i < points.length - 1; i++) paths.push([points[i], points[i + 1]]);
  return paths;
}

// De routestrip onderaan het kaartscherm — FIX: stond voorheen hardcoded
// in index.html (Nijmegen/Hirtshals/Sogndal/...), dus elke reis toonde de
// Noorwegen-route. De standaardreis rendert nu haar eigen rijke ROUTE-data
// (js/data.js, incl. ferry's/hotel); elke andere reis een generieke strip
// Thuis → verblijven → Thuis uit haar eigen data.
function renderMapRouteStrip() {
  const container = document.getElementById('map-route-strip');
  if (!container) return;

  if (getCurrentTripId() === DEFAULT_TRIP_ID) {
    container.innerHTML = ROUTE.map(stop => {
      const acc = stop.type === 'accommodation'
        ? ACCOMMODATIONS.find(a => a.name.startsWith(stop.name))
        : null;
      const color = acc ? acc.color
        : (stop.type === 'home' ? 'var(--summit)'
          : (stop.type === 'hotel' ? '#795548' : 'var(--water)'));
      return `<div class="chip" style="border-left:3px solid ${color}">${stop.emoji} ${escapeHtml(stop.name)} · ${escapeHtml(stop.date)}</div>`;
    }).join('');
    return;
  }

  const homeChip = `<div class="chip" style="border-left:3px solid var(--summit)">🏠 Thuis</div>`;
  const accChips = ACCOMMODATIONS.map(acc =>
    `<div class="chip" style="border-left:3px solid ${acc.color}">▲ ${escapeHtml(acc.name)} · ${formatShortDate(acc.checkIn)}–${formatShortDate(acc.checkOut)}</div>`
  ).join('');
  container.innerHTML = ACCOMMODATIONS.length > 0
    ? homeChip + accChips + homeChip
    : `<div class="chip" style="border-left:3px solid var(--line)">Nog geen verblijven — voeg ze toe via het Verblijf-scherm</div>`;
}

// FIX: het gezichtsveld van de kaart stond altijd vast op Noorwegen
// ([61,8], zoom 7) — een verblijf buiten dat vaste kader (een andere reis,
// of gewoon een net toegevoegd verblijf ergens anders) viel dan buiten
// beeld zonder dat de gebruiker dat kon weten; het leek dan of dat
// verblijf helemaal niet op de kaart stond. Past nu altijd het
// gezichtsveld aan zodat elk verblijf mét geldige coördinaten zichtbaar
// is; met mapShowFullRoute aan ("Alles") telt Thuis ook mee, zodat de
// hele route incl. vertrekpunt in beeld komt.
function fitMapToAllPins() {
  if (!leafletMap) return;
  const points = [];
  ACCOMMODATIONS.forEach(acc => {
    if (isValidLatLng(acc.lat, acc.lng)) points.push([acc.lat, acc.lng]);
  });
  if (mapShowFullRoute || points.length === 0) points.push([HOME_LAT, HOME_LNG]);
  try {
    leafletMap.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 9 });
  } catch (e) {
    reportMapError(e);
  }
}

// Filterchips zijn nu afgeleid van de actieve reis i.p.v. hardcoded
// Noorwegen-verblijven — nodig sinds Fase B (multi-trip): een andere
// reis heeft andere verblijven, en de chips moeten meegroeien.
function renderMapFilterChips() {
  const container = document.getElementById('map-filter-chips');
  if (!container) return;
  container.innerHTML = `<button data-filter-chip="all" onclick="setMapFilter(null)" class="chip${mapFilterAccId === null ? ' on' : ''}">Alles</button>` +
    ACCOMMODATIONS.map(acc => `
      <button data-filter-chip="${acc.id}" onclick="setMapFilter('${acc.id}')" class="chip${mapFilterAccId === acc.id ? ' on' : ''}" style="border-color:${acc.color};color:${acc.color}">▲ ${escapeHtml(acc.short)}</button>
    `).join('');
}

function renderMapMarkers() {
  if (!leafletMap) return;

  accommodationMarkers.forEach(m => m.remove());
  activityMarkers.forEach(m => m.remove());
  accommodationMarkers = [];
  activityMarkers = [];

  const activeAcc = getActiveAccommodation();

  // Thuis-pin — hetzelfde punt dat de rijroutes ook als vertrek/aankomst
  // gebruiken (HOME_LAT/HOME_LNG, js/data.js).
  const homeHtml = `
    <div style="text-align:center">
      <div style="background:${HOME_PSEUDO_ACC.color};width:40px;height:40px;border-radius:50%;border:2.5px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(0,0,0,.3);margin:0 auto">
        <span style="font-size:18px">🏠</span>
      </div>
      <div style="background:${HOME_PSEUDO_ACC.color};color:white;font-size:9px;font-weight:700;padding:2px 6px;border-radius:3px;text-align:center;margin-top:2px;white-space:nowrap">Thuis</div>
    </div>`;
  const homeIcon = L.divIcon({ html: homeHtml, className: '', iconSize: [56, 60], iconAnchor: [28, 60] });
  accommodationMarkers.push(L.marker([HOME_LAT, HOME_LNG], { icon: homeIcon }).addTo(leafletMap));

  // FIX (docs/10-issues/36): een verblijf zonder coördinaten is een normale
  // toestand (net toegevoegd, of een reis die je bewust zonder locatie
  // bijhoudt), GEEN fout. Voorheen schreef dit bij elke kaartweergave een
  // rode, niet-afsluitbare debug-banner die de kop/terug-knop op élk scherm
  // blokkeerde, plus een opdringerige toast. Nu: gewoon geen pin en een
  // stille console-waarschuwing — de banner is er alleen nog voor échte
  // (afsluitbare) fouten.
  const invalidAccs = ACCOMMODATIONS.filter(acc => !isValidLatLng(acc.lat, acc.lng));
  if (invalidAccs.length > 0) {
    console.warn('Verblijf(en) zonder geldige coördinaten, geen pin op de kaart:', invalidAccs.map(a => a.name));
  }

  // Accommodatiepins — altijd zichtbaar, ongeacht filter
  ACCOMMODATIONS.filter(acc => isValidLatLng(acc.lat, acc.lng)).forEach(acc => {
    const isActive = activeAcc && activeAcc.id === acc.id;
    const size = isActive ? 50 : 42;
    const html = `
      <div style="text-align:center">
        <div style="background:${acc.color};width:${size}px;height:${size}px;border-radius:50%;border:${isActive ? 3 : 2.5}px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px ${acc.color}55;position:relative;margin:0 auto">
          <span style="font-size:${isActive ? 22 : 18}px">🏡</span>
          ${isActive ? '<div style="position:absolute;top:-4px;right:-4px;width:12px;height:12px;background:#C5512B;border-radius:50%;border:2px solid white"></div>' : ''}
        </div>
        <div style="background:${acc.color};color:white;font-size:9px;font-weight:700;padding:2px 6px;border-radius:3px;text-align:center;margin-top:2px;white-space:nowrap">${acc.short}</div>
      </div>`;
    const icon = L.divIcon({ html, className: '', iconSize: [56, 64], iconAnchor: [28, 64] });
    const marker = L.marker([acc.lat, acc.lng], { icon }).addTo(leafletMap);
    // Eerste tik filtert de activiteiten op dit verblijf (zoals de chips
    // erboven); nogmaals tikken op hetzelfde, al gefilterde verblijf
    // opent het accommodatiedetail — zo blijft de bestaande navigatie
    // behouden naast de nieuwe filterfunctie.
    marker.on('click', () => {
      if (mapFilterAccId === acc.id) {
        AppState.viewingAccommodationId = acc.id;
        navigateTo('accommodation');
      } else {
        setMapFilter(acc.id);
      }
    });
    accommodationMarkers.push(marker);
  });

  // Activiteitenpins — gefilterd op accommodatie indien actief
  const filtered = mapFilterAccId
    ? AppState.activities.filter(a => idsMatch(a.accId, mapFilterAccId))
    : AppState.activities;

  // FIX: een activiteit zonder dag ("Beschikbaar vanuit X" in Planning) kreeg
  // hier gewoon een pin zodra 'm coördinaten had — dat oogt als een vaste
  // plek in de reis terwijl je 'm nog niet eens hebt ingepland. Nu pas een
  // pin zodra er ook echt een dag aan hangt; los idee blijft intussen gewoon
  // vindbaar via Planning ("Beschikbaar vanuit...") en Ideeën.
  const withPin = filtered.filter(a => a.lat && a.lng && a.date);
  withPin.forEach(act => {
    const acc = ACCOMMODATIONS.find(a => idsMatch(a.id, act.accId));
    if (!acc) return;
    // Dag-label met volgnummer ("D4-2") als er meerdere activiteiten op
    // dezelfde dag zijn — anders zijn hun pins niet te onderscheiden.
    // FIX: telde voorheen ook activiteiten zónder coördinaten mee (die
    // helemaal geen pin krijgen) — een dag met 2 geplande activiteiten
    // waarvan er maar 1 een pin kreeg, toonde die ene toch als "D4-1"
    // (lijkt op "de eerste van meerdere" terwijl er maar 1 pin te zien is)
    // i.p.v. gewoon "D4". Nu geteld op wat er ook echt als pin verschijnt.
    let dayLabel = '';
    if (act.date) {
      const sameDay = withPin
        .filter(a => a.date.toDateString() === act.date.toDateString())
        .sort((a, b) => a.id - b.id);
      const seq = sameDay.findIndex(a => a.id === act.id) + 1;
      dayLabel = sameDay.length > 1 ? `D${getDayNumber(act.date)}-${seq}` : `D${getDayNumber(act.date)}`;
    }
    const opacity = act.status === 'done' ? 0.5 : 1;
    const html = `
      <div style="opacity:${opacity};text-align:center">
        <div style="background:${acc.color};width:36px;height:36px;border-radius:50%;border:2px solid white;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 6px ${acc.color}44;margin:0 auto">${act.emoji}</div>
        ${dayLabel ? `<div style="background:${acc.color};color:white;font-size:8px;font-weight:700;padding:1px 5px;border-radius:3px;text-align:center;margin-top:2px">${dayLabel}</div>` : ''}
      </div>`;
    const icon = L.divIcon({ html, className: '', iconSize: [36, dayLabel ? 50 : 40], iconAnchor: [18, dayLabel ? 50 : 40] });
    const marker = L.marker([act.lat, act.lng], { icon }).addTo(leafletMap);
    // FIX (H5): rechtstreeks de Planning-detailweergave gebruiken i.p.v.
    // de kale kaart-versie, zodat Verplaatsen/AI-verrijking/Verwijderen
    // ook vanuit de kaart beschikbaar zijn — voorheen kon je vanaf een
    // kaart-pin alleen "+ Plan" en "Route" doen.
    marker.on('click', () => openActivityDetailSheet(act.id));
    activityMarkers.push(marker);
  });
}

// Gedeelde hero-header voor sheet-place-detail — gebruikt door zowel de
// kaart (hier) als Planning (openActivityDetailSheet). Kleur komt van de
// bijbehorende accommodatie, zodat de plek-detail visueel verbonden blijft
// met "vanuit welk verblijf" — vergelijkbaar met Flutter's hero-scherm.
function renderPdHero(act, acc) {
  if (!act || !acc) return;
  const hero = document.getElementById('pd-hero');
  if (hero) hero.style.background = acc.color;

  // Echte foto (Wikipedia, best-effort via AI-verrijking — zie
  // fetchWikipediaPhoto() in js/state.js) krijgt voorrang op het
  // topografische decoratiepatroon, zelfde idee als een verblijf met foto.
  if (hero) {
    hero.style.backgroundImage = act.photoUrl
      ? `linear-gradient(155deg, transparent 25%, rgba(8, 31, 24, 0.86) 100%), url(${act.photoUrl})`
      : '';
    hero.style.backgroundSize = 'cover';
    hero.style.backgroundPosition = 'center';
  }

  // Zelfde topografisch decoratiepatroon als de accommodatie-hero, nu ook
  // in het (vergrote) activiteit-detailscherm, afgeleid van de echte
  // locatie/hoogte van deze activiteit. Alleen zonder eigen foto — anders
  // concurreren beide decoraties om dezelfde achtergrond.
  const topoSvg = document.getElementById('pd-topo-svg');
  if (topoSvg) {
    if (!act.photoUrl && act.lat && act.lng) {
      topoSvg.style.display = '';
      topoSvg.innerHTML = generateTopoLines(topoSeedForLocation(act.lat, act.lng, act.elevation), act.elevation);
    } else {
      topoSvg.style.display = 'none';
    }
  }

  const thumb = document.getElementById('pd-thumb');
  thumb.textContent = act.emoji;

  document.getElementById('pd-name').textContent = act.name;

  // pd-meta blijft leeg — openActivityDetailSheet() vult die zelf met een
  // datum/status-badge. Cijfers (afstand/duur/hoogte/niveau) staan sinds
  // de "ik mis info bij wandeling"-melding niet meer als kleine pilletjes
  // in de hero, maar als grotere, leesbare kaartjes in #pd-stats hieronder.
  const metaEl = document.getElementById('pd-meta');
  if (metaEl) metaEl.innerHTML = '';

  // Hoogtewinst/niveau zijn wandeling-specifieke begrippen — een café of
  // restaurant heeft geen "moeilijkheidsgraad", zie CATEGORY_META (js/data.js).
  const meta = categoryMetaForActivity(act);
  const stats = [];
  if (act.distance && act.distance !== '—') stats.push({ label: 'Afstand', value: act.distance });
  if (act.duration && act.duration !== '—') stats.push({ label: 'Duur', value: act.duration });
  if (meta.isHike && act.elevation) stats.push({ label: 'Hoogtewinst', value: `▲ ${act.elevation}m` });
  if (meta.isHike && act.level && act.level !== '—') stats.push({ label: 'Niveau', value: act.level });
  const statsEl = document.getElementById('pd-stats');
  if (statsEl) {
    statsEl.style.display = stats.length ? 'grid' : 'none';
    statsEl.innerHTML = stats.map(s => `
      <div style="background:white;border:1.5px solid var(--line);border-radius:12px;padding:10px 8px;text-align:center">
        <p style="font-size:16px;font-weight:800;color:var(--spruce)">${escapeHtml(s.value)}</p>
        <p class="eyebrow" style="margin-top:2px;font-size:9px">${s.label}</p>
      </div>`).join('');
  }
}

function setMapFilter(accId) {
  // FIX: accommodatie-ID's zijn strings (Firestore-doc-ID/UUID) sinds
  // Fase B — parseInt() hier gaf altijd NaN behalve toevallig voor de
  // Noorwegen-seed, en zelfs dan geen strikte match met een string-ID.
  mapFilterAccId = accId;
  renderMapFilterChips();
  renderMapMarkers();
}

// FIX: de NO/EU-knop zoomde naar vaste Noorwegen/Europa-coördinaten,
// ongeacht de actieve reis. Nu generiek: "Reis" kadert de verblijven van
// de actieve reis, "Alles" neemt Thuis (vertrek/aankomst) erbij.
function toggleFullRoute() {
  mapShowFullRoute = !mapShowFullRoute;
  const btn = document.getElementById('route-toggle-btn');
  btn.textContent = mapShowFullRoute ? 'Alles' : 'Reis';
  fitMapToAllPins();
}

function toggleGPS() {
  const btn = document.getElementById('gps-toggle-btn');
  if (isGpsActive()) {
    stopGpsTracking();
    showToast('GPS gestopt');
  } else {
    const started = startGpsTracking('map', pos => {
      const latlng = [pos.coords.latitude, pos.coords.longitude];
      gpsTrack.push(latlng);
      if (gpsTrack.length > 200) gpsTrack.shift();
      if (gpsPolyline) gpsPolyline.setLatLngs(gpsTrack);
      if (gpsMarker) {
        gpsMarker.setLatLng(latlng);
      } else {
        gpsMarker = L.circleMarker(latlng, { radius: 8, color: '#C5512B', fillColor: '#C5512B', fillOpacity: 1, weight: 3 }).addTo(leafletMap);
        leafletMap.panTo(latlng);
      }
    }, () => {
      // Opgeroepen zodra de tracking stopt, ook als dat via een ander scherm gebeurde
      gpsTrack = [];
      if (gpsMarker) { gpsMarker.remove(); gpsMarker = null; }
      if (gpsPolyline) gpsPolyline.setLatLngs([]);
      btn.textContent = '📍 GPS';
      btn.classList.remove('on');
    });
    if (started) {
      btn.textContent = '📍 Actief';
      btn.classList.add('on');
      showToast('📍 GPS-tracking gestart');
    }
  }
}
