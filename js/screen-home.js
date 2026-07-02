// ═══════════════════════════════════════════════════════════
// screen-home.js — Vandaag-scherm
// ═══════════════════════════════════════════════════════════

function renderHomeScreen() {
  const today = getToday();
  const dayNum = getDayNumber(today);
  const acc = getActiveAccommodation(); // FIX: altijd via datum-logica, nooit hardcoded

  renderTripPhaseBanner();

  const activeTrip = getActiveTrip();
  document.getElementById('home-trip-name').textContent = activeTrip
    ? `${activeTrip.countryFlag || ''} ${activeTrip.name}`.trim().toUpperCase()
    : 'NOORWEGEN 2026';

  document.getElementById('home-day').textContent = `Dag ${dayNum} · ${formatShortDate(today)}`;
  document.getElementById('home-coord').textContent = acc ? acc.coord : '15.06 – 30.06';

  // Hero accommodatie
  document.getElementById('home-acc-name').textContent = acc ? acc.name.toUpperCase() : 'ONDERWEG';
  document.getElementById('home-acc-elevation').textContent = acc ? `${acc.elevation}m` : '—m';
  const nights = acc ? Math.round((acc.checkOut - acc.checkIn) / 86400000) : 0;
  document.getElementById('home-acc-dates').textContent = acc
    ? `${formatShortDate(acc.checkIn)} – ${formatShortDate(acc.checkOut)} · ${nights} nachten`
    : 'reisdag';

  // Live weer — Open-Meteo, geen sleutel nodig
  if (acc) {
    fillWeatherBadge('home-weather-badge', acc.lat, acc.lng, today);
  }

  // Statistieken
  const { done, total } = getProgress();
  document.getElementById('stat-todo').textContent = total - done;
  document.getElementById('stat-done').textContent = done;
  document.getElementById('stat-tickets').textContent = 1 + AppState.tickets.length;
  document.getElementById('home-progress-label').textContent = `${done}/${total}`;
  document.getElementById('home-progress-fill').style.width = `${getProgress().percent}%`;

  // Vandaag's activiteiten
  const todayActs = getActivitiesForDate(today);
  const listEl = document.getElementById('home-today-list');
  if (todayActs.length === 0) {
    listEl.innerHTML = `
      <div style="padding:24px 16px;text-align:center">
        <p class="mono" style="margin-bottom:8px">Niets gepland vandaag</p>
        <button onclick="navigateTo('discover')" class="btn btn-outline">Bekijk AI-ideeën</button>
      </div>`;
  } else {
    listEl.innerHTML = todayActs.map((act, i) => renderActivityRow(act, i, todayActs.length)).join('');
  }

  // Voortgang per accommodatie (mini-balkjes)
  const barsEl = document.getElementById('home-acc-bars');
  barsEl.innerHTML = ACCOMMODATIONS.map(a => {
    const accActs = AppState.activities.filter(x => idsMatch(x.accId, a.id));
    const accDone = accActs.filter(x => x.status === 'done').length;
    const pct = accActs.length > 0 ? (accDone / accActs.length) * 100 : 0;
    return `
      <div style="flex:1">
        <div style="height:4px;background:var(--slope-light);border-radius:2px;overflow:hidden">
          <div style="height:100%;width:${pct}%;background:${a.color};border-radius:2px"></div>
        </div>
        <p class="mono" style="font-size:8px;color:${a.color};margin-top:3px;text-align:center">${a.short}</p>
      </div>`;
  }).join('');

  initAllTopoPanels();
}

// Eerlijke status i.p.v. een gefingeerde datum: buiten het reisvenster
// toont de app nu duidelijk dat de reis nog moet beginnen of al voorbij
// is, in plaats van te doen alsof het een willekeurige dag mid-reis is.
function renderTripPhaseBanner() {
  const el = document.getElementById('home-trip-phase-banner');
  if (!el) return;
  const phase = getTripPhase();
  if (phase === 'during') { el.innerHTML = ''; return; }

  const daysUntil = Math.ceil((TRIP_START - getToday()) / 86400000);
  const text = phase === 'before'
    ? `Reis begint over ${daysUntil} dag${daysUntil === 1 ? '' : 'en'} · ${formatShortDate(TRIP_START)}`
    : `Reis afgerond op ${formatShortDate(TRIP_END)} — hier is een terugblik`;

  el.innerHTML = `
    <div class="px" style="padding-top:11px;padding-bottom:11px;background:var(--slope-light);border-bottom:1px solid var(--line-soft)">
      <p class="mono" style="color:var(--spruce);font-weight:700">◷ ${text}</p>
    </div>`;
}

function renderActivityRow(act, index, total) {
  const acc = ACCOMMODATIONS.find(a => idsMatch(a.id, act.accId));
  if (!acc) return '';
  const isDone = act.status === 'done';
  const isLast = index === total - 1;
  return `
    <div class="activity-row" style="${isLast ? '' : 'border-bottom:1px solid var(--line-soft)'}" onclick="showToast('${escapeHtml(act.name)} · ${act.distance} · ${act.duration}')">
      <div class="activity-band" style="background:${acc.color}"></div>
      <span class="mono" style="font-size:13px;font-weight:700;color:${isDone ? 'var(--ink-faint)' : acc.color};width:22px;text-align:center;flex-shrink:0">${index + 1}</span>
      <div class="activity-thumb" style="background:${isDone ? 'var(--paper-warm)' : acc.color + '18'}">${act.emoji}</div>
      <div style="flex:1;min-width:0">
        <p class="row-title" style="${isDone ? 'color:var(--ink-faint);text-decoration:line-through' : ''};overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(act.name)}</p>
        <div style="display:flex;align-items:center;gap:8px;margin-top:2px">
          ${renderElevationTag(act.elevation, acc.color)}
          <span class="mono">· ${act.distance} · ${act.duration}</span>
        </div>
      </div>
      <button class="activity-check" style="border-color:${isDone ? acc.color : 'var(--line)'};background:${isDone ? acc.color : 'transparent'}" onclick="event.stopPropagation();handleToggleActivity(${act.id})">
        ${isDone ? checkmarkSvg() : ''}
      </button>
    </div>`;
}

function renderElevationTag(elevation, color) {
  return `<span class="elevation-tag" style="color:${color}"><span class="summit-tri" style="border-left:5px solid transparent;border-right:5px solid transparent;border-bottom:8px solid ${color}"></span>${elevation}m</span>`;
}

function checkmarkSvg() {
  return `<svg width="11" height="11" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function handleToggleActivity(id) {
  const act = toggleActivityStatus(id);
  if (!act) return;
  showToast(act.status === 'done' ? '✓ Voltooid' : 'Heropend');
  renderHomeScreen();
  if (document.getElementById('screen-planning').classList.contains('active')) renderPlanningScreen();
  if (document.getElementById('screen-roadtrip').classList.contains('active')) renderRoadtripScreen();
}
