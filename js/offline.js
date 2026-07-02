// ═══════════════════════════════════════════════════════════
// offline.js — Verbindings-banner + Service Worker-update-banner
// Toont een balk zodra de browser offline gaat; reisdata blijft
// werken (lokaal/Firestore-cache), AI-suggesties vereisen internet.
// Registreert ook de Service Worker (N1) voor een echte offline-
// app-shell, met een update-banner i.p.v. stil bijwerken.
// ═══════════════════════════════════════════════════════════

function updateOfflineBanner() {
  const banner = document.getElementById('offline-banner');
  if (!banner) return;
  banner.style.display = !navigator.onLine ? 'block' : 'none';
  recalculateTopBannerSpace();
}

// Meerdere balken (offline + SW-update) kunnen tegelijk zichtbaar zijn —
// duw de content naar beneden met de som van hun hoogtes, anders
// overlappen ze headers/terug-knoppen (zelfde bug als eerder gefixt bij
// de safe-area-top-headers).
function recalculateTopBannerSpace() {
  const banners = ['offline-banner', 'sw-update-banner']
    .map(id => document.getElementById(id))
    .filter(el => el && el.style.display !== 'none');
  const totalHeight = banners.reduce((sum, el) => sum + el.offsetHeight, 0);
  document.body.style.paddingTop = totalHeight ? totalHeight + 'px' : '0';
}

window.addEventListener('online', updateOfflineBanner);
window.addEventListener('offline', updateOfflineBanner);
document.addEventListener('DOMContentLoaded', updateOfflineBanner);

// ── Service Worker: registratie + update-banner ────────────
let swWaitingWorker = null;

function showSwUpdateBanner(worker) {
  swWaitingWorker = worker;
  const banner = document.getElementById('sw-update-banner');
  if (!banner) return;
  banner.style.display = 'block';
  recalculateTopBannerSpace();
}

function applySwUpdate() {
  if (!swWaitingWorker) return;
  swWaitingWorker.postMessage({ type: 'SKIP_WAITING' });
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // FIX: clients.claim() in sw.js' activate-handler laat "controllerchange"
    // ook afgaan bij de ALLERSTE installatie (er was nog geen controller,
    // nu wel) — niet alleen bij een echte update. Zonder deze check
    // herlaadde de pagina zichzelf ongevraagd bij elk eerste bezoek.
    const hadControllerBeforeRegister = !!navigator.serviceWorker.controller;

    navigator.serviceWorker.register('/sw.js').then(registration => {
      // Er stond al een update klaar vóór deze pagina-load
      if (registration.waiting) showSwUpdateBanner(registration.waiting);

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          // "installed" + er is al een actieve controller = een update,
          // niet de allereerste installatie (dan is er nog niets te tonen)
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            showSwUpdateBanner(newWorker);
          }
        });
      });
    }).catch(err => console.error('Service Worker registratie mislukt:', err));

    // Zodra de nieuwe worker de controle overneemt (na skipWaiting),
    // eenmalig herladen om de nieuwe versie daadwerkelijk te tonen —
    // maar alleen als dit een échte update was, niet de eerste install.
    if (hadControllerBeforeRegister) {
      let hasReloaded = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (hasReloaded) return;
        hasReloaded = true;
        window.location.reload();
      });
    }
  });
}
