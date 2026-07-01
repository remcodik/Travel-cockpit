// ═══════════════════════════════════════════════════════════
// screen-tickets.js — Tickets met Firestore-opslag + bestand-upload
// Tickets worden persistent opgeslagen en gedeeld via Firebase.
// ═══════════════════════════════════════════════════════════

let pendingTicketFile = null;

function renderTicketsScreen() {
  const moreLabel = document.getElementById('tickets-active-label');
  const listEl = document.getElementById('tickets-list');
  const count = 1 + AppState.tickets.length; // 1 = het vaste Klimapark-ticket

  const totalEl = document.getElementById('stat-tickets');
  if (totalEl) totalEl.textContent = count;
  const subEl = document.getElementById('meer-tickets-sub');
  if (subEl) subEl.textContent = `${count} ticket${count !== 1 ? 's' : ''}`;

  if (AppState.tickets.length === 0) {
    moreLabel.style.display = 'none';
    listEl.innerHTML = '';
    return;
  }

  moreLabel.style.display = 'block';
  listEl.innerHTML = AppState.tickets.map((ticket, i) => `
    <div class="card" style="border-left:3px solid var(--spruce);margin-bottom:10px;overflow:hidden">
      <div style="padding:15px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <p style="font-weight:800;font-size:15.5px;flex:1">${escapeHtml(ticket.name)}</p>
          <button onclick="handleRemoveTicket(${i})" style="background:none;border:none;cursor:pointer;color:var(--ink-faint);font-size:16px;margin-left:8px;padding:4px">✕</button>
        </div>
        ${ticket.venue ? `<p class="mono" style="margin-top:5px">${escapeHtml(ticket.venue)}</p>` : ''}
        <div style="display:flex;gap:15px;margin-top:11px" class="mono">
          ${ticket.date ? `<span>◷ ${ticket.date}</span>` : ''}
          ${ticket.time ? `<span>· ${ticket.time}</span>` : ''}
        </div>
        ${ticket.code ? `<p class="mono" style="margin-top:6px;padding:4px 9px;background:var(--slope-light);color:var(--spruce);border-radius:6px;display:inline-block">${escapeHtml(ticket.code)}</p>` : ''}
        ${ticket.fileDataUrl ? renderTicketFilePreview(ticket) : ''}
      </div>
    </div>`).join('');
}

function renderTicketFilePreview(ticket) {
  const isImage = ticket.fileType && ticket.fileType.startsWith('image/');
  return `
    <div style="margin-top:11px;display:flex;align-items:center;gap:10px;padding:9px 11px;background:var(--paper-warm);border-radius:10px">
      ${isImage
        ? `<img src="${ticket.fileDataUrl}" class="file-preview" alt="Ticket bestand"/>`
        : `<div class="file-upload-icon">📄</div>`}
      <div style="flex:1;min-width:0">
        <p style="font-size:12px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(ticket.fileName || 'Bijlage')}</p>
        <p class="mono">Bijgevoegd document</p>
      </div>
    </div>`;
}

async function handleRemoveTicket(index) {
  const ticket = AppState.tickets[index];
  if (!ticket) return;
  AppState.tickets.splice(index, 1);
  await dbDeleteTicket(ticket.id);
  showToast('Ticket verwijderd');
  renderTicketsScreen();
  renderHomeScreen();
}

// Alias voor backward compat
function removeTicket(index) { handleRemoveTicket(index); }

function openAddTicketSheet() {
  document.getElementById('ticket-name-input').value = '';
  document.getElementById('ticket-venue-input').value = '';
  document.getElementById('ticket-code-input').value = '';
  pendingTicketFile = null;
  resetTicketFileUpload();
  openSheet('sheet-ticket');
}

function handleTicketFileSelect(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 8 * 1024 * 1024) { showToast('Bestand te groot (max 8MB)'); input.value = ''; return; }
  const reader = new FileReader();
  reader.onload = e => {
    pendingTicketFile = { dataUrl: e.target.result, name: file.name, type: file.type };
    updateTicketFileUploadUI();
  };
  reader.readAsDataURL(file);
}

function updateTicketFileUploadUI() {
  const uploadEl = document.getElementById('ticket-file-upload');
  if (!pendingTicketFile) { resetTicketFileUpload(); return; }
  uploadEl.classList.add('has-file');
  const isImage = pendingTicketFile.type.startsWith('image/');
  uploadEl.querySelector('.file-upload-icon').innerHTML = isImage
    ? `<img src="${pendingTicketFile.dataUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:9px"/>`
    : '📄';
  uploadEl.querySelector('.file-upload-label').textContent = pendingTicketFile.name;
  uploadEl.querySelector('.file-upload-hint').textContent = 'Tik om te wijzigen';
}

function resetTicketFileUpload() {
  const uploadEl = document.getElementById('ticket-file-upload');
  if (!uploadEl) return;
  uploadEl.classList.remove('has-file');
  uploadEl.querySelector('.file-upload-icon').textContent = '📎';
  uploadEl.querySelector('.file-upload-label').textContent = 'Ticket toevoegen';
  uploadEl.querySelector('.file-upload-hint').textContent = 'Foto of PDF, max 8MB';
}

async function saveTicket() {
  const name = document.getElementById('ticket-name-input').value.trim();
  if (!name) { showToast('Voer een naam in'); return; }

  const ticket = {
    id: (self.crypto && crypto.randomUUID) ? crypto.randomUUID() : `ticket-${Date.now()}`,
    name,
    venue: document.getElementById('ticket-venue-input').value.trim(),
    code: document.getElementById('ticket-code-input').value.trim(),
    date: document.getElementById('ticket-date-input').value,
    time: document.getElementById('ticket-time-input').value,
    fileDataUrl: pendingTicketFile ? pendingTicketFile.dataUrl : null,
    fileName: pendingTicketFile ? pendingTicketFile.name : null,
    fileType: pendingTicketFile ? pendingTicketFile.type : null,
  };

  AppState.tickets.push(ticket);
  await dbSaveTicket(ticket);
  closeSheet('sheet-ticket');
  showToast(`✓ ${name} opgeslagen`);
  renderTicketsScreen();
  renderHomeScreen();
}

// ── Mijn reizen — echte multi-trip CRUD ───────────────────
function renderTripsScreen() {
  const activeContainer = document.getElementById('active-trip-card');
  const listContainer = document.getElementById('extra-trips-list');
  if (!activeContainer || !listContainer) return;

  const trips = AppState.trips.slice().sort((a, b) => (b.startDate || 0) - (a.startDate || 0));
  const active = trips.find(t => t.isActive);
  const others = trips.filter(t => !t.isActive);

  activeContainer.innerHTML = active ? renderTripCard(active, true) : `
    <p class="mono" style="padding:16px 0">Nog geen reis actief.</p>`;

  listContainer.innerHTML = others.length === 0 ? '' :
    `<p class="eyebrow" style="margin:18px 0 9px">Overige reizen</p>` +
    others.map(t => renderTripCard(t, false)).join('');
}

function renderTripCard(trip, isActive) {
  const from = trip.startDate ? formatShortDate(trip.startDate) : '—';
  const to = trip.endDate ? formatShortDate(trip.endDate) : '—';
  return `
    <div class="card" style="border-left:3px solid ${isActive ? 'var(--spruce)' : 'var(--line)'};margin-bottom:10px;overflow:hidden">
      <div style="padding:16px;display:flex;align-items:flex-start;gap:13px">
        <span style="font-size:28px">${trip.countryFlag || '🌍'}</span>
        <div style="flex:1">
          <p style="font-weight:800;font-size:15.5px">${escapeHtml(trip.name)}</p>
          <p class="mono" style="margin-top:4px">${from} – ${to}</p>
          <div style="display:flex;gap:7px;margin-top:11px">
            ${isActive
              ? `<button onclick="showToast('${escapeHtml(trip.name)} is al actief')" style="padding:7px 14px;background:var(--slope-light);color:var(--spruce);border-radius:20px;border:none;cursor:pointer;font-size:11px;font-weight:700;text-transform:uppercase">✓ Actief</button>`
              : `<button onclick="handleActivateTrip('${trip.id}')" style="padding:7px 14px;background:white;border:1.5px solid var(--line);border-radius:20px;cursor:pointer;font-size:11px;font-weight:700;text-transform:uppercase;color:var(--ink-mid)">Activeren</button>`}
          </div>
        </div>
        <button onclick="handleDeleteTrip('${trip.id}', '${escapeHtml(trip.name).replace(/'/g, "\\'")}')" style="background:none;border:none;cursor:pointer;color:var(--ink-faint);font-size:16px">✕</button>
      </div>
    </div>`;
}

async function handleActivateTrip(tripId) {
  await switchToTrip(tripId);
  renderTripsScreen();
}

async function handleDeleteTrip(tripId, name) {
  if (AppState.trips.length <= 1) { showToast('Je kunt de enige reis niet verwijderen'); return; }
  if (!window._deleteTripConfirm || window._deleteTripConfirm !== tripId) {
    window._deleteTripConfirm = tripId;
    showToast(`Tik nogmaals om "${name}" te verwijderen`, 3000);
    return;
  }
  window._deleteTripConfirm = null;
  await deleteTrip(tripId);
  showToast(`🗑 ${name} verwijderd`);
  renderTripsScreen();
}

let pendingNewAccommodations = [];

function openAddTripSheet() {
  document.getElementById('trip-name-input').value = '';
  pendingNewAccommodations = [{}];
  renderTripAccommodationFields();
  openSheet('sheet-trip');
}

// Eén accommodatie is verplicht (DL-003: accommodatie is de operationele
// eenheid van elke reisdag) — verdere kunnen later via de accommodatie-
// beheerder worden toegevoegd. Hier bewust minimaal: naam, adres,
// check-in/uit, coördinaten (handmatig, zoals de bestaande Noorwegen-data).
function renderTripAccommodationFields() {
  const container = document.getElementById('trip-accommodations-fields');
  if (!container) return;
  container.innerHTML = pendingNewAccommodations.map((_, i) => `
    <div class="card" style="padding:13px;margin-bottom:10px">
      <p class="eyebrow" style="margin-bottom:8px">Verblijf ${i + 1}</p>
      <input id="new-acc-name-${i}" placeholder="Naam accommodatie"/>
      <input id="new-acc-address-${i}" placeholder="Adres"/>
      <div style="display:flex;gap:10px">
        <input id="new-acc-checkin-${i}" type="date" style="flex:1"/>
        <input id="new-acc-checkout-${i}" type="date" style="flex:1"/>
      </div>
      <div style="display:flex;gap:10px;margin-bottom:0">
        <input id="new-acc-lat-${i}" type="number" step="0.0001" placeholder="Breedtegraad (optioneel)" style="flex:1;margin-bottom:0"/>
        <input id="new-acc-lng-${i}" type="number" step="0.0001" placeholder="Lengtegraad (optioneel)" style="flex:1;margin-bottom:0"/>
      </div>
    </div>`).join('');
}

function addAnotherTripAccommodation() {
  pendingNewAccommodations.push({});
  renderTripAccommodationFields();
}

async function saveTrip() {
  const name = document.getElementById('trip-name-input').value.trim();
  if (!name) { showToast('Voer een naam in'); return; }
  const countrySelect = document.getElementById('trip-country-select');
  const country = countrySelect.value.replace(/^\S+\s/, '');
  const countryFlag = countrySelect.value.split(' ')[0];

  const accommodations = pendingNewAccommodations.map((_, i) => {
    const accName = document.getElementById(`new-acc-name-${i}`).value.trim();
    const checkIn = document.getElementById(`new-acc-checkin-${i}`).value;
    const checkOut = document.getElementById(`new-acc-checkout-${i}`).value;
    const lat = parseFloat(document.getElementById(`new-acc-lat-${i}`).value) || 0;
    const lng = parseFloat(document.getElementById(`new-acc-lng-${i}`).value) || 0;
    return {
      name: accName || `Verblijf ${i + 1}`,
      address: document.getElementById(`new-acc-address-${i}`).value.trim(),
      checkIn: checkIn ? new Date(checkIn).toISOString() : new Date().toISOString(),
      checkOut: checkOut ? new Date(checkOut).toISOString() : new Date().toISOString(),
      lat, lng,
      short: (accName || 'Vbl').slice(0, 3),
      color: '#5B8C7B',
      elevation: 0,
      coord: lat && lng ? `${lat}°N ${lng}°E` : '—',
      notes: '',
      phone: null,
    };
  }).filter(a => a.name);

  if (accommodations.length === 0) { showToast('Voeg minstens één verblijf toe'); return; }

  const startDate = new Date(Math.min(...accommodations.map(a => new Date(a.checkIn).getTime())));
  const endDate = new Date(Math.max(...accommodations.map(a => new Date(a.checkOut).getTime())));

  const trip = await createTrip({ name, country, countryFlag, startDate, endDate, accommodations });
  closeSheet('sheet-trip');
  showToast(`✓ ${name} toegevoegd`);
  renderTripsScreen();
  return trip;
}

// ── Instellingen ───────────────────────────────────────────
function selectVehicleType(type) {
  AppState.vehicleType = type;
  ['ev', 'fuel', 'none'].forEach(v => {
    document.getElementById('vehicle-check-' + v).style.opacity = v === type ? '1' : '0';
  });
  const labels = { ev: 'Elektrisch', fuel: 'Benzine', none: 'Geen voertuig' };
  showToast('Voertuig: ' + labels[type]);
}

function toggleTravelStyle(chipEl, style) {
  if (AppState.travelStyles.has(style)) {
    AppState.travelStyles.delete(style);
    chipEl.classList.remove('on');
  } else {
    AppState.travelStyles.add(style);
    chipEl.classList.add('on');
  }
}

function toggleAiEnabled(switchEl) {
  AppState.aiEnabled = !AppState.aiEnabled;
  switchEl.style.background = AppState.aiEnabled ? 'var(--spruce)' : 'var(--line)';
  switchEl.querySelector('.switch-knob').style.left = AppState.aiEnabled ? 'calc(100% - 25px)' : '3px';
  showToast(AppState.aiEnabled ? 'AI-suggesties ingeschakeld' : 'AI-suggesties uitgeschakeld');
}
