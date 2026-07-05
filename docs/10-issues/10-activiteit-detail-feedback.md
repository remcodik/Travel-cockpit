# Activiteit-detail-feedback (2026-07-03)

**Document ID:** TC-ISSUES-010
**Status:** ✅ Gebouwd
**Bron:** vier losse punten in één bericht na het testen van het (net vergrote) activiteit-detailscherm, plus een vervolgverzoek over de reisdag-weergave.

---

## 1. "Knop nieuwe ideeën bovenaan"

De Discover-header had alleen een klein ↻-icoontje zonder tekst — makkelijk over het hoofd te zien. Dit is nu een volwaardige, herkenbare knop "↻ Nieuwe ideeën" bovenaan de header (naast de bestaande knop onderaan de lijst, die blijft staan). Beide knoppen tonen "Laden…" tijdens het ophalen.

---

## 2. "Activiteit-detail scherm moet groter en ik mis info bij wandeling"

Twee aparte oorzaken gevonden:

- **Het detailscherm zelf** toonde afstand/duur/hoogte/niveau als kleine tekstpilletjes in de gekleurde hero — makkelijk te missen. Dit is nu een grotere, leesbare statistiekkaarten-rij (wit, met duidelijk label) direct onder de hero. Hero zelf ook iets vergroot (thumb 72→80px, naam 23→25px).
- **De eigenlijke oorzaak van "ik mis info"**: het "Activiteit toevoegen"-formulier had helemaal geen velden voor afstand/duur/hoogtewinst/niveau — alleen naam, dag, verblijf en soort. Elke handmatig toegevoegde wandeling had dus sowieso niets te tonen op het detailscherm. Opgelost door een optioneel "Wandelinfo toevoegen"-blok toe te voegen aan zowel het toevoeg- als het bewerk-formulier (`sheet-activity`/`sheet-edit-activity`) — afstand, duur, hoogtewinst, niveau, en de Komoot-routelink uit punt 4 hieronder. Ook bestaande activiteiten kunnen zo achteraf van info voorzien worden.

---

## 3. "Komoot link werkt niet"

Klopte — `https://www.komoot.com/smart-tour?sport=hike&q=...` is geen bestaande pagina op komoot.com (geverifieerd: deze URL komt nergens voor in Komoot's eigen documentatie of enige andere bron; waarschijnlijk ooit verzonnen/geraden). Komoot's zoekfunctie is een JS-app zonder gedocumenteerde publieke "zoek op tekst"-URL, dus in plaats van nóg een gok te wagen op een andere Komoot-interne route linken we nu naar een Google-zoekopdracht die specifiek naar komoot.com scoped is (`komootSearchUrl()` in `js/state.js`) — dat opent altijd echte resultaten, nooit een dode link. Toegepast op alle drie plekken waar de kapotte link stond: activiteit-detail, Discover-suggestiekaarten, AI-verrijking.

---

## 4. "Hoogtekaart wel bij wandeling — dacht dat de eerdere afwijzing over de autoroute ging"

Klopt, zie de correctie in `01-testronde-30juni.md` (D6/D6b) en `08-restplan-openstaande-punten.md` — de eerdere afwijzing (1 juli) ging over een hoogtekaart van de hele **rijroute** op de kaart, niet over het profiel van een losse wandeling.

**Waarom niet zomaar een grafiek getekend**: een echt hoogteprofiel (hoogte over afstand) vereist een echt wandelpad met meetpunten. De app heeft per activiteit alleen één coördinaat plus (optioneel) een totale hoogtewinst als getal — geen route/GPX-data. Zelf een grafiek tekenen zou dus verzonnen data zijn (in strijd met het eerlijkheidsprincipe dat door dit hele project heen is aangehouden, bijv. bij laadstations en weer).

**Gekozen oplossing — echte data via Komoot zelf**: Komoot biedt een officiële, gedocumenteerde embed (`support.komoot.com`, iframe `komoot.com/tour/{id}/embed?profile=1`) die het échte hoogteprofiel van een bestaande Komoot-tour toont. Nieuw veld `komootTourUrl` op een activiteit (optioneel, in te vullen bij toevoegen/bewerken van een wandeling). Is dit veld ingevuld met een geldige `komoot.com/tour/{cijfers}`-link, dan toont het activiteit-detailscherm Komoot's eigen widget met het echte profiel. Geen link → geen embed, gewoon de Komoot-zoekknop (punt 3) om er zelf een te vinden.

**Validatie**: `extractKomootTourId()` in `js/state.js` accepteert uitsluitend `https://(www.)komoot.com/tour/<cijfers>` — elke andere waarde (inclusief een `javascript:`-URL) wordt genegeerd en komt nooit in de iframe-`src` terecht.

---

## 5. "Voeg bij activiteit (toevoegen) ook icoon voor reisdag toe, en combi-kleuren in Planning voor verplaatsdagen"

**Reisdag-icoon bij activiteit toevoegen**: naast de dag-keuze (`activity-day-select`) in het "Activiteit toevoegen"-formulier staat nu een klein badge (`activity-day-badge`) dat live het dagnummer toont ("D5") in de kleur van het verblijf dat op die dag actief is — werkt ook bij het wisselen van dag in de dropdown (`updateActivityDayBadge()` in `js/screen-planning.js`). Voorheen was de dagkeuze platte tekst zonder visuele bevestiging welk verblijf erbij hoort.

**Combi-kleuren op verplaatsdagen**: een dag die zowel de check-out-datum van het ene verblijf als de check-in-datum van het volgende is, toont nu een 🚗-icoon, zowel in de dagtabs-strip (`buildDayTabs()`) als in de grote dag-header (`renderPlanningDay()`, die ook beide verblijfsnamen toont i.p.v. alleen het nieuwe). Voorheen kreeg zo'n dag stilzwijgend alleen de kleur van het nieuwe verblijf, zonder dat zichtbaar was dat het een verplaatsdag betreft.

**Subtieler gemaakt (2026-07-05)**: de eerste versie gebruikte een diagonale twee-kleuren-vulling voor de verplaatsdag — te opvallend. Vervangen door een randkleur-aanpak: elke dagtab (en de dag-header-badge) heeft nu altijd een subtiele randkleur van het bijbehorende verblijf, ook als de dag niet geselecteerd is (voorheen alleen bij selectie, anders grijs). Een verplaatsdag krijgt daarbovenop alleen een afwijkende linkerrand in de kleur van het verblijf waar je vandaan komt — de rest van de rand volgt gewoon de normale regel (kleur van het verblijf waar de dag nu bij hoort). Geen gevuld vlak meer voor een niet-geselecteerde dag.

**Rand nog dikker + Sogndal/Skjåk beter te onderscheiden (2026-07-05, vervolg)**: de rand was nog steeds lastig te zien, en Sogndal (groen) en Skjåk Solside (blauw) leken te veel op elkaar. Eerst een interactief voorbeeld gemaakt (losstaand HTML-artifact) om dit te kunnen beoordelen vóór het bouwen — daaruit bleek objectief (relatieve helderheid/luminance berekend) dat Sogndal (`#2d6a4f`, helderheid 0,114) en Skjåk (`#1565c0`, helderheid 0,133) een verschil van maar 0,018 hadden, tegenover 0,229 tussen de andere verblijfsparen — vandaar dat ze op een dunne rand zo op elkaar leken, ondanks verschillende kleurfamilies (groen vs. blauw). Doorgevoerd na akkoord:
- Randdikte overal (dagtabs, dag-header-badge, activiteit-toevoegen-badge) van 2.5px naar 5px (verplaatsdag-linkerrand van 4px naar 7px).
- Skjåk Solside's kleur van `#1565c0` naar `#1e88e5` (zelfde blauwe familie, helderheid 0,235 — verschil met Sogndal nu 0,121, ruim 6× beter te onderscheiden). Aangepast in `js/data.js` (seed) en `css/styles.css` (`--acc-2`-fallback).
- Eenmalige zelfhelende kleurmigratie toegevoegd in `applyTripData()` (`js/state.js`): een al bestaand Firestore-document met de oude hex wordt bij het laden gecorrigeerd én teruggeschreven — er is geen bewerk-veld voor accommodatiekleur, dus zonder deze migratie zou een al aangemaakt verblijf de oude kleur voor altijd houden.

---

## Gewijzigde bestanden

`index.html` (Discover-header-knop, pd-stats-grid, wandelinfo-velden in beide activiteit-formulieren, pd-elevation-embed, activity-day-badge), `js/state.js` (`komootSearchUrl()`, `extractKomootTourId()`, `addActivity()` uitgebreid met `komootTourUrl`), `js/screen-map.js` (`renderPdHero()` — stats-grid i.p.v. pilletjes), `js/screen-planning.js` (formulier-logica add/edit, Komoot-embed-rendering in `openActivityDetailSheet()`, `updateActivityDayBadge()`, verplaatsdag-detectie in `buildDayTabs()`/`renderPlanningDay()`), `js/screen-discover.js` (Komoot-link + top-knop-status), `js/screen-accommodation.js` (`resetActivityFormExtras()`/`updateActivityDayBadge()` hergebruikt).
