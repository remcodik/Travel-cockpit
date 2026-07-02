// ═══════════════════════════════════════════════════════════
// screen-planning.js — Planning met CRUD en filter
// ═══════════════════════════════════════════════════════════

let planningFilter = 'all'; // 'all' | 'planned'

function renderPlanningScreen() {
  if (!AppState.selectedPlanningDay) AppState.selectedPlanningDay = getToday();
  buildDayTabs();
  renderPlanningDay();
}

function togglePlanningFilter(btn) {
  planningFilter = planningFilter === 'all' ? 'planned' : 'all';
  btn.textContent = planningFilter === 'planned' ? 'Ingepland' : 'Alle';
  btn.classList.toggle('on', planningFilter === 'planned');
  renderPlanningDay();
}

function buildDayTabs() {
  const container = document.getElementById('day-tabs');
  const days = getAllTripDays();
  container.innerHTML = days.map(day => {
    const dayNum = getDayNumber(day);
    const acc = getAccommodationForDate(day);
    const color = acc ? acc.color : 'var(--ink-faint)';
    const isSelected = day.toDateString() === AppState.selectedPlanningDay.toDateString();
    const actCount = getActivitiesForDate(day).length;
    return `
      <button class="day-tab ${isSelected ? 'selected' : ''}"
        style="background:${isSelected ? color : 'var(--white)'};border-color:${isSelected ? color : 'var(--line)'}"
        onclick="selectPlanningDay('${day.toISOString()}')">
        <span class="mono" style="font-size:10px;font-weight:700;color:${isSelected ? 'rgba(255,255,255,.85)' : color}">D${dayNum}</span>
        <span style="font-family:var(--font-display);font-size:17px;font-weight:800;color:${isSelected ? 'white' : 'var(--ink)'};line-height:1.1">${day.getDate()}</span>
        <span class="mono" style="font-size:8px;color:${isSelected ? 'rgba(255,255,255,.55)' : 'var(--ink-faint)'}">${MONTHS[day.getMonth()]}</span>
        ${actCount > 0
          ? `<span style="width:16px;height:16px;background:${isSelected ? 'rgba(255,255,255,.3)' : color + '22'};border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;color:${isSelected ? 'white' : color};margin-top:2px">${actCount}</span>`
          : `<span style="width:16px;height:4px"></span>`}
      </button>`;
  }).join('');

  const selectedIdx = Math.floor((AppState.selectedPlanningDay - TRIP_START) / 86400000);
  setTimeout(() => { container.scrollLeft = Math.max(0, (selectedIdx - 2) * 66); }, 50);
}

function selectPlanningDay(isoString) {
  AppState.selectedPlanningDay = new Date(isoString);
  buildDayTabs();
  renderPlanningDay();
}

function renderPlanningDay() {
  const day = AppState.selectedPlanningDay;
  const dayNum = getDayNumber(day);
  const acc = getAccommodationForDate(day);

  document.getElementById('day-header').innerHTML = `
    <div style="background:${acc ? acc.color : 'var(--ink-faint)'};border-radius:10px;padding:4px 10px;display:flex;flex-direction:column;align-items:center;flex-shrink:0">
      <span class="mono" style="font-size:8px;color:rgba(255,255,255,.65);font-weight:700;letter-spacing:1px">DAG</span>
      <span style="font-family:var(--font-display);font-size:20px;font-weight:800;color:white;line-height:1">${dayNum}</span>
    </div>
    <div style="flex:1">
      <p class="row-title" style="font-size:15.5px">${WEEKDAYS[day.getDay()]} ${day.getDate()} ${MONTHS[day.getMonth()]}</p>
      ${acc
        ? `<div style="display:flex;align-items:center;gap:6px;margin-top:3px"><span style="width:8px;height:8px;border-radius:50%;background:${acc.color};flex-shrink:0"></span><span class="mono" style="color:${acc.color};font-weight:700">vanuit ${escapeHtml(acc.name)}</span></div>`
        : `<p class="mono" style="margin-top:3px">reisdag · onderweg</p>`}
    </div>
    ${acc ? renderElevationTag(acc.elevation, acc.color) : ''}
  `;

  let dayActivities = getActivitiesForDate(day);
  // Filter: alleen ingeplande (niet 'todo') als filter actief is
  if (planningFilter === 'planned') {
    dayActivities = dayActivities.filter(a => a.status !== 'todo');
  }

  // Onge-inplande activiteiten voor dit verblijf — alleen tonen als filter uit staat
  const unscheduled = (acc && planningFilter === 'all')
    ? getUnscheduledForAccommodation(acc.id)
    : [];

  const container = document.getElementById('planning-items');

  if (dayActivities.length === 0 && unscheduled.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="summit-tri" style="border-left:14px solid transparent;border-right:14px solid transparent;border-bottom:24px solid var(--line)"></span>
        <p class="row-title" style="font-size:18px;margin-top:16px">
          ${planningFilter === 'planned' ? 'Niets ingepland op deze dag' : 'Niets gepland'}
        </p>
        <p class="mono" style="margin-top:4px">Voeg toe via AI-ideeën of het + icoon</p>
        <button onclick="openAddActivitySheetForCurrentDay()" class="btn btn-primary" style="margin-top:20px;width:auto;padding:10px 20px">+ Activiteit</button>
      </div>`;
    return;
  }

  let html = '';

  if (dayActivities.length > 0) {
    html += `<div class="card" style="margin-bottom:16px;overflow:hidden">`;
    dayActivities.forEach((act, i) => {
      html += renderPlanningActivityRow(act, i, dayActivities.length);
    });
    html += `</div>`;
  }

  if (unscheduled.length > 0) {
    html += `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        <span class="eyebrow">Beschikbaar vanuit ${escapeHtml(acc.short)}</span>
        <span class="mono" style="font-size:10px;color:var(--ink-faint)">${unscheduled.length} activiteiten</span>
      </div>
      <div class="card" style="margin-bottom:16px;overflow:hidden">`;
    unscheduled.forEach((act, i) => {
      html += renderUnscheduledRow(act, i, unscheduled.length);
    });
    html += `</div>`;
  }

  container.innerHTML = html;
}

function renderPlanningActivityRow(act, index, total) {
  const acc = ACCOMMODATIONS.find(a => idsMatch(a.id, act.accId));
  if (!acc) return '';
  const isDone = act.status === 'done';
  const isLast = index === total - 1;
  return `
    <div class="activity-row" style="${isLast ? '' : 'border-bottom:1px solid var(--line-soft)'}">
      <div class="activity-band" style="background:${acc.color}"></div>
      <div class="activity-thumb" style="background:${isDone ? 'var(--paper-warm)' : acc.color + '18'};cursor:pointer" onclick="openActivityDetailSheet(${act.id})">${act.emoji}</div>
      <div style="flex:1;min-width:0;cursor:pointer" onclick="openActivityDetailSheet(${act.id})">
        <p class="row-title" style="${isDone ? 'color:var(--ink-faint);text-decoration:line-through' : ''};overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(act.name)}</p>
        <div style="display:flex;align-items:center;gap:8px;margin-top:2px">
          ${renderElevationTag(act.elevation, acc.color)}
          <span class="mono">· ${act.distance} · ${act.duration}</span>
        </div>
      </div>
      <button class="activity-check"
        style="border-color:${isDone ? acc.color : 'var(--line)'};background:${isDone ? acc.color : 'transparent'}"
        onclick="handleToggleActivity(${act.id})">
        ${isDone ? checkmarkSvg() : ''}
      </button>
    </div>`;
}

function renderUnscheduledRow(act, index, total) {
  const acc = ACCOMMODATIONS.find(a => idsMatch(a.id, act.accId));
  if (!acc) return '';
  const isLast = index === total - 1;
  return `
    <div class="activity-row" style="${isLast ? '' : 'border-bottom:1px solid var(--line-soft)'}">
      <div class="activity-band" style="background:${acc.color}40"></div>
      <div class="activity-thumb" style="background:${acc.color}12;cursor:pointer" onclick="openActivityDetailSheet(${act.id})">${act.emoji}</div>
      <div style="flex:1;min-width:0;cursor:pointer" onclick="openActivityDetailSheet(${act.id})">
        <p class="row-title" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(act.name)}</p>
        <p class="mono" style="margin-top:2px">${act.level} · tik voor details</p>
      </div>
      <button onclick="openMoveActivitySheet(${act.id})"
        style="font-size:11px;font-weight:700;padding:5px 10px;background:${acc.color}15;color:${acc.color};border:1.5px solid ${acc.color}40;border-radius:20px;cursor:pointer;white-space:nowrap;flex-shrink:0">
        Inplannen
      </button>
    </div>`;
}

// ── Activiteit detail — gebruikt de bestaande place-detail sheet ──
// Dit is de unified detailweergave die ook vanuit de kaart gebruikt wordt.
function openActivityDetailSheet(id) {
  const act = AppState.activities.find(a => a.id === id);
  if (!act) return;
  const acc = ACCOMMODATIONS.find(a => idsMatch(a.id, act.accId));
  if (!acc) return;

  // Gebruik de bestaande place-detail sheet (ook gebruikt door de kaart)
  // en voeg Planning-specifieke acties toe onderaan
  renderPdHero(act, acc);
  // Planning-context toont ook de inplanstatus, die de kaart-versie niet heeft
  const dateLabel = act.date
    ? `${WEEKDAYS[act.date.getDay()]} ${formatShortDate(act.date)}`
    : 'Nog niet ingepland';
  const metaEl = document.getElementById('pd-meta');
  if (metaEl) metaEl.innerHTML += `<span class="mono" style="background:rgba(255,255,255,0.16);color:white;padding:3px 9px;border-radius:20px;font-size:11px">${escapeHtml(dateLabel)}</span>`;

  const descEl = document.getElementById('pd-desc');
  if (descEl) descEl.textContent = act.desc || `Activiteit vanuit ${acc.name}.`;

  // Plan-knop: toon status
  const addBtn = document.getElementById('pd-add-btn');
  if (addBtn) {
    const isDone = act.status === 'done';
    addBtn.textContent = isDone ? '✓ Afgerond' : act.date ? '↺ Heropenen' : '+ Inplannen';
    addBtn.disabled = false;
    addBtn.onclick = () => { handleToggleActivity(id); closeSheet('sheet-place-detail'); };
  }

  // Route knop
  const routeBtn = document.getElementById('pd-route-btn');
  if (routeBtn && act.lat && act.lng) {
    routeBtn.style.display = 'flex';
    routeBtn.onclick = () => openMapsForCoords(act.lat, act.lng, act.name);
  } else if (routeBtn) {
    routeBtn.style.display = 'none';
  }

  // Extra acties voor planning-context
  const extraEl = document.getElementById('pd-extra-actions');
  if (extraEl) {
    extraEl.innerHTML = `
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px">
        <button onclick="closeSheet('sheet-place-detail');openMoveActivitySheet(${id})"
          style="flex:1;padding:10px;border-radius:11px;border:1.5px solid var(--line);background:white;font-size:12px;font-weight:700;text-transform:uppercase;color:var(--ink-mid);cursor:pointer">
          ↕ Verplaatsen
        </button>
        <button onclick="closeSheet('sheet-place-detail');openAiEnrichSheet(${id})"
          style="flex:1;padding:10px;border-radius:11px;border:1.5px solid var(--line);background:white;font-size:12px;font-weight:700;text-transform:uppercase;color:var(--ink-mid);cursor:pointer">
          ◎ AI-verrijking
        </button>
        <button onclick="handleDeleteActivity(${id})"
          style="flex:1;padding:10px;border-radius:11px;border:1.5px solid #dc2626;background:white;font-size:12px;font-weight:700;text-transform:uppercase;color:#dc2626;cursor:pointer">
          🗑 Verwijder
        </button>
      </div>`;
  }

  openSheet('sheet-place-detail');
}

// ── Activiteit verplaatsen ────────────────────────────────
function openMoveActivitySheet(id) {
  const act = AppState.activities.find(a => a.id === id);
  if (!act) return;

  document.getElementById('move-day-select').innerHTML =
    `<option value="">Niet ingepland</option>` +
    getAllTripDays().map((d, i) => {
      const iso = d.toISOString();
      const sel = act.date && act.date.toDateString() === d.toDateString() ? 'selected' : '';
      return `<option value="${iso}" ${sel}>Dag ${i+1} · ${WEEKDAYS[d.getDay()]} ${formatShortDate(d)}</option>`;
    }).join('');

  document.getElementById('move-acc-select').innerHTML = ACCOMMODATIONS.map(a =>
    `<option value="${a.id}" ${idsMatch(a.id, act.accId) ? 'selected' : ''}>${a.name} (${formatShortDate(a.checkIn)}–${formatShortDate(a.checkOut)})</option>`
  ).join('');

  document.getElementById('move-activity-title').textContent = act.name;
  document.getElementById('move-save-btn').onclick = () => saveMoveActivity(id);
  openSheet('sheet-move-activity');
}

async function saveMoveActivity(id) {
  const dateStr = document.getElementById('move-day-select').value;
  // FIX: accId is sinds Fase B altijd een string (Firestore-doc-ID/UUID),
  // parseInt() gaf hiervoor NaN voor elke reis behalve de Noorwegen-seed.
  const accId = document.getElementById('move-acc-select').value;
  await updateActivity(id, { date: dateStr ? new Date(dateStr) : null, accId });
  closeSheet('sheet-move-activity');
  showToast('✓ Activiteit verplaatst');
  renderPlanningScreen();
  renderHomeScreen();
}

// ── Activiteit verwijderen (met bevestiging) ──────────────
async function handleDeleteActivity(id) {
  const act = AppState.activities.find(a => a.id === id);
  if (!act) return;
  closeSheet('sheet-place-detail');

  if (!window._deleteConfirm || window._deleteConfirm !== id) {
    window._deleteConfirm = id;
    showToast(`Tik nogmaals op verwijderen om "${act.name}" te verwijderen`, 3000);
    return;
  }
  window._deleteConfirm = null;
  await deleteActivity(id);
  showToast(`🗑 ${act.name} verwijderd`);
  renderPlanningScreen();
  renderHomeScreen();
}

// ── AI-verrijking ─────────────────────────────────────────
async function openAiEnrichSheet(id) {
  const act = AppState.activities.find(a => a.id === id);
  if (!act) return;
  const acc = ACCOMMODATIONS.find(a => idsMatch(a.id, act.accId));

  document.getElementById('enrich-activity-title').textContent = act.name;
  document.getElementById('enrich-result').innerHTML = `
    <div class="empty-state" style="padding:24px 0">
      <div class="spinner" style="margin-bottom:12px"></div>
      <p class="mono">AI verrijkt "${escapeHtml(act.name)}"…</p>
    </div>`;
  openSheet('sheet-enrich-activity');

  try {
    const liveWeather = await getWeatherForDate(acc.lat, acc.lng, getToday());
    const response = await fetch('/api/suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accommodationName: acc.name,
        accommodationLocation: acc.address,
        country: 'Noorwegen',
        today: formatShortDate(getToday()),
        temperature: liveWeather ? liveWeather.temperature : 12,
        weatherCondition: liveWeather ? liveWeather.condition : 'bewolkt',
        rainProbability: liveWeather ? liveWeather.rainProbability : 20,
        userPreferences: Array.from(AppState.travelStyles),
        alreadyPlanned: [],
        language: 'nl',
        prompt: `Verrijk de activiteit "${act.name}" nabij ${acc.name} in Noorwegen. Geef als JSON array met 1 object: {"name":"${act.name}","description":"2-3 zinnen beschrijving","duration_minutes":getal,"distance_km":getal of null,"difficulty":"easy/medium/hard","why_recommended":"waarom de moeite waard","tips":["tip1","tip2"],"best_time":"beste tijd","komoot_search":"zoekterm"}`
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Onbekende fout');
    const enriched = (data.suggestions || [])[0];

    if (enriched) {
      document.getElementById('enrich-result').innerHTML = `
        <p style="font-size:13.5px;line-height:1.65;color:var(--ink-mid);margin-bottom:12px">${escapeHtml(enriched.description || '')}</p>
        ${enriched.tips && enriched.tips.length ? `
          <div style="background:var(--slope-light);border-radius:11px;padding:12px 14px;margin-bottom:12px">
            <p class="eyebrow" style="margin-bottom:8px">Tips</p>
            ${enriched.tips.map(t => `<p style="font-size:12.5px;color:var(--spruce);margin-bottom:5px">· ${escapeHtml(t)}</p>`).join('')}
          </div>` : ''}
        ${enriched.best_time ? `<p class="mono" style="margin-bottom:12px">⏰ ${escapeHtml(enriched.best_time)}</p>` : ''}
        <button onclick="applyAiEnrichment(${id}, ${JSON.stringify(enriched).replace(/"/g, '&quot;')})" class="btn btn-primary" style="margin-bottom:9px">✓ Opslaan</button>
        ${enriched.komoot_search ? `<a href="https://www.komoot.com/smart-tour?sport=hike&q=${encodeURIComponent(enriched.komoot_search)}" target="_blank" style="display:block;padding:13px;border-radius:13px;border:1.5px solid #6fbe6f;text-align:center;font-size:13px;font-weight:700;text-transform:uppercase;color:#3d8c3d;text-decoration:none">🗺 Bekijk op Komoot</a>` : ''}`;
    } else {
      document.getElementById('enrich-result').innerHTML = `<p class="mono" style="color:var(--summit)">Geen verrijking ontvangen</p>`;
    }
  } catch (err) {
    document.getElementById('enrich-result').innerHTML = `
      <p class="mono" style="color:var(--summit)">Fout: ${escapeHtml(err.message)}</p>
      <button onclick="openAiEnrichSheet(${id})" class="btn btn-outline" style="margin-top:12px">Opnieuw</button>`;
  }
}

async function applyAiEnrichment(id, enriched) {
  const changes = { desc: enriched.description || '' };
  if (enriched.duration_minutes) changes.duration = Math.round(enriched.duration_minutes / 60) + ' u';
  if (enriched.distance_km) changes.distance = enriched.distance_km + ' km';
  if (enriched.difficulty) changes.level = { easy: 'Makkelijk', medium: 'Gemiddeld', hard: 'Zwaar' }[enriched.difficulty] || enriched.difficulty;
  await updateActivity(id, changes);
  closeSheet('sheet-enrich-activity');
  showToast('✓ Activiteit verrijkt');
  renderPlanningScreen();
}

// ── Context-bewust formulier ──────────────────────────────
// Dag en verblijf worden automatisch ingevuld — je hoeft ze niet
// opnieuw in te voeren als je al op de juiste dag in Planning bent.
function openAddActivitySheetForCurrentDay() {
  const day = AppState.selectedPlanningDay || getToday();
  const acc = getAccommodationForDate(day) || getActiveAccommodation();

  document.getElementById('activity-day-select').innerHTML =
    `<option value="">Niet ingepland</option>` +
    getAllTripDays().map((d, i) => {
      const iso = d.toISOString();
      const isThis = d.toDateString() === day.toDateString();
      return `<option value="${iso}" ${isThis ? 'selected' : ''}>Dag ${i+1} · ${WEEKDAYS[d.getDay()]} ${formatShortDate(d)}</option>`;
    }).join('');

  document.getElementById('activity-acc-select').innerHTML = ACCOMMODATIONS.map(a =>
    `<option value="${a.id}" ${a.id === acc.id ? 'selected' : ''}>${a.name} (${formatShortDate(a.checkIn)}–${formatShortDate(a.checkOut)})</option>`
  ).join('');

  document.getElementById('activity-name-input').value = '';
  openSheet('sheet-activity');
}

function openAddActivitySheet() {
  openAddActivitySheetForCurrentDay();
}

async function saveActivity() {
  const name = document.getElementById('activity-name-input').value.trim();
  if (!name) { showToast('Voer een naam in'); return; }
  const dateStr = document.getElementById('activity-day-select').value;
  // FIX: accId is sinds Fase B altijd een string (Firestore-doc-ID/UUID).
  const accId = document.getElementById('activity-acc-select').value;
  const date = dateStr ? new Date(dateStr) : null;
  await addActivity({ name, accId, date });
  closeSheet('sheet-activity');
  showToast(`✓ ${name} toegevoegd`);
  if (date) AppState.selectedPlanningDay = date;
  renderPlanningScreen();
  renderHomeScreen();
}
