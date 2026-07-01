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
  AppState.tickets.splice(index, 1);
  await dbDeleteTicket(index);
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
    name,
    venue: document.getElementById('ticket-venue-input').value.trim(),
    code: document.getElementById('ticket-code-input').value.trim(),
    date: document.getElementById('ticket-date-input').value,
    time: document.getElementById('ticket-time-input').value,
    fileDataUrl: pendingTicketFile ? pendingTicketFile.dataUrl : null,
    fileName: pendingTicketFile ? pendingTicketFile.name : null,
    fileType: pendingTicketFile ? pendingTicketFile.type : null,
  };

  const newIndex = AppState.tickets.length;
  AppState.tickets.push(ticket);
  await dbSaveTicket(ticket, newIndex);
  closeSheet('sheet-ticket');
  showToast(`✓ ${name} opgeslagen`);
  renderTicketsScreen();
  renderHomeScreen();
}

// ── Mijn reizen ────────────────────────────────────────────
function renderTripsScreen() {
  const container = document.getElementById('extra-trips-list');
  if (AppState.extraTrips.length === 0) { container.innerHTML = ''; return; }
  container.innerHTML = `<p class="eyebrow" style="margin:18px 0 9px">Overige reizen</p>` +
    AppState.extraTrips.map((trip, i) => `
      <div class="card" style="margin-bottom:10px">
        <div style="padding:15px;display:flex;align-items:flex-start;gap:12px">
          <span style="font-size:28px">${trip.country.split(' ')[0]}</span>
          <div style="flex:1">
            <p style="font-weight:800;font-size:15px">${escapeHtml(trip.name)}</p>
            <p class="mono" style="margin-top:4px">${trip.from || '—'} – ${trip.to || '—'}</p>
          </div>
          <button onclick="removeTrip(${i})" style="background:none;border:none;cursor:pointer;color:var(--ink-faint);font-size:16px">✕</button>
        </div>
      </div>`).join('');
}

function removeTrip(index) {
  AppState.extraTrips.splice(index, 1);
  showToast('Reis verwijderd');
  renderTripsScreen();
}

function openAddTripSheet() {
  document.getElementById('trip-name-input').value = '';
  openSheet('sheet-trip');
}

function saveTrip() {
  const name = document.getElementById('trip-name-input').value.trim();
  if (!name) { showToast('Voer een naam in'); return; }
  AppState.extraTrips.push({
    name,
    country: document.getElementById('trip-country-select').value,
    from: document.getElementById('trip-from-input').value,
    to: document.getElementById('trip-to-input').value,
  });
  closeSheet('sheet-trip');
  showToast(`✓ ${name} toegevoegd`);
  renderTripsScreen();
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
