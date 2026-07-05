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
  weatherSuggestionsEnabled: true,
  language: 'nl',
  dbUnsubscribers: [], // voor realtime listeners
};

// ── Instellingen-persistentie (device-eigen, geen Firestore) ──
// Instellingen zijn per toestel, niet gedeeld tussen toestellen —
// vandaar localStorage i.p.v. Firestore, zoals Flutter's SharedPreferences.
const SETTINGS_STORAGE_KEY = 'travelCockpitSettings';

function loadSettingsFromStorage() {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (saved.vehicleType) AppState.vehicleType = saved.vehicleType;
    if (Array.isArray(saved.travelStyles)) AppState.travelStyles = new Set(saved.travelStyles);
    if (typeof saved.aiEnabled === 'boolean') AppState.aiEnabled = saved.aiEnabled;
    if (typeof saved.weatherSuggestionsEnabled === 'boolean') AppState.weatherSuggestionsEnabled = saved.weatherSuggestionsEnabled;
    if (saved.language) AppState.language = saved.language;
  } catch (err) {
    console.error('Instellingen laden mislukt:', err);
  }
}

function saveSettingsToStorage() {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({
      vehicleType: AppState.vehicleType,
      travelStyles: Array.from(AppState.travelStyles),
      aiEnabled: AppState.aiEnabled,
      weatherSuggestionsEnabled: AppState.weatherSuggestionsEnabled,
      language: AppState.language,
    }));
  } catch (err) {
    console.error('Instellingen opslaan mislukt:', err);
  }
}

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

// Vandaag, geklemd binnen het reisvenster — voor een reis die nog moet
// beginnen of al voorbij is, is "vandaag" zelf geen geldige dagtab
// (buiten TRIP_START..TRIP_END), waardoor Planning geen dag kon
// selecteren. Geeft in dat geval de dichtstbijzijnde geldige dag terug
// (eerste of laatste dag van de reis).
function getClosestTripDay() {
  const today = getToday();
  if (today < TRIP_START) return new Date(TRIP_START);
  if (today > TRIP_END) return new Date(TRIP_END);
  return today;
}

// FIX: een <input type="date"> geeft een kale "YYYY-MM-DD"-string. `new
// Date(str)` parseert zo'n string per ECMA-262 als UTC-middernacht, niet als
// lokale middernacht. In een tijdzone vóór op UTC (bv. Nederland, CEST =
// UTC+2) valt dat UTC-instant ná de lokale middernacht van diezelfde
// kalenderdag — waardoor getAccommodationForDate() de check-in-dag zelf niet
// meer als "erbij horend" herkende (`d >= acc.checkIn` faalde), en die dag
// dus ongekleurd bleef in Planning, ook nadat een nieuw verblijf 'm juist had
// moeten dekken. Deze helper parseert altijd als lokale middernacht.
function parseLocalDateInput(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
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

// Correct N/S en E/W bepalen op basis van het teken — FIX: eerdere
// code liet altijd "°N ... °E" zien, ook bij een negatieve breedte-
// (zuidelijk halfrond) of lengtegraad (westelijk halfrond), wat de
// coördinaten van elke niet-Noorse/niet-Europese reis fout liet lezen.
function formatLatLng(lat, lng, decimals = 2) {
  // N/E/S/W (internationale kaartconventie) i.p.v. Nederlandse afkortingen
  // — zo blijft dit consistent met de bestaande, hardcoded seed-coördinaten
  // in js/data.js (bv. "61.24°N 7.09°E").
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(decimals)}°${latDir} ${Math.abs(lng).toFixed(decimals)}°${lngDir}`;
}

// FIX: de eerdere Komoot-link (komoot.com/smart-tour?...) is geen bestaande
// pagina — die 404't/werkt niet. Komoot's echte zoekfunctie is een JS-app
// zonder gedocumenteerde publieke "zoek op tekst"-URL, dus in plaats van
// nóg een gok te wagen op een Komoot-interne route linken we naar een
// Google-zoekopdracht die specifiek naar komoot.com scoped is — dat opent
// altijd echte resultaten, nooit een dode link.
function komootSearchUrl(query) {
  return `https://www.google.com/search?q=${encodeURIComponent(query + ' wandeling site:komoot.com')}`;
}

// Veilige, altijd-werkende zoeklinks voor de reisgids-sectie (js/screen-guide.js)
// — MediaWiki's eigen zoek-URL i.p.v. een gegokte kant-en-klare artikel-URL
// (die kan 404'en bij een spellingsverschil). Werkt voor elke taalcode die
// Wikipedia/Wikivoyage ondersteunt.
function wikipediaSearchUrl(query, lang) {
  return `https://${lang || 'en'}.wikipedia.org/w/index.php?search=${encodeURIComponent(query)}`;
}
function wikivoyageSearchUrl(query, lang) {
  return `https://${lang || 'en'}.wikivoyage.org/w/index.php?search=${encodeURIComponent(query)}`;
}

// Haalt alleen de plaatsnaam uit een adres ("Straat 1, 6857 Sogndal" → "Sogndal")
// — een zoekopdracht met het volledige adres levert bij Wikipedia/Wikivoyage
// vrijwel nooit iets op, alleen de plaatsnaam wel.
function extractCityFromAddress(address) {
  if (!address) return '';
  const lastPart = address.split(',').pop().trim();
  return lastPart.replace(/^\d+\s*/, '').trim();
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
  const idx = ACCOMMODATIONS.findIndex(a => idsMatch(a.id, currentAccId));
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
    idsMatch(a.accId, accId) && !a.date && a.status !== 'done'
  );
}

// FIX: accommodatie-ID's zijn strings (Firestore-doc-ID), maar activiteiten
// die vóór deze fix zijn opgeslagen kunnen nog een numerieke accId hebben
// (oude parseInt()-bug, of de allereerste seed vóór de string-migratie).
// Bestaande Firestore-documenten worden niet met terugwerkende kracht
// aangepast, dus vergelijk hier getolereerd i.p.v. met strikte ===.
function idsMatch(a, b) {
  return a !== null && a !== undefined && b !== null && b !== undefined && String(a) === String(b);
}

async function toggleActivityStatus(id) {
  const act = AppState.activities.find(a => a.id === id);
  if (!act) return null;
  act.status = act.status === 'done' ? 'planned' : 'done';
  await dbSaveActivity(act);
  return act;
}

async function addActivity({
  name, accId, date, emoji = '📍', category = '', desc = '', level = 'Makkelijk',
  distance = '—', duration = '—', elevation = 0, lat = 0, lng = 0,
  googleMapsQuery = '', whyRecommended = '', komootTourUrl = '', link = '',
}) {
  const existingIds = AppState.activities.map(a => typeof a.id === 'number' ? a.id : 0);
  const newId = Math.max(...existingIds, 0) + 1;
  const activity = {
    id: newId, name, emoji, category: category || categoryForEmoji(emoji), accId, status: 'planned', date: date || null,
    distance, duration, level, elevation, lat, lng, desc,
    googleMapsQuery, whyRecommended, komootTourUrl, link,
  };
  AppState.activities.push(activity);
  await dbSaveActivity(activity);
  return activity;
}

// Alleen een echte komoot.com/tour/{id}-link accepteren — dit wordt
// gebruikt om een iframe-src te bouwen (embed?profile=1, zie
// openActivityDetailSheet), dus moet strikt gevalideerd zijn om te
// voorkomen dat een willekeurige URL in een iframe terechtkomt.
function extractKomootTourId(url) {
  if (!url) return null;
  const match = url.match(/^https:\/\/(?:www\.)?komoot\.com\/tour\/(\d+)/);
  return match ? match[1] : null;
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
// Regio-thema per land (Restplan #2) — alleen kleuren wisselen
// (body[data-theme=...] in css/styles.css), het contourlijnen-patroon
// zelf blijft overal gelijk. Onbekend/niet-gemapt land = geen data-theme
// attribuut = het oorspronkelijke Scandinavische/alpiene thema.
const COUNTRY_THEMES = {
  'Italië': 'mediterranean',
  'Spanje': 'mediterranean',
  'Portugal': 'mediterranean',
  'Griekenland': 'mediterranean',
  'Kroatië': 'mediterranean',
  'Duitsland': 'continental',
  'Frankrijk': 'continental',
};

// Vaste, onderling goed te onderscheiden verblijfskleuren (zelfde palet als
// de bestaande seed-verblijven in js/data.js, plus enkele aanvullingen) —
// FIX: elk nieuw toegevoegd verblijf kreeg voorheen altijd dezelfde vaste
// kleur (#5B8C7B), ongeacht hoeveel verblijven er al waren. Bij een tweede
// nieuw verblijf zag je dus geen kleurverschil in Planning, en de vaste
// kleur lag bovendien qua tint dicht bij Sogndal's groen (#2d6a4f) — precies
// het soort te-dicht-bij-elkaar-probleem dat eerder al voor Skjåk/Sogndal is
// opgelost. Geeft de eerste kleur terug die nog niet in gebruik is.
const ACCOMMODATION_COLOR_PALETTE = [
  '#2d6a4f', '#1e88e5', '#ef6c00', '#6a1b9a',
  '#c62828', '#00838f', '#f9a825', '#5d4037',
];
function nextAccommodationColor() {
  const used = new Set(ACCOMMODATIONS.map(a => a.color));
  return ACCOMMODATION_COLOR_PALETTE.find(c => !used.has(c))
    || ACCOMMODATION_COLOR_PALETTE[ACCOMMODATIONS.length % ACCOMMODATION_COLOR_PALETTE.length];
}

// Echte hoogte boven zeeniveau via Open-Meteo's gratis, sleutelloze
// elevation-API (zelfde provider als het weer, al client-side aangeroepen
// zonder proxy in js/weather.js) — i.p.v. een geschatte/geraden waarde.
// Best-effort: geeft null terug bij een netwerkfout, nooit een gok.
async function fetchElevationForCoords(lat, lng) {
  try {
    const resp = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lng}`);
    if (!resp.ok) return null;
    const data = await resp.json();
    return (data.elevation && typeof data.elevation[0] === 'number') ? data.elevation[0] : null;
  } catch {
    return null;
  }
}

function applyCountryTheme(country) {
  const theme = COUNTRY_THEMES[country];
  if (theme) {
    document.body.dataset.theme = theme;
  } else {
    delete document.body.dataset.theme;
  }
}

function applyTripData(trip, accommodations) {
  // Kopie eerst nemen — accommodations kan (in een fallback-pad) dezelfde
  // array-referentie zijn als ACCOMMODATIONS zelf, die hieronder leeg-
  // gemaakt wordt. Zonder deze kopie zou die dan als lege array eindigen.
  const snapshot = accommodations.slice();

  TRIP_START.setTime(trip.startDate.getTime());
  TRIP_END.setTime(trip.endDate.getTime());
  applyCountryTheme(trip.country);

  ACCOMMODATIONS.length = 0;
  // Sorteert op check-in datum i.p.v. het (onbetrouwbare, vaak
  // ontbrekende) order-veld — zie de FIX-toelichting bij
  // dbLoadAccommodations() in js/firebase.js.
  snapshot
    .sort((a, b) => new Date(a.checkIn) - new Date(b.checkIn))
    .forEach(acc => ACCOMMODATIONS.push({
      ...acc,
      checkIn: new Date(acc.checkIn),
      checkOut: new Date(acc.checkOut),
    }));

  // Eenmalige kleurmigratie: Skjåk Solside's blauw lag qua helderheid te
  // dicht bij Sogndal's groen om op een dunne rand goed te onderscheiden
  // (zie docs/10-issues). js/data.js's seed heeft al de nieuwe kleur, maar
  // een al bestaand Firestore-document met de oude hex blijft anders voor
  // altijd hangen — er is geen edit-veld voor accommodatiekleur. Zelfhelend:
  // corrigeert het geheugen én schrijft de fix één keer terug, waarna dit
  // een no-op wordt.
  const LEGACY_COLOR_FIX = { '#1565c0': '#1e88e5' };
  ACCOMMODATIONS.forEach(acc => {
    const fixed = LEGACY_COLOR_FIX[acc.color];
    if (fixed) {
      acc.color = fixed;
      dbSaveAccommodation(trip.id, { id: acc.id, color: fixed });
    }
  });

  // Eenmalige zelfhelende migratie (zie docs/10-issues/12-reisdag-kleur-
  // bugfix.md): vóór parseLocalDateInput() konden checkIn/checkOut via het
  // bewerkformulier op UTC-middernacht i.p.v. lokale middernacht terecht-
  // komen. getAccommodationForDate()'s >=/<-vergelijking is daar tolerant
  // voor, maar de exacte `.getTime() ===`-check in buildDayTabs() (die een
  // verplaatsdag herkent: checkOut van het ene verblijf = checkIn van het
  // volgende) faalt bij zo'n tijdsverschil — het 🚗-icoon en de tweekleurige
  // rand blijven dan stilzwijgend weg, ook al is de kleur van de dag zelf
  // wél correct. Verblijven die vóór deze migratie al zijn opgeslagen
  // blijven anders voor altijd op het foute tijdstip hangen — er is geen
  // andere manier om ze te corrigeren dan bij het laden.
  let dateFixApplied = false;
  ACCOMMODATIONS.forEach(acc => {
    const normalizedCheckIn = new Date(acc.checkIn.getFullYear(), acc.checkIn.getMonth(), acc.checkIn.getDate());
    const normalizedCheckOut = new Date(acc.checkOut.getFullYear(), acc.checkOut.getMonth(), acc.checkOut.getDate());
    if (acc.checkIn.getTime() !== normalizedCheckIn.getTime() || acc.checkOut.getTime() !== normalizedCheckOut.getTime()) {
      acc.checkIn = normalizedCheckIn;
      acc.checkOut = normalizedCheckOut;
      dbSaveAccommodation(trip.id, {
        id: acc.id,
        checkIn: normalizedCheckIn.toISOString(),
        checkOut: normalizedCheckOut.toISOString(),
      });
      dateFixApplied = true;
    }
  });
  // Reisdata (trips/{tripId}, startDate/endDate) is een tweede plek waar
  // datum wordt opgeslagen — afgeleid als min/max van alle verblijven (zie
  // recalculateTripDates()). Die kan dezelfde tijdstip-afwijking bevatten als
  // 'm berekend werd tóen een verblijf nog kapotte tijden had. Alleen
  // herberekenen als er hierboven daadwerkelijk iets gecorrigeerd is.
  if (dateFixApplied) recalculateTripDates();

  // Eenmalige hoogte-verificatie via Open-Meteo (zie docs/10-issues/12-
  // reisdag-kleur-bugfix.md): het elevation-veld had tot nu toe geen
  // bewerkbaar formulierveld — bestaande verblijven droegen dus alleen een
  // handmatig geschatte waarde uit de allereerste opzet (of 0 voor een later
  // toegevoegd verblijf zoals Hotel Kolding). Haalt eenmalig per verblijf de
  // echte hoogte op en schrijft 'm terug; elevationVerified voorkomt dat een
  // latere handmatige correctie via het bewerkformulier hierna weer
  // overschreven wordt. Fire-and-forget (async), blokkeert het renderen niet.
  ACCOMMODATIONS.forEach(async acc => {
    if (acc.elevationVerified || !acc.lat || !acc.lng) return;
    const real = await fetchElevationForCoords(acc.lat, acc.lng);
    if (real == null) return;
    acc.elevation = Math.round(real);
    acc.elevationVerified = true;
    dbSaveAccommodation(trip.id, { id: acc.id, elevation: acc.elevation, elevationVerified: true });
    // Ronde is klaar ná de eerste render (netwerk-round-trip) — actieve
    // schermen die de hoogte tonen alsnog verversen, anders zie je 'm pas na
    // de volgende navigatie.
    renderHomeScreen();
    if (document.getElementById('screen-planning').classList.contains('active')) renderPlanningScreen();
    if (document.getElementById('screen-accommodation').classList.contains('active')) renderAccommodationScreen(AppState.viewingAccommodationId);
  });
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
  AppState.selectedPlanningDay = getClosestTripDay();
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

async function updateTripMeta(tripId, changes) {
  const trip = AppState.trips.find(t => t.id === tripId);
  if (!trip) return null;
  Object.assign(trip, changes);
  await dbSaveTripMeta(trip);
  return trip;
}

// FIX (Fase F): schakelde voorheen stil naar trips[0] (geen vaste
// volgorde) als de actieve reis verweesd werd — dat kon aanvoelen als
// "er werd zomaar een andere reis geactiveerd". Reis-activering moet
// altijd een expliciete keuze zijn; de aanroeper (handleDeleteTrip)
// laat de gebruiker nu zelf kiezen welke reis actief wordt.
async function deleteTrip(tripId) {
  const wasActive = AppState.trips.find(t => t.id === tripId)?.isActive;
  await dbDeleteTripMeta(tripId);
  AppState.trips = AppState.trips.filter(t => t.id !== tripId);
  return wasActive;
}

// ── Verblijf toevoegen aan een bestaande reis (Fase F) ─────
// Zelfde velden als het bewerkformulier; short/color/elevation krijgen
// dezelfde defaults als bij het aanmaken van een gloednieuwe reis
// (saveTrip() in js/screen-tickets.js) voor visuele consistentie.
async function createAccommodationForTrip(fields) {
  const id = (self.crypto && crypto.randomUUID) ? crypto.randomUUID() : `acc-${Date.now()}-${Math.random()}`;
  const acc = {
    id,
    name: fields.name,
    address: fields.address,
    checkIn: fields.checkIn,
    checkOut: fields.checkOut,
    lat: fields.lat,
    lng: fields.lng,
    coord: fields.coord,
    url: fields.url,
    photoDataUrl: fields.photoDataUrl || null,
    notes: fields.notes,
    short: (fields.name || 'Vbl').slice(0, 3),
    color: nextAccommodationColor(),
    elevation: fields.elevation || 0,
    elevationVerified: !!fields.elevationVerified,
    phone: fields.phone || null,
  };
  ACCOMMODATIONS.push(acc);
  await dbSaveAccommodation(getCurrentTripId(), {
    ...acc,
    checkIn: acc.checkIn.toISOString(),
    checkOut: acc.checkOut.toISOString(),
  });
  await recalculateTripDates();
  return acc;
}

// ── Verblijf bewerken/verwijderen (Fase E) ─────────────────
async function updateAccommodation(accId, changes) {
  const acc = ACCOMMODATIONS.find(a => a.id === accId);
  if (!acc) return null;
  Object.assign(acc, changes);
  // dbSaveAccommodation verwacht checkIn/checkOut als ISO-strings (zelfde
  // conventie als createTrip()) — in ACCOMMODATIONS staan ze als Date.
  await dbSaveAccommodation(getCurrentTripId(), {
    ...acc,
    checkIn: acc.checkIn.toISOString(),
    checkOut: acc.checkOut.toISOString(),
  });
  await recalculateTripDates();
  return acc;
}

// Reis start/einddatum groeit automatisch mee met verblijf-wijzigingen
// (Fase E-besluit), herberekend uit min/max van alle verblijven.
async function recalculateTripDates() {
  if (ACCOMMODATIONS.length === 0) return;
  const newStart = new Date(Math.min(...ACCOMMODATIONS.map(a => a.checkIn.getTime())));
  const newEnd = new Date(Math.max(...ACCOMMODATIONS.map(a => a.checkOut.getTime())));
  TRIP_START.setTime(newStart.getTime());
  TRIP_END.setTime(newEnd.getTime());
  await updateTripMeta(getCurrentTripId(), { startDate: new Date(TRIP_START), endDate: new Date(TRIP_END) });
}

async function deleteAccommodationWithChoice(accId, alsoDeleteActivities) {
  if (alsoDeleteActivities) {
    const toDelete = AppState.activities.filter(act => idsMatch(act.accId, accId));
    for (const act of toDelete) {
      await deleteActivity(act.id);
    }
  }
  await dbDeleteAccommodation(getCurrentTripId(), accId);
  const idx = ACCOMMODATIONS.findIndex(a => a.id === accId);
  if (idx !== -1) ACCOMMODATIONS.splice(idx, 1);
  await recalculateTripDates();
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

// Zet body.read-only-mode aan/uit op basis van de huidige toegang
// (eigenaar, deel-link view/edit, of standaard vol-toegang). Puur UI —
// zie css/styles.css voor de .edit-only/.edit-pencil-btn-verberging.
function applyAccessStateToUI() {
  document.body.classList.toggle('read-only-mode', !canEdit());
}

// ── Init ──────────────────────────────────────────────────
function initAppState() {
  loadSettingsFromStorage();
  AppState.selectedPlanningDay = getClosestTripDay();
  AppState.viewingAccommodationId = getActiveAccommodation().id;

  // Firebase sync starten zodra db klaar is
  onDbReady(async () => {
    applyAccessStateToUI();
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
    // Een deel-link met een vaste reis (isTripLocked()) overstemt alles —
    // die bezoeker mag alleen die ene reis zien, punt uit.
    const urlHadExplicitTrip = !!new URLSearchParams(window.location.search).get('trip');
    let targetTripId = isTripLocked()
      ? getCurrentTripId()
      : (urlHadExplicitTrip ? getCurrentTripId() : (getActiveTrip() || trips[0]).id);
    let targetTrip = trips.find(t => t.id === targetTripId);
    if (!targetTrip) {
      targetTrip = trips[0];
      targetTripId = targetTrip.id;
    }
    setCurrentTripId(targetTripId);

    const accs = await dbLoadAccommodations(targetTripId);
    applyTripData(targetTrip, accs && accs.length > 0 ? accs : ACCOMMODATIONS);
    AppState.selectedPlanningDay = getClosestTripDay();
    AppState.viewingAccommodationId = getActiveAccommodation() ? getActiveAccommodation().id : null;

    startFirebaseSync();
    updateMeerSummary();
    if (document.getElementById('screen-home').classList.contains('active')) renderHomeScreen();
  });
}
