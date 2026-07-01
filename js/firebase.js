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

function initFirebase() {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('trip')) tripId = params.get('trip');

    const app = firebase.initializeApp(FIREBASE_CONFIG);
    db = firebase.firestore(app);

    // Optimistische offline-ondersteuning — Firestore cachet lokaal
    db.enablePersistence({ synchronizeTabs: true }).catch(() => {});

    dbReady = true;
    dbReadyCallbacks.forEach(fn => fn());
    dbReadyCallbacks = [];
    console.log(`Firebase gereed — trip: ${tripId}`);
  } catch (err) {
    console.error('Firebase init mislukt:', err);
    // App blijft werken met in-memory data
  }
}

function tripRef(collection) {
  if (!db) return null;
  return db.collection('trips').doc(tripId).collection(collection);
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
async function dbSaveTicket(ticket, index) {
  const ref = tripRef('tickets');
  if (!ref) return;
  try {
    // Bestandsdata (base64) slaan we lokaal op vanwege Firestore 1MB limiet
    const { fileDataUrl, ...rest } = ticket;
    await ref.doc(String(index)).set({
      ...rest,
      hasFile: !!fileDataUrl,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    // Bestand apart opslaan in localStorage (device-local)
    if (fileDataUrl) {
      try { localStorage.setItem(`tc_ticket_file_${index}`, fileDataUrl); } catch (e) {}
    }
  } catch (err) {
    console.error('Ticket opslaan mislukt:', err);
  }
}

async function dbDeleteTicket(index) {
  const ref = tripRef('tickets');
  if (!ref) return;
  try {
    await ref.doc(String(index)).delete();
    try { localStorage.removeItem(`tc_ticket_file_${index}`); } catch (e) {}
  } catch (err) {
    console.error('Ticket verwijderen mislukt:', err);
  }
}

async function dbLoadTickets() {
  const ref = tripRef('tickets');
  if (!ref) return null;
  try {
    const snap = await ref.orderBy('updatedAt').get();
    return snap.docs.map((doc, i) => {
      const d = doc.data();
      // Bestandsdata terug ophalen uit localStorage
      const fileDataUrl = d.hasFile
        ? (localStorage.getItem(`tc_ticket_file_${doc.id}`) || null)
        : null;
      return { ...d, fileDataUrl };
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
      return { ...d, fileDataUrl };
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
