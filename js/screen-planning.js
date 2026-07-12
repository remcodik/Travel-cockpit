// ═══════════════════════════════════════════════════════════
// screen-planning.js — Planning met CRUD en filter
// ═══════════════════════════════════════════════════════════

let planningFilter = 'all'; // 'all' | 'planned'

// Wie je "vandaan komt" op een verplaatsdag — normaliter het verblijf dat
// exact op deze dag uitcheckt. Op de allereerste reisdag zelf checkt er
// per definitie niemand uit (er is nog geen vorig verblijf), maar als er
// die dag al wél een écht verblijf begint (bv. een overnachting op de
// ferry op dag 1), vertrek je feitelijk vanuit Thuis — net zoals de
// laatste reisdag al "Kolding → Thuis" toont zodra je daar vandaan naar
// huis gaat.
function getChangeoverPrevAcc(day, acc) {
  const real = ACCOMMODATIONS.find(a => a.checkOut.getTime() === day.getTime());
  if (real) return real;
  if (day.getTime() === TRIP_START.getTime() && acc && !acc.isHome) return HOME_PSEUDO_ACC;
  return null;
}

function renderPlanningScreen() {
  if (!AppState.selectedPlanningDay) AppState.selectedPlanningDay = getClosestTripDay();
  buildDayTabs();
  renderPlanningDay();
  initPlanningSwipeIfNeeded();
}

// Door de dagen heen swipen (horizontaal) op de daginhoud, als alternatief
// voor het aantikken van een dagtab. Eenmalig gebonden (niet bij elke
// render opnieuw) — de listener zelf leest bij elke swipe de actuele
// geselecteerde dag uit AppState, dus hoeft niet opnieuw gebonden te worden.
let planningSwipeInitialized = false;
function initPlanningSwipeIfNeeded() {
  if (planningSwipeInitialized) return;
  const el = document.querySelector('#screen-planning .scroll');
  if (!el) return;
  planningSwipeInitialized = true;

  let startX = 0, startY = 0, tracking = false;
  const SWIPE_THRESHOLD = 60; // px — voorkomt dat een gewone tik of verticale scroll als swipe telt

  el.addEventListener('touchstart', e => {
    if (e.touches.length !== 1) return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    tracking = true;
  }, { passive: true });

  el.addEventListener('touchend', e => {
    if (!tracking) return;
    tracking = false;
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    // Alleen als de beweging overwegend horizontaal is — anders zou
    // gewoon verticaal scrollen door de activiteitenlijst per ongeluk
    // ook de dag laten verspringen.
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy) * 1.5) {
      goToAdjacentPlanningDay(dx < 0 ? 1 : -1);
    }
  }, { passive: true });
}

function goToAdjacentPlanningDay(offset) {
  const next = new Date(AppState.selectedPlanningDay);
  next.setDate(next.getDate() + offset);
  if (next < TRIP_START || next > TRIP_END) return; // niet buiten het reisvenster
  selectPlanningDay(next.toISOString());
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
    const acc = getAccommodationOrHomeForDate(day);
    const color = acc ? acc.color : 'var(--ink-faint)';
    const isSelected = day.toDateString() === AppState.selectedPlanningDay.toDateString();
    const actCount = getActivitiesForDate(day).length;

    // Verplaatsdag: dit is zowel de check-out-datum van het vorige verblijf
    // als de check-in-datum van het volgende. Subtiel weergegeven: geen
    // gekleurd vlak, alleen de linkerrand in de kleur van het verblijf waar
    // je vandaan komt — de rest van de rand volgt gewoon de normale regel
    // hieronder (kleur van het verblijf waar de dag nu bij hoort).
    const prevAcc = getChangeoverPrevAcc(day, acc);
    // FIX: de eerste en laatste reisdag (vóór het eerste verblijf / ná het
    // laatste, "Thuis" — zie docs/10-issues/14-thuis-reisdag-randen.md) zijn
    // net zo goed reisdagen als een verplaatsdag tussen twee verblijven,
    // maar kregen alleen het 🚗-icoon als er toevallig een verblijf exact op
    // die dag uitcheckte. Elke "Thuis"-dag toont nu altijd het icoon.
    const isHomeDay = !!(acc && acc.isHome);
    // FIX (vervolg): ook de allereerste/-laatste kalenderdag van de reis
    // zélf is altijd een reisdag, ook als die dag toevallig al door een
    // écht verblijf gedekt wordt (bv. een overnachting op de ferry op dag
    // 1) — dan gold de dag voorheen als een gewone verblijfsdag zonder
    // icoon, terwijl je feitelijk nog aan het reizen bent.
    const isTripBoundaryDay = day.getTime() === TRIP_START.getTime() || day.getTime() === TRIP_END.getTime();
    const hasTwoToneBorder = !!(prevAcc && acc && prevAcc.id !== acc.id);
    const isChangeover = isHomeDay || isTripBoundaryDay || hasTwoToneBorder;

    // Elke dag krijgt een subtiele randkleur van het bijbehorende verblijf,
    // ook als hij niet geselecteerd is — alleen de selectie zelf blijft een
    // gevuld vlak.
    return `
      <button class="day-tab ${isSelected ? 'selected' : ''}"
        style="background:${isSelected ? color : 'var(--white)'};border-color:${color};${hasTwoToneBorder ? `border-left-color:${prevAcc.color};` : ''}"
        onclick="selectPlanningDay('${day.toISOString()}')"
        title="${hasTwoToneBorder ? `Verplaatsdag: ${escapeHtml(prevAcc.name)} → ${escapeHtml(acc.name)}` : ((isHomeDay || isTripBoundaryDay) ? 'Reisdag' : '')}">
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
  const acc = getAccommodationOrHomeForDate(day);

  // Verplaatsdag: zelfde detectie als buildDayTabs() — deze dag is zowel de
  // check-out van het vorige verblijf als de check-in van het volgende.
  // Subtiel weergegeven: geen gekleurd vlak, alleen een linkerrand in de
  // kleur van het verblijf waar je vandaan komt (zelfde aanpak als de
  // dagtabs hierboven, i.p.v. de eerdere, te opvallende kleurverloop-vulling).
  const prevAcc = getChangeoverPrevAcc(day, acc);
  // FIX: de eerste/laatste reisdag ("Thuis", vóór het eerste verblijf of ná
  // het laatste) kreeg alleen het 🚗-icoon als er toevallig een verblijf
  // exact op die dag uitcheckte — anders gewoon een stille "vanuit Thuis".
  // Zo'n dag is net zo goed een reisdag, dus toont nu altijd het icoon.
  const isHomeDay = !!(acc && acc.isHome);
  // FIX (vervolg): ook de allereerste/-laatste kalenderdag van de reis zélf
  // is altijd een reisdag, ook als die dag toevallig al door een écht
  // verblijf gedekt wordt (bv. een overnachting op de ferry op dag 1).
  const isTripBoundaryDay = day.getTime() === TRIP_START.getTime() || day.getTime() === TRIP_END.getTime();
  const hasTwoToneBorder = !!(prevAcc && acc && prevAcc.id !== acc.id);
  const badgeBg = hasTwoToneBorder ? 'var(--white)' : (acc ? acc.color : 'var(--ink-faint)');
  const badgeBorder = hasTwoToneBorder ? `border:5px solid ${acc.color};border-left:7px solid ${prevAcc.color};` : '';
  const badgeTextColor = hasTwoToneBorder ? 'var(--ink)' : 'white';
  const badgeLabelColor = hasTwoToneBorder ? 'var(--ink-faint)' : 'rgba(255,255,255,.65)';

  document.getElementById('day-header').innerHTML = `
    <div style="background:${badgeBg};${badgeBorder}border-radius:10px;padding:4px 10px;display:flex;flex-direction:column;align-items:center;flex-shrink:0">
      <span class="mono" style="font-size:8px;color:${badgeLabelColor};font-weight:700;letter-spacing:1px">DAG</span>
      <span style="font-family:var(--font-display);font-size:20px;font-weight:800;color:${badgeTextColor};line-height:1">${dayNum}</span>
    </div>
    <div style="flex:1">
      <p class="row-title" style="font-size:15.5px">${WEEKDAYS[day.getDay()]} ${day.getDate()} ${MONTHS[day.getMonth()]}</p>
      ${hasTwoToneBorder
        ? `<div style="display:flex;align-items:center;gap:6px;margin-top:3px">
             <span style="width:8px;height:8px;border-radius:50%;background:${prevAcc.color};flex-shrink:0"></span><span class="mono" style="color:${prevAcc.color};font-weight:700">${escapeHtml(prevAcc.name)}</span>
             <span class="mono" style="color:var(--ink-faint)">🚗</span>
             <span style="width:8px;height:8px;border-radius:50%;background:${acc.color};flex-shrink:0"></span><span class="mono" style="color:${acc.color};font-weight:700">${escapeHtml(acc.name)}</span>
           </div>`
        : (acc
          ? `<div style="display:flex;align-items:center;gap:6px;margin-top:3px">${(isHomeDay || isTripBoundaryDay) ? `<span class="mono">🚗</span>` : `<span style="width:8px;height:8px;border-radius:50%;background:${acc.color};flex-shrink:0"></span>`}<span class="mono" style="color:${acc.color};font-weight:700">${isHomeDay ? 'Reisdag' : (isTripBoundaryDay ? 'Reisdag · vanuit ' + escapeHtml(acc.name) : 'vanuit ' + escapeHtml(acc.name))}</span></div>`
          : `<p class="mono" style="margin-top:3px">reisdag · onderweg</p>`)}
    </div>
    ${acc && !acc.isHome ? renderElevationTag(acc.elevation, acc.color) : ''}
    <button onclick="openNoteScreen('day','${day.toISOString().slice(0,10)}','Dag ${dayNum} — ${day.getDate()} ${MONTHS[day.getMonth()]}')"
      style="width:32px;height:32px;border-radius:9px;border:1.5px solid var(--line);background:white;cursor:pointer;font-size:14px;color:var(--ink-faint);flex-shrink:0;display:flex;align-items:center;justify-content:center" title="Dagnotitie">✎</button>
  `;

  // FIX: dayActivities bevat door getActivitiesForDate() altijd al alleen
  // activiteiten met een datum die op deze dag valt — dus per definitie
  // "ingepland". Er stond hier voorheen ook nog een filter op
  // `status !== 'todo'`, die legacy 'todo'-activiteiten (zie updateActivity()
  // hierboven) onterecht liet verdwijnen zodra ze via "+ Inplannen" alsnog
  // een datum kregen zonder dat hun status meeveranderde — het
  // "Ingepland"-filter hoort alleen de niet-ingeplande "Beschikbaar vanuit
  // X"-lijst hieronder te verbergen, niet dayActivities zelf.
  const dayActivities = getActivitiesForDate(day);

  // Onge-inplande activiteiten voor dit verblijf — alleen tonen als filter uit staat
  const unscheduled = (acc && planningFilter === 'all')
    ? getUnscheduledForAccommodation(acc.id)
    : [];

  const container = document.getElementById('planning-items');

  if (dayActivities.length === 0 && unscheduled.length === 0) {
    // FIX: had hier een eigen "+ Activiteit"-knop, bovenop de altijd
    // aanwezige "+ Activiteit toevoegen"-knop onderaan het scherm (buiten
    // deze container) — twee knoppen voor dezelfde actie tegelijk zichtbaar.
    // Die onderste knop blijft de enige, consistente plek, ook als de dag
    // leeg is.
    container.innerHTML = `
      <div class="empty-state">
        <span class="summit-tri" style="border-left:14px solid transparent;border-right:14px solid transparent;border-bottom:24px solid var(--line)"></span>
        <p class="row-title" style="font-size:18px;margin-top:16px">
          ${planningFilter === 'planned' ? 'Niets ingepland op deze dag' : 'Niets gepland'}
        </p>
        <p class="mono" style="margin-top:4px">Voeg toe via AI-ideeën of hieronder</p>
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
  const descText = act.desc || `Activiteit vanuit ${acc.name}.`;
  if (descEl) {
    descEl.textContent = descText;
    descEl.onclick = () => openTextViewer(act.name, descText, null, act.photoUrl);
  }
  // "Groter lezen"-hint alleen tonen bij tekst die ook echt baat heeft bij
  // een groter scherm — niet bij de korte placeholderzin hierboven.
  const descHintEl = document.getElementById('pd-desc-hint');
  if (descHintEl) {
    descHintEl.style.display = (act.desc && act.desc.length > 80) ? 'block' : 'none';
    descHintEl.onclick = () => openTextViewer(act.name, descText, null, act.photoUrl);
  }

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

  // Zichtbaar maken of deze activiteit een pin op Kaart heeft en waarom
  // (niet) — voorheen puur onzichtbare achtergrondstaat (lat/lng,
  // locationVerifiedV2), onmogelijk te controleren zonder in de broncode
  // te kijken. Zo kan een gebruiker het zelf zien i.p.v. te moeten gokken
  // of de automatische opzoekactie nog moet lopen of al iets opleverde.
  const locationStatusEl = document.getElementById('pd-location-status');
  if (locationStatusEl) {
    if (isValidLatLng(act.lat, act.lng)) {
      locationStatusEl.textContent = `📍 ${act.lat.toFixed(4)}°N ${act.lng.toFixed(4)}°E — staat op Kaart`;
      locationStatusEl.style.color = 'var(--ink-faint)';
    } else if (act.locationVerifiedV2) {
      locationStatusEl.textContent = '📍 Geen locatie gevonden voor deze naam — staat niet op Kaart';
      locationStatusEl.style.color = 'var(--summit)';
    } else {
      locationStatusEl.textContent = '📍 Locatie nog niet opgezocht — staat nog niet op Kaart';
      locationStatusEl.style.color = 'var(--ink-faint)';
    }
    locationStatusEl.style.display = 'block';
  }

  // Plan-knop: alleen nog relevant om een datum toe te kennen aan een
  // niet-ingeplande activiteit. Afronden/Heropenen is hier weggehaald —
  // dat kon via deze knop (bij een wél ingeplande activiteit) altijd al
  // dubbelop met het vinkje op de Planning-rij zelf, en staat voortaan in
  // Bewerken (minder drukte in dit eerste scherm). Route neemt de volle
  // breedte over zodra dit vakje verborgen is (flex-sibling zonder display).
  const addBtn = document.getElementById('pd-add-btn');
  if (addBtn) {
    if (!act.date) {
      addBtn.style.display = '';
      addBtn.disabled = false;
      addBtn.textContent = '+ Inplannen';
      addBtn.onclick = () => { handleQuickSchedule(id); closeSheet('sheet-place-detail'); };
    } else {
      addBtn.style.display = 'none';
    }
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

  // Snelkoppelingen: Komoot (alleen bij een wandeling), en "X nabij"-knoppen
  // voor categorieën die zinnig zijn — een restaurant hoeft zichzelf niet
  // in de buurt te zoeken, zie CATEGORY_META.nearbyCategories (js/data.js).
  const nearbyEl = document.getElementById('pd-nearby-links');
  if (nearbyEl) {
    const meta = categoryMetaForActivity(act);
    const safeQuery = escapeHtml(locationQuery).replace(/'/g, "\\'");
    // Alleen een echte http(s)-link tonen — nooit een javascript:-achtige
    // waarde als href gebruiken.
    const hasSafeLink = act.link && /^https?:\/\//i.test(act.link);
    // FIX: dit gebruikte altijd een automatisch gegenereerde Komoot-
    // zoekopdracht, ook als er al een echte, door de gebruiker opgeslagen
    // Komoot-routelink (act.komootTourUrl) was — die link zelf kwam dan
    // nergens als klikbare link terecht, alleen (best-effort en niet altijd
    // matchend) als bron voor het hoogteprofiel-embed hieronder. Nu wint de
    // eigen link altijd, zoekopdracht blijft de terugval zonder eigen link.
    const hasSafeKomootLink = act.komootTourUrl && /^https?:\/\//i.test(act.komootTourUrl);
    const komootHref = hasSafeKomootLink ? act.komootTourUrl : komootSearchUrl(locationQuery);
    nearbyEl.innerHTML = `
        ${hasSafeLink ? `<a href="${escapeHtml(act.link)}" target="_blank"
          style="padding:7px 14px;border:1.5px solid var(--spruce);border-radius:20px;background:var(--spruce);font-size:11px;font-weight:700;text-transform:uppercase;color:white;text-decoration:none;display:inline-block">
          🔗 Link
        </a>` : ''}
        ${meta.isHike ? `<a href="${escapeHtml(komootHref)}" target="_blank"
          style="padding:7px 13px;border:1.5px solid var(--line);border-radius:20px;background:white;font-size:11px;font-weight:700;text-transform:uppercase;color:var(--ink-mid);text-decoration:none;display:inline-block">
          🥾 Komoot
        </a>` : ''}
        ${meta.nearbyCategories.map(cat => `
        <button onclick="openNearbySearch('${cat}', ${act.lat || 0}, ${act.lng || 0}, '${safeQuery}')"
          style="padding:7px 13px;border:1.5px solid var(--line);border-radius:20px;background:white;font-size:11px;font-weight:700;text-transform:uppercase;color:var(--ink-mid);cursor:pointer">
          ${NEARBY_BUTTON_META[cat].emoji} ${NEARBY_BUTTON_META[cat].label}
        </button>`).join('')}`;
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
    // Ticket dat aan déze activiteit gekoppeld is (optioneel veld, zie
    // sheet-ticket) — alleen tonen als er echt een gekoppeld is, anders
    // blijft de knop weg i.p.v. een dooie/lege actie te tonen.
    const linkedTicket = AppState.tickets.find(t => idsMatch(t.activityId, id));
    const actionBtnStyle = 'flex:1;padding:10px;border-radius:11px;border:1.5px solid var(--line);background:white;font-size:12px;font-weight:700;text-transform:uppercase;color:var(--ink-mid);cursor:pointer';
    // FIX (betere indeling): dit was één lange, wrappende rij van 5-7
    // knoppen door elkaar (inclusief Verwijder/AI-verrijking, die zelden
    // per ongeluk aangetikt moeten worden). Nu in duidelijke rijen: de
    // twee meest gebruikte acties bovenaan, "uit planning halen" direct
    // naast Verplaatsen (voorheen alleen één laag dieper, in dat sheet
    // zelf, te vinden) i.p.v. pas via Bewerken. Verwijder en AI-verrijking
    // staan voortaan in Bewerken — bewuster te bereiken, minder drukte
    // hier. Afronden/Heropenen stond hier ook al dubbelop met het vinkje
    // op de Planning-rij zelf, en staat nu ook in Bewerken.
    extraEl.innerHTML = `
      <div style="display:flex;gap:8px;margin-top:4px;margin-bottom:8px">
        <button id="pd-note-btn" onclick="closeSheet('sheet-place-detail');openNoteScreen('activity',${id},'${escapeHtml(act.name).replace(/'/g, "\\'")}')"
          style="${actionBtnStyle}">✎ Notitie</button>
        <button onclick="closeSheet('sheet-place-detail');openEditActivitySheet(${id})" class="edit-only"
          style="${actionBtnStyle}">✎ Bewerken</button>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:8px" class="edit-only">
        <button onclick="closeSheet('sheet-place-detail');openMoveActivitySheet(${id})" class="edit-only"
          style="${actionBtnStyle}">↕ Verplaatsen</button>
        ${act.date ? `
        <button onclick="handleQuickUnschedule(${id})" class="edit-only"
          style="${actionBtnStyle}">↩ Uit planning</button>` : ''}
      </div>
      ${(linkedTicket || !isValidLatLng(act.lat, act.lng)) ? `
      <div style="display:flex;gap:8px;margin-bottom:8px">
        ${linkedTicket ? `
        <button onclick="closeSheet('sheet-place-detail');navigateTo('tickets');openEditTicketSheet('${linkedTicket.id}')"
          style="${actionBtnStyle}">🎟️ Ticket</button>` : ''}
        ${!isValidLatLng(act.lat, act.lng) ? `
        <button id="pd-retry-location-btn" onclick="handleRetryActivityLocation(${id})" class="edit-only"
          style="${actionBtnStyle}">🔍 Locatie zoeken</button>` : ''}
      </div>` : ''}`;

    // Toont of er al een notitie bestaat, zelfde patroon als de
    // notitie-knop op het accommodatiescherm (acc-note-btn).
    const pdNoteBtn = document.getElementById('pd-note-btn');
    dbLoadNote('activity', id).then(text => {
      if (!pdNoteBtn) return;
      pdNoteBtn.style.color = text ? 'var(--spruce)' : 'var(--ink-mid)';
      pdNoteBtn.style.borderColor = text ? 'var(--spruce)' : 'var(--line)';
    });
  }

  openSheet('sheet-place-detail');
}

// Directe, zichtbare locatie-opzoekpoging voor één activiteit — i.p.v. te
// moeten wachten op (en te moeten vertrouwen op) de onzichtbare
// achtergrondmigratie in startFirebaseSync(). Toont meteen succes/falen via
// een toast, zodat duidelijk is of Nominatim deze naam simpelweg niet kent
// (geen bug, een grens van automatisch zoeken) i.p.v. dat het overkomt als
// "de app doet het niet".
async function handleRetryActivityLocation(id) {
  const act = AppState.activities.find(a => a.id === id);
  if (!act) return;
  showToast('Locatie zoeken…', 4000);
  const country = getActiveTrip()?.country || '';
  const query = act.googleMapsQuery || act.name;
  const coords = await geocodeAddress(country ? `${query}, ${country}` : query);
  act.locationVerifiedV2 = true;
  if (coords) {
    act.lat = coords.lat;
    act.lng = coords.lng;
    await dbSaveActivity(act);
    showToast(`✓ Locatie gevonden: ${coords.displayName || act.name}`);
    if (document.getElementById('screen-map').classList.contains('active')) renderMapMarkers();
  } else {
    await dbSaveActivity(act);
    showToast('Geen locatie gevonden voor deze naam');
  }
  openActivityDetailSheet(id);
}

// Zelfde Google Maps-link-extractie als bij een verblijf
// (extractLatLngFromMapsUrl()/js/screen-accommodation.js, inclusief de
// server-side fallback in api/geocode.js voor verkorte maps.app.goo.gl-
// links) — hier voor het bewerkformulier van een activiteit i.p.v. een
// verblijf, voor als Nominatim de naam zelf niet kan vinden maar je wél
// een Maps-link hebt (bv. gedeeld vanuit de Maps-app zelf).
async function handleExtractActivityLocationFromMapsLink() {
  const url = document.getElementById('edit-activity-maps-link-input').value.trim();
  if (!url) { showToast('Plak eerst een Google Maps-link'); return; }

  const coords = extractLatLngFromMapsUrl(url);
  if (coords) {
    document.getElementById('edit-activity-lat-input').value = coords.lat;
    document.getElementById('edit-activity-lng-input').value = coords.lng;
    showToast('✓ Locatie overgenomen uit Maps-link');
    return;
  }
  if (url.includes('goo.gl')) {
    showToast('Verkorte link — bezig met opzoeken…', 6000);
    try {
      const resp = await fetch(`/api/geocode?mapsUrl=${encodeURIComponent(url)}`);
      const data = await resp.json();
      if (data && data.found && Number.isFinite(data.lat) && Number.isFinite(data.lng)) {
        document.getElementById('edit-activity-lat-input').value = data.lat;
        document.getElementById('edit-activity-lng-input').value = data.lng;
        showToast('✓ Locatie overgenomen uit Maps-link');
        return;
      }
    } catch { /* netwerkfout — val door naar de foutmelding hieronder */ }
    showToast('Kon deze verkorte link niet oplossen — open de link eerst in een browser en kopieer de volledige link');
    return;
  }
  showToast('Geen coördinaten gevonden in deze link — gebruik een volledige Google Maps-link');
}

// Locatie proberen te halen uit het gewone Link-veld (website/menu/
// reservering) — niet alleen Komoot of een Maps-link, maar bijvoorbeeld ook
// een restaurant- of café-website, die vaak net als boekingssites
// gestructureerde locatiegegevens meestuurt (JSON-LD/Open Graph). Hergebruikt
// api/extract-listing.js (al bestaand, gebruikt voor verblijven — daar
// bewust alleen voor naam/adres, hier ook voor coördinaten, want een
// activiteit heeft al een apart naamveld en dit is de enige plek waar
// coördinaten voor de kaart vandaan kunnen komen als Komoot/Maps-link niets
// opleveren). Best-effort: vult alleen in als er nog geen coördinaten zijn,
// nooit een gok als er niets gevonden wordt.
async function handleExtractActivityLocationFromLink() {
  const url = document.getElementById('edit-activity-link-input').value.trim();
  if (!url) { showToast('Plak eerst een link'); return; }
  if (!/^https?:\/\//i.test(url)) { showToast('Geen geldige http(s)-link'); return; }

  showToast('Locatie zoeken in link…', 4000);
  try {
    const resp = await fetch(`/api/extract-listing?url=${encodeURIComponent(url)}`);
    const data = await resp.json();
    if (data && data.found && Number.isFinite(data.lat) && Number.isFinite(data.lng)) {
      document.getElementById('edit-activity-lat-input').value = data.lat;
      document.getElementById('edit-activity-lng-input').value = data.lng;
      showToast('✓ Locatie gevonden in link');
      return;
    }
  } catch { /* netwerkfout — val door naar de melding hieronder */ }
  showToast('Geen locatie gevonden in deze link — probeer Komoot of een Google Maps-link');
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
  document.getElementById('edit-activity-link-input').value = act.link || '';
  document.getElementById('edit-activity-maps-link-input').value = '';
  document.getElementById('edit-activity-lat-input').value = isValidLatLng(act.lat, act.lng) ? act.lat : '';
  document.getElementById('edit-activity-lng-input').value = isValidLatLng(act.lat, act.lng) ? act.lng : '';

  // FIX: de categorie/het icoon was ooit alleen bij het toevoegen te kiezen
  // — eenmaal opgeslagen kon je 'm niet meer wijzigen. Chips vooraf
  // geselecteerd op de huidige categorie (met dezelfde categoryForEmoji()-
  // terugval als elders voor activiteiten zonder opgeslagen category-veld).
  selectedEditActivityCategory = act.category || categoryForEmoji(act.emoji);
  document.querySelectorAll('#edit-activity-category-chips .chip').forEach(c =>
    c.classList.toggle('on', c.dataset.category === selectedEditActivityCategory)
  );
  updateActivityFormForCategory(selectedEditActivityCategory, 'edit-activity');

  document.getElementById('edit-activity-save-btn').onclick = () => saveActivityEdit(id);

  // FIX (betere knoppen-indeling): Afronden/Heropenen, AI-verrijking en
  // Verwijder stonden voorheen allemaal naast elkaar in het eerste,
  // veelgebruikte detailscherm — Afronden zat daar al dubbelop met het
  // vinkje op de Planning-rij zelf, en Verwijder/AI-verrijking zijn
  // bewuster te bereiken vanuit Bewerken, minder kans op per-ongeluk-tikken.
  const secondaryEl = document.getElementById('edit-activity-secondary-actions');
  if (secondaryEl) {
    const isDone = act.status === 'done';
    secondaryEl.innerHTML = `
      <div style="display:flex;gap:8px;margin-bottom:8px">
        ${act.date ? `
        <button onclick="closeSheet('sheet-edit-activity');handleToggleActivity(${id})" class="btn btn-outline" style="flex:1;margin:0">
          ${isDone ? '↺ Heropenen' : '✓ Afronden'}
        </button>` : ''}
        <button onclick="closeSheet('sheet-edit-activity');openAiEnrichSheet(${id})" class="btn btn-outline" style="flex:1;margin:0">
          ◎ AI-verrijking
        </button>
      </div>
      <button onclick="handleDeleteActivity(${id})" class="btn btn-outline" style="border-color:#dc2626;color:#dc2626">
        🗑 Verwijder
      </button>`;
  }

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
  const link = document.getElementById('edit-activity-link-input').value.trim();
  const category = selectedEditActivityCategory;
  const emoji = CATEGORY_EMOJIS[category] || CATEGORY_EMOJIS.default;
  // Handmatig ingevulde/overgenomen coördinaten winnen altijd — als je hier
  // zelf iets invult, telt dat als "geprobeerd", ook als het leeg blijft
  // (dan kies je bewust voor geen pin), zodat de achtergrondmigratie dit
  // niet later alsnog overschrijft met een eigen gok.
  const latVal = parseFloat(document.getElementById('edit-activity-lat-input').value);
  const lngVal = parseFloat(document.getElementById('edit-activity-lng-input').value);
  const lat = Number.isFinite(latVal) ? latVal : 0;
  const lng = Number.isFinite(lngVal) ? lngVal : 0;
  await updateActivity(id, {
    name, desc, distance: distance || '—', duration: duration || '—', elevation, level, komootTourUrl, link, category, emoji,
    lat, lng, locationVerifiedV2: true,
  });
  closeSheet('sheet-edit-activity');
  showToast('✓ Activiteit bijgewerkt');
  renderPlanningScreen();
  renderHomeScreen();
}

// ── Activiteit verplaatsen ────────────────────────────────
// currentMoveActivityId: onthoudt welke activiteit het move-sheet net heeft
// geopend, zodat de losse "uit planning halen"-snelknop (die de dropdown
// niet zelf hoeft te tonen) weet welke activiteit het betreft.
let currentMoveActivityId = null;

function openMoveActivitySheet(id) {
  const act = AppState.activities.find(a => a.id === id);
  if (!act) return;
  currentMoveActivityId = id;

  document.getElementById('move-day-select').innerHTML =
    // FIX: "een activiteit uit Planning halen zonder 'm te verwijderen" was
    // alleen mogelijk door deze eerste optie in de dropdown te vinden — niet
    // vanzelfsprekend vanuit een sheet met de titel "Verplaatsen". Tekst
    // verduidelijkt, en een losse knop hieronder doet hetzelfde in één tik.
    `<option value="">↩ Niet ingepland (uit planning halen)</option>` +
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
  showToast(dateStr ? '✓ Activiteit verplaatst' : '✓ Uit planning gehaald (niet verwijderd)');
  renderPlanningScreen();
  renderHomeScreen();
}

// Eén-tik-snelkoppeling voor exact dezelfde actie als "Dag" op "↩ Niet
// ingepland" zetten — de activiteit blijft gewoon bestaan (bij het verblijf,
// als niet-ingeplande activiteit), alleen de datum wordt losgelaten.
async function handleUnscheduleActivity() {
  if (currentMoveActivityId == null) return;
  document.getElementById('move-day-select').value = '';
  await saveMoveActivity(currentMoveActivityId);
}

// Zelfde actie, maar als directe snelknop op het activiteit-detailscherm
// zelf — voorheen alleen te bereiken via "Verplaatsen" (dit sheet), nu ook
// zonder tussenstap voor wie een activiteit alleen even wil loskoppelen
// van een dag, niet verplaatsen naar een andere.
async function handleQuickUnschedule(id) {
  await updateActivity(id, { date: null });
  closeSheet('sheet-place-detail');
  showToast('✓ Uit planning gehaald (niet verwijderd)');
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
  // FIX: sloot voorheen altijd hardcoded 'sheet-place-detail' — sinds
  // Verwijder ook vanuit Bewerken aan te roepen is, sluit dit nu elk open
  // sheet i.p.v. per ongeluk het bewerkformulier open te laten staan.
  document.querySelectorAll('.sheet-backdrop.open').forEach(s => s.classList.remove('open'));
  await deleteActivity(id);
  showToast(`🗑 ${act.name} verwijderd`);
  renderPlanningScreen();
  renderHomeScreen();
}

// ── AI-verrijking ─────────────────────────────────────────
// Grotere weergave van een lang, zelf getypt tekstveld (bv. de
// beschrijving, die maar 3 regels tekstvak heeft) — via de gedeelde
// openTextViewer() (js/navigation.js). Schrijft de nieuwe waarde bij
// "Gebruik deze tekst" terug naar het oorspronkelijke tekstvak.
function openDescTextEditor(textareaId) {
  const el = document.getElementById(textareaId);
  if (!el) return;
  openTextViewer('Beschrijving', el.value, newValue => { el.value = newValue; });
}

// Laatst getoonde AI-verrijking — alleen om openEnrichDescriptionViewer()
// de tekst te kunnen doorgeven zonder 'm in een onclick-attribuut te
// moeten proppen (kan aanhalingstekens/regeleinden bevatten).
let lastEnrichedResult = null;

function openEnrichDescriptionViewer() {
  if (!lastEnrichedResult) return;
  const text = [lastEnrichedResult.description, lastEnrichedResult.fun_fact ? `💡 ${lastEnrichedResult.fun_fact}` : null]
    .filter(Boolean).join('\n\n');
  openTextViewer('AI-verrijking', text, null, lastEnrichedResult.photo_url);
}

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
    // FIX: dit riep voorheen /api/suggestions aan met een custom "prompt"-
    // veld dat die functie nooit las — je kreeg dus gewoon het eerste van 5
    // verse, willekeurige Discover-suggesties terug, niet per se iets over
    // déze activiteit. Apart endpoint dat de opgegeven activiteit echt
    // verrijkt, nu ook met iets meer tekst en een optioneel achtergrondfeitje.
    const trip = AppState.trips.find(t => t.id === getCurrentTripId());
    const activityLink = act.komootTourUrl || act.link || null;
    // FIX: een Wikipedia-zoekopdracht op de activiteitnaam werkte prima
    // voor bekende wandelingen/uitzichtpunten, maar bij een klein
    // restaurant/café (bv. "Nøgen") matcht Wikipedia al snel een compleet
    // ongerelateerd artikel (en dus een totaal verkeerde foto) — Wikipedia
    // heeft simpelweg geen pagina's over de meeste eetgelegenheden. Voor
    // restaurant/café gebruiken we in plaats daarvan straks de og:image
    // van de eigen opgeslagen link (dat IS de plek); Wikipedia slaan we
    // dan over in plaats van te gokken.
    // FIX: act.category is pas sinds later toegevoegd — oudere activiteiten
    // hebben alleen act.emoji. Overal elders (categoryMetaForActivity())
    // wordt daarom altijd met categoryForEmoji() teruggevallen; dat miste ik
    // hier, waardoor deze check bij een activiteit zonder .category-veld
    // altijd false gaf en Wikipedia dus tóch nog gewoon aangeroepen werd.
    const resolvedCategory = act.category || categoryForEmoji(act.emoji);
    const isFoodCategory = resolvedCategory === 'restaurant' || resolvedCategory === 'cafe';
    const [response, wikipediaPhoto] = await Promise.all([
      fetch('/api/enrich-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityName: act.name,
          accommodationName: acc.name,
          accommodationLocation: acc.address,
          country: (trip && trip.country) || 'Noorwegen',
          language: AppState.language || 'nl',
          // Opgeslagen Komoot-/website-link meesturen (zelfde volgorde als
          // elders: Komoot voor wandelingen, anders het gewone Link-veld) —
          // zodat de AI zich baseert op de plek die de gebruiker zelf koos,
          // niet op alleen de activiteitnaam raden.
          activityLink,
          // FIX: AI-tekst over een restaurant/café zonder gevonden site-info
          // was altijd vage vulling ("lijkt een lokaal restaurant te zijn")
          // — server slaat die tekst nu over i.p.v. te gokken wanneer dit een
          // eetgelegenheid is.
          category: resolvedCategory,
        }),
      }),
      isFoodCategory ? Promise.resolve(null) : fetchWikipediaPhoto(act.name, AppState.language),
    ]);

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Onbekende fout');
    const enriched = data.enriched;
    const siteInfo = data.siteInfo || null;
    // Eigen foto van de gelinkte site (og:image) is betrouwbaarder dan een
    // Wikipedia-gok op naam — wint dus altijd als 'm er is.
    const photoUrl = (siteInfo && siteInfo.image) || wikipediaPhoto || null;

    if (enriched) {
      enriched.photo_url = photoUrl;
      lastEnrichedResult = enriched;
      // FIX: telde eerder ook mee als er ALLEEN een titel was (bv. gewoon de
      // <title>-tag als enige terugval) — dat geeft een "Site-info"-blok met
      // niets dan een naam erin, net zo nutteloos als geen blok tonen maar
      // dan verwarrender (lijkt een halve/kapotte fetch i.p.v. duidelijk
      // "niets bruikbaars gevonden"). Nu pas een eigen blok bij iets met
      // echte inhoud: omschrijving, keuken of prijsklasse.
      const hasSiteInfo = siteInfo && (siteInfo.description || siteInfo.excerpt || siteInfo.cuisine || siteInfo.priceRange);
      const siteInfoHtml = hasSiteInfo ? `
        <p class="eyebrow" style="margin-bottom:6px">🌐 Site-info</p>
        <div style="background:var(--paper-warm);border-radius:11px;padding:12px 14px;margin-bottom:14px">
          ${siteInfo.title ? `<p style="font-weight:800;font-size:13.5px;margin-bottom:4px">${escapeHtml(siteInfo.title)}</p>` : ''}
          ${(siteInfo.cuisine || siteInfo.priceRange) ? `<p class="mono" style="margin-bottom:6px">${[siteInfo.cuisine, siteInfo.priceRange].filter(Boolean).map(escapeHtml).join(' · ')}</p>` : ''}
          ${(siteInfo.description || siteInfo.excerpt) ? `<p style="font-size:12.5px;line-height:1.5;color:var(--ink-mid)">${escapeHtml(siteInfo.description || siteInfo.excerpt)}</p>` : ''}
        </div>
        <p class="eyebrow" style="margin-bottom:6px">🤖 AI-info</p>`
        // FIX: bij een opgeslagen link die niets opleverde bleef dit
        // eerder gewoon stil — onmogelijk te zien of het ooit geprobeerd
        // is. Sommige sites blokkeren geautomatiseerde verzoeken (bv.
        // Cloudflare-botwering) — dat kunnen we niet altijd omzeilen zonder
        // een volledige browser, maar wél zichtbaar maken i.p.v. verzwijgen.
        : (activityLink ? `<p class="mono" style="color:var(--ink-faint);margin-bottom:12px">ℹ️ Kon geen extra info van de opgeslagen link ophalen — de AI-tekst hieronder is dus niet op die site gebaseerd.</p>` : '');

      // FIX: bij een restaurant/café zonder gegronde site-info retourneert
      // de server nu bewust description:null i.p.v. een vage vulzin (zie
      // api/enrich-activity.js) — dat moet dan ook duidelijk zo getoond
      // worden i.p.v. een lege alinea met een dooie "groter lezen"-knop
      // erbij, of stilzwijgend een leeg sheet.
      const hasDescription = !!(enriched.description && enriched.description.trim());
      const hasAnyContent = hasDescription || enriched.fun_fact || (enriched.tips && enriched.tips.length) || enriched.duration_minutes || enriched.distance_km;
      const noInfoNote = (!hasDescription && isFoodCategory) ? `
        <p class="mono" style="color:var(--ink-faint);margin-bottom:12px">Voor restaurants/cafés toont AI-verrijking alleen tekst als er concrete info is gevonden (via een opgeslagen link) — geen algemene gok. Voeg een link toe voor specifiekere info.</p>` : '';

      document.getElementById('enrich-result').innerHTML = `
        ${photoUrl ? `<img src="${escapeHtml(photoUrl)}" alt="" style="width:100%;height:160px;object-fit:cover;border-radius:12px;margin-bottom:12px" onerror="this.remove()"/>` : ''}
        ${siteInfoHtml}
        ${hasDescription ? `
        <p onclick="openEnrichDescriptionViewer()" style="font-size:13.5px;line-height:1.65;color:var(--ink-mid);margin-bottom:12px;cursor:pointer">${escapeHtml(enriched.description)}</p>
        <p onclick="openEnrichDescriptionViewer()" style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.3px;color:var(--spruce);cursor:pointer;margin:-9px 0 12px">⤢ Groter lezen</p>` : noInfoNote}
        ${enriched.fun_fact ? `<p style="font-size:12.5px;line-height:1.5;color:var(--spruce);background:var(--paper-warm);border-radius:10px;padding:10px 12px;margin-bottom:12px">💡 ${escapeHtml(enriched.fun_fact)}</p>` : ''}
        ${enriched.tips && enriched.tips.length ? `
          <div style="background:var(--slope-light);border-radius:11px;padding:12px 14px;margin-bottom:12px">
            <p class="eyebrow" style="margin-bottom:8px">Tips</p>
            ${enriched.tips.map(t => `<p style="font-size:12.5px;color:var(--spruce);margin-bottom:5px">· ${escapeHtml(t)}</p>`).join('')}
          </div>` : ''}
        ${enriched.best_time ? `<p class="mono" style="margin-bottom:12px">⏰ ${escapeHtml(enriched.best_time)}</p>` : ''}
        ${hasAnyContent ? `<button onclick="applyAiEnrichment(${id}, ${JSON.stringify(enriched).replace(/"/g, '&quot;')})" class="btn btn-primary" style="margin-bottom:9px">✓ Opslaan</button>` : ''}
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
  // fun_fact wordt bij de beschrijving gevoegd (geen apart schemaveld nodig)
  // zodat het ook zichtbaar blijft op het activiteit-detailscherm nadat de
  // verrijking is opgeslagen, niet alleen in dit sheet.
  const desc = [enriched.description, enriched.fun_fact ? `💡 ${enriched.fun_fact}` : null].filter(Boolean).join('\n\n');
  // FIX: bij een restaurant/café zonder gegronde site-info is description
  // nu bewust null (zie api/enrich-activity.js) — zonder deze check zou
  // "Opslaan" dan een lege string wegschrijven en een al bestaande,
  // handmatig ingevulde omschrijving stilzwijgend wissen.
  const changes = desc ? { desc } : {};
  if (enriched.duration_minutes) changes.duration = Math.round(enriched.duration_minutes / 60) + ' u';
  if (enriched.distance_km) changes.distance = enriched.distance_km + ' km';
  if (enriched.difficulty) changes.level = { easy: 'Makkelijk', medium: 'Gemiddeld', hard: 'Zwaar' }[enriched.difficulty] || enriched.difficulty;
  // Echte foto (Wikipedia, best-effort — zie fetchWikipediaPhoto() in
  // js/state.js) die bij het verrijken al werd opgehaald, nu bewaren zodat
  // 'm ook zichtbaar blijft op het activiteit-detailscherm (renderPdHero()).
  if (enriched.photo_url) changes.photoUrl = enriched.photo_url;
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
  updateActivityFormForCategory(selectedActivityCategory);
  openSheet('sheet-activity');
}

// Reisdag-icoon naast de dag-keuze in "Activiteit toevoegen" — toont het
// dagnummer in de kleur van het verblijf dat op die dag actief is, zodat je
// meteen ziet welke reisdag/verblijf je kiest i.p.v. alleen platte tekst
// in de dropdown. Bij een verplaatsdag (zelfde detectie als buildDayTabs())
// hetzelfde 🚗-icoon + subtiele twee-kleuren-rand als in Planning, i.p.v.
// stilzwijgend alleen de kleur van het nieuwe verblijf.
function updateActivityDayBadge() {
  const badge = document.getElementById('activity-day-badge');
  const sel = document.getElementById('activity-day-select');
  if (!badge || !sel) return;
  if (!sel.value) {
    badge.textContent = '—';
    badge.style.background = 'var(--ink-faint)';
    badge.style.border = 'none';
    badge.title = '';
    return;
  }
  const day = new Date(sel.value);
  const dayAcc = getAccommodationForDate(day);
  const prevAcc = ACCOMMODATIONS.find(a => a.checkOut.getTime() === day.getTime());
  const isChangeover = !!(prevAcc && dayAcc && prevAcc.id !== dayAcc.id);

  if (isChangeover) {
    badge.textContent = '🚗';
    badge.style.background = 'var(--white)';
    badge.style.border = `5px solid ${dayAcc.color}`;
    badge.style.borderLeft = `7px solid ${prevAcc.color}`;
    badge.title = `Verplaatsdag: ${prevAcc.name} → ${dayAcc.name}`;
  } else {
    badge.textContent = `D${getDayNumber(day)}`;
    badge.style.background = dayAcc ? dayAcc.color : 'var(--ink-faint)';
    badge.style.border = 'none';
    badge.title = '';
  }
}

function openAddActivitySheet() {
  openAddActivitySheetForCurrentDay();
}

// ── Komoot-link → afstand/duur/hoogte proberen over te nemen ──
// Best-effort, zie api/extract-komoot-tour.js: Komoot heeft geen publieke
// data-API, dit leest server-side de paginabron en zoekt naar cijfers die
// Komoot zelf al meestuurt. Vult uitdrukkelijk alleen de nog LEGE velden in
// (nooit een handmatig ingevoerde waarde overschrijven), en doet niets als
// er niets gevonden wordt — geen gok.
async function handleExtractFromKomootLink(prefix) {
  const url = document.getElementById(`${prefix}-komoot-input`).value.trim();
  if (!url) { showToast('Plak eerst een Komoot-routelink'); return; }

  showToast('Bezig met ophalen…', 4000);
  try {
    const resp = await fetch(`/api/extract-komoot-tour?url=${encodeURIComponent(url)}`);
    const data = await resp.json();
    if (!data || !data.found) {
      showToast('Geen gegevens gevonden in deze link — vul handmatig aan');
      return;
    }
    // FIX: vulde eerder alleen nog lege velden, dus als Komoot een andere
    // (of eerder verkeerd overgenomen) afstand/duur/hoogte/locatie teruggaf,
    // bleef de oude waarde onopgemerkt staan. Komoot is de belangrijkste,
    // meest betrouwbare bron voor wandelgegevens — een expliciete klik op
    // deze knop is een bewuste "haal het uit Komoot"-actie, die dus altijd
    // mag overschrijven, ook als er al iets (mogelijk verouderd of fout)
    // ingevuld stond.
    const distanceEl = document.getElementById(`${prefix}-distance-input`);
    const durationEl = document.getElementById(`${prefix}-duration-input`);
    const elevationEl = document.getElementById(`${prefix}-elevation-input`);
    let filledAny = false;
    if (data.distance_km) { distanceEl.value = `${data.distance_km} km`; filledAny = true; }
    if (data.duration_minutes) {
      durationEl.value = data.duration_minutes >= 60 ? `${Math.round(data.duration_minutes / 60)} u` : `${data.duration_minutes} min`;
      filledAny = true;
    }
    if (data.elevation_gain_m) { elevationEl.value = data.elevation_gain_m; filledAny = true; }
    // Startpunt-coördinaten (best-effort, zie extractStartCoords() in
    // api/extract-komoot-tour.js) — alleen relevant bij het activiteit-
    // bewerkformulier, dat als enige lat/lng-velden heeft.
    const latEl = document.getElementById(`${prefix}-lat-input`);
    const lngEl = document.getElementById(`${prefix}-lng-input`);
    if (latEl && lngEl && Number.isFinite(data.lat) && Number.isFinite(data.lng)) {
      latEl.value = data.lat;
      lngEl.value = data.lng;
      filledAny = true;
    }
    showToast(filledAny ? '✓ Gegevens overgenomen uit Komoot-link' : 'Geen gegevens gevonden in deze link');
  } catch {
    showToast('Geen gegevens gevonden in deze link — vul handmatig aan');
  }
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
  document.getElementById('activity-link-input').value = '';
}

// Soort bepaalt het icoon — zelfde iconenset als Discover, zodat een
// handmatig toegevoegde activiteit er niet anders uitziet dan een
// vanuit AI-suggesties ingeplande (CATEGORY_EMOJIS in js/data.js).
// Toevoeg- en bewerkformulier hebben allebei hun eigen chips-container en
// state (prefix 'activity' resp. 'edit-activity'), zodat het bewerken van
// de ene activiteit niet de "soort"-keuze van het toevoeg-formulier verstoort.
let selectedActivityCategory = 'activity';
let selectedEditActivityCategory = 'activity';
function setActivityCategory(chipEl, category, prefix = 'activity') {
  if (prefix === 'edit-activity') selectedEditActivityCategory = category;
  else selectedActivityCategory = category;
  document.querySelectorAll(`#${prefix}-category-chips .chip`).forEach(c => c.classList.remove('on'));
  chipEl.classList.add('on');
  updateActivityFormForCategory(category, prefix);
}

// Hoogtewinst/niveau/Komoot-routelink zijn wandeling-specifiek — een café
// of restaurant heeft geen "moeilijkheidsgraad" (zie CATEGORY_META,
// js/data.js). Afstand/duur blijven wel voor elke categorie zichtbaar.
function updateActivityFormForCategory(category, prefix = 'activity') {
  const isHike = (CATEGORY_META[category] || CATEGORY_META.activity).isHike;
  const hikeFields = document.getElementById(`${prefix}-hike-fields`);
  const komootRow = document.getElementById(`${prefix}-komoot-row`);
  const summary = document.getElementById(`${prefix}-extra-summary`);
  if (hikeFields) hikeFields.style.display = isHike ? 'flex' : 'none';
  if (komootRow) komootRow.style.display = isHike ? 'flex' : 'none';
  if (summary) summary.textContent = isHike ? 'Wandelinfo toevoegen (optioneel)' : 'Extra info toevoegen (optioneel)';
  // FIX: bij een wandeling staan de belangrijkste velden (Komoot-link voor
  // hoogteprofiel/locatie) hier al meteen zichtbaar i.p.v. achter een
  // dichtgeklapt "optioneel"-uitklapje verstopt — bij elke andere categorie
  // blijft het dicht, zoals voorheen.
  if (summary && summary.parentElement && summary.parentElement.tagName === 'DETAILS') {
    summary.parentElement.open = isHike;
  }
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
  const link = document.getElementById('activity-link-input').value.trim();
  // FIX: dit formulier heeft geen locatieveld, dus een handmatig toegevoegde
  // activiteit kreeg nooit lat/lng — onvindbaar op Kaart, ook als 'm keurig
  // op een dag staat (renderMapMarkers() toont alleen activiteiten mét
  // coördinaten). Best-effort dezelfde Nominatim-opzoeking als bij een
  // verblijf zonder handmatige coördinaten, op basis van de naam — geen gok
  // als er niets gevonden wordt, dan blijft de activiteit gewoon zonder pin.
  // Land van de reis erbij als context, anders kan een naam als "Solvorn"
  // net zo goed naar een gelijknamige plek elders ter wereld matchen.
  const country = getActiveTrip()?.country || '';
  const coords = await geocodeAddress(country ? `${name}, ${country}` : name);
  await addActivity({
    name, accId, date, emoji, category: selectedActivityCategory, distance: distance || '—', duration: duration || '—',
    elevation, level, komootTourUrl, link, lat: coords?.lat || 0, lng: coords?.lng || 0, googleMapsQuery: name,
    locationVerifiedV2: true,
  });
  closeSheet('sheet-activity');
  showToast(`✓ ${name} toegevoegd`);
  if (date) AppState.selectedPlanningDay = date;
  renderPlanningScreen();
  renderHomeScreen();
  if (document.getElementById('screen-accommodation').classList.contains('active')) {
    renderAccommodationScreen(AppState.viewingAccommodationId);
  }
}
