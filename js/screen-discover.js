// ═══════════════════════════════════════════════════════════
// screen-discover.js — AI-ideeën scherm
// ═══════════════════════════════════════════════════════════

let discoverShownCount = {}; // hoeveel suggesties per accId al getoond zijn

function renderDiscoverScreen() {
  const acc = getActiveAccommodation();
  document.getElementById('discover-location').textContent =
    `⛅ 14° · ${acc ? acc.short : '—'} · ${acc ? acc.coord : '—'}`;

  if (acc && discoverShownCount[acc.id] === undefined) {
    discoverShownCount[acc.id] = 2; // toon eerst 2 suggesties
  }

  renderDiscoverList();
  initAllTopoPanels();
}

function renderDiscoverList() {
  const acc = getActiveAccommodation();
  if (!acc) {
    document.getElementById('discover-list').innerHTML = `
      <div class="empty-state">
        <p class="row-title">Geen actief verblijf</p>
        <p class="mono" style="margin-top:6px">Suggesties verschijnen zodra je reis begint.</p>
      </div>`;
    return;
  }

  const allSuggestions = AI_SUGGESTIONS[acc.id] || [];
  const shownCount = Math.min(discoverShownCount[acc.id] || 2, allSuggestions.length);
  const visible = allSuggestions.slice(0, shownCount);

  if (visible.length === 0) {
    document.getElementById('discover-list').innerHTML = `
      <div class="empty-state">
        <p class="row-title">Nog geen suggesties voor ${escapeHtml(acc.name)}</p>
      </div>`;
    return;
  }

  document.getElementById('discover-list').innerHTML = visible.map(s => renderSuggestionCard(s, acc)).join('');

  // "Meer ideeën" knop: uitschakelen als alles al getoond is
  const moreBtn = document.getElementById('discover-more-btn');
  if (moreBtn) {
    const allShown = shownCount >= allSuggestions.length;
    moreBtn.disabled = allShown;
    moreBtn.textContent = allShown ? 'Alle ideeën getoond' : '↻ Meer ideeën';
  }
}

function renderSuggestionCard(suggestion, acc) {
  const key = acc.short + '-' + suggestion.name;
  const isAdded = AppState.discoveredAdded.has(key);
  return `
    <div class="card" style="display:flex;overflow:hidden;cursor:pointer" onclick="showToast('${escapeHtml(suggestion.name)} · ${suggestion.distance} · ${suggestion.duration}')">
      <div style="width:84px;flex-shrink:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:${acc.color};padding:12px 0">
        <span style="font-size:30px">${suggestion.emoji}</span>
        <span class="mono" style="color:rgba(255,255,255,.85);font-weight:700;margin-top:3px">${suggestion.elevation}m</span>
      </div>
      <div style="flex:1;padding:12px;min-width:0">
        <div class="from-acc-badge" style="background:${acc.color}18;color:${acc.color};display:inline-block;margin-bottom:6px">VANUIT ${acc.short.toUpperCase()}</div>
        <p style="font-weight:800;font-size:15px;letter-spacing:-0.2px">${escapeHtml(suggestion.name)}</p>
        <p style="font-size:12px;color:var(--ink-mid);margin-top:2px">${escapeHtml(suggestion.sub)}</p>
        <p class="mono" style="margin-top:4px">${suggestion.distance} · ${suggestion.duration}</p>
        <div style="display:flex;gap:8px;margin-top:10px">
          <button onclick="event.stopPropagation();handleAddSuggestion('${escapeHtml(suggestion.name).replace(/'/g, "\\'")}', ${acc.id})"
            style="padding:6px 14px;background:${isAdded ? 'var(--slope)' : 'var(--spruce)'};color:white;border-radius:20px;border:none;cursor:pointer;font-size:11px;font-weight:700;text-transform:uppercase">
            ${isAdded ? '✓ Gepland' : '+ Plan'}
          </button>
          <button onclick="event.stopPropagation();showToast('Route naar ${escapeHtml(suggestion.name).replace(/'/g, "\\'")}')"
            style="padding:6px 12px;border:1.5px solid var(--line);background:white;border-radius:20px;cursor:pointer;font-size:11px;font-weight:700;text-transform:uppercase;color:var(--ink-mid)">
            Route
          </button>
        </div>
      </div>
    </div>`;
}

function handleAddSuggestion(name, accId) {
  const acc = ACCOMMODATIONS.find(a => a.id === accId);
  const key = acc.short + '-' + name;
  if (AppState.discoveredAdded.has(key)) { showToast('Al toegevoegd aan planning'); return; }
  addActivity({ name, accId, date: null, emoji: '📍' });
  AppState.discoveredAdded.add(key);
  showToast(`✓ ${name} toegevoegd aan planning`);
  renderDiscoverList();
}

// FIX: "Meer ideeën" toonde voorheen alleen een nepmelding.
// Nu telt het echt het aantal getoonde suggesties op en herrendert de lijst.
function handleLoadMoreSuggestions() {
  const acc = getActiveAccommodation();
  if (!acc) return;
  const total = (AI_SUGGESTIONS[acc.id] || []).length;
  const current = discoverShownCount[acc.id] || 2;
  if (current >= total) { showToast('Geen nieuwe ideeën meer voor dit verblijf'); return; }
  discoverShownCount[acc.id] = Math.min(current + 2, total);
  renderDiscoverList();
  showToast('Nieuwe ideeën geladen');
}

function setDiscoverFilter(chipEl) {
  document.querySelectorAll('#screen-discover .chip').forEach(c => c.classList.remove('on'));
  chipEl.classList.add('on');
}
