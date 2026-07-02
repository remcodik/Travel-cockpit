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
    <div class="card-row" style="cursor:default;${i < rows.length - 1 ? '' : 'border-bottom:none'}">
      <div style="flex:1;min-width:0">
        <p class="eyebrow">${row.label}</p>
        <p class="row-title" style="margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(row.value)}</p>
      </div>
      ${row.hasMapsBtn ? `<button onclick="openMapsForAccommodation('${acc.id}')" style="padding:5px 12px;background:var(--slope-light);color:var(--spruce);border-radius:20px;border:none;cursor:pointer;font-size:11px;font-weight:700;text-transform:uppercase;flex-shrink:0">Maps</button>` : ''}
    </div>`).join('');

  document.getElementById('acc-notes').textContent = acc.notes;

  // Alle verblijven (tijdlijn)
  document.getElementById('acc-stops').innerHTML = ACCOMMODATIONS.map((a, i) => {
    const n = Math.round((a.checkOut - a.checkIn) / 86400000);
    const isActive = activeAcc && a.id === activeAcc.id;
    const isViewing = a.id === acc.id;
    return `
      <button onclick="renderAccommodationScreen('${a.id}')" style="display:flex;align-items:stretch;gap:10px;width:100%;background:none;border:none;cursor:pointer;text-align:left;padding:0">
        <div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0">
          <span class="mono" style="width:28px;height:28px;background:${isViewing ? a.color : 'white'};border:1.5px solid ${isViewing ? a.color : 'var(--line)'};border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:${isViewing ? 'white' : 'var(--ink-faint)'}">${i + 1}</span>
          ${i < ACCOMMODATIONS.length - 1 ? '<div style="width:1px;flex:1;background:var(--line);margin:2px 0;min-height:16px"></div>' : ''}
        </div>
        <div class="card" style="flex:1;padding:10px 12px;border-left:3px solid ${a.color};background:${isViewing ? a.color + '0D' : 'white'};margin-bottom:${i < ACCOMMODATIONS.length - 1 ? '4px' : '0'}">
          <div style="display:flex;align-items:flex-start;justify-content:space-between">
            <div>
              <p class="row-title" style="font-size:14px">${escapeHtml(a.name)}</p>
              <p class="mono" style="margin-top:2px">${formatShortDate(a.checkIn)}–${formatShortDate(a.checkOut)} · ${n}n · ${a.elevation}m</p>
            </div>
            ${isActive ? `<span class="from-acc-badge" style="background:${a.color};color:white;text-transform:uppercase">ACTIEF</span>` : ''}
          </div>
        </div>
      </button>`;
  }).join('');

  initAllTopoPanels();
}

function openMapsForAccommodation(accId) {
  const acc = ACCOMMODATIONS.find(a => idsMatch(a.id, accId));
  if (!acc) return;
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${acc.lat},${acc.lng}`, '_blank');
}
