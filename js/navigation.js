// ═══════════════════════════════════════════════════════════
// navigation.js — Schermnavigatie en toast-meldingen
// ═══════════════════════════════════════════════════════════

const MAIN_SCREENS = ['home', 'map', 'planning', 'discover', 'meer'];
let navigationStack = ['home'];

let toastTimer = null;
// DIAGNOSE: duration optioneel zodat foutmeldingen langer blijven
// staan en je ze kunt lezen voordat ze verdwijnen.
function showToast(message, duration) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
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
    roadtrip: renderRoadtripScreen,
    map: initMap,
    tickets: renderTicketsScreen,
    trips: renderTripsScreen,
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

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.sheet-backdrop').forEach(bg => {
    bg.addEventListener('click', e => {
      if (e.target === bg) bg.classList.remove('open');
    });
  });
});
