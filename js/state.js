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

// Spiegel van parseLocalDateInput(): Date → "YYYY-MM-DD" voor een <input
// type="date">, op basis van de LOKALE kalenderdag. FIX: het bewerkformulier
// gebruikte .toISOString().slice(0, 10) — dat is de UTC-dag. Een reisdatum
// die als lokale middernacht is opgeslagen (Nederland, CEST = UTC+2) valt in
// UTC nog op de dag ervóór, dus het formulier toonde de begindatum één dag
// te vroeg — en elke keer "Opslaan" schoof de reis dan écht een dag terug.
function formatDateInputValue(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getAccommodationForDate(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return ACCOMMODATIONS.find(acc => d >= acc.checkIn && d < acc.checkOut) || null;
}

// Virtueel "Thuis"-verblijf voor de reisdagen vóór de allereerste check-in
// of ná de allerlaatste check-out (bv. de vertrek- of aankomstdag zelf,
// vaak nog binnen TRIP_START..TRIP_END maar niet gedekt door een echt
// verblijf) — puur voor weergave in Planning, geen echt opgeslagen verblijf
// en dus niet gebruikt door getActiveAccommodation() of enige andere
// plek die een écht verblijf verwacht (adres, lat/lng, telefoon, ...).
// Een gat middenin de reis (tussen twee verblijven) blijft bewust
// "reisdag · onderweg" — dat wijst eerder op een ontbrekend verblijf dan
// op "thuis".
// FIX: gold voorheen alleen vóór het eerste verblijf / ná het laatste —
// een gat MIDDENIN de reis (bv. een reisdag tussen een ferry-overnachting
// en het volgende hotel, zonder dat daar een apart verblijf voor is
// aangemaakt) bleef dan alsnog kleurloos ("reisdag · onderweg" in grijs),
// ook al is zo'n tussenliggende reisdag net zo reëel als de rand-dagen.
// Nu: elke dag binnen het reisvenster die niet door een verblijf gedekt
// wordt, krijgt dezelfde neutrale "Thuis/onderweg"-weergave.
const HOME_PSEUDO_ACC = { id: '__home__', name: 'Thuis', short: 'Thuis', color: '#45564C', elevation: null, isHome: true };
function getAccommodationOrHomeForDate(date) {
  const direct = getAccommodationForDate(date);
  if (direct) return direct;
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return (d >= TRIP_START && d <= TRIP_END) ? HOME_PSEUDO_ACC : null;
}

function getActiveAccommodation() {
  // Een reis mag inmiddels zonder verblijven bestaan (datums eerst,
  // verblijven later) — zonder deze guard crashte `last.checkOut` hieronder
  // op undefined, waardoor o.a. wisselen naar zo'n reis halverwege stopte.
  if (ACCOMMODATIONS.length === 0) return null;
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

// Generieke "open deze link"-knop voor een linkveld in een bewerkformulier
// (Komoot-routelink, Link-veld, boekingslink, Maps-link) — een gewoon
// <input> is zelf niet klikbaar zoals een <a>, dus zonder dit was de enige
// manier om een al ingevulde link te bezoeken 'm eerst te kopiëren en apart
// te plakken. Alleen een echte http(s)-link openen, nooit een
// javascript:-achtige waarde.
function openLinkFromInput(inputId) {
  const input = document.getElementById(inputId);
  const url = input && input.value.trim();
  if (!url || !/^https?:\/\//i.test(url)) {
    showToast('Voer eerst een geldige link in (begint met http:// of https://)');
    return;
  }
  window.open(url, '_blank');
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

// Best-effort ECHTE foto bij AI-verrijking (i.p.v. een AI-gegenereerde
// afbeelding) — via Wikipedia's eigen, gratis, CORS-toegestane API's, dus
// rechtstreeks vanuit de client, geen nieuwe serverless function nodig
// (Vercel's functielimiet, zie docs/10-issues/32-...). Zoekt eerst het
// best passende artikel (search-API), haalt daarvan de samenvatting op
// (rest_v1/page/summary) voor de thumbnail. Probeert eerst de opgegeven
// taal, dan Engels — een obscuur lokaal paadje/restaurant heeft vaak geen
// artikel, een bekende bezienswaardigheid/natuurgebied vaak wel. Geen gok:
// null als er niets gevonden wordt.
async function fetchWikipediaPhoto(query, lang) {
  for (const l of [...new Set([lang || 'nl', 'en'])]) {
    try {
      const searchUrl = `https://${l}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=1`;
      const searchResp = await fetch(searchUrl);
      const searchData = await searchResp.json();
      const title = searchData?.query?.search?.[0]?.title;
      if (!title) continue;
      const summaryResp = await fetch(`https://${l}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
      const summaryData = await summaryResp.json();
      const photo = summaryData?.thumbnail?.source || summaryData?.originalimage?.source;
      if (photo) return photo;
    } catch { /* geen internet of Wikipedia onbereikbaar — volgende taal/null */ }
  }
  return null;
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

// Eerstvolgende nog niet afgevinkte, wél ingeplande activiteit ná een
// gegeven datum — gebruikt op Vandaag als "niets gepland vandaag" leeg
// is, zodat er toch iets nuttigs te zien is i.p.v. alleen een knop.
function getNextUpcomingActivity(afterDate) {
  return AppState.activities
    .filter(a => a.date && a.date > afterDate && a.status !== 'done')
    .sort((a, b) => a.date - b.date)[0] || null;
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
  locationVerifiedV2 = false,
}) {
  const existingIds = AppState.activities.map(a => typeof a.id === 'number' ? a.id : 0);
  const newId = Math.max(...existingIds, 0) + 1;
  const activity = {
    id: newId, name, emoji, category: category || categoryForEmoji(emoji), accId, status: 'planned', date: date || null,
    distance, duration, level, elevation, lat, lng, desc,
    googleMapsQuery, whyRecommended, komootTourUrl, link, locationVerifiedV2,
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

// FIX: 'todo' is een legacy-status uit de allereerste seed (js/data.js) —
// altijd gepaard met date: null, dus feitelijk synoniem voor "nog niet
// ingepland". Zodra zo'n activiteit alsnog een datum krijgt (via "+
// Inplannen", verplaatsen, of bewerken) bleef de status stil op 'todo'
// staan, omdat niets die twee velden ooit aan elkaar koppelde. Het
// "Ingepland"-filter in Planning sluit 'todo' bewust uit, dus zo'n
// activiteit leek daar dan onvindbaar ("Niets ingepland op deze dag"),
// terwijl de dagtab-teller (die alleen op datum telt) 'm wél meetelde.
async function updateActivity(id, changes) {
  const act = AppState.activities.find(a => a.id === id);
  if (!act) return null;
  if (changes.date && act.status === 'todo') {
    changes = { ...changes, status: 'planned' };
  }
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

// FIX: telde voorheen ALLE activiteiten mee, ook niet-ingeplande (act.date
// is null — activiteiten die nog los bij een verblijf liggen, zie
// "Beschikbaar vanuit X" in Planning). "Voortgang reis" hoort alleen over
// wat daadwerkelijk ingepland is te gaan, anders klopt de teller niet met
// wat je in Planning ziet staan.
function getProgress() {
  const scheduled = AppState.activities.filter(a => a.date);
  const done = scheduled.filter(a => a.status === 'done').length;
  const total = scheduled.length;
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
// Land-thema per reis — niet beperkt tot een vaste lijst: elk land (ook
// een vrij getypt land dat hier niet in staat) krijgt een eigen palet.
// Bekende reisbestemmingen krijgen een handgekozen [terrein-tint,
// accent-tint]-paar (Fraunces-achtige "topografische kaart"-sfeer, zelfde
// rol als Noorwegens groen/oranje); alles daarbuiten krijgt een palet dat
// deterministisch (dus stabiel bij herladen) uit de landnaam zelf wordt
// afgeleid — zie getCountryHues()/applyCountryTheme() verderop.
const COUNTRY_HUES = {
  noorwegen: [164, 15], norway: [164, 15], norge: [164, 15],
  zweden: [170, 25], sweden: [170, 25], sverige: [170, 25],
  ijsland: [200, 20], iceland: [200, 20],
  finland: [175, 30],
  denemarken: [150, 8], denmark: [150, 8],
  italie: [16, 193], italy: [16, 193], italia: [16, 193],
  spanje: [20, 200], spain: [20, 200], espana: [20, 200],
  portugal: [10, 195],
  griekenland: [205, 25], greece: [205, 25], hellas: [205, 25],
  kroatie: [195, 20], croatia: [195, 20],
  turkije: [15, 205], turkey: [15, 205],
  duitsland: [132, 12], germany: [132, 12], deutschland: [132, 12],
  frankrijk: [140, 355], france: [140, 355],
  oostenrijk: [150, 10], austria: [150, 10],
  zwitserland: [155, 358], switzerland: [155, 358], suisse: [155, 358],
  polen: [135, 5], poland: [135, 5],
  tsjechie: [140, 350], czechia: [140, 350],
  slovenie: [160, 18], slovenia: [160, 18],
  nederland: [160, 20], netherlands: [160, 20],
  belgie: [145, 15], belgium: [145, 15],
  ierland: [130, 40], ireland: [130, 40],
  marokko: [30, 205], morocco: [30, 205],
  egypte: [40, 210], egypt: [40, 210],
  japan: [340, 165], nippon: [340, 165],
  thailand: [15, 195], vietnam: [140, 20], indonesie: [155, 25], indonesia: [155, 25],
  vsverenigdestaten: [210, 15], usa: [210, 15], verenigdestaten: [210, 15],
  canada: [355, 165],
  nieuwzeeland: [155, 30], newzealand: [155, 30],
  australie: [25, 205], australia: [25, 205],
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

function normalizeCountryKey(name) {
  return (name || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // diakritische tekens weg (ë → e)
    .toLowerCase().replace(/[^a-z]/g, '');
}

// Simpele, stabiele string-hash (zelfde land = altijd hetzelfde palet,
// ook na herladen — geen Math.random, geen server nodig).
function hashCountryName(key) {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return h;
}

// Geeft [terrein-tint, accent-tint] terug (beide 0–360°). Bekende landen
// komen uit COUNTRY_HUES; onbekende landen krijgen een uit de naam
// afgeleide terrein-tint met een accent op ruwweg (maar niet exact) de
// tegenoverliggende kant van het kleurenwiel — zelfde contrastverhouding
// als Noorwegens groen/oranje, maar dan voor een willekeurig land.
function getCountryHues(country) {
  const key = normalizeCountryKey(country);
  if (COUNTRY_HUES[key]) return COUNTRY_HUES[key];
  const h = hashCountryName(key || 'reis');
  const terrain = h % 360;
  const accent = (terrain + 180 + (Math.floor(h / 360) % 61) - 30 + 360) % 360;
  return [terrain, accent];
}

function hslToken(h, s, l) {
  return `hsl(${Math.round(((h % 360) + 360) % 360)}, ${s}%, ${l}%)`;
}

// Vervangt de vaste 2-thema's-lijst: berekent voor élk land — ook een vrij
// getypt land dat niet voorkomt in COUNTRY_HUES — een compleet, in
// zichzelf consistent palet en zet dat als inline custom properties op
// :root (wint altijd van de :root{}-waarden in styles.css, dus werkt voor
// oneindig veel landen zonder dat de CSS ooit hoeft te weten welke).
// Verzadiging/helderheid per rol liggen vast (gekalibreerd op het
// bestaande Noorwegen-palet); alleen de tint (H) varieert per land.
function applyCountryTheme(country) {
  const [terrain, accent] = getCountryHues(country);
  const h2 = hashCountryName(normalizeCountryKey(country) || 'reis');
  const waterHue = 196 + (h2 % 21);        // 196–216: blijft herkenbaar "water"-blauw
  const paperHue = 36 + ((h2 >> 8) % 17);  // 36–52: blijft een warme, papierachtige ondergrond

  const root = document.documentElement.style;
  root.setProperty('--spruce', hslToken(terrain, 60, 14));
  root.setProperty('--spruce-deep', hslToken(terrain, 59, 8));
  root.setProperty('--slope', hslToken(terrain, 21, 45));
  root.setProperty('--slope-light', hslToken(terrain, 19, 94));
  root.setProperty('--summit', hslToken(accent, 64, 47));
  root.setProperty('--summit-light', hslToken(accent, 13, 92));
  root.setProperty('--water', hslToken(waterHue, 67, 32));
  root.setProperty('--water-light', hslToken(waterHue, 9, 92));
  root.setProperty('--contour', hslToken(paperHue, 18, 52));
  root.setProperty('--paper', hslToken(paperHue, 25, 88));
  root.setProperty('--paper-warm', hslToken(paperHue, 28, 92));

  document.querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', hslToken(terrain, 60, 14));
}

// Kleuren van één reis zónder het hele app-thema om te zetten — exact
// dezelfde tinten als applyCountryTheme() voor dat land op :root zou
// zetten. Gebruikt door de reiskaarten in "Mijn reizen": tot nu toe was
// het vlaggetje daar het enige visuele verschil tussen reizen; nu draagt
// elke kaart alvast de kleuren die de hele app krijgt zodra je die reis
// activeert (zelfde herkomst, dus altijd consistent met het thema).
function getTripThemeColors(country) {
  const [terrain, accent] = getCountryHues(country);
  return {
    deep: hslToken(terrain, 60, 14),   // = --spruce van dat land
    accent: hslToken(accent, 64, 47),  // = --summit van dat land
    tint: hslToken(terrain, 19, 94),   // = --slope-light van dat land
  };
}

// Brede (maar per definitie nooit volledige) landnaam→vlag-lookup voor de
// vrije land-invoer bij reizen toevoegen/bewerken — onbekend land = 🌍
// i.p.v. een lege of foute vlag.
const COUNTRY_FLAGS = {
  noorwegen: '🇳🇴', norway: '🇳🇴', norge: '🇳🇴',
  zweden: '🇸🇪', sweden: '🇸🇪', sverige: '🇸🇪',
  ijsland: '🇮🇸', iceland: '🇮🇸',
  finland: '🇫🇮',
  denemarken: '🇩🇰', denmark: '🇩🇰',
  italie: '🇮🇹', italy: '🇮🇹', italia: '🇮🇹',
  spanje: '🇪🇸', spain: '🇪🇸', espana: '🇪🇸',
  portugal: '🇵🇹',
  griekenland: '🇬🇷', greece: '🇬🇷', hellas: '🇬🇷',
  kroatie: '🇭🇷', croatia: '🇭🇷',
  turkije: '🇹🇷', turkey: '🇹🇷',
  duitsland: '🇩🇪', germany: '🇩🇪', deutschland: '🇩🇪',
  frankrijk: '🇫🇷', france: '🇫🇷',
  oostenrijk: '🇦🇹', austria: '🇦🇹',
  zwitserland: '🇨🇭', switzerland: '🇨🇭', suisse: '🇨🇭',
  polen: '🇵🇱', poland: '🇵🇱',
  tsjechie: '🇨🇿', czechia: '🇨🇿',
  slovenie: '🇸🇮', slovenia: '🇸🇮',
  nederland: '🇳🇱', netherlands: '🇳🇱',
  belgie: '🇧🇪', belgium: '🇧🇪',
  ierland: '🇮🇪', ireland: '🇮🇪',
  verenigdkoninkrijk: '🇬🇧', unitedkingdom: '🇬🇧', engeland: '🇬🇧',
  marokko: '🇲🇦', morocco: '🇲🇦',
  egypte: '🇪🇬', egypt: '🇪🇬',
  japan: '🇯🇵', nippon: '🇯🇵',
  thailand: '🇹🇭', vietnam: '🇻🇳', indonesie: '🇮🇩', indonesia: '🇮🇩',
  vsverenigdestaten: '🇺🇸', usa: '🇺🇸', verenigdestaten: '🇺🇸',
  canada: '🇨🇦',
  nieuwzeeland: '🇳🇿', newzealand: '🇳🇿',
  australie: '🇦🇺', australia: '🇦🇺',
};

function flagForCountry(country) {
  return COUNTRY_FLAGS[normalizeCountryKey(country)] || '🌍';
}

function applyTripData(trip, accommodations) {
  // Kopie eerst nemen — accommodations kan (in een fallback-pad) dezelfde
  // array-referentie zijn als ACCOMMODATIONS zelf, die hieronder leeg-
  // gemaakt wordt. Zonder deze kopie zou die dan als lege array eindigen.
  const snapshot = accommodations.slice();

  TRIP_START.setTime(trip.startDate.getTime());
  TRIP_END.setTime(trip.endDate.getTime());
  applyCountryTheme(trip.country);
  // Browsertab/PWA-titel volgt de actieve reis — stond vast op
  // "Noorwegen 2026" (index.html), welke reis er ook actief was.
  document.title = `Travel Cockpit · ${trip.name}`;

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
    }
  });

  // FIX (zie docs/10-issues/16-reisdatum-krimp-bugfix.md): reisdata
  // (trips/{tripId} startDate/endDate) mag NOOIT meer automatisch krimpen of
  // exact op de verblijf-data worden vastgepind — de gebruiker stelt de
  // reislengte zelf in via "Reis bewerken", los van hoeveel verblijven er al
  // zijn ingevuld ("die kan ik later toevoegen maar vakantie blijft even
  // lang"). Alleen een permanente ondergrens: een al opgeslagen verblijf mag
  // nooit buiten het zichtbare reisvenster vallen (zou 'm onzichtbaar maken
  // in Planning, zoals hierboven met Hotel Kolding gebeurde) — dus alleen
  // verruimen, nooit krimpen, en alleen wanneer het venster een bestaand
  // verblijf niet meer dekt.
  if (ACCOMMODATIONS.length > 0) {
    const accMinCheckIn = new Date(Math.min(...ACCOMMODATIONS.map(a => a.checkIn.getTime())));
    const accMaxCheckOut = new Date(Math.max(...ACCOMMODATIONS.map(a => a.checkOut.getTime())));
    let windowWidened = false;
    if (accMinCheckIn.getTime() < TRIP_START.getTime()) { TRIP_START.setTime(accMinCheckIn.getTime()); windowWidened = true; }
    if (accMaxCheckOut.getTime() > TRIP_END.getTime()) { TRIP_END.setTime(accMaxCheckOut.getTime()); windowWidened = true; }
    if (windowWidened) updateTripMeta(trip.id, { startDate: new Date(TRIP_START), endDate: new Date(TRIP_END) });
  }

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
  // FIX: de "al toegevoegd"-markeringen van AI-ideeën (Ideeën-scherm)
  // bleven bij het wisselen van reis staan — een suggestie met dezelfde
  // naam leek in de nieuwe reis dan al toegevoegd terwijl die daar
  // helemaal niet bestaat.
  AppState.discoveredAdded = new Set();
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
  // FIX: nieuwe verblijven werden altijd achteraan toegevoegd, ongeacht hun
  // check-in-datum — de accommodatielijst/-chips (die simpelweg ACCOMMODATIONS
  // in array-volgorde tonen) toonden zo's een verblijf met een vroege
  // check-in (bv. een ferry-overnachting vóór het eerste hotel) alsnog
  // helemaal achteraan. Op datum sorteren houdt de volgorde overal correct.
  ACCOMMODATIONS.sort((a, b) => a.checkIn - b.checkIn);
  await dbSaveAccommodation(getCurrentTripId(), {
    ...acc,
    checkIn: acc.checkIn.toISOString(),
    checkOut: acc.checkOut.toISOString(),
  });
  return acc;
}

// ── Verblijf bewerken/verwijderen (Fase E) ─────────────────
async function updateAccommodation(accId, changes) {
  const acc = ACCOMMODATIONS.find(a => a.id === accId);
  if (!acc) return null;
  Object.assign(acc, changes);
  ACCOMMODATIONS.sort((a, b) => a.checkIn - b.checkIn);
  // dbSaveAccommodation verwacht checkIn/checkOut als ISO-strings (zelfde
  // conventie als createTrip()) — in ACCOMMODATIONS staan ze als Date.
  await dbSaveAccommodation(getCurrentTripId(), {
    ...acc,
    checkIn: acc.checkIn.toISOString(),
    checkOut: acc.checkOut.toISOString(),
  });
  return acc;
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
}

// Eenmalige zelfhelende migratie: geen van beide manieren om een activiteit
// toe te voegen zette ooit lat/lng — AI-suggesties (via Ideeën) hadden
// alleen een tekst-zoekopdracht (googleMapsQuery), en "+ Activiteit
// toevoegen" had zelfs helemaal geen locatieveld. Zonder lat/lng toont
// renderMapMarkers() (js/screen-map.js) geen pin, dus zulke activiteiten
// bleven voor altijd onzichtbaar op Kaart, ook keurig ingepland op een dag.
//
// FIX: de eerste versie van deze migratie vuurde alle opzoekingen tegelijk
// af (Array.forEach met een async callback wacht niet op elkaar) — bij een
// hele reis met meerdere onopgeloste activiteiten in één keer overtreedt
// dat Nominatim's gebruiksbeperking (max 1 verzoek/seconde), waardoor een
// deel gewoon niets terugkreeg terwijl locationVerified sowieso op true
// werd gezet — dus voor altijd overgeslagen, ook al kwam dat alleen door
// het overbelaste verzoek zelf. Nu strikt na elkaar (met een korte pauze
// ertussen) en met het land van de reis als context (anders kan bv.
// "Solvorn" naar een gelijknamige plek elders ter wereld matchen i.p.v.
// Noorwegen). locationVerifiedV2 i.p.v. het oude, mogelijk al kapot-
// gemarkeerde locationVerified — zodat activiteiten die door de kapotte
// eerste versie stilzwijgend zonder coördinaten bleven hangen, nu alsnog
// één eerlijke nieuwe poging krijgen.
async function geocodeUnresolvedActivities() {
  const country = getActiveTrip()?.country || '';
  const todo = AppState.activities.filter(act => !act.locationVerifiedV2 && !isValidLatLng(act.lat, act.lng));
  for (const act of todo) {
    const query = act.googleMapsQuery || act.name;
    const coords = await geocodeAddress(country ? `${query}, ${country}` : query);
    act.locationVerifiedV2 = true;
    if (coords) { act.lat = coords.lat; act.lng = coords.lng; }
    await dbSaveActivity(act);
    if (document.getElementById('screen-map').classList.contains('active')) renderMapMarkers();
    // Nominatim's gebruiksvoorwaarden: max 1 verzoek per seconde.
    if (todo.indexOf(act) < todo.length - 1) await new Promise(r => setTimeout(r, 1100));
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

      geocodeUnresolvedActivities();
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
    // FIX: onthoudt of we hier zonet pas de standaardreis hebben aangemaakt
    // — verderop bepaalt dat of een lege/mislukte accommodaties-load mag
    // terugvallen op de hardcoded ACCOMMODATIONS-seed (zie hieronder).
    let justSeededDefaultTrip = false;
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
      justSeededDefaultTrip = true;
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

    // FIX: AppState.activities begint als de hardcoded Noorwegen-seed
    // (js/data.js) — dat is alleen juist voor de standaardreis. Voor elke
    // andere actieve reis lekten de seed-activiteiten (mét hun verwijzingen
    // naar de Noorwegen-verblijven) na een pagina-herlaad het scherm in:
    // bij een lege remote bleven ze gewoon staan, en bij een niet-lege
    // remote voegde de "localOnly"-merge in startFirebaseSync() ze er zelfs
    // tussen. Zo zag je in een net aangemaakte tweede reis ineens
    // activiteiten en verblijfsnamen uit de andere reis opduiken.
    if (targetTripId !== DEFAULT_TRIP_ID) AppState.activities = [];

    // FIX (kritiek): een lege/mislukte dbLoadAccommodations() (bv. een
    // Firestore-leescache die nog niet gesynchroniseerd is, vlak na een
    // reload) viel hier altijd terug op de hardcoded Noorwegen-seed uit
    // js/data.js — ook voor een allang bestaande, allang aangepaste reis.
    // ACCOMMODATIONS werd dan stilzwijgend vervangen door de bevroren
    // demo-data, en de auto-verruim-check in applyTripData() kon die
    // afwijkende (verkeerde) data vervolgens gewoon terugschrijven naar de
    // écht reis — precies de "af en toe veranderen mijn reisdatums vanzelf"-
    // klacht, zonder dat er ooit iets bewerkt was. De seed-terugval is nu
    // alleen nog geldig direct ná het hierboven aanmaken van een
    // gloednieuwe standaardreis (dan wéten we dat de seed klopt, want die
    // is net pas geschreven) — voor elke andere, bestaande reis betekent
    // een lege/mislukte load "nog niet geladen", niet "vervang door demo-
    // data", zelfde veilige terugval als switchToTrip() al gebruikte.
    const accs = await dbLoadAccommodations(targetTripId);
    applyTripData(targetTrip, (accs && accs.length > 0) ? accs : (justSeededDefaultTrip ? ACCOMMODATIONS : []));
    AppState.selectedPlanningDay = getClosestTripDay();
    AppState.viewingAccommodationId = getActiveAccommodation() ? getActiveAccommodation().id : null;

    startFirebaseSync();
    updateMeerSummary();
    if (document.getElementById('screen-home').classList.contains('active')) renderHomeScreen();
  });
}
