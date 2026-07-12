// ═══════════════════════════════════════════════════════════
// navigation.js — Schermnavigatie en toast-meldingen
// ═══════════════════════════════════════════════════════════

const MAIN_SCREENS = ['home', 'map', 'planning', 'discover', 'meer'];
let navigationStack = ['home'];

let toastTimer = null;
// DIAGNOSE: duration optioneel zodat foutmeldingen langer blijven
// staan en je ze kunt lezen voordat ze verdwijnen.
// onAction (optioneel, N3): maakt de toast zelf tikbaar, voor korte
// vervolgacties zoals "iets zoeken in de buurt?" na het afvinken.
function showToast(message, duration, onAction) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = onAction ? `${message}  ›` : message;
  el.classList.add('show');
  el.style.cursor = onAction ? 'pointer' : '';
  el.onclick = onAction ? () => { el.classList.remove('show'); onAction(); } : null;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), duration || 2400);
}

function navigateTo(screenId) {
  stopGpsIfLeavingOwner(screenId);

  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById('screen-' + screenId);
  if (!target) { console.error('Onbekend scherm:', screenId); return; }
  target.classList.add('active');

  document.querySelectorAll('.bottom-nav button').forEach(b => b.classList.remove('active'));
  const navBtn = document.getElementById('nav-' + screenId);
  if (navBtn) navBtn.classList.add('active');

  document.querySelector('.bottom-nav').style.display = MAIN_SCREENS.includes(screenId) ? 'flex' : 'none';

  if (MAIN_SCREENS.includes(screenId)) {
    navigationStack = [screenId];
  } else {
    navigationStack.push(screenId);
  }

  target.scrollTop = 0;
  const scrollEl = target.querySelector('.scroll');
  if (scrollEl) scrollEl.scrollTop = 0;

  const renderers = {
    home: renderHomeScreen,
    planning: renderPlanningScreen,
    discover: renderDiscoverScreen,
    accommodation: () => renderAccommodationScreen(AppState.viewingAccommodationId),
    guide: renderRegionGuideScreen,
    roadtrip: renderRoadtripScreen,
    map: initMap,
    tickets: renderTicketsScreen,
    trips: renderTripsScreen,
    settings: renderSettingsScreen,
    notes: renderNotesScreen,
  };
  if (renderers[screenId]) {
    try {
      renderers[screenId]();
    } catch (e) {
      const b = document.getElementById('debug-banner');
      if (b) {
        b.classList.add('show');
        b.textContent += `❌ FOUT bij scherm "${screenId}": ${e.message}\n${e.stack || ''}\n\n`;
      }
    }
  }
}

function goBack() {
  if (navigationStack.length > 1) {
    navigationStack.pop();
    navigateTo(navigationStack[navigationStack.length - 1]);
  } else {
    navigateTo('meer');
  }
}

function closeSheet(sheetId) {
  document.getElementById(sheetId).classList.remove('open');
}

function openSheet(sheetId) {
  document.getElementById(sheetId).classList.add('open');
}

// Generieke "grotere tekst"-popup — voor zowel lange, zelf getypte tekst
// (bv. de beschrijving van een activiteit, die maar 3 regels tekstvak
// heeft) als lange AI-gegenereerde tekst (AI-verrijking) die in een smal
// bottom-sheet lastig leest. Zonder onSave: alleen-lezen weergave in een
// groter lettertype. Met onSave: een groter tekstvak, en "Gebruik deze
// tekst" schrijft de nieuwe waarde terug naar de aanroeper i.p.v. dat deze
// popup zelf hoeft te weten waar de tekst vandaan komt of heen gaat.
let textViewerSaveCallback = null;

function openTextViewer(title, text, onSave, photoUrl) {
  document.getElementById('text-viewer-title').textContent = title;
  const photo = document.getElementById('text-viewer-photo');
  if (photo) {
    if (photoUrl) { photo.src = photoUrl; photo.style.display = 'block'; }
    else { photo.style.display = 'none'; photo.removeAttribute('src'); }
  }
  const textarea = document.getElementById('text-viewer-textarea');
  const readonly = document.getElementById('text-viewer-readonly');
  const saveBtn = document.getElementById('text-viewer-save-btn');
  if (onSave) {
    textarea.style.display = 'block';
    readonly.style.display = 'none';
    saveBtn.style.display = 'block';
    textarea.value = text || '';
    textViewerSaveCallback = onSave;
  } else {
    textarea.style.display = 'none';
    readonly.style.display = 'block';
    saveBtn.style.display = 'none';
    readonly.textContent = text || '';
    textViewerSaveCallback = null;
  }
  openSheet('sheet-text-viewer');
}

function saveTextViewer() {
  if (textViewerSaveCallback) textViewerSaveCallback(document.getElementById('text-viewer-textarea').value);
  closeSheet('sheet-text-viewer');
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.sheet-backdrop').forEach(bg => {
    bg.addEventListener('click', e => {
      if (e.target === bg) bg.classList.remove('open');
    });
  });
});
