// ═══════════════════════════════════════════════════════════
// screen-map.js — Kaartscherm met Leaflet/OpenStreetMap
// ═══════════════════════════════════════════════════════════

let leafletMap = null;
let gpsWatchId = null;
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
    // FIX: kaart bestaat al, maar het scherm was net verborgen (display:none).
    // Leaflet meet zijn container-grootte verkeerd als die niet zichtbaar was.
    // invalidateSize() forceert een herberekening zodra het scherm weer toont.
    requestAnimationFrame(() => {
      leafletMap.invalidateSize();
      if (loadingEl) loadingEl.classList.add('hidden');
    });
    return;
  }

  const container = document.getElementById('leaflet-map');

  // FIX: wacht tot het scherm daadwerkelijk zichtbaar is (display:flex)
  // voordat Leaflet wordt geïnitialiseerd, anders is de containergrootte 0×0.
  requestAnimationFrame(() => {
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

    renderMapMarkers();

    // Nogmaals invalidateSize na de eerste render, voor de zekerheid
    // (sommige mobiele browsers herberekenen layout met vertraging).
    setTimeout(() => {
      leafletMap.invalidateSize();
      if (loadingEl) loadingEl.classList.add('hidden');
    }, 150);
  });
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
    marker.on('click', () => {
      AppState.viewingAccommodationId = acc.id;
      navigateTo('accommodation');
    });
    accommodationMarkers.push(marker);
  });

  // Activiteitenpins — gefilterd op accommodatie indien actief
  const filtered = mapFilterAccId
    ? AppState.activities.filter(a => a.accId === mapFilterAccId)
    : AppState.activities;

  filtered.filter(a => a.lat && a.lng).forEach(act => {
    const acc = ACCOMMODATIONS.find(a => a.id === act.accId);
    if (!acc) return;
    const dayLabel = act.date ? `D${getDayNumber(act.date)}` : '';
    const opacity = act.status === 'done' ? 0.5 : 1;
    const html = `
      <div style="opacity:${opacity};text-align:center">
        <div style="background:${acc.color};width:36px;height:36px;border-radius:50%;border:2px solid white;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 6px ${acc.color}44;margin:0 auto">${act.emoji}</div>
        ${dayLabel ? `<div style="background:${acc.color};color:white;font-size:8px;font-weight:700;padding:1px 5px;border-radius:3px;text-align:center;margin-top:2px">${dayLabel}</div>` : ''}
      </div>`;
    const icon = L.divIcon({ html, className: '', iconSize: [36, dayLabel ? 50 : 40], iconAnchor: [18, dayLabel ? 50 : 40] });
    const marker = L.marker([act.lat, act.lng], { icon }).addTo(leafletMap);
    marker.on('click', () => showToast(`${act.name} · ${act.distance} · ${act.level} · ${act.elevation}m`));
    activityMarkers.push(marker);
  });
}

function setMapFilter(accId) {
  mapFilterAccId = accId;
  document.querySelectorAll('[data-filter-chip]').forEach(chip => {
    const isOn = (accId === null && chip.dataset.filterChip === 'all') ||
                 (accId !== null && parseInt(chip.dataset.filterChip) === accId);
    chip.classList.toggle('on', isOn);
  });
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
  if (gpsWatchId) {
    navigator.geolocation.clearWatch(gpsWatchId);
    gpsWatchId = null;
    gpsTrack = [];
    if (gpsMarker) { gpsMarker.remove(); gpsMarker = null; }
    if (gpsPolyline) gpsPolyline.setLatLngs([]);
    btn.textContent = '📍 GPS';
    btn.classList.remove('on');
    showToast('GPS gestopt');
  } else {
    if (!navigator.geolocation) { showToast('GPS niet beschikbaar op dit apparaat'); return; }
    btn.textContent = '📍 Actief';
    btn.classList.add('on');
    gpsWatchId = navigator.geolocation.watchPosition(
      pos => {
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
      },
      err => showToast('GPS-fout: ' + err.message),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
    showToast('📍 GPS-tracking gestart');
  }
}
