// ═══════════════════════════════════════════════════════════
// screen-map.js — Kaartscherm met Leaflet/OpenStreetMap
// ═══════════════════════════════════════════════════════════

let leafletMap = null;
let gpsMarker = null;
let gpsTrack = [];
let gpsPolyline = null;
let accommodationMarkers = [];
let activityMarkers = [];
let mapFilterAccId = null;
let mapShowFullRoute = false;

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
    // FIX: pins en filterchips opnieuw opbouwen bij elk bezoek — anders
    // bleven ze na het wisselen van reis (Fase B) de vorige reis tonen,
    // omdat dit vroeger alleen bij de allereerste kaart-load gebeurde.
    mapFilterAccId = null;
    renderMapFilterChips();
    renderMapMarkers();
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

      DRIVE_PATHS.forEach(path => {
        L.polyline(path, { color: '#0E3A2E', weight: 2.5, opacity: 0.65 }).addTo(leafletMap);
      });
      FERRY_PATHS.forEach(path => {
        L.polyline(path, { color: '#1B5A8A', weight: 2.5, opacity: 0.7, dashArray: '8,5' }).addTo(leafletMap);
      });

      gpsPolyline = L.polyline([], { color: '#C5512B', weight: 3, opacity: 0.85 }).addTo(leafletMap);

      renderMapFilterChips();
      renderMapMarkers();

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

  // Accommodatiepins — altijd zichtbaar, ongeacht filter
  ACCOMMODATIONS.forEach(acc => {
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

  filtered.filter(a => a.lat && a.lng).forEach(act => {
    const acc = ACCOMMODATIONS.find(a => idsMatch(a.id, act.accId));
    if (!acc) return;
    // Dag-label met volgnummer ("D4-2") als er meerdere activiteiten op
    // dezelfde dag zijn — anders zijn hun pins niet te onderscheiden.
    let dayLabel = '';
    if (act.date) {
      const sameDay = AppState.activities
        .filter(a => a.date && a.date.toDateString() === act.date.toDateString())
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
  const thumb = document.getElementById('pd-thumb');
  thumb.textContent = act.emoji;

  document.getElementById('pd-name').textContent = act.name;

  const metaParts = [];
  if (act.elevation) metaParts.push(`▲ ${act.elevation}m`);
  if (act.distance && act.distance !== '—') metaParts.push(act.distance);
  if (act.duration && act.duration !== '—') metaParts.push(act.duration);
  if (act.level && act.level !== '—') metaParts.push(act.level);
  const metaEl = document.getElementById('pd-meta');
  metaEl.innerHTML = metaParts.length
    ? metaParts.map(p => `<span class="mono" style="background:rgba(255,255,255,0.16);color:white;padding:3px 9px;border-radius:20px;font-size:11px">${escapeHtml(p)}</span>`).join('')
    : `<span class="mono" style="color:rgba(255,255,255,0.7)">Geen details bekend</span>`;
}

function setMapFilter(accId) {
  // FIX: accommodatie-ID's zijn strings (Firestore-doc-ID/UUID) sinds
  // Fase B — parseInt() hier gaf altijd NaN behalve toevallig voor de
  // Noorwegen-seed, en zelfs dan geen strikte match met een string-ID.
  mapFilterAccId = accId;
  renderMapFilterChips();
  renderMapMarkers();
}

function toggleFullRoute() {
  mapShowFullRoute = !mapShowFullRoute;
  const btn = document.getElementById('route-toggle-btn');
  btn.textContent = mapShowFullRoute ? 'EU' : 'NO';
  if (leafletMap) {
    leafletMap.setView(mapShowFullRoute ? [55.0, 7.5] : [61.0, 8.0], mapShowFullRoute ? 5 : 7);
  }
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
