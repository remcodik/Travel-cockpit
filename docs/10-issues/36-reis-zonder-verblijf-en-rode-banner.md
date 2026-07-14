# Reis zonder verblijf: rode blokkerende banner, niet-verwijderbaar verblijf, dubbele aftelling (2026-07-14)

**Document ID:** TC-ISSUES-036
**Status:** ✅ Gefixt
**Bron:** Twee screenshots + "Ik heb reis maar wil nog zonder verblijf, komt nu allerlei errors waardoor ik ook niet uit pagina kan (terug is niet zichtbaar). Banner van reis mag wel wat groter. En wat is 2de blok aftellen?? Twee keer???"

De gebruiker had een reis "Krakau" (17–20 sep) met nog een legacy "Verblijf 1"
(aangemaakt vóór het loskoppelen van verblijven, TC-ISSUES-033), zonder
coördinaten. Dat verblijf wilde hij weghalen om de reis zonder verblijf te
houden — maar dat lukte niet en de pagina raakte geblokkeerd.

---

## Oorzaken & fixes

### 1. Rode debug-banner blokkeerde de kop/terug-knop (kernprobleem)
`renderMapMarkers()` schreef bij élke kaartweergave van een verblijf zonder
coördinaten een regel naar `#debug-banner` — een `position:fixed`, rode,
**niet-afsluitbare** overlay (z-index 99999) die daarna op élk scherm de
bovenrand (incl. de ‹ terug-knop) bedekte. Plus een opdringerige toast.

Een verblijf zonder coördinaten is een **normale toestand**, geen fout.
- `js/screen-map.js`: de banner- en toast-schrijfacties verwijderd — alleen
  nog een stille `console.warn`, en gewoon geen pin.
- `index.html`: de debug-banner is nu **tikbaar om te sluiten** (kan nooit
  meer permanent iets blokkeren), ook voor échte fouten.

### 2. Accommodatiescherm crashte bij 0 verblijven → voedde de banner
`renderAccommodationScreen()` deed `acc.id` op een `null` (geen actief
verblijf). Die crash werd door `navigateTo()`'s try/catch opgevangen en... in
dezelfde rode debug-banner getoond. Nu: `renderEmptyAccommodationScreen()` —
een nette lege-staat ("Deze reis heeft nog geen verblijf") met één
"+ Verblijf toevoegen"-knop. De normale render zet de door de lege-staat
verborgen elementen (weerbadge/-strip) weer terug.

### 3. Laatste verblijf was niet te verwijderen
`openDeleteAccommodationSheet()` blokkeerde met "Je kunt het enige verblijf
niet verwijderen". Sinds een reis zonder verblijven een geldige toestand is
(TC-ISSUES-033/035), is die guard weg — het laatste verblijf mag nu weg, en
`confirmDeleteAccommodation()` rendert daarna netjes de lege-staat.

### 4. "Twee keer aftellen" op Vandaag
Vóór de reis toonde de kop `DAG -64 · 14 JUL` (negatief dagnummer, want de
reis is nog niet begonnen) én daaronder de fase-banner `Reis begint over 65
dagen · 17 sep` — twee dingen die tegelijk leken af te tellen. Nu toont de
kop buiten het reisvenster gewoon `Vandaag · 14 jul` (geen dagnummer); alleen
tijdens de reis staat er `Dag X · datum`. De fase-banner is de enige afteller.

### 5. Reis-herkenningsstrip groter
Op verzoek iets prominenter: `.trip-id-strip` font 12→14.5px, vlag 14→18px,
datums 10.5→12px, meer verticale padding.

---

`sw.js`: `CACHE_VERSION` v27 → v28.
