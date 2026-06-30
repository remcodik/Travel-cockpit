// ═══════════════════════════════════════════════════════════
// data.js — Alle reisdata voor Travel Cockpit
// Noorwegen 2026 · 15-30 juni
// ═══════════════════════════════════════════════════════════

const TRIP_START = new Date(2026, 5, 15);
const TRIP_END = new Date(2026, 5, 30);
const MONTHS = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
const WEEKDAYS = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];

// ── Accommodaties ─────────────────────────────────────────
const ACCOMMODATIONS = [
  {
    id: 1, name: 'Sogndal', short: 'Sgd', color: '#2d6a4f',
    checkIn: new Date(2026, 5, 16), checkOut: new Date(2026, 5, 19),
    address: 'Årøyvegen 202, 6857 Sogndal',
    elevation: 12, coord: '61.23°N 7.10°E', lat: 61.2289, lng: 7.1003,
    notes: 'Fjorddorp aan de Lustrafjord. Basis voor Molden, Urnes en Bøyabreen.',
    phone: null,
  },
  {
    id: 2, name: 'Skjåk Solside', short: 'Skj', color: '#1565c0',
    checkIn: new Date(2026, 5, 19), checkOut: new Date(2026, 5, 23),
    address: 'Skjåk Solside 799, 2690 Skjåk',
    elevation: 1100, coord: '61.88°N 8.27°E', lat: 61.8786, lng: 8.2733,
    notes: 'Droog bergdal. Basis voor Lom, Dønfoss en Klimapark 2469.',
    phone: null,
  },
  {
    id: 3, name: 'Valdres / Noord-Aurdal', short: 'Val', color: '#ef6c00',
    checkIn: new Date(2026, 5, 23), checkOut: new Date(2026, 5, 27),
    address: 'Førsøddin 30, 2920 Leira i Valdres',
    elevation: 520, coord: '60.99°N 9.24°E', lat: 60.9856, lng: 9.2361,
    notes: 'Rustige vallei. Basis voor Besseggen, Bygdin en Mjølkevegen.',
    phone: null,
  },
  {
    id: 4, name: 'Gjerstad', short: 'Gjr', color: '#6a1b9a',
    checkIn: new Date(2026, 5, 27), checkOut: new Date(2026, 5, 29),
    address: 'Løyteveien 14, 4980 Gjerstad',
    elevation: 155, coord: '58.88°N 9.02°E', lat: 58.8800, lng: 9.0200,
    notes: 'Kust en bos. Basis voor Risør, Tvedestrand en Solhomfjell.',
    phone: null,
  },
];

// ── Activiteiten ───────────────────────────────────────────
// status: 'done' | 'planned' | 'todo'
const ACTIVITIES = [
  { id: 1, name: 'Molden', emoji: '🥾', accId: 1, status: 'done', date: new Date(2026, 5, 18), distance: '7 km', duration: '3–4 u', level: 'Gemiddeld', elevation: 1116, lat: 61.259, lng: 7.182, desc: 'Uitzichtwandeling boven de Lustrafjord.' },
  { id: 2, name: 'Solvorn', emoji: '🏘️', accId: 1, status: 'done', date: new Date(2026, 5, 19), distance: '—', duration: '1–2 u', level: 'Makkelijk', elevation: 10, lat: 61.298, lng: 7.228, desc: 'Klein fjorddorpje met veerpont en haven.' },
  { id: 3, name: 'Urnes Stavkyrkje', emoji: '⛪', accId: 1, status: 'done', date: new Date(2026, 5, 19), distance: '—', duration: '1–2 u', level: 'Makkelijk', elevation: 120, lat: 61.300, lng: 7.328, desc: 'UNESCO-staafkerk, oudste van Noorwegen.' },
  { id: 4, name: 'Bøyabreen', emoji: '🧊', accId: 1, status: 'done', date: new Date(2026, 5, 19), distance: '1 km', duration: '30 m', level: 'Makkelijk', elevation: 160, lat: 61.669, lng: 6.823, desc: 'Korte stop bij de gletsjertong.' },
  { id: 5, name: 'Lom sentrum', emoji: '🏕️', accId: 2, status: 'done', date: new Date(2026, 5, 20), distance: '—', duration: '1 u', level: 'Makkelijk', elevation: 382, lat: 61.838, lng: 8.567, desc: 'Bergdorp aan de rivier de Otta.' },
  { id: 6, name: 'Bakeriet i Lom', emoji: '☕', accId: 2, status: 'done', date: new Date(2026, 5, 20), distance: '—', duration: 'koffie', level: '—', elevation: 382, lat: 61.838, lng: 8.568, desc: 'Beste bakkerij van het dal.' },
  { id: 7, name: 'Lom Stavkyrkje', emoji: '⛪', accId: 2, status: 'done', date: new Date(2026, 5, 20), distance: '—', duration: '45 m', level: 'Makkelijk', elevation: 390, lat: 61.839, lng: 8.567, desc: 'Staafkerk uit 1158.' },
  { id: 8, name: 'Klimapark 2469', emoji: '🧊', accId: 2, status: 'done', date: new Date(2026, 5, 21), distance: '—', duration: '3 u', level: 'Begeleid', elevation: 1841, lat: 61.676, lng: 8.344, desc: 'IJstunnel en permafrost bij Juvasshytta.' },
  { id: 9, name: 'Vegaskjelet', emoji: '🥾', accId: 2, status: 'done', date: new Date(2026, 5, 21), distance: '5 km', duration: '2 u', level: 'Gemiddeld', elevation: 900, lat: 61.820, lng: 8.600, desc: 'Rondtocht vanuit Lom.' },
  { id: 10, name: 'Dønfoss', emoji: '🌊', accId: 2, status: 'planned', date: new Date(2026, 5, 22), distance: '1 km', duration: '45 m', level: 'Makkelijk', elevation: 560, lat: 61.893, lng: 8.403, desc: 'Waterval in de Otta, dichtbij Skjåk.' },
  { id: 11, name: 'Gjelbrue', emoji: '🥾', accId: 2, status: 'planned', date: new Date(2026, 5, 22), distance: '4 km', duration: '1–2 u', level: 'Gemiddeld', elevation: 650, lat: 61.913, lng: 8.275, desc: 'Kloof- en rivierwandeling, Tundragjelet.' },
  { id: 12, name: 'Besseggen', emoji: '🏔️', accId: 3, status: 'todo', date: null, distance: '16 km', duration: '6–8 u', level: 'Zwaar', elevation: 1743, lat: 61.517, lng: 8.650, desc: 'De beroemde grat tussen Gjende en Bessvatnet. Alleen bij goed weer.' },
  { id: 13, name: 'M/S Bitihorn', emoji: '🚢', accId: 3, status: 'todo', date: null, distance: '—', duration: '2–4 u', level: 'Makkelijk', elevation: 1060, lat: 61.380, lng: 8.800, desc: 'Bootvaart over het Bygdin meer.' },
  { id: 14, name: 'Mjølkevegen', emoji: '🚴', accId: 3, status: 'todo', date: null, distance: '—', duration: '½ dag', level: 'Gemiddeld', elevation: 900, lat: 60.900, lng: 9.100, desc: 'Fietsroute langs oude veestapels (støler).' },
  { id: 15, name: 'Snøhetta (Gomobu)', emoji: '🏔️', accId: 3, status: 'planned', date: new Date(2026, 5, 24), distance: '8 km', duration: '2–3 u', level: 'Gemiddeld', elevation: 1127, lat: 62.340, lng: 9.167, desc: 'Rondwandeling met panoramisch uitzicht.' },
  { id: 16, name: 'Syndin', emoji: '🏞️', accId: 3, status: 'planned', date: new Date(2026, 5, 24), distance: '—', duration: '2–4 u', level: 'Makkelijk', elevation: 920, lat: 60.900, lng: 9.300, desc: 'Bergmeren en rustige routes.' },
  { id: 17, name: 'Solhomfjell', emoji: '🌲', accId: 4, status: 'todo', date: null, distance: '11 km', duration: '3 u', level: 'Gemiddeld', elevation: 670, lat: 58.930, lng: 9.040, desc: 'Bos- en heuvellandschap.' },
  { id: 18, name: 'Risør', emoji: '⚓', accId: 4, status: 'todo', date: null, distance: '—', duration: '2–3 u', level: 'Makkelijk', elevation: 5, lat: 58.718, lng: 9.233, desc: 'Wit houten kustplaatsje, "Skagerraks parel".' },
  { id: 19, name: 'Tvedestrand', emoji: '⛵', accId: 4, status: 'todo', date: null, distance: '—', duration: '1–2 u', level: 'Makkelijk', elevation: 8, lat: 58.623, lng: 8.934, desc: 'Knus havenstadje aan de Skagerrak.' },
];

// ── AI-suggesties per accommodatie ────────────────────────
// Elke suggestie is gekoppeld aan een accId zodat de gebruiker
// altijd ziet vanuit welk verblijf deze bereikbaar is.
const AI_SUGGESTIONS = {
  1: [ // Sogndal
    { name: 'Hodlekve', emoji: '🚠', sub: 'Kabelbaan en zomerskigebied', distance: '20 km', duration: '2–3 u', elevation: 1380 },
    { name: 'Kaupanger Stavkyrkje', emoji: '⛪', sub: 'Grootste staafkerk van Sogn', distance: '15 km', duration: '1 u', elevation: 40 },
  ],
  2: [ // Skjåk
    { name: 'Breheimsenteret', emoji: '🏔️', sub: 'Gletsjercentrum Jostedalsbreen', distance: '3.2 km', duration: '2–3 u', elevation: 300 },
    { name: 'Grotli uitzichtpunt', emoji: '🌄', sub: 'Panorama over Skjåkdal', distance: '8 km', duration: '30 min', elevation: 900 },
    { name: 'Pollfoss Café', emoji: '☕', sub: 'Rustig café langs Rv15', distance: '12 km', duration: 'koffie', elevation: 600 },
    { name: 'Sognefjellet (Rv55)', emoji: '🚗', sub: 'Hoogste bergpas Noord-Europa', distance: '35 km', duration: '+1 u', elevation: 1434 },
  ],
  3: [ // Valdres
    { name: 'Valdresflye', emoji: '🌄', sub: 'Hoogvlakte met rendieren', distance: '18 km', duration: '2 u rijden', elevation: 1389 },
    { name: 'Tyinkrysset', emoji: '🏔️', sub: 'Bergpas richting Jotunheimen', distance: '25 km', duration: '1 u', elevation: 1080 },
  ],
  4: [ // Gjerstad
    { name: 'Gjerstad Stasjon', emoji: '🚂', sub: 'Historisch spoorwegmuseum', distance: '2 km', duration: '1 u', elevation: 80 },
    { name: 'Lyngør', emoji: '⛵', sub: 'Autovrij eilanddorpje', distance: '22 km', duration: '2–3 u', elevation: 2 },
  ],
};

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

// Rijroutes (lat/lng paden voor de kaart, schematisch over land)
const DRIVE_PATHS = [
  [[51.8125, 5.8372], [52.3676, 4.9041], [53.2194, 6.5665], [55.4768, 8.4497], [57.5879, 9.9580]],
  [[60.3913, 5.3221], [60.6, 5.7], [60.86, 6.4], [61.05, 6.8], [61.219, 7.158]],
  [[61.219, 7.158], [61.4, 7.5], [61.564, 8.0], [61.837, 8.567], [61.913, 8.275]],
  [[61.913, 8.275], [61.5, 8.8], [60.985, 9.236]],
  [[60.985, 9.236], [59.7, 9.7], [58.88, 9.02]],
  [[58.88, 9.02], [58.5, 8.5], [58.145, 7.989]],
  [[57.5879, 9.9580], [57.0, 9.8], [55.49, 9.472]],
  [[55.49, 9.472], [53.55, 9.99], [51.8125, 5.8372]],
];

// Ferryroutes
const FERRY_PATHS = [
  [[57.5879, 9.9580], [57.9, 7.5], [58.97, 5.7331], [60.3913, 5.3221]],
  [[58.145, 7.989], [57.9, 8.5], [57.5879, 9.9580]],
];
