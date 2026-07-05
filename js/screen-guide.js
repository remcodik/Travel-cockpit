// ═══════════════════════════════════════════════════════════
// screen-guide.js — Reisgids: omgevingsinfo bij een verblijf
// On-demand AI-blok (karakter streek, geschiedenis/cultuur,
// bezienswaardigheden om te weten, praktische tips) + twee vaste,
// veilige zoeklinks (Wikipedia/Wikivoyage) — geen AI-gegenereerde
// URL's, zie js/state.js voor de reden (Komoot-link-bug).
// Resultaat wordt gecached in Firestore (dbSaveRegionGuide()), dus
// niet bij elk bezoek opnieuw een AI-aanroep (kost geld + tijd).
// ═══════════════════════════════════════════════════════════

function navigateToRegionGuide(accId) {
  AppState.viewingAccommodationId = accId;
  navigateTo('guide');
}

async function renderRegionGuideScreen() {
  const acc = ACCOMMODATIONS.find(a => idsMatch(a.id, AppState.viewingAccommodationId)) || getActiveAccommodation();
  if (!acc) return;

  document.getElementById('guide-acc-name').textContent = acc.name;

  const contentEl = document.getElementById('guide-content');
  contentEl.innerHTML = `
    <div class="empty-state" style="padding:24px 0">
      <div class="spinner" style="margin-bottom:12px"></div>
      <p class="mono">Reisgids laden…</p>
    </div>`;

  const cached = await dbLoadRegionGuide(acc.id);
  if (cached) {
    renderRegionGuideContent(acc, cached);
  } else {
    renderRegionGuideEmptyState(acc);
  }
}

function renderRegionGuideEmptyState(acc) {
  const contentEl = document.getElementById('guide-content');
  contentEl.innerHTML = `
    <div class="empty-state" style="padding:32px 0">
      <span style="font-size:34px">📖</span>
      <p class="row-title" style="font-size:17px;margin-top:14px">Nog geen reisgids voor ${escapeHtml(acc.name)}</p>
      <p class="mono" style="margin-top:6px;text-align:center;line-height:1.5">AI schrijft een korte introductie over de omgeving:<br/>karakter van de streek, geschiedenis en praktische tips.</p>
      <button onclick="handleGenerateRegionGuide('${acc.id}')" class="btn btn-primary" style="margin-top:20px;width:auto;padding:10px 20px">✨ Genereer reisgids</button>
    </div>`;
}

async function handleGenerateRegionGuide(accId) {
  const acc = ACCOMMODATIONS.find(a => idsMatch(a.id, accId));
  if (!acc) return;
  const trip = AppState.trips.find(t => t.id === getCurrentTripId());

  const contentEl = document.getElementById('guide-content');
  contentEl.innerHTML = `
    <div class="empty-state" style="padding:32px 0">
      <div class="spinner" style="margin-bottom:12px"></div>
      <p class="mono">AI schrijft de reisgids voor ${escapeHtml(acc.name)}…</p>
    </div>`;

  try {
    const response = await fetch('/api/region-guide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accommodationName: acc.name,
        accommodationLocation: acc.address,
        country: (trip && trip.country) || 'Noorwegen',
        travelStyles: Array.from(AppState.travelStyles),
        language: AppState.language || 'nl',
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Onbekende fout');

    await dbSaveRegionGuide(acc.id, data.guide);
    renderRegionGuideContent(acc, data.guide);
  } catch (err) {
    contentEl.innerHTML = `
      <div class="empty-state" style="padding:32px 0">
        <p class="mono" style="color:var(--summit)">Reisgids genereren mislukt: ${escapeHtml(err.message)}</p>
        <button onclick="handleGenerateRegionGuide('${accId}')" class="btn btn-outline" style="margin-top:16px;width:auto;padding:10px 20px">Opnieuw</button>
      </div>`;
  }
}

function renderRegionGuideContent(acc, guide) {
  const contentEl = document.getElementById('guide-content');
  const lang = AppState.language || 'en';
  const searchQuery = extractCityFromAddress(acc.address) || acc.name;

  contentEl.innerHTML = `
    <div style="background:var(--paper-warm);border-radius:10px;padding:10px 12px;margin-bottom:16px;font-size:11.5px;color:var(--ink-faint);line-height:1.5">
      💡 AI-samenvatting, geen gegarandeerde feiten — controleer belangrijke details zelf.
    </div>
    ${(guide.paragraphs || []).map(p => `<p style="font-size:13.5px;line-height:1.7;color:var(--ink-mid);margin-bottom:14px">${escapeHtml(p)}</p>`).join('')}
    ${(guide.highlights || []).length ? `
      <span class="eyebrow" style="display:block;margin-bottom:9px">Goed om te weten</span>
      <div class="card" style="margin-bottom:18px;overflow:hidden">
        ${guide.highlights.map((h, i) => `
          <div class="card-row" style="cursor:default;${i === guide.highlights.length - 1 ? 'border-bottom:none' : ''}">
            <div style="flex:1;min-width:0">
              <p class="row-title" style="font-size:14px">${escapeHtml(h.name || '')}</p>
              <p style="margin-top:3px;white-space:normal;font-size:12.5px;line-height:1.5;color:var(--ink-mid)">${escapeHtml(h.note || '')}</p>
            </div>
          </div>`).join('')}
      </div>` : ''}
    ${(guide.practicalTips || []).length ? `
      <span class="eyebrow" style="display:block;margin-bottom:9px">Praktisch</span>
      <div style="background:var(--slope-light);border-radius:11px;padding:12px 14px;margin-bottom:18px">
        ${guide.practicalTips.map(t => `<p style="font-size:12.5px;color:var(--spruce);margin-bottom:6px">· ${escapeHtml(t)}</p>`).join('')}
      </div>` : ''}
    <span class="eyebrow" style="display:block;margin-bottom:9px">Meer info opzoeken</span>
    <div style="display:flex;gap:8px;margin-bottom:9px">
      <a href="${wikipediaSearchUrl(searchQuery, lang)}" target="_blank" class="btn btn-outline" style="flex:1;display:block;text-align:center;text-decoration:none;box-sizing:border-box">📚 Wikipedia</a>
      <a href="${wikivoyageSearchUrl(searchQuery, lang)}" target="_blank" class="btn btn-outline" style="flex:1;display:block;text-align:center;text-decoration:none;box-sizing:border-box">🧭 Wikivoyage</a>
    </div>
    <button onclick="handleGenerateRegionGuide('${acc.id}')" class="btn btn-outline edit-only" style="margin-top:8px">↻ Vernieuwen</button>
  `;
}
