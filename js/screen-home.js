// ═══════════════════════════════════════════════════════════
// screen-home.js — Vandaag-scherm
// ═══════════════════════════════════════════════════════════

function renderHomeScreen() {
  const today = getToday();
  const dayNum = getDayNumber(today);
  const acc = getActiveAccommodation(); // FIX: altijd via datum-logica, nooit hardcoded

  renderTripPhaseBanner();
  updateTripIdentityStrips();

  document.getElementById('home-day').textContent = `Dag ${dayNum} · ${formatShortDate(today)}`;

  // Hero accommodatie
  document.getElementById('home-acc-name').textContent = acc ? acc.name : 'Onderweg';
  document.getElementById('home-acc-elevation').textContent = acc ? `${acc.elevation}m` : '—m';
  const nights = acc ? Math.round((acc.checkOut - acc.checkIn) / 86400000) : 0;
  document.getElementById('home-acc-dates').textContent = acc
    ? `${formatShortDate(acc.checkIn)} – ${formatShortDate(acc.checkOut)} · ${nights} nachten`
    : 'reisdag';

  // Live weer — Open-Meteo, geen sleutel nodig
  if (acc) {
    fillWeatherBadge('home-weather-badge', acc.lat, acc.lng, today);
  }

  // Snelacties: sublabels met de concrete bestemming
  const accSub = document.getElementById('qt-acc-sub');
  if (accSub) accSub.textContent = acc ? acc.name : 'Geen verblijf';
  const nextAct = getActivitiesForDate(today).find(a => a.status !== 'done') || getNextUpcomingActivity(today);
  const actSub = document.getElementById('qt-act-sub');
  if (actSub) actSub.textContent = nextAct ? nextAct.name : 'Niets gepland';

  // Voortgang
  const { done, total } = getProgress();
  document.getElementById('home-progress-label').textContent = `${done}/${total}`;
  document.getElementById('home-progress-fill').style.width = `${getProgress().percent}%`;

  // Vandaag's activiteiten — activiteit toevoegen doe je op Planning (op
  // verzoek hier weggelaten), dus alleen een verwijzing daarheen + een
  // voorproefje van de eerstvolgende geplande activiteit.
  const todayActs = getActivitiesForDate(today);
  const listEl = document.getElementById('home-today-list');
  if (todayActs.length === 0) {
    const next = getNextUpcomingActivity(today);
    listEl.innerHTML = `
      <div style="padding:22px 16px;text-align:center">
        <p class="mono" style="margin-bottom:10px">Niets gepland vandaag</p>
        <button onclick="navigateTo('planning')" class="btn btn-outline">Naar planning →</button>
        ${next ? `
        <button onclick="goToActivityDay('${next.date.toISOString()}')" class="mono" style="display:block;width:100%;margin-top:14px;padding:0;background:none;border:none;cursor:pointer;color:var(--ink-faint)">
          Volgende: ${next.emoji} ${escapeHtml(next.name)} · ${formatShortDate(next.date)} →
        </button>` : ''}
      </div>`;
  } else {
    listEl.innerHTML = todayActs.map((act, i) => renderActivityRow(act, i, todayActs.length)).join('');
  }

  // Voortgang per accommodatie (mini-balkjes)
  // FIX: telde ook niet-ingeplande activiteiten mee (nog los liggend bij
  // dit verblijf, "Beschikbaar vanuit X" in Planning) — hoort alleen over
  // daadwerkelijk ingeplande activiteiten te gaan, zelfde correctie als
  // getProgress() hierboven.
  const barsEl = document.getElementById('home-acc-bars');
  barsEl.innerHTML = ACCOMMODATIONS.map(a => {
    const accActs = AppState.activities.filter(x => idsMatch(x.accId, a.id) && x.date);
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

// ── Snelacties (Vandaag) ───────────────────────────────────
// Route/nabij/laden vanuit je huidige verblijf of de activiteit van
// vandaag. Hergebruiken de bestaande helpers (openMapsForAccommodation,
// openMapsForCoords, openNearbySearch, openChargingStationsSheet) zodat
// het gedrag identiek is aan de knoppen op het verblijf- en
// activiteitscherm.
function routeToCurrentAccommodation() {
  const acc = getActiveAccommodation();
  if (!acc || !isValidLatLng(acc.lat, acc.lng)) { showToast('Geen locatie bekend voor je huidige verblijf'); return; }
  openMapsForAccommodation(acc.id);
}

function todayOrNextActivity() {
  const today = getToday();
  return getActivitiesForDate(today).find(a => a.status !== 'done') || getNextUpcomingActivity(today);
}

function routeToTodayActivity() {
  const act = todayOrNextActivity();
  if (!act) { showToast('Geen activiteit gepland — plan er eerst een in'); return; }
  if (!isValidLatLng(act.lat, act.lng)) { showToast(`Geen locatie bekend voor ${act.name}`); return; }
  openMapsForCoords(act.lat, act.lng, act.name);
}

function nearbyFoodForCurrentAccommodation() {
  const acc = getActiveAccommodation();
  if (!acc) { showToast('Geen huidig verblijf'); return; }
  openNearbySearch('restaurant', acc.lat || 0, acc.lng || 0, acc.name);
}

// Springt vanaf Vandaag's "Volgende: ..."-voorproefje naar de betreffende
// dag in Planning.
function goToActivityDay(isoString) {
  AppState.selectedPlanningDay = new Date(isoString);
  navigateTo('planning');
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

async function handleToggleActivity(id) {
  // FIX: ontbrekende await zorgde ervoor dat `act` hier altijd een
  // (altijd truthy) Promise was i.p.v. de activiteit — de toast toonde
  // daardoor altijd "Heropend", ook bij het afvinken.
  const act = await toggleActivityStatus(id);
  if (!act) return;
  if (act.status === 'done') {
    // N3: na afvinken, met locatie bekend, meteen kunnen doorspringen
    // naar Discover met déze plek als basis i.p.v. het verblijf.
    const hasLocation = act.lat && act.lng;
    showToast(
      hasLocation ? '✓ Voltooid — iets zoeken in de buurt?' : '✓ Voltooid',
      hasLocation ? 4500 : 2400,
      hasLocation ? () => openDiscoverNearActivity(act) : null
    );
  } else {
    showToast('Heropend');
  }
  renderHomeScreen();
  if (document.getElementById('screen-planning').classList.contains('active')) renderPlanningScreen();
  if (document.getElementById('screen-roadtrip').classList.contains('active')) renderRoadtripScreen();
}
