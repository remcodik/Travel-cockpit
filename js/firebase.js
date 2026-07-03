// ═══════════════════════════════════════════════════════════
// firebase.js — Firestore database koppeling
// Persistent opslag voor tickets, activiteiten, planning.
// Gedeeld via een trip-ID zodat reisgenoten dezelfde data zien.
// ═══════════════════════════════════════════════════════════

// Firebase SDK via CDN (zie index.html <head> voor de script-tags)
// Alle functies zijn async en vallen netjes terug op local state
// als de verbinding wegvalt.

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDKRGvn877Q-rNeqwZ4NsxloxFmFVaION8",
  authDomain: "travel-cockpit-89ef5.firebaseapp.com",
  projectId: "travel-cockpit-89ef5",
  storageBucket: "travel-cockpit-89ef5.firebasestorage.app",
  messagingSenderId: "815259961754",
  appId: "1:815259961754:web:35fea3001a542f59111223",
};

// Trip-ID: staat in de URL als ?trip=XXX, anders de standaard reis.
// Gedeelde link = zelfde trip-ID = zelfde data voor alle bezoekers.
const DEFAULT_TRIP_ID = 'noorwegen-2026';

let db = null;
let tripId = DEFAULT_TRIP_ID;
let dbReady = false;
let dbReadyCallbacks = [];

function onDbReady(fn) {
  if (dbReady) { fn(); return; }
  dbReadyCallbacks.push(fn);
}

// ── Toegang: eigenaar-PIN of deel-link (Fase G — deel-links met rechten) ──
// Standaard (geen link, geen PIN) blijft dit vol-toegang — exact het
// gedrag van vandaag. Alleen een deel-link met scope:'view' of een
// vaste tripId beperkt dit. Dit wordt pas écht afgedwongen zodra de
// eigenaar de nieuwe firestore.rules publiceert (zie
// docs/10-issues/07-deel-links-permissies-plan.md) — tot die tijd is
// dit puur UI-gedrag.
let accessState = {
  scope: 'edit',       // 'view' | 'edit'
  lockedTripId: null,  // niet-null = alleen deze reis tonen, geen wisselen
  isOwner: false,
  isShareLink: false,
};

function getAccessState() { return accessState; }
function canEdit() { return accessState.scope !== 'view'; }
function isTripLocked() { return !!accessState.lockedTripId; }

const OWNER_SESSION_KEY = 'tc_owner_session';

async function initFirebase() {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('trip')) tripId = params.get('trip');

    const app = firebase.initializeApp(FIREBASE_CONFIG);
    db = firebase.firestore(app);

    // Optimistische offline-ondersteuning — Firestore cachet lokaal
    db.enablePersistence({ synchronizeTabs: true }).catch(() => {});

    await initAuthFlow(params);

    dbReady = true;
    dbReadyCallbacks.forEach(fn => fn());
    dbReadyCallbacks = [];
    console.log(`Firebase gereed — trip: ${tripId}`);
  } catch (err) {
    console.error('Firebase init mislukt:', err);
    // App blijft werken met in-memory data
  }
}

// Wordt vóór het laden van reisdata afgewacht, zodat een eventuele
// deel-link-sessie al actief is voordat de eerste Firestore-lezing
// gebeurt. Faalt dit (ongeldige/ingetrokken link, geen internet), dan
// gaat de app gewoon door zonder ingelogde sessie — vandaag verandert
// dat niets omdat de Firestore-rules nog niets afdwingen.
async function initAuthFlow(params) {
  const shareId = params.get('share');
  if (shareId) {
    await redeemShareLink(shareId);
    return;
  }
  // Geen deel-link: als er al een eerdere eigenaar-sessie was (Firebase
  // Auth onthoudt dit zelf tussen bezoeken), wachten we die kort af zodat
  // canEdit()/isTripLocked() meteen kloppen. Geen PIN-scherm afdwingen —
  // dat blijft een bewuste actie via "Deel-links beheren".
  try {
    await Promise.race([
      new Promise(resolve => {
        const unsub = firebase.auth().onAuthStateChanged(user => {
          unsub();
          if (user && localStorage.getItem(OWNER_SESSION_KEY) === '1') {
            accessState = { scope: 'edit', lockedTripId: null, isOwner: true, isShareLink: false };
          }
          resolve();
        });
      }),
      new Promise(resolve => setTimeout(resolve, 1500)),
    ]);
  } catch { /* geen blokkerende fout — app werkt door met standaardtoegang */ }
}

async function redeemShareLink(shareId) {
  try {
    const resp = await fetch(`/api/redeem-share?id=${encodeURIComponent(shareId)}`);
    const data = await resp.json();
    if (!resp.ok || !data.token) {
      console.error('Deel-link ongeldig:', data.error);
      onDbReady(() => showToast && showToast('⚠️ Deze deel-link is ongeldig of ingetrokken'));
      return;
    }
    await firebase.auth().signInWithCustomToken(data.token);
    accessState = {
      scope: data.scope,
      lockedTripId: data.tripId || null,
      isOwner: false,
      isShareLink: true,
    };
    if (data.tripId) tripId = data.tripId;
  } catch (err) {
    console.error('Deel-link inwisselen mislukt:', err);
  }
}

// Eigenaar-login vanuit "Deel-links beheren" (js/screen-tickets.js).
// Geeft true/false terug zodat de UI een foutmelding kan tonen.
async function signInAsOwner(pin) {
  try {
    const resp = await fetch('/api/owner-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    const data = await resp.json();
    if (!resp.ok || !data.token) return false;
    await firebase.auth().signInWithCustomToken(data.token);
    accessState = { scope: 'edit', lockedTripId: null, isOwner: true, isShareLink: false };
    localStorage.setItem(OWNER_SESSION_KEY, '1');
    return true;
  } catch (err) {
    console.error('Eigenaar-login mislukt:', err);
    return false;
  }
}

// Roept de owner-PIN-gated API's aan (create/list/revoke-share) met
// consistente foutafhandeling.
async function callShareApi(path, body) {
  const resp = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data.error || `${path} mislukt`);
  return data;
}

function tripRef(collection) {
  if (!db) return null;
  return db.collection('trips').doc(tripId).collection(collection);
}

function getCurrentTripId() {
  return tripId;
}

// Wisselt de actieve trip-ID. Roept alleen de variabele bij — het
// afmelden van oude listeners en opnieuw laden van data gebeurt in
// state.js (switchToTrip), dat deze functie aanroept.
function setCurrentTripId(newTripId) {
  tripId = newTripId;
}

// ── Genereer een deelbare reislink ────────────────────────
function getTripShareUrl() {
  const base = window.location.origin + window.location.pathname;
  return `${base}?trip=${tripId}`;
}

function copyTripShareUrl() {
  const url = getTripShareUrl();
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => showToast('✓ Reislink gekopieerd'));
  } else {
    // Fallback voor oudere iOS Safari
    const el = document.createElement('textarea');
    el.value = url;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    showToast('✓ Reislink gekopieerd');
  }
}

// ── Activiteiten ──────────────────────────────────────────
async function dbSaveActivity(activity) {
  const ref = tripRef('activities');
  if (!ref) return;
  try {
    const data = {
      ...activity,
      date: activity.date ? activity.date.toISOString() : null,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };
    await ref.doc(String(activity.id)).set(data);
  } catch (err) {
    console.error('Activity opslaan mislukt:', err);
  }
}

async function dbDeleteActivity(id) {
  const ref = tripRef('activities');
  if (!ref) return;
  try {
    await ref.doc(String(id)).delete();
  } catch (err) {
    console.error('Activity verwijderen mislukt:', err);
  }
}

async function dbLoadActivities() {
  const ref = tripRef('activities');
  if (!ref) return null;
  try {
    const snap = await ref.get();
    return snap.docs.map(doc => {
      const d = doc.data();
      return { ...d, date: d.date ? new Date(d.date) : null, id: parseInt(doc.id) || doc.id };
    });
  } catch (err) {
    console.error('Activities laden mislukt:', err);
    return null;
  }
}

// Realtime luisteren naar activiteit-wijzigingen door reisgenoten
function dbWatchActivities(callback) {
  const ref = tripRef('activities');
  if (!ref) return () => {};
  return ref.onSnapshot(snap => {
    const activities = snap.docs.map(doc => {
      const d = doc.data();
      return { ...d, date: d.date ? new Date(d.date) : null, id: parseInt(doc.id) || doc.id };
    });
    callback(activities);
  }, err => console.error('Activity watch fout:', err));
}

// ── Tickets ───────────────────────────────────────────────
// FIX: doc-ID is het stabiele ticket.id (UUID), niet de array-index.
// Met index als ID verschoof de foto van een ander ticket naar dit
// ticket zodra er eentje ertussenuit werd verwijderd.
async function dbSaveTicket(ticket) {
  const ref = tripRef('tickets');
  if (!ref || !ticket.id) return;
  try {
    // Bestandsdata (base64) slaan we lokaal op vanwege Firestore 1MB limiet
    const { fileDataUrl, ...rest } = ticket;
    await ref.doc(ticket.id).set({
      ...rest,
      hasFile: !!fileDataUrl,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    // Bestand apart opslaan in localStorage (device-local)
    if (fileDataUrl) {
      try { localStorage.setItem(`tc_ticket_file_${ticket.id}`, fileDataUrl); } catch (e) {}
    }
  } catch (err) {
    console.error('Ticket opslaan mislukt:', err);
  }
}

async function dbDeleteTicket(ticketId) {
  const ref = tripRef('tickets');
  if (!ref || !ticketId) return;
  try {
    await ref.doc(ticketId).delete();
    try { localStorage.removeItem(`tc_ticket_file_${ticketId}`); } catch (e) {}
  } catch (err) {
    console.error('Ticket verwijderen mislukt:', err);
  }
}

async function dbLoadTickets() {
  const ref = tripRef('tickets');
  if (!ref) return null;
  try {
    const snap = await ref.orderBy('updatedAt').get();
    return snap.docs.map(doc => {
      const d = doc.data();
      // Bestandsdata terug ophalen uit localStorage
      const fileDataUrl = d.hasFile
        ? (localStorage.getItem(`tc_ticket_file_${doc.id}`) || null)
        : null;
      return { ...d, id: doc.id, fileDataUrl };
    });
  } catch (err) {
    console.error('Tickets laden mislukt:', err);
    return null;
  }
}

// Realtime luisteren naar ticket-wijzigingen
function dbWatchTickets(callback) {
  const ref = tripRef('tickets');
  if (!ref) return () => {};
  return ref.onSnapshot(snap => {
    const tickets = snap.docs.map(doc => {
      const d = doc.data();
      const fileDataUrl = d.hasFile
        ? (localStorage.getItem(`tc_ticket_file_${doc.id}`) || null)
        : null;
      return { ...d, id: doc.id, fileDataUrl };
    });
    callback(tickets);
  }, err => console.error('Ticket watch fout:', err));
}

// ── AI-suggesties cache ───────────────────────────────────
// Opslaan in Firestore zodat cache gedeeld is tussen reisgenoten
async function dbSaveAiSuggestions(accId, suggestions) {
  const ref = tripRef('ai_cache');
  if (!ref) return;
  try {
    await ref.doc(String(accId)).set({
      suggestions,
      savedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.error('AI cache opslaan mislukt:', err);
  }
}

async function dbLoadAiSuggestions(accId) {
  const ref = tripRef('ai_cache');
  if (!ref) return null;
  try {
    const doc = await ref.doc(String(accId)).get();
    if (!doc.exists) return null;
    const d = doc.data();
    // Cache vervalt na 24 uur
    if (d.savedAt) {
      const age = Date.now() - d.savedAt.toDate().getTime();
      if (age > 24 * 60 * 60 * 1000) return null;
    }
    return d.suggestions || null;
  } catch (err) {
    console.error('AI cache laden mislukt:', err);
    return null;
  }
}

// ── Reizen (trips-collectie op het hoogste niveau) ────────
// Elk trip-document bevat alleen metadata (naam, land, data, actief).
// De bijbehorende activiteiten/tickets/accommodaties staan in de
// subcollecties eronder, via tripRef() — precies zoals nu al gebeurt
// voor de standaardreis, alleen was er tot nu toe nooit een echt
// document op trips/{tripId} zelf.
function allTripsRef() {
  if (!db) return null;
  return db.collection('trips');
}

async function dbLoadAllTrips() {
  const ref = allTripsRef();
  if (!ref) return null;
  try {
    const snap = await ref.get();
    return snap.docs
      .filter(doc => doc.data().name) // sluit lege/legacy trip-docs uit
      .map(doc => {
        const d = doc.data();
        return {
          ...d,
          id: doc.id,
          startDate: d.startDate ? new Date(d.startDate) : null,
          endDate: d.endDate ? new Date(d.endDate) : null,
        };
      });
  } catch (err) {
    console.error('Reizen laden mislukt:', err);
    return null;
  }
}

function dbWatchAllTrips(callback) {
  const ref = allTripsRef();
  if (!ref) return () => {};
  return ref.onSnapshot(snap => {
    const trips = snap.docs
      .filter(doc => doc.data().name)
      .map(doc => {
        const d = doc.data();
        return {
          ...d,
          id: doc.id,
          startDate: d.startDate ? new Date(d.startDate) : null,
          endDate: d.endDate ? new Date(d.endDate) : null,
        };
      });
    callback(trips);
  }, err => console.error('Reizen watch fout:', err));
}

async function dbSaveTripMeta(trip) {
  const ref = allTripsRef();
  if (!ref || !trip.id) return;
  try {
    await ref.doc(trip.id).set({
      name: trip.name,
      country: trip.country,
      countryFlag: trip.countryFlag || '',
      startDate: trip.startDate ? trip.startDate.toISOString() : null,
      endDate: trip.endDate ? trip.endDate.toISOString() : null,
      isActive: !!trip.isActive,
      createdAt: trip.createdAt || firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.error('Reis opslaan mislukt:', err);
  }
}

// Zet precies één reis actief; deactiveert de rest (spiegelt DL-004
// uit de Flutter-architectuur: nooit meer dan één actieve reis).
async function dbSetActiveTrip(newActiveTripId, allTripIds) {
  const ref = allTripsRef();
  if (!ref) return;
  try {
    const batch = db.batch();
    allTripIds.forEach(id => {
      batch.set(ref.doc(id), { isActive: id === newActiveTripId }, { merge: true });
    });
    await batch.commit();
  } catch (err) {
    console.error('Reis activeren mislukt:', err);
  }
}

async function dbDeleteTripMeta(tripIdToDelete) {
  const ref = allTripsRef();
  if (!ref) return;
  try {
    await ref.doc(tripIdToDelete).delete();
    // Subcollecties (activiteiten/tickets/accommodaties/ai_cache) blijven
    // achter als "wees"-data in Firestore — bewust niet automatisch
    // verwijderd, zodat een per-ongeluk-verwijderde reis herstelbaar
    // blijft door hem opnieuw aan te maken met dezelfde trip-ID.
  } catch (err) {
    console.error('Reis verwijderen mislukt:', err);
  }
}

// Alleen voor export (N6) — laadt activiteiten/tickets van een
// willekeurige reis, i.p.v. tripRef()'s vaste "huidige reis". Wisselt
// bewust niets in de actieve app-state.
async function dbLoadActivitiesForTrip(forTripId) {
  const ref = db && db.collection('trips').doc(forTripId).collection('activities');
  if (!ref) return [];
  try {
    const snap = await ref.get();
    return snap.docs.map(doc => {
      const d = doc.data();
      return { ...d, id: doc.id };
    });
  } catch (err) {
    console.error('Activiteiten laden voor export mislukt:', err);
    return [];
  }
}

async function dbLoadTicketsForTrip(forTripId) {
  const ref = db && db.collection('trips').doc(forTripId).collection('tickets');
  if (!ref) return [];
  try {
    const snap = await ref.get();
    return snap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  } catch (err) {
    console.error('Tickets laden voor export mislukt:', err);
    return [];
  }
}

// ── Accommodaties (per reis, onder trips/{tripId}/accommodations) ──
// FIX: sorteerde voorheen op orderBy('order') — Firestore sluit
// documenten zonder dat veld volledig uit van het resultaat. Alleen de
// oorspronkelijke Noorwegen-seed kreeg ooit een order-waarde; elk via
// "Reis toevoegen" aangemaakt verblijf miste 'm, waardoor de
// accommodaties van elke nieuw aangemaakte reis nooit geladen werden.
// checkIn staat altijd gegarandeerd op elk verblijf, en sorteert
// chronologisch correct als ISO-string — dus geen reorder-UI nodig,
// de volgorde volgt gewoon de data (op verzoek van de gebruiker).
async function dbLoadAccommodations(forTripId) {
  const ref = db && db.collection('trips').doc(forTripId).collection('accommodations');
  if (!ref) return null;
  try {
    const snap = await ref.orderBy('checkIn').get();
    return snap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  } catch (err) {
    console.error('Accommodaties laden mislukt:', err);
    return null;
  }
}

async function dbSaveAccommodation(forTripId, acc) {
  const ref = db && db.collection('trips').doc(forTripId).collection('accommodations');
  if (!ref || !acc.id) return;
  try {
    const { id, ...rest } = acc;
    await ref.doc(id).set(rest, { merge: true });
  } catch (err) {
    console.error('Accommodatie opslaan mislukt:', err);
  }
}

async function dbDeleteAccommodation(forTripId, accId) {
  const ref = db && db.collection('trips').doc(forTripId).collection('accommodations');
  if (!ref) return;
  try {
    await ref.doc(accId).delete();
  } catch (err) {
    console.error('Accommodatie verwijderen mislukt:', err);
  }
}
