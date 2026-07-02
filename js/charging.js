// ═══════════════════════════════════════════════════════════
// charging.js — Laadstations bij locatie, accommodatie en route
// Roept api/charging-stations.js aan (Open Charge Map, server-side)
// ═══════════════════════════════════════════════════════════

const CHARGING_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 uur — laadstations veranderen zelden
const chargingCache = new Map();
let lastChargingError = null; // DIAGNOSE: bewaart de exacte laatste fout

async function fetchChargingStationsNear(lat, lng, distanceKm) {
  const cacheKey = `near:${lat.toFixed(2)},${lng.toFixed(2)}:${distanceKm || 25}`;
  const cached = chargingCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CHARGING_CACHE_TTL_MS) {
    return cached.stations;
  }

  try {
    const params = new URLSearchParams({ lat, lng, distanceKm: distanceKm || 25 });
    const response = await fetch(`/api/charging-stations?${params}`);
    const bodyText = await response.text();

    if (!response.ok) {
      lastChargingError = `HTTP ${response.status} — ${bodyText.slice(0, 200)}`;
      console.error('Laadstations server-fout:', lastChargingError);
      return null;
    }

    let data;
    try {
      data = JSON.parse(bodyText);
    } catch (parseErr) {
      lastChargingError = `Antwoord was geen JSON: ${bodyText.slice(0, 200)}`;
      console.error('Laadstations parse-fout:', lastChargingError);
      return null;
    }

    if (data.error) {
      lastChargingError = `${data.error}${data.message ? ' — ' + data.message : ''}`;
      return null;
    }

    chargingCache.set(cacheKey, { stations: data.stations, timestamp: Date.now() });
    lastChargingError = null;
    return data.stations;
  } catch (err) {
    // "Failed to fetch" hier betekent meestal dat /api/charging-stations
    // zelf niet bereikbaar is — bijv. de functie deployt niet correct.
    lastChargingError = err.message || String(err);
    console.error('Laadstations ophalen mislukt:', err);
    return null;
  }
}

// Laadstations langs de hele route — gebruikt de accommodatiepunten
// en eventuele tussenliggende routepunten als zoekpunten.
async function fetchChargingStationsAlongRoute() {
  const cacheKey = 'route:all';
  const cached = chargingCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CHARGING_CACHE_TTL_MS) {
    return cached.stations;
  }

  const routePoints = ACCOMMODATIONS.map(acc => `${acc.lat},${acc.lng}`).join(';');

  try {
    const params = new URLSearchParams({ points: routePoints, distanceKm: 15 });
    const response = await fetch(`/api/charging-stations?${params}`);
    if (!response.ok) throw new Error('Status ' + response.status);
    const data = await response.json();
    chargingCache.set(cacheKey, { stations: data.stations, timestamp: Date.now() });
    return data.stations;
  } catch (err) {
    lastChargingError = err.message || String(err);
    console.error('Laadstations langs route ophalen mislukt:', err);
    return null;
  }
}

// ── DC/AC-indeling ─────────────────────────────────────────
// Open Charge Map geeft geen apart "DC/AC"-veld terug — afgeleid uit
// connector-type (CCS/CHAdeMO/Tesla = DC) met vermogen als fallback
// (snelladers ≥43 kW zijn in de praktijk vrijwel altijd DC).
const DC_CONNECTOR_PATTERN = /ccs|chademo|tesla|type\s?2\s?ccs/i;
function isDcStation(station) {
  if (station.connectorTypes.some(c => DC_CONNECTOR_PATTERN.test(c))) return true;
  if (station.connectorTypes.length && !station.connectorTypes.some(c => DC_CONNECTOR_PATTERN.test(c))) return false;
  return (station.maxPowerKw || 0) >= 43;
}

// ── Render: laadstation-lijst in de sheet ─────────────────
// Toont alleen velden die Open Charge Map daadwerkelijk teruggeeft.
// Geen live beschikbaarheid (X/Y vrij) — die data levert deze API niet,
// dus we tonen geen verzonnen getallen (zie DL / eerlijkheids-principe
// dat ook al bij de weer-fix is toegepast).
function renderChargingStationCard(station) {
  const powerLabel = station.maxPowerKw ? `${station.maxPowerKw} kW` : 'Onbekend vermogen';
  const connectorLabel = station.connectorTypes.length
    ? station.connectorTypes.slice(0, 2).join(', ')
    : 'Type onbekend';
  const pointsLabel = station.numberOfPoints ? `${station.numberOfPoints} laadpunt${station.numberOfPoints !== 1 ? 'en' : ''}` : '';
  const dcBadge = isDcStation(station) ? 'DC' : 'AC';
  return `
    <div class="card-row" onclick="openMapsForCoords(${station.lat},${station.lng},'${escapeHtml(station.name).replace(/'/g, "\\'")}')">
      <div class="icon-box" style="background:var(--water-light);color:var(--water)">⚡</div>
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:6px">
          <p class="row-title" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(station.name)}</p>
          <span class="mono" style="flex-shrink:0;padding:2px 6px;background:var(--water-light);color:var(--water);border-radius:6px;font-size:9px;font-weight:700">${dcBadge}</span>
          ${!station.isOperational ? `<span class="mono" style="flex-shrink:0;padding:2px 6px;background:var(--paper-warm);color:var(--ink-faint);border-radius:6px;font-size:9px;font-weight:700">BUITEN DIENST</span>` : ''}
        </div>
        <p class="row-sub">${escapeHtml(station.operator)} · ${powerLabel} · ${escapeHtml(connectorLabel)}${pointsLabel ? ' · ' + pointsLabel : ''}</p>
      </div>
      <span class="chevron">›</span>
    </div>`;
}

// ── Sheet: echte laadstation-lijst i.p.v. toast met top-3 ──
let chargingStations = [];
let chargingFilter = 'all';

async function openChargingStationsSheet() {
  const acc = getActiveAccommodation();
  const subEl = document.getElementById('charging-sub');
  const listEl = document.getElementById('charging-list');
  if (!acc) { showToast('Geen actief verblijf'); return; }

  chargingFilter = 'all';
  setChargingFilterChips('all');
  subEl.textContent = `Binnen 25 km van ${acc.short}`;
  listEl.innerHTML = `<div class="empty-state" style="padding:24px 0"><div class="spinner" style="margin-bottom:10px"></div><p class="mono">Laadstations zoeken…</p></div>`;
  openSheet('sheet-charging');

  const stations = await fetchChargingStationsNear(acc.lat, acc.lng, 25);
  chargingStations = stations || [];

  if (stations === null) {
    listEl.innerHTML = `<div class="empty-state" style="padding:24px 0"><p class="row-title" style="color:var(--summit)">Kon laadstations niet laden</p><p class="mono" style="margin-top:6px">${escapeHtml(lastChargingError || 'Onbekende fout')}</p></div>`;
    return;
  }
  renderChargingList();
}

async function handleSearchChargingAlongRoute() {
  const listEl = document.getElementById('charging-list');
  const subEl = document.getElementById('charging-sub');
  subEl.textContent = 'Langs de hele route';
  listEl.innerHTML = `<div class="empty-state" style="padding:24px 0"><div class="spinner" style="margin-bottom:10px"></div><p class="mono">Route doorzoeken…</p></div>`;

  const stations = await fetchChargingStationsAlongRoute();
  chargingStations = stations || [];

  if (stations === null) {
    listEl.innerHTML = `<div class="empty-state" style="padding:24px 0"><p class="row-title" style="color:var(--summit)">Kon laadstations niet laden</p><p class="mono" style="margin-top:6px">${escapeHtml(lastChargingError || 'Onbekende fout')}</p></div>`;
    return;
  }
  renderChargingList();
}

function setChargingFilter(filter) {
  chargingFilter = filter;
  setChargingFilterChips(filter);
  renderChargingList();
}

function setChargingFilterChips(filter) {
  ['all', 'dc', 'ac'].forEach(f => {
    const chip = document.getElementById('charging-filter-' + f);
    if (chip) chip.classList.toggle('on', f === filter);
  });
}

function renderChargingList() {
  const listEl = document.getElementById('charging-list');
  let list = chargingStations;
  if (chargingFilter === 'dc') list = list.filter(isDcStation);
  if (chargingFilter === 'ac') list = list.filter(s => !isDcStation(s));

  if (list.length === 0) {
    listEl.innerHTML = `<div class="empty-state" style="padding:24px 0"><p class="row-title">Geen laadstations gevonden</p><p class="mono" style="margin-top:6px">Probeer een ander filter of zoek langs de hele route.</p></div>`;
    return;
  }

  listEl.innerHTML = `<div class="card">${list
    .sort((a, b) => (b.maxPowerKw || 0) - (a.maxPowerKw || 0))
    .map(renderChargingStationCard)
    .join('')}</div>`;
}
