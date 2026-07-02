// ═══════════════════════════════════════════════════════════
// screen-roadtrip.js — Roadtrip-modus met live GPS
// ═══════════════════════════════════════════════════════════

function renderRoadtripScreen() {
  const acc = getActiveAccommodation();
  const today = getToday();
  const dayNum = getDayNumber(today);
  const { done, total, percent } = getProgress();

  document.getElementById('rt-acc-short').textContent = acc ? acc.short : '—';
  document.getElementById('rt-current-name').textContent = acc ? acc.name : 'Onderweg';
  document.getElementById('rt-checkout').textContent = acc ? `check-out ${formatShortDate(acc.checkOut)} · 11:00` : '—';

  // Live weer voor de huidige positie
  if (acc) {
    fillRoadtripWeather(acc.lat, acc.lng, today);
    fillWeatherStrip('rt-weather-strip', acc.lat, acc.lng, 5);
  }

  const next = acc ? getNextAccommodation(acc.id) : null;
  document.getElementById('rt-next-name').textContent = next ? next.name : 'Einde reis';
  document.getElementById('rt-next-date').textContent = next ? formatShortDate(next.checkIn) : formatShortDate(TRIP_END);

  const todayActs = getActivitiesForDate(today);
  const nextActivity = todayActs.find(a => a.status !== 'done');
  document.getElementById('rt-activity-emoji').textContent = nextActivity ? nextActivity.emoji : '✅';
  document.getElementById('rt-activity-name').textContent = nextActivity ? nextActivity.name.toUpperCase() : 'ALLES GEDAAN VANDAAG';
  document.getElementById('rt-activity-meta').textContent = nextActivity
    ? `${nextActivity.elevation}m · ${nextActivity.distance} · ${nextActivity.duration}`
    : 'Goed gedaan!';
  document.getElementById('rt-activity-card').onclick = nextActivity
    ? () => openMapsForCoords(nextActivity.lat, nextActivity.lng, nextActivity.name)
    : null;

  document.getElementById('rt-progress-label').textContent = `${done}/${total} · ${percent}%`;
  document.getElementById('rt-progress-fill').style.width = `${percent}%`;

  document.getElementById('rt-today-label').textContent = `Dag ${dayNum} · vandaag`;
  const listEl = document.getElementById('rt-today-list');
  if (todayActs.length === 0) {
    listEl.innerHTML = `<div style="padding:16px;text-align:center"><p class="mono">Niets gepland vandaag</p></div>`;
  } else {
    listEl.innerHTML = todayActs.map((a, i) => {
      const isLast = i === todayActs.length - 1;
      return `
        <div class="activity-row" style="${isLast ? '' : 'border-bottom:1px solid var(--line-soft)'}" onclick="handleToggleActivity(${a.id})">
          <button class="activity-check" style="border-color:${a.status === 'done' ? 'var(--slope)' : 'var(--line)'};background:${a.status === 'done' ? 'var(--slope)' : 'transparent'}">
            ${a.status === 'done' ? checkmarkSvg() : ''}
          </button>
          <span style="font-size:18px;flex-shrink:0">${a.emoji}</span>
          <p class="row-title" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;${a.status === 'done' ? 'color:var(--ink-faint);text-decoration:line-through' : ''}">${escapeHtml(a.name)}</p>
          <button onclick="event.stopPropagation();openMapsForCoords(${a.lat},${a.lng},'${escapeHtml(a.name).replace(/'/g, "\\'")}')" style="width:32px;height:32px;background:var(--slope-light);border:none;border-radius:8px;cursor:pointer;font-size:16px;flex-shrink:0">◈</button>
        </div>`;
    }).join('');
  }

  initAllTopoPanels();
}

function toggleRoadtripGPS() {
  const dot = document.getElementById('rt-gps-dot');
  const label = document.getElementById('rt-gps-label');
  if (isGpsActive()) {
    stopGpsTracking();
    showToast('GPS gestopt');
  } else {
    const started = startGpsTracking('roadtrip', pos => {
      document.getElementById('rt-position').textContent =
        `${pos.coords.latitude.toFixed(4)}°N ${pos.coords.longitude.toFixed(4)}°E`;
    }, () => {
      dot.style.background = 'rgba(232,228,217,0.4)';
      label.textContent = 'GPS UIT';
      document.getElementById('rt-position').textContent = 'positie onbekend';
    });
    if (started) {
      dot.style.background = '#C5512B';
      label.textContent = 'GPS AAN';
      showToast('📍 GPS-tracking gestart');
    }
  }
}

function openMapsForCoords(lat, lng, label) {
  const query = (lat && lng) ? `${lat},${lng}` : encodeURIComponent(label);
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${query}`, '_blank');
}

// ── Ingeklapte mini-kaart ──────────────────────────────────
// Losse Leaflet-instantie van het hoofd-kaartscherm, zodat je
// tijdens roadtrip-modus niet hoeft weg te navigeren om te zien
// waar je bent t.o.v. de verblijven. Lazy-init pas bij het uitklappen.
let roadtripMiniMap = null;

function toggleRoadtripMiniMap() {
  const container = document.getElementById('rt-minimap-container');
  const chevron = document.getElementById('rt-minimap-chevron');
  const isOpen = container.style.display !== 'none';

  if (isOpen) {
    container.style.display = 'none';
    chevron.textContent = '›';
    return;
  }

  container.style.display = 'block';
  chevron.textContent = '⌄';

  if (typeof L === 'undefined') {
    container.innerHTML = `<p class="mono" style="padding:16px;text-align:center">Kaart kon niet laden — controleer internetverbinding.</p>`;
    return;
  }

  if (!roadtripMiniMap) {
    const acc = getActiveAccommodation();
    roadtripMiniMap = L.map(container, { zoomControl: false, attributionControl: false }).setView([acc ? acc.lat : 61.0, acc ? acc.lng : 8.0], 9);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(roadtripMiniMap);

    ACCOMMODATIONS.forEach(a => {
      const isActive = acc && acc.id === a.id;
      const icon = L.divIcon({
        html: `<div style="background:${a.color};width:${isActive ? 28 : 20}px;height:${isActive ? 28 : 20}px;border-radius:50%;border:2px solid white;display:flex;align-items:center;justify-content:center;font-size:${isActive ? 14 : 11}px;box-shadow:0 2px 6px ${a.color}55">🏡</div>`,
        className: '', iconSize: [30, 30], iconAnchor: [15, 15],
      });
      L.marker([a.lat, a.lng], { icon }).addTo(roadtripMiniMap)
        .on('click', () => { AppState.viewingAccommodationId = a.id; navigateTo('accommodation'); });
    });
  }

  setTimeout(() => { try { roadtripMiniMap.invalidateSize(); } catch (e) { console.error('Mini-kaart fout:', e); } }, 100);
}
