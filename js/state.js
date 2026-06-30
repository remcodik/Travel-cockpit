// ═══════════════════════════════════════════════════════════
// state.js — Applicatiestatus en datum/accommodatie-logica
// ═══════════════════════════════════════════════════════════

const AppState = {
  activities: ACTIVITIES.map(a => ({ ...a })), // mutable kopie
  tickets: [],
  extraTrips: [],
  discoveredAdded: new Set(),
  selectedPlanningDay: null, // wordt gezet bij init
  viewingAccommodationId: null, // wordt gezet bij init — NOOIT hardcoded
  vehicleType: 'ev',
  travelStyles: new Set(['natuur', 'wandelen']),
  aiEnabled: true,
};

// ── Datum / "vandaag" logica ──────────────────────────────
// Als de echte datum binnen de reis valt, gebruik die.
// Anders: toon de laatste dag van de reis (niet een willekeurige
// demo-dag) zodat de gebruiker na de reis nog steeds een logisch
// "huidig" verblijf ziet — het laatst bezochte.
function getToday() {
  const now = new Date();
  const inTrip = now >= TRIP_START && now <= TRIP_END;
  if (inTrip) return now;
  // Buiten de reisperiode: gebruik de laatste reisdag als referentie
  // zodat er altijd een zinnig "huidig verblijf" getoond kan worden.
  return new Date(TRIP_END.getFullYear(), TRIP_END.getMonth(), TRIP_END.getDate() - 1);
}

function getDayNumber(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor((d - TRIP_START) / 86400000) + 1;
}

function getAccommodationForDate(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return ACCOMMODATIONS.find(acc => d >= acc.checkIn && d < acc.checkOut) || null;
}

// Het "actieve" verblijf — gebaseerd op echte datumlogica, nooit hardcoded.
// Valt terug op de laatste accommodatie als de datum precies op de
// check-out dag van de laatste valt (edge case: laatste reisdag).
function getActiveAccommodation() {
  const today = getToday();
  const direct = getAccommodationForDate(today);
  if (direct) return direct;
  // Edge case: als vandaag na de laatste check-out valt, toon de laatste.
  const last = ACCOMMODATIONS[ACCOMMODATIONS.length - 1];
  if (today >= last.checkOut) return last;
  return ACCOMMODATIONS[0];
}

function getAllTripDays() {
  const days = [];
  const d = new Date(TRIP_START);
  while (d <= TRIP_END) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

function formatShortDate(date) {
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

function getNextAccommodation(currentAccId) {
  const idx = ACCOMMODATIONS.findIndex(a => a.id === currentAccId);
  if (idx >= 0 && idx + 1 < ACCOMMODATIONS.length) return ACCOMMODATIONS[idx + 1];
  return null;
}

// ── Activiteiten helpers ──────────────────────────────────
function getActivitiesForDate(date) {
  return AppState.activities.filter(a => a.date && a.date.toDateString() === date.toDateString());
}

function getUnscheduledForAccommodation(accId) {
  return AppState.activities.filter(a => a.accId === accId && !a.date && a.status !== 'done');
}

function toggleActivityStatus(id) {
  const act = AppState.activities.find(a => a.id === id);
  if (!act) return null;
  act.status = act.status === 'done' ? 'planned' : 'done';
  return act;
}

function addActivity({ name, accId, date, emoji = '📍' }) {
  const newId = Math.max(...AppState.activities.map(a => a.id), 0) + 1;
  const activity = {
    id: newId, name, emoji, accId, status: 'planned', date,
    distance: '—', duration: '—', level: 'Makkelijk', elevation: 0, lat: 0, lng: 0,
    desc: '',
  };
  AppState.activities.push(activity);
  return activity;
}

function getProgress() {
  const done = AppState.activities.filter(a => a.status === 'done').length;
  const total = AppState.activities.length;
  return { done, total, percent: total > 0 ? Math.round((done / total) * 100) : 0 };
}

// ── Init: zet de startwaarden NA het laden van data.js ────
function initAppState() {
  AppState.selectedPlanningDay = getToday();
  AppState.viewingAccommodationId = getActiveAccommodation().id;
}
