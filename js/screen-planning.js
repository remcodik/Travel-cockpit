// ═══════════════════════════════════════════════════════════
// screen-planning.js — Planningscherm met dag-tabs
// ═══════════════════════════════════════════════════════════

function renderPlanningScreen() {
  if (!AppState.selectedPlanningDay) AppState.selectedPlanningDay = getToday();
  buildDayTabs();
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
    return `
      <button class="day-tab ${isSelected ? 'selected' : ''}"
        style="background:${isSelected ? color : 'var(--white)'};border-color:${isSelected ? color : 'var(--line)'}"
        onclick="selectPlanningDay('${day.toISOString()}')">
        <span class="mono" style="font-size:10px;font-weight:700;color:${isSelected ? 'rgba(255,255,255,.85)' : color}">D${dayNum}</span>
        <span style="font-family:var(--font-display);font-size:17px;font-weight:800;color:${isSelected ? 'white' : 'var(--ink)'};line-height:1.1">${day.getDate()}</span>
        <span class="mono" style="font-size:8px;color:${isSelected ? 'rgba(255,255,255,.55)' : 'var(--ink-faint)'}">${MONTHS[day.getMonth()]}</span>
        ${acc ? `<span class="acc-dot" style="width:5px;height:5px;background:${isSelected ? 'rgba(255,255,255,.8)' : color};margin-top:2px"></span>` : ''}
      </button>`;
  }).join('');

  // Scroll geselecteerde tab in beeld
  const selectedIdx = Math.floor((AppState.selectedPlanningDay - TRIP_START) / 86400000);
  setTimeout(() => {
    container.scrollLeft = Math.max(0, (selectedIdx - 2) * 62);
  }, 50);
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

  document.getElementById('day-header').innerHTML = `
    <div style="background:${acc ? acc.color : 'var(--ink-faint)'};border-radius:10px;padding:4px 10px;display:flex;flex-direction:column;align-items:center;flex-shrink:0">
      <span class="mono" style="font-size:8px;color:rgba(255,255,255,.65);font-weight:700;letter-spacing:1px">DAG</span>
      <span style="font-family:var(--font-display);font-size:20px;font-weight:800;color:white;line-height:1">${dayNum}</span>
    </div>
    <div style="flex:1">
      <p class="row-title" style="font-size:15.5px">${WEEKDAYS[day.getDay()]} ${day.getDate()} ${MONTHS[day.getMonth()]}</p>
      ${acc
        ? `<div style="display:flex;align-items:center;gap:6px;margin-top:3px"><span class="acc-dot" style="width:8px;height:8px;background:${acc.color}"></span><span class="mono" style="color:${acc.color};font-weight:700">vanuit ${escapeHtml(acc.name)}</span></div>`
        : `<p class="mono" style="margin-top:3px">reisdag · onderweg</p>`}
    </div>
    ${acc ? renderElevationTag(acc.elevation, acc.color) : ''}
  `;

  const dayActivities = getActivitiesForDate(day);
  const unscheduled = acc ? getUnscheduledForAccommodation(acc.id) : [];
  const container = document.getElementById('planning-items');

  if (dayActivities.length === 0 && unscheduled.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="summit-tri" style="border-left:14px solid transparent;border-right:14px solid transparent;border-bottom:24px solid var(--line)"></span>
        <p class="row-title" style="font-size:18px;margin-top:16px">Geen activiteiten</p>
        <p class="mono" style="margin-top:4px">Plan via AI-ideeën</p>
        <button onclick="navigateTo('discover')" class="btn btn-primary" style="margin-top:20px;width:auto;padding:10px 20px">AI-ideeën</button>
      </div>`;
    return;
  }

  let html = '';
  if (dayActivities.length > 0) {
    html += `<div class="card" style="margin-bottom:13px;overflow:hidden">`;
    html += dayActivities.map((a, i) => renderActivityRow(a, i, dayActivities.length)).join('');
    html += `</div>`;
  }
  if (unscheduled.length > 0) {
    html += `<p class="eyebrow" style="margin-bottom:8px">Beschikbaar vanuit ${escapeHtml(acc.short)}</p>`;
    html += `<div class="card" style="margin-bottom:13px;overflow:hidden">`;
    html += unscheduled.map((a, i) => renderUnscheduledRow(a, i, unscheduled.length)).join('');
    html += `</div>`;
  }
  container.innerHTML = html;
}

function renderUnscheduledRow(act, index, total) {
  const acc = ACCOMMODATIONS.find(a => a.id === act.accId);
  const isLast = index === total - 1;
  return `
    <div class="activity-row" style="${isLast ? '' : 'border-bottom:1px solid var(--line-soft)'}" onclick="showToast('${escapeHtml(act.name)} · ${act.distance}')">
      <div class="activity-band" style="background:${acc.color}"></div>
      <div class="activity-thumb" style="background:${acc.color}18">${act.emoji}</div>
      <div style="flex:1;min-width:0">
        <p class="row-title" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(act.name)}</p>
        <div style="display:flex;align-items:center;gap:8px;margin-top:2px">
          ${renderElevationTag(act.elevation, acc.color)}
          <span class="mono">· ${act.level}</span>
        </div>
      </div>
      <span class="from-acc-badge" style="background:${acc.color}20;color:${acc.color}">niet ingepland</span>
    </div>`;
}
