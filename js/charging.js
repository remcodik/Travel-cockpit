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

// ── Render: laadstation-lijst in een sheet of paneel ──────
function renderChargingStationCard(station) {
  const powerLabel = station.maxPowerKw ? `${station.maxPowerKw} kW` : 'Onbekend vermogen';
  const connectorLabel = station.connectorTypes.length
    ? station.connectorTypes.slice(0, 2).join(', ')
    : 'Type onbekend';
  return `
    <div class="card-row" onclick="openMapsForCoords(${station.lat},${station.lng},'${escapeHtml(station.name).replace(/'/g, "\\'")}')">
      <div class="icon-box" style="background:var(--water-light);color:var(--water)">⚡</div>
      <div style="flex:1;min-width:0">
        <p class="row-title" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(station.name)}</p>
        <p class="row-sub">${escapeHtml(station.operator)} · ${powerLabel} · ${escapeHtml(connectorLabel)}</p>
      </div>
      <span class="chevron">›</span>
    </div>`;
}

// DIAGNOSE: toont nu de ECHTE foutmelding (lastChargingError) ipv
// de generieke "Kon laadstations niet ophalen" — tijdelijk.
async function showChargingStationsNearActiveAccommodation() {
  const acc = getActiveAccommodation();
  if (!acc) { showToast('Geen actief verblijf'); return; }

  showToast('Laadstations zoeken…');
  const stations = await fetchChargingStationsNear(acc.lat, acc.lng, 25);

  if (stations === null) {
    showToast(`⚠️ ${lastChargingError || 'Onbekende fout'}`);
    return;
  }
  if (stations.length === 0) {
    showToast(`Geen laadstations gevonden binnen 25 km van ${acc.short}`);
    return;
  }

  const top3 = stations
    .sort((a, b) => b.maxPowerKw - a.maxPowerKw)
    .slice(0, 3)
    .map(s => `${s.name} (${s.maxPowerKw || '?'} kW)`)
    .join(' · ');
  showToast(`⚡ ${stations.length} gevonden: ${top3}`);
}
