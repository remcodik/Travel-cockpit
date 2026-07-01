// ═══════════════════════════════════════════════════════════
// state.js — Applicatiestatus, datum-logica en Firebase-sync
// ═══════════════════════════════════════════════════════════

const AppState = {
  activities: ACTIVITIES.map(a => ({ ...a })),
  tickets: [],
  trips: [],                 // alle reizen (metadata) — echt, via Firestore
  discoveredAdded: new Set(),
  selectedPlanningDay: null,
  viewingAccommodationId: null,
  vehicleType: 'ev',
  travelStyles: new Set(['natuur', 'wandelen']),
  aiEnabled: true,
  dbUnsubscribers: [], // voor realtime listeners
};

// ── Datum / "vandaag" logica ──────────────────────────────
// FIX: geeft altijd de echte huidige datum terug. Voorheen werd
// buiten het reisvenster een gefingeerde datum binnen de reis
// teruggegeven, wat het weer structureel liet breken (Open-Meteo's
// 16-daagse forecast-venster matcht dan nooit met de "echte vandaag"
// die de weer-provider zelf ook gebruikt). Schermen die willen weten
// of de reis nog moet beginnen of al voorbij is, gebruiken getTripPhase().
function getToday() {
  return new Date();
}

// 'before' | 'during' | 'after' — relatief aan de actieve reis.
function getTripPhase() {
  const now = new Date();
  if (now < TRIP_START) return 'before';
  if (now > TRIP_END) return 'after';
  return 'during';
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

// ── Reizen (echte multi-trip, via Firestore) ──────────────
function getActiveTrip() {
  return AppState.trips.find(t => t.isActive) || null;
}

// Vervangt de inhoud van ACCOMMODATIONS/ACTIVITIES/TRIP_START/TRIP_END
// in-place (niet opnieuw toewijzen — andere bestanden houden al een
// referentie naar dezelfde array/Date-objecten vast). Zo hoeft geen
// enkel scherm te weten dat er van reis is gewisseld; ze lezen bij de
// eerstvolgende render gewoon de bijgewerkte waarden.
function applyTripData(trip, accommodations) {
  // Kopie eerst nemen — accommodations kan (in een fallback-pad) dezelfde
  // array-referentie zijn als ACCOMMODATIONS zelf, die hieronder leeg-
  // gemaakt wordt. Zonder deze kopie zou die dan als lege array eindigen.
  const snapshot = accommodations.slice();

  TRIP_START.setTime(trip.startDate.getTime());
  TRIP_END.setTime(trip.endDate.getTime());

  ACCOMMODATIONS.length = 0;
  snapshot
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .forEach(acc => ACCOMMODATIONS.push({
      ...acc,
      checkIn: new Date(acc.checkIn),
      checkOut: new Date(acc.checkOut),
    }));
}

async function switchToTrip(tripId) {
  const trip = AppState.trips.find(t => t.id === tripId);
  if (!trip) return;

  // Oude realtime-listeners (activiteiten/tickets van de vorige reis) opruimen
  AppState.dbUnsubscribers.forEach(unsub => unsub());
  AppState.dbUnsubscribers = [];

  await dbSetActiveTrip(tripId, AppState.trips.map(t => t.id));
  AppState.trips.forEach(t => { t.isActive = t.id === tripId; });
  setCurrentTripId(tripId);

  const accs = await dbLoadAccommodations(tripId);
  applyTripData(trip, accs || []);

  AppState.activities = [];
  AppState.tickets = [];
  AppState.selectedPlanningDay = getToday();
  AppState.viewingAccommodationId = getActiveAccommodation() ? getActiveAccommodation().id : null;

  startFirebaseSync();
  updateMeerSummary();
  navigateTo('home');
  showToast(`✓ ${trip.name} is nu actief`);
}

async function createTrip({ name, country, countryFlag, startDate, endDate, accommodations }) {
  const id = (self.crypto && crypto.randomUUID) ? crypto.randomUUID() : `trip-${Date.now()}`;
  const trip = { id, name, country, countryFlag, startDate, endDate, isActive: false };
  await dbSaveTripMeta(trip);
  for (const acc of accommodations) {
    await dbSaveAccommodation(id, { ...acc, id: (self.crypto && crypto.randomUUID) ? crypto.randomUUID() : `acc-${Date.now()}-${Math.random()}` });
  }
  AppState.trips.push(trip);
  return trip;
}

async function deleteTrip(tripId) {
  const wasActive = AppState.trips.find(t => t.id === tripId)?.isActive;
  await dbDeleteTripMeta(tripId);
  AppState.trips = AppState.trips.filter(t => t.id !== tripId);
  if (wasActive && AppState.trips.length > 0) {
    await switchToTrip(AppState.trips[0].id);
  }
}

// ── Firebase sync-initialisatie ───────────────────────────
// Wordt aangeroepen vanuit initAppState nadat Firebase klaar is, en
// opnieuw vanuit switchToTrip() bij het wisselen van reis.
function startFirebaseSync() {
  // Activiteiten: laad eerst, dan realtime luisteren
  dbLoadActivities().then(remoteActivities => {
    if (remoteActivities && remoteActivities.length > 0) {
      // Merge: remote data wint voor bestaande IDs, lokale data voor nieuwe
      const remoteIds = new Set(remoteActivities.map(a => a.id));
      const localOnly = AppState.activities.filter(a => !remoteIds.has(a.id));
      AppState.activities = [...remoteActivities, ...localOnly];
      refreshAllScreens();
    } else if (getCurrentTripId() === DEFAULT_TRIP_ID) {
      // Eerste keer voor de standaardreis: push de seed-data naar Firebase.
      // Nieuwe, door de gebruiker aangemaakte reizen starten bewust leeg —
      // geen automatische seed meer voor onbekende trip-ID's.
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

// Het Meer-scherm heeft geen eigen render-functie (statische lijst met
// vaste links) — deze twee regels zijn de enige die van de actieve reis
// afhangen, dus die werken we hier gericht bij i.p.v. het hele scherm
// dynamisch te maken.
function updateMeerSummary() {
  const tripEl = document.getElementById('meer-trip-sub');
  const accEl = document.getElementById('meer-acc-sub');
  const trip = getActiveTrip();
  if (tripEl) tripEl.textContent = trip ? `${trip.name} · actief` : 'Nog geen reis actief';
  if (accEl) accEl.textContent = `${ACCOMMODATIONS.length} verblijven · wisselen per datum`;
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
  onDbReady(async () => {
    // Reizen laden; als de trips-collectie nog nooit is gevuld (eerste
    // keer ooit), de standaardreis + haar accommodaties zaaien —
    // zelfde patroon als de bestaande activiteiten-seed hieronder.
    let trips = await dbLoadAllTrips();
    if (!trips || trips.length === 0) {
      const seedTrip = {
        id: DEFAULT_TRIP_ID, name: 'Noorwegen 2026', country: 'Noorwegen',
        countryFlag: '🇳🇴', startDate: TRIP_START, endDate: TRIP_END, isActive: true,
      };
      await dbSaveTripMeta(seedTrip);
      for (const acc of ACCOMMODATIONS) {
        await dbSaveAccommodation(DEFAULT_TRIP_ID, {
          id: String(acc.id), name: acc.name, short: acc.short, color: acc.color,
          checkIn: acc.checkIn.toISOString(), checkOut: acc.checkOut.toISOString(),
          address: acc.address, elevation: acc.elevation, coord: acc.coord,
          lat: acc.lat, lng: acc.lng, notes: acc.notes, phone: acc.phone,
          order: ACCOMMODATIONS.indexOf(acc),
        });
      }
      trips = [seedTrip];
    }
    AppState.trips = trips;

    // De URL (?trip=XXX) is leidend als hij expliciet is meegegeven —
    // dat is precies het mechanisme achter de gedeelde reislink.
    // Zonder expliciete link volgen we de reis die globaal als actief
    // staat. Wijst de URL naar een trip-ID die niet (meer) bestaat, dan
    // valt de app terug op de eerste beschikbare reis — geen automatische
    // Noorwegen-kloon meer voor een onbekende/lege reis.
    const urlHadExplicitTrip = !!new URLSearchParams(window.location.search).get('trip');
    let targetTripId = urlHadExplicitTrip ? getCurrentTripId() : (getActiveTrip() || trips[0]).id;
    let targetTrip = trips.find(t => t.id === targetTripId);
    if (!targetTrip) {
      targetTrip = trips[0];
      targetTripId = targetTrip.id;
    }
    setCurrentTripId(targetTripId);

    const accs = await dbLoadAccommodations(targetTripId);
    applyTripData(targetTrip, accs && accs.length > 0 ? accs : ACCOMMODATIONS);
    AppState.selectedPlanningDay = getToday();
    AppState.viewingAccommodationId = getActiveAccommodation() ? getActiveAccommodation().id : null;

    startFirebaseSync();
    updateMeerSummary();
    if (document.getElementById('screen-home').classList.contains('active')) renderHomeScreen();
  });
}
