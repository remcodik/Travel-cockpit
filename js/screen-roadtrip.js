// ═══════════════════════════════════════════════════════════
// screen-roadtrip.js — Roadtrip-modus met live GPS
// ═══════════════════════════════════════════════════════════

let roadtripGpsWatchId = null;

function renderRoadtripScreen() {
  const acc = getActiveAccommodation();
  const today = getToday();
  const dayNum = getDayNumber(today);
  const { done, total, percent } = getProgress();

  document.getElementById('rt-acc-short').textContent = acc ? acc.short : '—';
  document.getElementById('rt-current-name').textContent = acc ? acc.name : 'Onderweg';
  document.getElementById('rt-checkout').textContent = acc ? `check-out ${formatShortDate(acc.checkOut)} · 11:00` : '—';

  // Live weer voor de huidige positie
  if (acc) fillRoadtripWeather(acc.lat, acc.lng, today);

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
  if (roadtripGpsWatchId) {
    navigator.geolocation.clearWatch(roadtripGpsWatchId);
    roadtripGpsWatchId = null;
    dot.style.background = 'rgba(232,228,217,0.4)';
    label.textContent = 'GPS UIT';
    document.getElementById('rt-position').textContent = 'positie onbekend';
    showToast('GPS gestopt');
  } else {
    if (!navigator.geolocation) { showToast('GPS niet beschikbaar'); return; }
    dot.style.background = '#C5512B';
    label.textContent = 'GPS AAN';
    roadtripGpsWatchId = navigator.geolocation.watchPosition(
      pos => {
        document.getElementById('rt-position').textContent =
          `${pos.coords.latitude.toFixed(4)}°N ${pos.coords.longitude.toFixed(4)}°E`;
      },
      err => showToast('GPS-fout: ' + err.message),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
    showToast('📍 GPS-tracking gestart');
  }
}

function openMapsForCoords(lat, lng, label) {
  const query = (lat && lng) ? `${lat},${lng}` : encodeURIComponent(label);
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${query}`, '_blank');
}
