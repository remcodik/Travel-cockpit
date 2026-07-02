// ═══════════════════════════════════════════════════════════
// screen-discover.js — AI-ideeën met Firestore cache
// - Alleen vernieuwen als gebruiker op de knop drukt
// - Twee modi: Verblijf en Hier (GPS-locatie)
// - Komoot-link bij wandelactiviteiten
// - Toevoegen vanuit Discover → direct zichtbaar in Planning
// ═══════════════════════════════════════════════════════════

let currentSuggestions = [];
let currentCategoryFilter = null;
let isLoadingSuggestions = false;
let discoverMode = 'accommodation'; // 'accommodation' | 'here'
let discoverGpsLocation = null; // { lat, lng } als mode = 'here'

function renderDiscoverScreen() {
  const acc = getActiveAccommodation();
  updateDiscoverHeader(acc);

  // Toon gecachede suggesties direct — geen auto-fetch
  loadCachedSuggestions(acc).then(cached => {
    if (cached && cached.length > 0) {
      currentSuggestions = cached;
      renderSuggestionList();
    } else {
      showEmptyDiscoverState(
        'Geen ideeën geladen',
        'Tik op ↻ om AI-suggesties op te halen voor dit verblijf.'
      );
      updateRefreshButtonState();
    }
  });
}

function updateDiscoverHeader(acc) {
  const el = document.getElementById('discover-location');
  if (!el) return;
  const loc = acc ? `${acc.short} · ${acc.coord}` : '—';
  el.textContent = `… · ${loc}`;

  // Topografisch patroon volgt de daadwerkelijke locatie (GPS in "Hier"-
  // modus, anders de accommodatie) i.p.v. altijd hetzelfde vaste patroon.
  const topoLat = discoverMode === 'here' && discoverGpsLocation ? discoverGpsLocation.lat : (acc ? acc.lat : null);
  const topoLng = discoverMode === 'here' && discoverGpsLocation ? discoverGpsLocation.lng : (acc ? acc.lng : null);
  const topoSvg = document.querySelector('#screen-discover .topo-svg');
  if (topoSvg && topoLat != null && topoLng != null) {
    topoSvg.dataset.topo = topoSeedForLocation(topoLat, topoLng, acc ? acc.elevation : undefined);
    if (acc) topoSvg.dataset.topoElevation = acc.elevation;
    initAllTopoPanels();
  }

  if (acc) {
    getWeatherForDate(acc.lat, acc.lng, getToday()).then(w => {
      if (!el) return;
      const tempLabel = w ? (w.isForecast
        ? `${w.temperatureMin}°–${w.temperatureMax}°`
        : `${w.temperature}°`) : '—°';
      const emoji = w ? w.emoji : '';
      const loc2 = discoverMode === 'here' && discoverGpsLocation
        ? `Hier · ${discoverGpsLocation.lat.toFixed(3)}°N`
        : (acc ? `${acc.short} · ${acc.coord}` : '—');
      el.textContent = `${emoji} ${tempLabel} · ${loc2}`;
    });
  }
}

async function loadCachedSuggestions(acc) {
  if (!acc) return null;
  // Probeer eerst Firestore, val terug op localStorage
  try {
    const dbCache = await dbLoadAiSuggestions(acc.id);
    if (dbCache) return dbCache;
  } catch (e) {}

  try {
    const lsCache = localStorage.getItem(`tc_ai_cache_${acc.id}`);
    if (lsCache) {
      const parsed = JSON.parse(lsCache);
      if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) return parsed.suggestions;
    }
  } catch (e) {}
  return null;
}

async function saveSuggestionsToCache(accId, suggestions) {
  // Sla op in beide: Firestore (gedeeld) en localStorage (offline)
  try { await dbSaveAiSuggestions(accId, suggestions); } catch (e) {}
  try {
    localStorage.setItem(`tc_ai_cache_${accId}`, JSON.stringify({
      suggestions, timestamp: Date.now()
    }));
  } catch (e) {}
}

// ── Modi schakelen ────────────────────────────────────────
function setDiscoverMode(mode, btnEl) {
  document.querySelectorAll('[data-discover-mode]').forEach(b => b.classList.remove('on'));
  btnEl.classList.add('on');

  if (mode === 'here') {
    discoverMode = 'here';
    if (!navigator.geolocation) {
      showToast('GPS niet beschikbaar op dit apparaat');
      setDiscoverMode('accommodation', document.querySelector('[data-discover-mode="accommodation"]'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        discoverGpsLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        updateDiscoverHeader(getActiveAccommodation());
        showToast('📍 Locatie bepaald — tik ↻ voor suggesties');
      },
      err => {
        showToast('GPS-fout: ' + err.message);
        setDiscoverMode('accommodation', document.querySelector('[data-discover-mode="accommodation"]'));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  } else {
    discoverMode = 'accommodation';
    discoverGpsLocation = null;
    updateDiscoverHeader(getActiveAccommodation());
  }
}

// ── Categorie-filter ──────────────────────────────────────
function setDiscoverFilter(chipEl, category) {
  document.querySelectorAll('#screen-discover .chip:not([data-discover-mode])').forEach(c => c.classList.remove('on'));
  chipEl.classList.add('on');
  currentCategoryFilter = category;
  // Filter past de huidige lijst — geen nieuwe API-aanroep
  renderSuggestionList();
}

// ── Refresh — alleen op knop, nooit automatisch ───────────
async function handleLoadMoreSuggestions() {
  const acc = getActiveAccommodation();
  if (!acc || isLoadingSuggestions) return;

  isLoadingSuggestions = true;
  updateRefreshButtonState();
  showLoadingState();

  if (!navigator.onLine) {
    isLoadingSuggestions = false;
    updateRefreshButtonState();
    const cached = await loadCachedSuggestions(acc);
    if (cached) {
      currentSuggestions = cached;
      renderSuggestionList();
      showToast('Offline · toont opgeslagen ideeën');
    } else {
      showOfflineState();
    }
    return;
  }

  // Bepaal locatie op basis van modus
  const baseLat = discoverMode === 'here' && discoverGpsLocation
    ? discoverGpsLocation.lat : acc.lat;
  const baseLng = discoverMode === 'here' && discoverGpsLocation
    ? discoverGpsLocation.lng : acc.lng;

  const alreadyNamed = AppState.activities.map(a => a.name);
  const liveWeather = await getWeatherForDate(baseLat, baseLng, getToday());

  const payload = {
    accommodationName: discoverMode === 'here'
      ? `Huidige locatie (${baseLat.toFixed(3)}°N, ${baseLng.toFixed(3)}°E)`
      : acc.name,
    accommodationLocation: discoverMode === 'here'
      ? `${baseLat.toFixed(4)}, ${baseLng.toFixed(4)}`
      : acc.address,
    country: 'Noorwegen',
    today: formatShortDate(getToday()),
    temperature: liveWeather ? liveWeather.temperature : 12,
    weatherCondition: liveWeather ? liveWeather.condition : 'bewolkt',
    rainProbability: liveWeather ? liveWeather.rainProbability : 20,
    userPreferences: Array.from(AppState.travelStyles),
    alreadyPlanned: alreadyNamed,
    categoryFilter: currentCategoryFilter,
    language: AppState.language || 'nl',
    weatherAdaptation: AppState.weatherSuggestionsEnabled,
  };

  try {
    const response = await fetch('/api/suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Onbekende fout');

    const newSuggestions = (data.suggestions || []).map(s => ({ ...s, accId: acc.id }));
    currentSuggestions = newSuggestions;
    await saveSuggestionsToCache(acc.id, currentSuggestions);
    renderSuggestionList();
    showToast(`✓ ${newSuggestions.length} nieuwe ideeën`);
  } catch (err) {
    console.error('AI fetch mislukt:', err);
    const cached = await loadCachedSuggestions(acc);
    if (cached) {
      currentSuggestions = cached;
      renderSuggestionList();
      showToast('Toont opgeslagen ideeën — nieuwe kon niet worden geladen');
    } else {
      showErrorState(err.message);
    }
  } finally {
    isLoadingSuggestions = false;
    updateRefreshButtonState();
  }
}

function updateRefreshButtonState() {
  const btn = document.getElementById('discover-more-btn');
  if (!btn) return;
  btn.disabled = isLoadingSuggestions;
  btn.textContent = isLoadingSuggestions ? 'Laden…' : '↻ Nieuwe ideeën';
}

// ── Render states ──────────────────────────────────────────
function showLoadingState() {
  const skeletonCard = `
    <div class="card skeleton-card" style="display:flex;overflow:hidden">
      <div class="skeleton-shimmer" style="width:80px;flex-shrink:0"></div>
      <div style="flex:1;padding:12px;min-width:0">
        <div class="skeleton-shimmer" style="height:11px;width:70px;border-radius:20px;margin-bottom:8px"></div>
        <div class="skeleton-shimmer" style="height:15px;width:65%;border-radius:4px;margin-bottom:7px"></div>
        <div class="skeleton-shimmer" style="height:11px;width:90%;border-radius:4px;margin-bottom:5px"></div>
        <div class="skeleton-shimmer" style="height:11px;width:40%;border-radius:4px"></div>
      </div>
    </div>`;
  document.getElementById('discover-list').innerHTML = skeletonCard.repeat(3);
}

function showOfflineState() {
  document.getElementById('discover-list').innerHTML = `
    <div class="empty-state">
      <p class="row-title">Offline</p>
      <p class="mono" style="margin-top:6px">Geen internet. Opgeslagen ideeën worden getoond zodra ze beschikbaar zijn.</p>
    </div>`;
}

function showErrorState(message) {
  document.getElementById('discover-list').innerHTML = `
    <div class="empty-state">
      <p class="row-title" style="color:var(--summit)">Kon ideeën niet laden</p>
      <p class="mono" style="margin-top:6px;margin-bottom:16px">${escapeHtml(message)}</p>
      <button onclick="handleLoadMoreSuggestions()" class="btn btn-primary" style="width:auto;padding:10px 20px">Opnieuw</button>
    </div>`;
}

function showEmptyDiscoverState(title, sub) {
  document.getElementById('discover-list').innerHTML = `
    <div class="empty-state">
      <p class="row-title">${escapeHtml(title)}</p>
      <p class="mono" style="margin-top:6px">${escapeHtml(sub)}</p>
    </div>`;
}

function renderSuggestionList() {
  const acc = getActiveAccommodation();
  let list = currentSuggestions;

  // Pas categorie-filter toe zonder API aan te roepen
  // FIX (H3): de "Eten & café"-chip geeft filter 'restaurant' mee maar
  // moet ook 'cafe'-suggesties tonen — anders verdwijnen cafés stil
  // ondanks de knoptekst.
  if (currentCategoryFilter) {
    list = list.filter(s =>
      s.category === currentCategoryFilter ||
      (currentCategoryFilter === 'restaurant' && s.category === 'cafe') ||
      (currentCategoryFilter === 'activity' && !['restaurant','cafe','viewpoint'].includes(s.category)));
  }

  if (!acc || list.length === 0) {
    showEmptyDiscoverState(
      currentCategoryFilter ? 'Geen resultaten voor dit filter' : 'Geen ideeën',
      'Tik op ↻ om nieuwe AI-suggesties op te halen.'
    );
    return;
  }
  document.getElementById('discover-list').innerHTML = list.map(s => renderSuggestionCard(s, acc)).join('');
  updateRefreshButtonState();
}

function renderSuggestionCard(suggestion, acc) {
  const key = acc.short + '-' + suggestion.name;
  const isAdded = AppState.discoveredAdded.has(key);
  const categoryEmoji = CATEGORY_EMOJIS[suggestion.category] || CATEGORY_EMOJIS.default;
  const isWalking = suggestion.category === 'activity';

  const durationLabel = suggestion.duration_minutes
    ? (suggestion.duration_minutes >= 60
        ? `${Math.round(suggestion.duration_minutes / 60)} u`
        : `${suggestion.duration_minutes} min`)
    : '';

  return `
    <div class="card" style="display:flex;overflow:hidden">
      <div style="width:80px;flex-shrink:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:${acc.color};padding:12px 0;gap:4px">
        <span style="font-size:28px">${categoryEmoji}</span>
        ${suggestion.distance_km ? `<span class="mono" style="color:rgba(255,255,255,.8);font-weight:700;font-size:11px">${suggestion.distance_km} km</span>` : ''}
        ${durationLabel ? `<span class="mono" style="color:rgba(255,255,255,.6);font-size:10px">${durationLabel}</span>` : ''}
      </div>
      <div style="flex:1;padding:12px;min-width:0">
        <div class="from-acc-badge" style="background:${acc.color}18;color:${acc.color};display:inline-block;margin-bottom:5px">
          ${discoverMode === 'here' ? '📍 HIER' : `VANUIT ${acc.short.toUpperCase()}`}
        </div>
        <p style="font-weight:800;font-size:15px;letter-spacing:-0.2px">${escapeHtml(suggestion.name)}</p>
        <p style="font-size:12px;color:var(--ink-mid);margin-top:2px;line-height:1.5">${escapeHtml(suggestion.description || '')}</p>
        ${suggestion.why_recommended ? `<p style="font-size:11px;color:var(--ink-faint);margin-top:4px;line-height:1.4">${escapeHtml(suggestion.why_recommended)}</p>` : ''}
        <div style="display:flex;flex-wrap:wrap;gap:7px;margin-top:10px">
          <button onclick="handleAddSuggestion('${escapeHtml(suggestion.name).replace(/'/g, "\\'")}', '${acc.id}', '${suggestion.category || ''}')"
            style="padding:6px 14px;background:${isAdded ? 'var(--slope)' : 'var(--spruce)'};color:white;border-radius:20px;border:none;cursor:pointer;font-size:11px;font-weight:700;text-transform:uppercase">
            ${isAdded ? '✓ Gepland' : '+ Plan'}
          </button>
          <button onclick="openRouteOptionsSheet('${escapeHtml(suggestion.name).replace(/'/g, "\\'")}', '${escapeHtml(suggestion.google_maps_query || suggestion.name).replace(/'/g, "\\'")}')"
            style="padding:6px 12px;border:1.5px solid var(--line);background:white;border-radius:20px;cursor:pointer;font-size:11px;font-weight:700;text-transform:uppercase;color:var(--ink-mid)">
            Route
          </button>
          ${isWalking ? `
          <a href="https://www.komoot.com/smart-tour?sport=hike&q=${encodeURIComponent(suggestion.name + ' ' + (acc ? acc.name : ''))}" target="_blank"
            style="padding:6px 12px;border:1.5px solid #6fbe6f;background:white;border-radius:20px;cursor:pointer;font-size:11px;font-weight:700;text-transform:uppercase;color:#3d8c3d;text-decoration:none;display:inline-flex;align-items:center;gap:4px">
            🗺 Komoot
          </a>` : ''}
        </div>
      </div>
    </div>`;
}

function openRouteOptionsSheet(name, mapsQuery) {
  // Route-knop: keuze tussen vanaf hier (GPS) of vanaf verblijf
  const acc = getActiveAccommodation();
  const fromAccUrl = acc
    ? `https://www.google.com/maps/dir/${acc.lat},${acc.lng}/${encodeURIComponent(mapsQuery)}`
    : `https://www.google.com/maps/search/${encodeURIComponent(mapsQuery)}`;
  const fromHereUrl = `https://www.google.com/maps/dir/Current+Location/${encodeURIComponent(mapsQuery)}`;

  document.getElementById('route-options-title').textContent = name;
  document.getElementById('route-from-acc-btn').onclick = () => window.open(fromAccUrl, '_blank');
  document.getElementById('route-from-here-btn').onclick = () => window.open(fromHereUrl, '_blank');
  document.getElementById('route-from-acc-label').textContent = acc ? `Vanaf ${acc.name}` : 'Vanaf verblijf';
  openSheet('sheet-route-options');
}

async function handleAddSuggestion(name, accId, category) {
  const acc = ACCOMMODATIONS.find(a => idsMatch(a.id, accId));
  const key = acc.short + '-' + name;
  if (AppState.discoveredAdded.has(key)) {
    showToast('Al toegevoegd aan planning');
    return;
  }

  // FIX: het categorie-icoon (🏔️/🍽️/☕/🌄) ging verloren zodra een
  // AI-suggestie werd ingepland — in Planning/Kaart/Vandaag werd alles
  // een generieke 📍. Nu draagt het icoon mee, consistent met Discover.
  const emoji = CATEGORY_EMOJIS[category] || CATEGORY_EMOJIS.default;

  // Voeg toe zonder datum zodat het als "beschikbaar" verschijnt
  await addActivity({ name, accId, date: null, emoji });
  AppState.discoveredAdded.add(key);
  showToast(`✓ "${name}" toegevoegd aan planning`);
  renderSuggestionList(); // herrender met bijgewerkte staat
}
