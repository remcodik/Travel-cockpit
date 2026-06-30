// ═══════════════════════════════════════════════════════════
// screen-discover.js — AI-ideeën scherm met echte Claude-integratie
// Volgt docs/04-ai/01-ai-architecture.md:
// - Roept /api/suggestions aan (Anthropic Claude, server-side)
// - Cachet per accommodatie, verloopt na 24 uur
// - Toont "Offline" label en cache bij geen internet
// - AI voegt nooit zelf iets toe — alleen na expliciete tap
// ═══════════════════════════════════════════════════════════

const AI_CACHE_KEY_PREFIX = 'tc_ai_cache_';
const AI_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 uur, conform documentatie

let currentSuggestions = [];
let currentCategoryFilter = null;
let isLoadingSuggestions = false;
let lastLoadFailed = false;

function renderDiscoverScreen() {
  const acc = getActiveAccommodation();
  document.getElementById('discover-location').textContent =
    `… · ${acc ? acc.short : '—'} · ${acc ? acc.coord : '—'}`;

  if (acc) {
    getWeatherForDate(acc.lat, acc.lng, getToday()).then(function(w) {
      const el = document.getElementById('discover-location');
      if (!el) return;
      if (w) {
        const tempLabel = w.isForecast ? `${w.temperatureMin}°–${w.temperatureMax}°` : `${w.temperature}°`;
        el.textContent = `${w.emoji} ${tempLabel} · ${acc.short} · ${acc.coord}`;
      } else {
        el.textContent = `${acc.short} · ${acc.coord}`;
      }
    });
  }

  if (!acc) {
    showEmptyDiscoverState('Geen actief verblijf', 'Suggesties verschijnen zodra je reis begint.');
    return;
  }

  const cached = readSuggestionCache(acc.id);
  if (cached) {
    currentSuggestions = cached.suggestions;
    renderSuggestionList();
  } else {
    showLoadingState();
  }

  fetchFreshSuggestions(acc, { append: false });
}

function cacheKey(accId) {
  return AI_CACHE_KEY_PREFIX + accId;
}

function readSuggestionCache(accId) {
  try {
    const raw = localStorage.getItem(cacheKey(accId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > AI_CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSuggestionCache(accId, suggestions) {
  try {
    localStorage.setItem(cacheKey(accId), JSON.stringify({
      suggestions,
      timestamp: Date.now(),
    }));
  } catch {
    // localStorage kan vol zijn of geblokkeerd — niet kritisch
  }
}

async function fetchFreshSuggestions(acc, options) {
  const append = options && options.append;
  if (isLoadingSuggestions) return;
  isLoadingSuggestions = true;
  lastLoadFailed = false;
  updateRefreshButtonState();

  if (!navigator.onLine) {
    isLoadingSuggestions = false;
    lastLoadFailed = true;
    updateRefreshButtonState();
    if (currentSuggestions.length === 0) {
      showOfflineState();
    } else {
      showToast('Offline · suggesties uit cache');
    }
    return;
  }

  const alreadyPlannedNames = AppState.activities
    .filter(a => a.accId === acc.id)
    .map(a => a.name);

  // Live weer ophalen voor de AI-context — geen vaste 14°C meer.
  // Bij falen vallen we terug op een neutrale aanname zodat de
  // AI-aanroep niet blokkeert op een weer-fout.
  const liveWeather = await getWeatherForDate(acc.lat, acc.lng, getToday());

  const payload = {
    accommodationName: acc.name,
    accommodationLocation: acc.address,
    country: 'Noorwegen',
    today: formatShortDate(getToday()),
    temperature: liveWeather ? liveWeather.temperature : 12,
    weatherCondition: liveWeather ? liveWeather.condition : 'onbekend',
    rainProbability: liveWeather ? liveWeather.rainProbability : 20,
    userPreferences: Array.from(AppState.travelStyles),
    alreadyPlanned: append
      ? alreadyPlannedNames.concat(currentSuggestions.map(function(s){ return s.name; }))
      : alreadyPlannedNames,
    categoryFilter: currentCategoryFilter,
    language: 'nl',
  };

  try {
    const response = await fetch('/api/suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Onbekende fout bij ophalen suggesties');
    }

    const newSuggestions = (data.suggestions || []).map(function(s) {
      return Object.assign({}, s, { accId: acc.id });
    });

    currentSuggestions = append ? currentSuggestions.concat(newSuggestions) : newSuggestions;
    writeSuggestionCache(acc.id, currentSuggestions);
    renderSuggestionList();
    showToast(append ? `✓ ${newSuggestions.length} nieuwe ideeën` : 'Ideeën bijgewerkt');
  } catch (err) {
    console.error('AI-suggesties ophalen mislukt:', err);
    lastLoadFailed = true;
    if (currentSuggestions.length === 0) {
      showErrorState(err.message);
    } else {
      showToast('Kon geen nieuwe ideeën ophalen — toont cache');
    }
  } finally {
    isLoadingSuggestions = false;
    updateRefreshButtonState();
  }
}

function updateRefreshButtonState() {
  const moreBtn = document.getElementById('discover-more-btn');
  if (!moreBtn) return;
  moreBtn.disabled = isLoadingSuggestions;
  moreBtn.textContent = isLoadingSuggestions ? 'Laden…' : '↻ Meer ideeën';
}

function showLoadingState() {
  document.getElementById('discover-list').innerHTML = `
    <div class="empty-state">
      <div class="spinner" style="margin-bottom:14px"></div>
      <p class="mono">AI-suggesties laden…</p>
    </div>`;
}

function showOfflineState() {
  document.getElementById('discover-list').innerHTML = `
    <div class="empty-state">
      <p class="row-title">Offline</p>
      <p class="mono" style="margin-top:6px">Geen internetverbinding. Suggesties laden zodra je weer online bent.</p>
    </div>`;
}

function showErrorState(message) {
  document.getElementById('discover-list').innerHTML = `
    <div class="empty-state">
      <p class="row-title" style="color:var(--summit)">Kon ideeën niet laden</p>
      <p class="mono" style="margin-top:6px;margin-bottom:16px">${escapeHtml(message)}</p>
      <button onclick="retryLoadSuggestions()" class="btn btn-primary" style="width:auto;padding:10px 20px">Opnieuw proberen</button>
    </div>`;
}

function showEmptyDiscoverState(title, sub) {
  document.getElementById('discover-list').innerHTML = `
    <div class="empty-state">
      <p class="row-title">${escapeHtml(title)}</p>
      <p class="mono" style="margin-top:6px">${escapeHtml(sub)}</p>
    </div>`;
}

function retryLoadSuggestions() {
  const acc = getActiveAccommodation();
  if (acc) fetchFreshSuggestions(acc, { append: false });
}

function renderSuggestionList() {
  const acc = getActiveAccommodation();
  if (!acc || currentSuggestions.length === 0) {
    showEmptyDiscoverState('Nog geen suggesties', 'Tik op vernieuwen om ideeën te laden.');
    return;
  }
  document.getElementById('discover-list').innerHTML =
    currentSuggestions.map(function(s) { return renderSuggestionCard(s, acc); }).join('');
  updateRefreshButtonState();
}

function renderSuggestionCard(suggestion, acc) {
  const key = acc.short + '-' + suggestion.name;
  const isAdded = AppState.discoveredAdded.has(key);
  const categoryEmojis = { activity: '🏔️', restaurant: '🍽️', cafe: '☕', viewpoint: '🌄' };
  const categoryEmoji = categoryEmojis[suggestion.category] || '📍';
  let durationLabel = '';
  if (suggestion.duration_minutes) {
    durationLabel = suggestion.duration_minutes >= 60
      ? Math.round(suggestion.duration_minutes / 60) + ' u'
      : suggestion.duration_minutes + ' min';
  }

  return `
    <div class="card" style="display:flex;overflow:hidden;cursor:pointer" onclick="showToast('${escapeHtml(suggestion.name)}')">
      <div style="width:84px;flex-shrink:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:${acc.color};padding:12px 0">
        <span style="font-size:30px">${categoryEmoji}</span>
        ${suggestion.distance_km ? `<span class="mono" style="color:rgba(255,255,255,.85);font-weight:700;margin-top:3px">${suggestion.distance_km} km</span>` : ''}
      </div>
      <div style="flex:1;padding:12px;min-width:0">
        <div class="from-acc-badge" style="background:${acc.color}18;color:${acc.color};display:inline-block;margin-bottom:6px">VANUIT ${acc.short.toUpperCase()}</div>
        <p style="font-weight:800;font-size:15px;letter-spacing:-0.2px">${escapeHtml(suggestion.name)}</p>
        <p style="font-size:12px;color:var(--ink-mid);margin-top:2px">${escapeHtml(suggestion.description || '')}</p>
        ${suggestion.why_recommended ? `<p class="mono" style="margin-top:5px;font-style:italic">💡 ${escapeHtml(suggestion.why_recommended)}</p>` : ''}
        <p class="mono" style="margin-top:4px">${durationLabel}${suggestion.difficulty ? ' · ' + suggestion.difficulty : ''}</p>
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
  const acc = ACCOMMODATIONS.find(function(a) { return a.id === accId; });
  const key = acc.short + '-' + name;
  if (AppState.discoveredAdded.has(key)) { showToast('Al toegevoegd aan planning'); return; }
  addActivity({ name: name, accId: accId, date: null, emoji: '📍' });
  AppState.discoveredAdded.add(key);
  showToast(`✓ ${name} toegevoegd aan planning`);
  renderSuggestionList();
}

function handleLoadMoreSuggestions() {
  const acc = getActiveAccommodation();
  if (!acc) return;
  fetchFreshSuggestions(acc, { append: true });
}

function setDiscoverFilter(chipEl, category) {
  document.querySelectorAll('#screen-discover .chip').forEach(function(c) { c.classList.remove('on'); });
  chipEl.classList.add('on');
  currentCategoryFilter = category;
  const acc = getActiveAccommodation();
  if (acc) {
    showLoadingState();
    fetchFreshSuggestions(acc, { append: false });
  }
}
