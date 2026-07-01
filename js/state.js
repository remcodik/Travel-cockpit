// ═══════════════════════════════════════════════════════════
// state.js — Applicatiestatus, datum-logica en Firebase-sync
// ═══════════════════════════════════════════════════════════

const AppState = {
  activities: ACTIVITIES.map(a => ({ ...a })),
  tickets: [],
  extraTrips: [],
  discoveredAdded: new Set(),
  selectedPlanningDay: null,
  viewingAccommodationId: null,
  vehicleType: 'ev',
  travelStyles: new Set(['natuur', 'wandelen']),
  aiEnabled: true,
  dbUnsubscribers: [], // voor realtime listeners
};

// ── Datum / "vandaag" logica ──────────────────────────────
function getToday() {
  const now = new Date();
  const inTrip = now >= TRIP_START && now <= TRIP_END;
  if (inTrip) return now;
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

function getActiveAccommodation() {
  const today = getToday();
  const direct = getAccommodationForDate(today);
  if (direct) return direct;
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
  return AppState.activities.filter(a =>
    a.date && a.date.toDateString() === date.toDateString()
  );
}

function getUnscheduledForAccommodation(accId) {
  return AppState.activities.filter(a =>
    a.accId === accId && !a.date && a.status !== 'done'
  );
}

async function toggleActivityStatus(id) {
  const act = AppState.activities.find(a => a.id === id);
  if (!act) return null;
  act.status = act.status === 'done' ? 'planned' : 'done';
  await dbSaveActivity(act);
  return act;
}

async function addActivity({ name, accId, date, emoji = '📍', desc = '', level = 'Makkelijk' }) {
  const existingIds = AppState.activities.map(a => typeof a.id === 'number' ? a.id : 0);
  const newId = Math.max(...existingIds, 0) + 1;
  const activity = {
    id: newId, name, emoji, accId, status: 'planned', date: date || null,
    distance: '—', duration: '—', level, elevation: 0, lat: 0, lng: 0, desc,
  };
  AppState.activities.push(activity);
  await dbSaveActivity(activity);
  return activity;
}

async function updateActivity(id, changes) {
  const act = AppState.activities.find(a => a.id === id);
  if (!act) return null;
  Object.assign(act, changes);
  await dbSaveActivity(act);
  return act;
}

async function deleteActivity(id) {
  const idx = AppState.activities.findIndex(a => a.id === id);
  if (idx === -1) return false;
  AppState.activities.splice(idx, 1);
  await dbDeleteActivity(id);
  return true;
}

function getProgress() {
  const done = AppState.activities.filter(a => a.status === 'done').length;
  const total = AppState.activities.length;
  return { done, total, percent: total > 0 ? Math.round((done / total) * 100) : 0 };
}

// ── Firebase sync-initialisatie ───────────────────────────
// Wordt aangeroepen vanuit initAppState nadat Firebase klaar is.
function startFirebaseSync() {
  // Activiteiten: laad eerst, dan realtime luisteren
  dbLoadActivities().then(remoteActivities => {
    if (remoteActivities && remoteActivities.length > 0) {
      // Merge: remote data wint voor bestaande IDs, lokale data voor nieuwe
      const remoteIds = new Set(remoteActivities.map(a => a.id));
      const localOnly = AppState.activities.filter(a => !remoteIds.has(a.id));
      AppState.activities = [...remoteActivities, ...localOnly];
      refreshAllScreens();
    } else {
      // Eerste keer: push de seed-data naar Firebase
      AppState.activities.forEach(act => dbSaveActivity(act));
    }

    // Daarna: realtime updates van reisgenoten
    const unsub = dbWatchActivities(remoteActs => {
      if (!remoteActs || remoteActs.length === 0) return;
      AppState.activities = remoteActs;
      refreshAllScreens();
    });
    AppState.dbUnsubscribers.push(unsub);
  });

  // Tickets: laad en luister
  dbLoadTickets().then(remoteTickets => {
    if (remoteTickets) {
      AppState.tickets = remoteTickets;
      if (document.getElementById('screen-tickets').classList.contains('active')) {
        renderTicketsScreen();
      }
    }
    const unsub = dbWatchTickets(remoteTickets => {
      AppState.tickets = remoteTickets;
      if (document.getElementById('screen-tickets').classList.contains('active')) {
        renderTicketsScreen();
      }
      renderHomeScreen();
    });
    AppState.dbUnsubscribers.push(unsub);
  });
}

function refreshAllScreens() {
  const screens = {
    'screen-home': renderHomeScreen,
    'screen-planning': renderPlanningScreen,
    'screen-roadtrip': renderRoadtripScreen,
  };
  Object.entries(screens).forEach(([id, fn]) => {
    if (document.getElementById(id).classList.contains('active')) fn();
  });
}

// ── Init ──────────────────────────────────────────────────
function initAppState() {
  AppState.selectedPlanningDay = getToday();
  AppState.viewingAccommodationId = getActiveAccommodation().id;

  // Firebase sync starten zodra db klaar is
  onDbReady(startFirebaseSync);
}
