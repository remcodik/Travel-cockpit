// ═══════════════════════════════════════════════════════════
// gps.js — Eén gedeelde GPS-watch voor de hele app
// FIX: Kaart en Roadtrip-modus hadden elk hun eigen onafhankelijke
// watchPosition-instantie die nooit stopte bij wegnavigeren — een
// reëel batterijlek op een app die je een hele dag "onderweg"
// gebruikt. Er is nu precies één watch tegelijk, met een eigenaar-
// scherm; verlaat je dat scherm, dan stopt de tracking automatisch.
// ═══════════════════════════════════════════════════════════

let gpsWatchId = null;
let gpsOwnerScreen = null;
let gpsOnUpdate = null;
let gpsOnStop = null;

function isGpsActive() {
  return gpsWatchId !== null;
}

function startGpsTracking(screenId, onUpdate, onStop) {
  if (gpsWatchId !== null) stopGpsTracking();
  if (!navigator.geolocation) { showToast('GPS niet beschikbaar op dit apparaat'); return false; }

  gpsOwnerScreen = screenId;
  gpsOnUpdate = onUpdate;
  gpsOnStop = onStop || null;
  gpsWatchId = navigator.geolocation.watchPosition(
    pos => { if (gpsOnUpdate) gpsOnUpdate(pos); },
    err => showToast('GPS-fout: ' + err.message),
    { enableHighAccuracy: true, maximumAge: 5000 }
  );
  updateGpsIndicator();
  return true;
}

function stopGpsTracking() {
  if (gpsWatchId !== null) navigator.geolocation.clearWatch(gpsWatchId);
  const stopCb = gpsOnStop;
  gpsWatchId = null;
  gpsOwnerScreen = null;
  gpsOnUpdate = null;
  gpsOnStop = null;
  updateGpsIndicator();
  if (stopCb) stopCb();
}

// Wordt vanuit navigateTo() aangeroepen, vóór het nieuwe scherm rendert.
function stopGpsIfLeavingOwner(newScreenId) {
  if (gpsWatchId !== null && gpsOwnerScreen !== newScreenId) stopGpsTracking();
}

function updateGpsIndicator() {
  const dot = document.getElementById('gps-global-dot');
  if (dot) dot.style.display = isGpsActive() ? 'flex' : 'none';
}
