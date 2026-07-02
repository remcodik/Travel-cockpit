// ═══════════════════════════════════════════════════════════
// offline.js — Verbindings-banner
// Toont een balk zodra de browser offline gaat; reisdata blijft
// werken (lokaal/Firestore-cache), AI-suggesties vereisen internet.
// ═══════════════════════════════════════════════════════════

function updateOfflineBanner() {
  const banner = document.getElementById('offline-banner');
  if (!banner) return;
  const isOffline = !navigator.onLine;
  banner.style.display = isOffline ? 'block' : 'none';
  // Duwt de actieve schermeninhoud naar beneden zodat de balk geen
  // headers/terug-knoppen overlapt (zelfde bug als eerder gefixt bij
  // de safe-area-top-headers).
  document.body.style.paddingTop = isOffline ? banner.offsetHeight + 'px' : '0';
}

window.addEventListener('online', updateOfflineBanner);
window.addEventListener('offline', updateOfflineBanner);
document.addEventListener('DOMContentLoaded', updateOfflineBanner);
