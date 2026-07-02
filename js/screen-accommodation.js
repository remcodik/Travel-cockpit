// ═══════════════════════════════════════════════════════════
// screen-accommodation.js — Accommodatiescherm met switcher
// ═══════════════════════════════════════════════════════════

function renderAccommodationScreen(accId) {
  // FIX: geen hardcoded fallback meer — gebruik altijd de actieve
  // accommodatie op basis van datum als er geen expliciete keuze is.
  const acc = ACCOMMODATIONS.find(a => idsMatch(a.id, accId)) || getActiveAccommodation();
  AppState.viewingAccommodationId = acc.id;
  const activeAcc = getActiveAccommodation();

  document.getElementById('acc-name').textContent = acc.name.toUpperCase();
  document.getElementById('acc-elevation').textContent = `${acc.elevation}m · ${acc.coord}`;

  // Live weer voor deze accommodatie (kan een toekomstig verblijf zijn,
  // Open-Meteo geeft dan de forecast voor de eerste dag van het verblijf)
  fillWeatherBadge('acc-weather-badge', acc.lat, acc.lng, acc.checkIn > getToday() ? acc.checkIn : getToday());
  const nights = Math.round((acc.checkOut - acc.checkIn) / 86400000);
  document.getElementById('acc-dates').textContent = `${formatShortDate(acc.checkIn)} – ${formatShortDate(acc.checkOut)} · ${nights} nachten`;

  // Switcher chips
  document.getElementById('acc-chips').innerHTML = ACCOMMODATIONS.map(a => {
    const isViewing = a.id === acc.id;
    const isActive = activeAcc && a.id === activeAcc.id;
    return `
      <button onclick="renderAccommodationScreen('${a.id}')"
        style="padding:6px 14px;border:1.5px solid ${a.color};border-radius:20px;background:${isViewing ? a.color : 'white'};color:${isViewing ? 'white' : a.color};font-size:11px;font-weight:700;text-transform:uppercase;cursor:pointer;position:relative;flex-shrink:0">
        ${a.short}
        ${isActive && !isViewing ? '<span style="position:absolute;top:-4px;right:-4px;width:8px;height:8px;background:#C5512B;border-radius:50%;border:1.5px solid white"></span>' : ''}
      </button>`;
  }).join('');

  // Info-rijen
  const rows = [
    { label: 'Check-in', value: `${formatShortDate(acc.checkIn)} · vanaf 15:00` },
    { label: 'Check-out', value: `${formatShortDate(acc.checkOut)} · voor 11:00` },
    { label: 'Nachten', value: String(nights) },
    { label: 'Adres', value: acc.address, hasMapsBtn: true },
    { label: 'Coördinaten', value: acc.coord },
  ];
  document.getElementById('acc-info').innerHTML = rows.map((row, i) => `
    <div class="card-row" style="cursor:default;${i < rows.length - 1 || acc.url ? '' : 'border-bottom:none'}">
      <div style="flex:1;min-width:0">
        <p class="eyebrow">${row.label}</p>
        <p class="row-title" style="margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(row.value)}</p>
      </div>
      ${row.hasMapsBtn ? `<button onclick="openMapsForAccommodation('${acc.id}')" style="padding:5px 12px;background:var(--slope-light);color:var(--spruce);border-radius:20px;border:none;cursor:pointer;font-size:11px;font-weight:700;text-transform:uppercase;flex-shrink:0">Maps</button>` : ''}
    </div>`).join('') +
    (acc.url ? `
    <a href="${escapeHtml(acc.url)}" target="_blank" class="card-row" style="border-bottom:none;text-decoration:none;color:inherit">
      <div style="flex:1;min-width:0">
        <p class="eyebrow">Boeking</p>
        <p class="row-title" style="margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--spruce)">Open link</p>
      </div>
      <span class="chevron">›</span>
    </a>` : '');

  document.getElementById('acc-notes').textContent = acc.notes;

  // Alle verblijven (tijdlijn) — met bewerken/verwijderen per rij (Fase E)
  document.getElementById('acc-stops').innerHTML = ACCOMMODATIONS.map((a, i) => {
    const n = Math.round((a.checkOut - a.checkIn) / 86400000);
    const isActive = activeAcc && a.id === activeAcc.id;
    const isViewing = a.id === acc.id;
    return `
      <div style="display:flex;align-items:stretch;gap:10px;width:100%">
        <div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0">
          <span class="mono" style="width:28px;height:28px;background:${isViewing ? a.color : 'white'};border:1.5px solid ${isViewing ? a.color : 'var(--line)'};border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:${isViewing ? 'white' : 'var(--ink-faint)'}">${i + 1}</span>
          ${i < ACCOMMODATIONS.length - 1 ? '<div style="width:1px;flex:1;background:var(--line);margin:2px 0;min-height:16px"></div>' : ''}
        </div>
        <button onclick="renderAccommodationScreen('${a.id}')" class="card" style="flex:1;padding:10px 12px;border-left:3px solid ${a.color};background:${isViewing ? a.color + '0D' : 'white'};margin-bottom:${i < ACCOMMODATIONS.length - 1 ? '4px' : '0'};border-top:none;border-right:none;border-bottom:none;text-align:left;cursor:pointer">
          <div style="display:flex;align-items:flex-start;justify-content:space-between">
            <div>
              <p class="row-title" style="font-size:14px">${escapeHtml(a.name)}</p>
              <p class="mono" style="margin-top:2px">${formatShortDate(a.checkIn)}–${formatShortDate(a.checkOut)} · ${n}n · ${a.elevation}m</p>
            </div>
            ${isActive ? `<span class="from-acc-badge" style="background:${a.color};color:white;text-transform:uppercase">ACTIEF</span>` : ''}
          </div>
        </button>
        <div style="display:flex;flex-direction:column;gap:6px;justify-content:center">
          <button onclick="openEditAccommodationSheet('${a.id}')" class="edit-pencil-btn" title="Bewerken">✎</button>
          <button onclick="openDeleteAccommodationSheet('${a.id}')" style="width:30px;height:30px;border-radius:50%;border:none;cursor:pointer;background:var(--paper-warm);color:#dc2626;font-size:13px;display:flex;align-items:center;justify-content:center;flex-shrink:0" title="Verwijderen">✕</button>
        </div>
      </div>`;
  }).join('');

  // Activiteiten van dit verblijf — ook voor voorbije verblijven, zodat je
  // terug kunt navigeren naar wat er toen gepland stond (Fase E).
  const accActivities = AppState.activities
    .filter(act => idsMatch(act.accId, acc.id))
    .sort((x, y) => (x.date && y.date) ? x.date - y.date : (x.date ? -1 : 1));
  const activitiesSection = document.getElementById('acc-activities');
  if (activitiesSection) {
    activitiesSection.innerHTML = accActivities.length === 0
      ? `<p class="mono" style="padding:4px 0 0">Nog geen activiteiten bij dit verblijf.</p>`
      : `<div class="card" style="overflow:hidden">${accActivities.map((act, i) => `
          <div class="card-row" style="cursor:pointer;${i === accActivities.length - 1 ? 'border-bottom:none' : ''}" onclick="openActivityDetailSheet(${act.id})">
            <span style="font-size:18px;flex-shrink:0">${act.emoji}</span>
            <div style="flex:1;min-width:0;margin-left:2px">
              <p class="row-title" style="${act.status === 'done' ? 'color:var(--ink-faint);text-decoration:line-through' : ''};overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(act.name)}</p>
              <p class="mono" style="margin-top:2px">${act.date ? formatShortDate(act.date) : 'Niet ingepland'}</p>
            </div>
            <span class="chevron">›</span>
          </div>`).join('')}</div>`;
  }

  // Topografisch patroon afgeleid van de echte locatie/hoogte van dit
  // verblijf, zodat elke accommodatie een eigen, herkenbaar patroon
  // krijgt i.p.v. voor elk verblijf hetzelfde decoratieve vaste patroon.
  const heroSvg = document.querySelector('#screen-accommodation .topo-svg');
  if (heroSvg) {
    heroSvg.dataset.topo = topoSeedForLocation(acc.lat, acc.lng, acc.elevation);
    heroSvg.dataset.topoElevation = acc.elevation;
  }

  initAllTopoPanels();
}

function openMapsForAccommodation(accId) {
  const acc = ACCOMMODATIONS.find(a => idsMatch(a.id, accId));
  if (!acc) return;
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${acc.lat},${acc.lng}`, '_blank');
}

// ── Verblijf bewerken (Fase E) ──────────────────────────────
function openEditAccommodationSheet(accId) {
  const acc = ACCOMMODATIONS.find(a => idsMatch(a.id, accId));
  if (!acc) return;
  document.getElementById('edit-acc-name-input').value = acc.name;
  document.getElementById('edit-acc-address-input').value = acc.address || '';
  document.getElementById('edit-acc-checkin-input').value = acc.checkIn.toISOString().slice(0, 10);
  document.getElementById('edit-acc-checkout-input').value = acc.checkOut.toISOString().slice(0, 10);
  document.getElementById('edit-acc-lat-input').value = acc.lat || '';
  document.getElementById('edit-acc-lng-input').value = acc.lng || '';
  document.getElementById('edit-acc-url-input').value = acc.url || '';
  document.getElementById('edit-acc-notes-input').value = acc.notes || '';
  document.getElementById('edit-acc-save-btn').onclick = () => saveAccommodationEdit(accId);
  openSheet('sheet-edit-accommodation');
}

async function saveAccommodationEdit(accId) {
  const name = document.getElementById('edit-acc-name-input').value.trim();
  if (!name) { showToast('Voer een naam in'); return; }
  const checkInStr = document.getElementById('edit-acc-checkin-input').value;
  const checkOutStr = document.getElementById('edit-acc-checkout-input').value;
  if (!checkInStr || !checkOutStr) { showToast('Vul check-in en check-out in'); return; }
  const lat = parseFloat(document.getElementById('edit-acc-lat-input').value) || 0;
  const lng = parseFloat(document.getElementById('edit-acc-lng-input').value) || 0;

  await updateAccommodation(accId, {
    name,
    address: document.getElementById('edit-acc-address-input').value.trim(),
    checkIn: new Date(checkInStr),
    checkOut: new Date(checkOutStr),
    lat, lng,
    coord: lat && lng ? `${lat.toFixed(2)}°N ${lng.toFixed(2)}°E` : '—',
    url: document.getElementById('edit-acc-url-input').value.trim(),
    notes: document.getElementById('edit-acc-notes-input').value.trim(),
  });
  closeSheet('sheet-edit-accommodation');
  showToast(`✓ ${name} bijgewerkt`);
  renderAccommodationScreen(accId);
  renderHomeScreen();
  updateMeerSummary();
}

// ── Verblijf verwijderen — met keuze over activiteiten (Fase E) ──
function openDeleteAccommodationSheet(accId) {
  const acc = ACCOMMODATIONS.find(a => idsMatch(a.id, accId));
  if (!acc) return;
  if (ACCOMMODATIONS.length <= 1) { showToast('Je kunt het enige verblijf niet verwijderen'); return; }

  const relatedCount = AppState.activities.filter(act => idsMatch(act.accId, accId)).length;
  const warningEl = document.getElementById('delete-acc-warning');
  const withActBtn = document.getElementById('delete-acc-with-activities-btn');
  const keepActBtn = document.getElementById('delete-acc-keep-activities-btn');

  if (relatedCount > 0) {
    warningEl.textContent = `"${acc.name}" verwijderen — er ${relatedCount === 1 ? 'staat 1 activiteit' : `staan ${relatedCount} activiteiten`} bij dit verblijf. Wat moet daarmee gebeuren?`;
    withActBtn.style.display = 'block';
    keepActBtn.textContent = 'Verblijf verwijderen, activiteiten laten staan';
  } else {
    warningEl.textContent = `"${acc.name}" verwijderen? Er staan geen activiteiten bij dit verblijf.`;
    withActBtn.style.display = 'none';
    keepActBtn.textContent = 'Verwijderen';
  }
  withActBtn.onclick = () => confirmDeleteAccommodation(accId, true);
  keepActBtn.onclick = () => confirmDeleteAccommodation(accId, false);
  openSheet('sheet-delete-accommodation');
}

async function confirmDeleteAccommodation(accId, alsoDeleteActivities) {
  closeSheet('sheet-delete-accommodation');
  await deleteAccommodationWithChoice(accId, alsoDeleteActivities);
  showToast('✓ Verblijf verwijderd');
  const fallback = getActiveAccommodation();
  if (document.getElementById('screen-accommodation').classList.contains('active') && fallback) {
    renderAccommodationScreen(fallback.id);
  }
  renderHomeScreen();
  updateMeerSummary();
}
