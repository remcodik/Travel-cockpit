// ═══════════════════════════════════════════════════════════
// screen-planning.js — Planning met CRUD en filter
// ═══════════════════════════════════════════════════════════

let planningFilter = 'all'; // 'all' | 'planned'

function renderPlanningScreen() {
  if (!AppState.selectedPlanningDay) AppState.selectedPlanningDay = getClosestTripDay();
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

    // Verplaatsdag: dit is zowel de check-out-datum van het vorige verblijf
    // als de check-in-datum van het volgende. Subtiel weergegeven: geen
    // gekleurd vlak, alleen de linkerrand in de kleur van het verblijf waar
    // je vandaan komt — de rest van de rand volgt gewoon de normale regel
    // hieronder (kleur van het verblijf waar de dag nu bij hoort).
    const prevAcc = ACCOMMODATIONS.find(a => a.checkOut.getTime() === day.getTime());
    const isChangeover = !!(prevAcc && acc && prevAcc.id !== acc.id);

    // Elke dag krijgt een subtiele randkleur van het bijbehorende verblijf,
    // ook als hij niet geselecteerd is — alleen de selectie zelf blijft een
    // gevuld vlak.
    return `
      <button class="day-tab ${isSelected ? 'selected' : ''}"
        style="background:${isSelected ? color : 'var(--white)'};border-color:${color};${isChangeover ? `border-left-color:${prevAcc.color};` : ''}"
        onclick="selectPlanningDay('${day.toISOString()}')"
        title="${isChangeover ? `Verplaatsdag: ${escapeHtml(prevAcc.name)} → ${escapeHtml(acc.name)}` : ''}">
        <span class="mono" style="font-size:10px;font-weight:700;color:${isSelected ? 'rgba(255,255,255,.85)' : color}">D${dayNum}</span>
        <span style="font-family:var(--font-display);font-size:17px;font-weight:800;color:${isSelected ? 'white' : 'var(--ink)'};line-height:1.1">${day.getDate()}</span>
        <span class="mono" style="font-size:8px;color:${isSelected ? 'rgba(255,255,255,.55)' : 'var(--ink-faint)'}">${MONTHS[day.getMonth()]}</span>
        ${isChangeover
          ? `<span style="font-size:10px;margin-top:2px;line-height:1">🚗</span>`
          : (actCount > 0
            ? `<span style="width:16px;height:16px;background:${isSelected ? 'rgba(255,255,255,.3)' : color + '22'};border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;color:${isSelected ? 'white' : color};margin-top:2px">${actCount}</span>`
            : `<span style="width:16px;height:4px"></span>`)}
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

  // Verplaatsdag: zelfde detectie als buildDayTabs() — deze dag is zowel de
  // check-out van het vorige verblijf als de check-in van het volgende.
  // Subtiel weergegeven: geen gekleurd vlak, alleen een linkerrand in de
  // kleur van het verblijf waar je vandaan komt (zelfde aanpak als de
  // dagtabs hierboven, i.p.v. de eerdere, te opvallende kleurverloop-vulling).
  const prevAcc = ACCOMMODATIONS.find(a => a.checkOut.getTime() === day.getTime());
  const isChangeover = !!(prevAcc && acc && prevAcc.id !== acc.id);
  const badgeBg = isChangeover ? 'var(--white)' : (acc ? acc.color : 'var(--ink-faint)');
  const badgeBorder = isChangeover ? `border:1.5px solid ${acc.color};border-left:3px solid ${prevAcc.color};` : '';
  const badgeTextColor = isChangeover ? 'var(--ink)' : 'white';
  const badgeLabelColor = isChangeover ? 'var(--ink-faint)' : 'rgba(255,255,255,.65)';

  document.getElementById('day-header').innerHTML = `
    <div style="background:${badgeBg};${badgeBorder}border-radius:10px;padding:4px 10px;display:flex;flex-direction:column;align-items:center;flex-shrink:0">
      <span class="mono" style="font-size:8px;color:${badgeLabelColor};font-weight:700;letter-spacing:1px">DAG</span>
      <span style="font-family:var(--font-display);font-size:20px;font-weight:800;color:${badgeTextColor};line-height:1">${dayNum}</span>
    </div>
    <div style="flex:1">
      <p class="row-title" style="font-size:15.5px">${WEEKDAYS[day.getDay()]} ${day.getDate()} ${MONTHS[day.getMonth()]}</p>
      ${isChangeover
        ? `<div style="display:flex;align-items:center;gap:6px;margin-top:3px">
             <span style="width:8px;height:8px;border-radius:50%;background:${prevAcc.color};flex-shrink:0"></span><span class="mono" style="color:${prevAcc.color};font-weight:700">${escapeHtml(prevAcc.name)}</span>
             <span class="mono" style="color:var(--ink-faint)">🚗</span>
             <span style="width:8px;height:8px;border-radius:50%;background:${acc.color};flex-shrink:0"></span><span class="mono" style="color:${acc.color};font-weight:700">${escapeHtml(acc.name)}</span>
           </div>`
        : (acc
          ? `<div style="display:flex;align-items:center;gap:6px;margin-top:3px"><span style="width:8px;height:8px;border-radius:50%;background:${acc.color};flex-shrink:0"></span><span class="mono" style="color:${acc.color};font-weight:700">vanuit ${escapeHtml(acc.name)}</span></div>`
          : `<p class="mono" style="margin-top:3px">reisdag · onderweg</p>`)}
    </div>
    ${acc ? renderElevationTag(acc.elevation, acc.color) : ''}
    <button onclick="openNoteScreen('day','${day.toISOString().slice(0,10)}','Dag ${dayNum} — ${day.getDate()} ${MONTHS[day.getMonth()]}')"
      style="width:32px;height:32px;border-radius:9px;border:1.5px solid var(--line);background:white;cursor:pointer;font-size:14px;color:var(--ink-faint);flex-shrink:0;display:flex;align-items:center;justify-content:center" title="Dagnotitie">✎</button>
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
      ${renderNoteButton('activity', act.id, act.name, acc.color)}
      ${act.lat && act.lng ? `<button onclick="event.stopPropagation();openMapsForCoords(${act.lat},${act.lng},'${escapeHtml(act.name).replace(/'/g, "\\'")}')" style="width:30px;height:30px;border-radius:8px;border:1.5px solid var(--water-light);background:var(--water-light);cursor:pointer;font-size:13px;color:var(--water);flex-shrink:0;display:flex;align-items:center;justify-content:center" title="Route">◈</button>` : ''}
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
      <button onclick="event.stopPropagation();openEditActivitySheet(${act.id})" class="edit-pencil-btn" title="Bewerken">✎</button>
      ${renderNoteButton('activity', act.id, act.name, acc.color)}
      <button onclick="event.stopPropagation();handleQuickSchedule(${act.id})" class="edit-only"
        style="font-size:11px;font-weight:700;padding:5px 10px;background:${acc.color}15;color:${acc.color};border:1.5px solid ${acc.color}40;border-radius:20px;cursor:pointer;white-space:nowrap;flex-shrink:0">
        Inplannen
      </button>
    </div>`;
}

// Zoekt restaurants/cafés rond een punt via Google Maps' nearby-zoekactie
// (zelfde aanpak als openGoogleMapsPlace() in js/charging.js).
function openNearbySearch(category, lat, lng, fallbackLabel) {
  const label = category === 'restaurant' ? 'restaurant' : 'café';
  // Coördinaten als bekend, anders de meegekregen naam/zoekopdracht als
  // tekst — AI-suggesties hebben zelden lat/lng, wel een bruikbare naam.
  const locationPart = (lat && lng) ? `${lat},${lng}` : (fallbackLabel || '');
  window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(label + ' near ' + locationPart)}`, '_blank');
}

// "Inplannen" op een niet-ingeplande activiteit vraagt niet meer via een
// sheet welke dag/verblijf — die zijn al bekend (de rij staat al onder
// de huidige dag/verblijf in Planning), dus meteen opslaan.
async function handleQuickSchedule(id) {
  const act = AppState.activities.find(a => a.id === id);
  if (!act) return;
  await updateActivity(id, { date: new Date(AppState.selectedPlanningDay) });
  showToast(`✓ ${act.name} ingepland`);
  renderPlanningScreen();
  renderHomeScreen();
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

  // "Waarom relevant" — AI-context die vroeger verloren ging zodra een
  // suggestie werd ingepland (zie FIX in handleAddSuggestion()).
  const whyEl = document.getElementById('pd-why');
  if (whyEl) {
    if (act.whyRecommended) {
      whyEl.textContent = `💡 ${act.whyRecommended}`;
      whyEl.style.display = 'block';
      if (descEl) descEl.style.marginBottom = '6px';
    } else {
      whyEl.style.display = 'none';
      if (descEl) descEl.style.marginBottom = '18px';
    }
  }

  // Plan-knop: toon status
  const addBtn = document.getElementById('pd-add-btn');
  if (addBtn) {
    const isDone = act.status === 'done';
    addBtn.textContent = isDone ? '✓ Afgerond' : act.date ? '↺ Heropenen' : '+ Inplannen';
    addBtn.disabled = false;
    addBtn.onclick = () => { handleToggleActivity(id); closeSheet('sheet-place-detail'); };
  }

  // Locatiereferentie voor Route/Komoot/nearby-links: coördinaten als die
  // bekend zijn, anders de meegekregen AI-zoekopdracht of gewoon de naam.
  // FIX: AI-suggesties hebben geen lat/lng (alleen een tekst-zoekopdracht),
  // dus deze knoppen bleven eerder altijd verborgen voor élke vanuit
  // Discover ingeplande activiteit — verreweg de meeste activiteiten.
  const locationQuery = act.googleMapsQuery || act.name;

  // Route knop — altijd tonen, er is altijd minstens een naam/tekst-
  // bestemming (openMapsForCoords() valt daar zelf al netjes op terug).
  const routeBtn = document.getElementById('pd-route-btn');
  if (routeBtn) {
    routeBtn.style.display = 'flex';
    routeBtn.onclick = () => openMapsForCoords(act.lat, act.lng, locationQuery);
  }

  // Snelkoppelingen: Komoot (alleen bij een wandeling), restaurant/café
  // in de buurt — altijd zolang er een naam/zoekopdracht is.
  const nearbyEl = document.getElementById('pd-nearby-links');
  if (nearbyEl) {
    const isWalk = act.emoji === CATEGORY_EMOJIS.activity;
    const safeQuery = escapeHtml(locationQuery).replace(/'/g, "\\'");
    nearbyEl.innerHTML = `
        ${isWalk ? `<a href="${komootSearchUrl(locationQuery)}" target="_blank"
          style="padding:7px 13px;border:1.5px solid var(--line);border-radius:20px;background:white;font-size:11px;font-weight:700;text-transform:uppercase;color:var(--ink-mid);text-decoration:none;display:inline-block">
          🥾 Komoot
        </a>` : ''}
        <button onclick="openNearbySearch('restaurant', ${act.lat || 0}, ${act.lng || 0}, '${safeQuery}')"
          style="padding:7px 13px;border:1.5px solid var(--line);border-radius:20px;background:white;font-size:11px;font-weight:700;text-transform:uppercase;color:var(--ink-mid);cursor:pointer">
          🍽️ Eten nabij
        </button>
        <button onclick="openNearbySearch('cafe', ${act.lat || 0}, ${act.lng || 0}, '${safeQuery}')"
          style="padding:7px 13px;border:1.5px solid var(--line);border-radius:20px;background:white;font-size:11px;font-weight:700;text-transform:uppercase;color:var(--ink-mid);cursor:pointer">
          ☕ Café nabij
        </button>`;
  }

  // Echt hoogteprofiel (geen zelfgebouwde grafiek — dat zou verzonnen data
  // zijn zonder een echt wandelpad). Als er een Komoot-routelink is
  // opgeslagen, embedden we Komoot's eigen officiële widget met het echte
  // altitude-profiel van die tour (support.komoot.com iframe-embed,
  // embed?profile=1). Zonder link: gewoon niets, de Komoot-zoekknop hierboven
  // blijft de manier om alsnog een route te vinden.
  const elevationEl = document.getElementById('pd-elevation-embed');
  if (elevationEl) {
    const tourId = extractKomootTourId(act.komootTourUrl);
    if (tourId) {
      elevationEl.style.display = 'block';
      elevationEl.innerHTML = `<iframe src="https://www.komoot.com/tour/${tourId}/embed?profile=1" width="100%" height="220" frameborder="0" scrolling="no" title="Hoogteprofiel op Komoot"></iframe>`;
    } else {
      elevationEl.style.display = 'none';
      elevationEl.innerHTML = '';
    }
  }

  // Extra acties voor planning-context
  const extraEl = document.getElementById('pd-extra-actions');
  if (extraEl) {
    extraEl.innerHTML = `
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px">
        <button onclick="closeSheet('sheet-place-detail');openMoveActivitySheet(${id})" class="edit-only"
          style="flex:1;padding:10px;border-radius:11px;border:1.5px solid var(--line);background:white;font-size:12px;font-weight:700;text-transform:uppercase;color:var(--ink-mid);cursor:pointer">
          ↕ Verplaatsen
        </button>
        <button onclick="closeSheet('sheet-place-detail');openAiEnrichSheet(${id})" class="edit-only"
          style="flex:1;padding:10px;border-radius:11px;border:1.5px solid var(--line);background:white;font-size:12px;font-weight:700;text-transform:uppercase;color:var(--ink-mid);cursor:pointer">
          ◎ AI-verrijking
        </button>
        <button onclick="handleDeleteActivity(${id})" class="edit-only"
          style="flex:1;padding:10px;border-radius:11px;border:1.5px solid #dc2626;background:white;font-size:12px;font-weight:700;text-transform:uppercase;color:#dc2626;cursor:pointer">
          🗑 Verwijder
        </button>
      </div>`;
  }

  openSheet('sheet-place-detail');
}

// ── Activiteit bewerken (Fase E) ───────────────────────────
function openEditActivitySheet(id) {
  const act = AppState.activities.find(a => a.id === id);
  if (!act) return;
  document.getElementById('edit-activity-name-input').value = act.name;
  document.getElementById('edit-activity-desc-input').value = act.desc || '';
  document.getElementById('edit-activity-distance-input').value = act.distance && act.distance !== '—' ? act.distance : '';
  document.getElementById('edit-activity-duration-input').value = act.duration && act.duration !== '—' ? act.duration : '';
  document.getElementById('edit-activity-elevation-input').value = act.elevation || '';
  document.getElementById('edit-activity-level-select').value = act.level && act.level !== '—' ? act.level : 'Makkelijk';
  document.getElementById('edit-activity-komoot-input').value = act.komootTourUrl || '';
  document.getElementById('edit-activity-save-btn').onclick = () => saveActivityEdit(id);
  openSheet('sheet-edit-activity');
}

async function saveActivityEdit(id) {
  const name = document.getElementById('edit-activity-name-input').value.trim();
  if (!name) { showToast('Voer een naam in'); return; }
  const desc = document.getElementById('edit-activity-desc-input').value.trim();
  const distance = document.getElementById('edit-activity-distance-input').value.trim();
  const duration = document.getElementById('edit-activity-duration-input').value.trim();
  const elevation = parseInt(document.getElementById('edit-activity-elevation-input').value, 10) || 0;
  const level = document.getElementById('edit-activity-level-select').value;
  const komootTourUrl = document.getElementById('edit-activity-komoot-input').value.trim();
  await updateActivity(id, {
    name, desc, distance: distance || '—', duration: duration || '—', elevation, level, komootTourUrl,
  });
  closeSheet('sheet-edit-activity');
  showToast('✓ Activiteit bijgewerkt');
  renderPlanningScreen();
  renderHomeScreen();
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

  // FIX: het sheet sloot voorheen meteen bij de eerste tik, vóór de
  // dubbel-tik-bevestiging — de "tik nogmaals"-knop was daarmee al
  // verdwenen, dus je moest de activiteit opnieuw openen om te
  // bevestigen. Sheet blijft nu open totdat er echt verwijderd wordt.
  if (!window._deleteConfirm || window._deleteConfirm !== id) {
    window._deleteConfirm = id;
    showToast(`Tik nogmaals op verwijderen om "${act.name}" te verwijderen`, 3000);
    return;
  }
  window._deleteConfirm = null;
  closeSheet('sheet-place-detail');
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
        ${enriched.komoot_search ? `<a href="${komootSearchUrl(enriched.komoot_search)}" target="_blank" style="display:block;padding:13px;border-radius:13px;border:1.5px solid #6fbe6f;text-align:center;font-size:13px;font-weight:700;text-transform:uppercase;color:#3d8c3d;text-decoration:none">🗺 Bekijk op Komoot</a>` : ''}`;
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
  const day = AppState.selectedPlanningDay || getClosestTripDay();
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
  resetActivityFormExtras();
  updateActivityDayBadge();
  selectedActivityCategory = 'activity';
  document.querySelectorAll('#activity-category-chips .chip').forEach((c, i) => c.classList.toggle('on', i === 0));
  openSheet('sheet-activity');
}

// Reisdag-icoon naast de dag-keuze in "Activiteit toevoegen" — toont het
// dagnummer in de kleur van het verblijf dat op die dag actief is, zodat je
// meteen ziet welke reisdag/verblijf je kiest i.p.v. alleen platte tekst
// in de dropdown.
function updateActivityDayBadge() {
  const badge = document.getElementById('activity-day-badge');
  const sel = document.getElementById('activity-day-select');
  if (!badge || !sel) return;
  if (!sel.value) {
    badge.textContent = '—';
    badge.style.background = 'var(--ink-faint)';
    return;
  }
  const day = new Date(sel.value);
  const dayAcc = getAccommodationForDate(day);
  badge.textContent = `D${getDayNumber(day)}`;
  badge.style.background = dayAcc ? dayAcc.color : 'var(--ink-faint)';
}

function openAddActivitySheet() {
  openAddActivitySheetForCurrentDay();
}

// Wandelinfo-velden (optioneel, zie sheet-activity) — leeg bij elk nieuw
// formulier, zodat de afstand/duur van de vorige activiteit niet blijft
// hangen.
function resetActivityFormExtras() {
  document.getElementById('activity-distance-input').value = '';
  document.getElementById('activity-duration-input').value = '';
  document.getElementById('activity-elevation-input').value = '';
  document.getElementById('activity-level-select').value = 'Makkelijk';
  document.getElementById('activity-komoot-input').value = '';
}

// Soort bepaalt het icoon — zelfde iconenset als Discover, zodat een
// handmatig toegevoegde activiteit er niet anders uitziet dan een
// vanuit AI-suggesties ingeplande (CATEGORY_EMOJIS in js/data.js).
let selectedActivityCategory = 'activity';
function setActivityCategory(chipEl, category) {
  selectedActivityCategory = category;
  document.querySelectorAll('#activity-category-chips .chip').forEach(c => c.classList.remove('on'));
  chipEl.classList.add('on');
}

async function saveActivity() {
  const name = document.getElementById('activity-name-input').value.trim();
  if (!name) { showToast('Voer een naam in'); return; }
  const dateStr = document.getElementById('activity-day-select').value;
  // FIX: accId is sinds Fase B altijd een string (Firestore-doc-ID/UUID).
  const accId = document.getElementById('activity-acc-select').value;
  const date = dateStr ? new Date(dateStr) : null;
  const emoji = CATEGORY_EMOJIS[selectedActivityCategory] || CATEGORY_EMOJIS.default;
  const distance = document.getElementById('activity-distance-input').value.trim();
  const duration = document.getElementById('activity-duration-input').value.trim();
  const elevation = parseInt(document.getElementById('activity-elevation-input').value, 10) || 0;
  const level = document.getElementById('activity-level-select').value;
  const komootTourUrl = document.getElementById('activity-komoot-input').value.trim();
  await addActivity({ name, accId, date, emoji, distance: distance || '—', duration: duration || '—', elevation, level, komootTourUrl });
  closeSheet('sheet-activity');
  showToast(`✓ ${name} toegevoegd`);
  if (date) AppState.selectedPlanningDay = date;
  renderPlanningScreen();
  renderHomeScreen();
  if (document.getElementById('screen-accommodation').classList.contains('active')) {
    renderAccommodationScreen(AppState.viewingAccommodationId);
  }
}
