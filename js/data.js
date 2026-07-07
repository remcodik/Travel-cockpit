// ═══════════════════════════════════════════════════════════
// data.js — Alle reisdata voor Travel Cockpit
// Noorwegen 2026 · 15-30 juni
// ═══════════════════════════════════════════════════════════

const TRIP_START = new Date(2026, 5, 15);
const TRIP_END = new Date(2026, 5, 30);
const MONTHS = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
const WEEKDAYS = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];

// Eén iconenset voor zowel AI-suggesties (Discover) als handmatig
// toegevoegde activiteiten — voorheen had Discover deze categorieën,
// maar viel elke toegevoegde activiteit terug op een generiek 📍.
const CATEGORY_EMOJIS = {
  activity: '🏔️', restaurant: '🍽️', cafe: '☕', viewpoint: '🌄',
  roadtrip: '🛣️', town: '🏘️', misc: '📦',
  default: '📍',
};

// Eén centrale plek die per categorie bepaalt welke info/acties relevant
// zijn, i.p.v. dat aannames als "elke activiteit heeft een moeilijkheids-
// graad" los door de code verspreid staan. isHike bepaalt of
// hoogtewinst/niveau/Komoot-hoogteprofiel getoond worden; nearbyCategories
// bepaalt welke "X nabij"-knoppen zinnig zijn — een restaurant hoeft niet
// zichzelf in de buurt te zoeken.
const CATEGORY_META = {
  activity:   { isHike: true,  nearbyCategories: ['restaurant', 'cafe'] },
  restaurant: { isHike: false, nearbyCategories: ['cafe'] },
  cafe:       { isHike: false, nearbyCategories: ['restaurant'] },
  viewpoint:  { isHike: false, nearbyCategories: ['restaurant', 'cafe'] },
  roadtrip:   { isHike: false, nearbyCategories: ['restaurant', 'cafe'] },
  town:       { isHike: false, nearbyCategories: ['restaurant', 'cafe'] },
  // Diversen is een bewuste vangnet-categorie zonder vaste betekenis (kan
  // van alles zijn) — geen "X nabij"-knoppen, want die veronderstellen een
  // herkenbaar soort locatie om naar te zoeken.
  misc:       { isHike: false, nearbyCategories: [] },
};

// Namen/emoji's voor de "X nabij"-knoppen op het activiteit-detailscherm,
// gestuurd door CATEGORY_META.nearbyCategories i.p.v. hardcoded per knop.
const NEARBY_BUTTON_META = {
  restaurant: { emoji: '🍽️', label: 'Eten nabij' },
  cafe: { emoji: '☕', label: 'Café nabij' },
};

// Terugval voor activiteiten die (nog) geen category-veld hebben opgeslagen
// (aangemaakt vóór dit veld bestond) — leidt de categorie af uit het icoon.
function categoryForEmoji(emoji) {
  return Object.keys(CATEGORY_EMOJIS).find(key => CATEGORY_EMOJIS[key] === emoji) || 'activity';
}

function categoryMetaForActivity(act) {
  const category = act.category || categoryForEmoji(act.emoji);
  return CATEGORY_META[category] || CATEGORY_META.activity;
}

// ── Accommodaties ─────────────────────────────────────────
const ACCOMMODATIONS = [
  {
    id: '1', name: 'Sogndal', short: 'Sgd', color: '#2d6a4f',
    checkIn: new Date(2026, 5, 16), checkOut: new Date(2026, 5, 19),
    address: 'Årøyvegen 202, 6857 Sogndal',
    elevation: 12, coord: '61.24°N 7.09°E', lat: 61.2435, lng: 7.0892,
    notes: 'Fjorddorp aan de Lustrafjord. Basis voor Molden, Urnes en Bøyabreen.',
    phone: null,
  },
  {
    id: '2', name: 'Skjåk Solside', short: 'Skj', color: '#1e88e5',
    checkIn: new Date(2026, 5, 19), checkOut: new Date(2026, 5, 23),
    address: 'Skjåk Solside 799, 2690 Skjåk',
    elevation: 1100, coord: '61.91°N 8.41°E', lat: 61.9050, lng: 8.4100,
    notes: 'Droog bergdal. Basis voor Lom, Dønfoss en Klimapark 2469.',
    phone: null,
  },
  {
    id: '3', name: 'Valdres / Noord-Aurdal', short: 'Val', color: '#ef6c00',
    checkIn: new Date(2026, 5, 23), checkOut: new Date(2026, 5, 27),
    address: 'Førsøddin 30, 2920 Leira i Valdres',
    elevation: 520, coord: '60.97°N 9.27°E', lat: 60.9695, lng: 9.2748,
    notes: 'Rustige vallei. Basis voor Besseggen, Bygdin en Mjølkevegen.',
    phone: null,
  },
  {
    id: '4', name: 'Gjerstad', short: 'Gjr', color: '#6a1b9a',
    checkIn: new Date(2026, 5, 27), checkOut: new Date(2026, 5, 29),
    address: 'Løyteveien 14, 4980 Gjerstad',
    elevation: 155, coord: '58.89°N 8.96°E', lat: 58.8858, lng: 8.9578,
    notes: 'Kust en bos. Basis voor Risør, Tvedestrand en Solhomfjell.',
    phone: null,
  },
];

// ── Activiteiten ───────────────────────────────────────────
// status: 'done' | 'planned' | 'todo'
const ACTIVITIES = [
  { id: 1, name: 'Molden', emoji: '🥾', accId: '1', status: 'done', date: new Date(2026, 5, 18), distance: '7 km', duration: '3–4 u', level: 'Gemiddeld', elevation: 1116, lat: 61.259, lng: 7.182, desc: 'Uitzichtwandeling boven de Lustrafjord.' },
  { id: 2, name: 'Solvorn', emoji: '🏘️', accId: '1', status: 'done', date: new Date(2026, 5, 19), distance: '—', duration: '1–2 u', level: 'Makkelijk', elevation: 10, lat: 61.298, lng: 7.228, desc: 'Klein fjorddorpje met veerpont en haven.' },
  { id: 3, name: 'Urnes Stavkyrkje', emoji: '⛪', accId: '1', status: 'done', date: new Date(2026, 5, 19), distance: '—', duration: '1–2 u', level: 'Makkelijk', elevation: 120, lat: 61.300, lng: 7.328, desc: 'UNESCO-staafkerk, oudste van Noorwegen.' },
  { id: 4, name: 'Bøyabreen', emoji: '🧊', accId: '1', status: 'done', date: new Date(2026, 5, 19), distance: '1 km', duration: '30 m', level: 'Makkelijk', elevation: 160, lat: 61.669, lng: 6.823, desc: 'Korte stop bij de gletsjertong.' },
  { id: 5, name: 'Lom sentrum', emoji: '🏕️', accId: '2', status: 'done', date: new Date(2026, 5, 20), distance: '—', duration: '1 u', level: 'Makkelijk', elevation: 382, lat: 61.838, lng: 8.567, desc: 'Bergdorp aan de rivier de Otta.' },
  { id: 6, name: 'Bakeriet i Lom', emoji: '☕', accId: '2', status: 'done', date: new Date(2026, 5, 20), distance: '—', duration: 'koffie', level: '—', elevation: 382, lat: 61.838, lng: 8.568, desc: 'Beste bakkerij van het dal.' },
  { id: 7, name: 'Lom Stavkyrkje', emoji: '⛪', accId: '2', status: 'done', date: new Date(2026, 5, 20), distance: '—', duration: '45 m', level: 'Makkelijk', elevation: 390, lat: 61.839, lng: 8.567, desc: 'Staafkerk uit 1158.' },
  { id: 8, name: 'Klimapark 2469', emoji: '🧊', accId: '2', status: 'done', date: new Date(2026, 5, 21), distance: '—', duration: '3 u', level: 'Begeleid', elevation: 1841, lat: 61.676, lng: 8.344, desc: 'IJstunnel en permafrost bij Juvasshytta.' },
  { id: 9, name: 'Vegaskjelet', emoji: '🥾', accId: '2', status: 'done', date: new Date(2026, 5, 21), distance: '5 km', duration: '2 u', level: 'Gemiddeld', elevation: 900, lat: 61.820, lng: 8.600, desc: 'Rondtocht vanuit Lom.' },
  { id: 10, name: 'Dønfoss', emoji: '🌊', accId: '2', status: 'planned', date: new Date(2026, 5, 22), distance: '1 km', duration: '45 m', level: 'Makkelijk', elevation: 560, lat: 61.893, lng: 8.403, desc: 'Waterval in de Otta, dichtbij Skjåk.' },
  { id: 11, name: 'Gjelbrue', emoji: '🥾', accId: '2', status: 'planned', date: new Date(2026, 5, 22), distance: '4 km', duration: '1–2 u', level: 'Gemiddeld', elevation: 650, lat: 61.913, lng: 8.275, desc: 'Kloof- en rivierwandeling, Tundragjelet.' },
  { id: 12, name: 'Besseggen', emoji: '🏔️', accId: '3', status: 'todo', date: null, distance: '16 km', duration: '6–8 u', level: 'Zwaar', elevation: 1743, lat: 61.517, lng: 8.650, desc: 'De beroemde grat tussen Gjende en Bessvatnet. Alleen bij goed weer.' },
  { id: 13, name: 'M/S Bitihorn', emoji: '🚢', accId: '3', status: 'todo', date: null, distance: '—', duration: '2–4 u', level: 'Makkelijk', elevation: 1060, lat: 61.380, lng: 8.800, desc: 'Bootvaart over het Bygdin meer.' },
  { id: 14, name: 'Mjølkevegen', emoji: '🚴', accId: '3', status: 'todo', date: null, distance: '—', duration: '½ dag', level: 'Gemiddeld', elevation: 900, lat: 60.900, lng: 9.100, desc: 'Fietsroute langs oude veestapels (støler).' },
  { id: 15, name: 'Snøhetta (Gomobu)', emoji: '🏔️', accId: '3', status: 'planned', date: new Date(2026, 5, 24), distance: '8 km', duration: '2–3 u', level: 'Gemiddeld', elevation: 1127, lat: 62.340, lng: 9.167, desc: 'Rondwandeling met panoramisch uitzicht.' },
  { id: 16, name: 'Syndin', emoji: '🏞️', accId: '3', status: 'planned', date: new Date(2026, 5, 24), distance: '—', duration: '2–4 u', level: 'Makkelijk', elevation: 920, lat: 60.900, lng: 9.300, desc: 'Bergmeren en rustige routes.' },
  { id: 17, name: 'Solhomfjell', emoji: '🌲', accId: '4', status: 'todo', date: null, distance: '11 km', duration: '3 u', level: 'Gemiddeld', elevation: 670, lat: 58.930, lng: 9.040, desc: 'Bos- en heuvellandschap.' },
  { id: 18, name: 'Risør', emoji: '⚓', accId: '4', status: 'todo', date: null, distance: '—', duration: '2–3 u', level: 'Makkelijk', elevation: 5, lat: 58.718, lng: 9.233, desc: 'Wit houten kustplaatsje, "Skagerraks parel".' },
  { id: 19, name: 'Tvedestrand', emoji: '⛵', accId: '4', status: 'todo', date: null, distance: '—', duration: '1–2 u', level: 'Makkelijk', elevation: 8, lat: 58.623, lng: 8.934, desc: 'Knus havenstadje aan de Skagerrak.' },
];

// AI-suggesties komen niet meer uit een vaste lijst — zie js/screen-discover.js
// en api/suggestions.js. Dat roept de Anthropic Claude API aan, conform
// docs/04-ai/01-ai-architecture.md.

// ── Volledige route Nijmegen → Noorwegen → Nijmegen ───────
const ROUTE = [
  { name: 'Nijmegen', date: '15 jun', emoji: '🏠', type: 'home', note: 'Vertrek 18:00', elevation: 9, lat: 51.8125, lng: 5.8372 },
  { name: 'Hirtshals', date: '15 jun nacht', emoji: '⚓', type: 'ferry', note: 'Nachtferry', elevation: 4, lat: 57.5879, lng: 9.9580 },
  { name: 'Stavanger', date: '16 jun', emoji: '🌊', type: 'waypoint', note: 'Tussenstop', elevation: 10, lat: 58.9700, lng: 5.7331 },
  { name: 'Bergen', date: '16 jun 13:00', emoji: '⚓', type: 'ferry', note: 'Aankomst', elevation: 12, lat: 60.3913, lng: 5.3221 },
  { name: 'Sogndal', date: '16–19 jun', emoji: '▲', type: 'accommodation', note: '3 nachten', elevation: 12, lat: 61.2190, lng: 7.1580 },
  { name: 'Skjåk', date: '19–23 jun', emoji: '▲', type: 'accommodation', note: '4 nachten', elevation: 1100, lat: 61.9130, lng: 8.2750 },
  { name: 'Valdres', date: '23–27 jun', emoji: '▲', type: 'accommodation', note: '4 nachten', elevation: 520, lat: 60.9850, lng: 9.2360 },
  { name: 'Gjerstad', date: '27–29 jun', emoji: '▲', type: 'accommodation', note: '2 nachten', elevation: 155, lat: 58.8800, lng: 9.0200 },
  { name: 'Kristiansand', date: '29 jun', emoji: '⚓', type: 'ferry', note: 'Ferry terug', elevation: 5, lat: 58.1450, lng: 7.9890 },
  { name: 'Hirtshals', date: '29 jun', emoji: '⚓', type: 'ferry', note: 'Aankomst DK', elevation: 4, lat: 57.5879, lng: 9.9580 },
  { name: 'Kolding', date: '29–30 jun', emoji: '🏨', type: 'hotel', note: 'Overnachting', elevation: 8, lat: 55.4900, lng: 9.4720 },
  { name: 'Nijmegen', date: '30 jun', emoji: '🏠', type: 'home', note: 'Thuis!', elevation: 9, lat: 51.8125, lng: 5.8372 },
];

// Rijroutes (lat/lng paden voor de kaart) — rechte lijn tussen de echte
// waypoints, geen verzonnen tussenpunten. FIX: de heen- en terugrit tussen
// Nijmegen en Denemarken hadden allebei hun eigen, los gekozen tussenpunt
// (de heenrit via de Nederlandse kust, de terugrit via een punt bij
// Hamburg) — dat liet de twee lijnen op de kaart lelijk kruisen ("rare
// knik"), ook al was elke lijn afzonderlijk een redelijke schatting. Een
// rechte lijn tussen de echte plekken (uit ROUTE hierboven) kan nooit meer
// zo'n kunstmatige knik veroorzaken. fetchRealRoute() (js/screen-map.js,
// N7) vervangt deze lijn alsnog door een echte, wegen-volgende route zodra
// er een ORS_API_KEY is ingesteld — dit is alleen de fallback zonder key.
const DRIVE_PATHS = [
  [[51.8125, 5.8372], [57.5879, 9.9580]], // Nijmegen → Hirtshals
  [[60.3913, 5.3221], [61.2190, 7.1580]], // Bergen → Sogndal
  [[61.2190, 7.1580], [61.9130, 8.2750]], // Sogndal → Skjåk
  [[61.9130, 8.2750], [60.9850, 9.2360]], // Skjåk → Valdres
  [[60.9850, 9.2360], [58.8800, 9.0200]], // Valdres → Gjerstad
  [[58.8800, 9.0200], [58.1450, 7.9890]], // Gjerstad → Kristiansand
  [[57.5879, 9.9580], [55.4900, 9.4720]], // Hirtshals → Kolding
  [[55.4900, 9.4720], [51.8125, 5.8372]], // Kolding → Nijmegen
];

// Ferryroutes
const FERRY_PATHS = [
  [[57.5879, 9.9580], [57.9, 7.5], [58.97, 5.7331], [60.3913, 5.3221]],
  [[58.145, 7.989], [57.9, 8.5], [57.5879, 9.9580]],
];

// "Thuis" op de kaart — hetzelfde vertrek-/aankomstpunt dat de rijroutes
// hierboven ook al gebruiken (Nijmegen). Er bestaat nog geen apart
// "thuisadres"-veld per reis (zie HOME_PSEUDO_ACC in js/state.js, die
// alleen dagen markeert, geen locatie kent) — voor nu hetzelfde punt dat
// impliciet al overal in deze route-data staat.
const HOME_LAT = 51.8125;
const HOME_LNG = 5.8372;
