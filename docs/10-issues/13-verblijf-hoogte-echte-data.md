# Verblijf-hoogte: echte data + bewerkbaar (2026-07-05)

**Document ID:** TC-ISSUES-013
**Status:** ✅ Gebouwd
**Bron:** "Wat is dit en klopt dit wel, ligt verblijf zo hoog?" (over de "▲ 520m"-badge bij Valdres / Noord-Aurdal) → "Ik weet hoogte niet maar zorg wel dat 't bij alle verblijven wordt ingevuld correct dan hoef ik 't niet te wijzigen maar wil 't wel kunnen wijzigen als je 't niet kan bepalen."

---

## Context

De "▲ NNNm"-badge (dagkop in Planning, accommodatiescherm, thuisscherm) toont de hoogte boven zeeniveau van het **verblijf zelf** (`acc.elevation`) — niet een hoogtewinst van een wandeling of route. Twee problemen:

1. Voor de 4 seed-verblijven (`js/data.js`) is dit een handmatig geschatte waarde uit de allereerste opzet van de app — nooit met een echte bron geverifieerd.
2. Er was **geen bewerkbaar veld** voor dit gegeven: elk nieuw toegevoegd verblijf (bv. Hotel Kolding) kreeg automatisch `0m`, en er was geen manier om dat achteraf te corrigeren.

De gebruiker weet de exacte hoogte zelf niet, maar wil wél dat het klopt — en tegelijk zelf kunnen ingrijpen als automatisch ophalen niet lukt.

---

## Oplossing

**Echte data i.p.v. een gok**: nieuwe helper `fetchElevationForCoords(lat, lng)` (`js/state.js`) roept Open-Meteo's gratis, sleutelloze elevation-API aan (`https://api.open-meteo.com/v1/elevation`) — dezelfde provider die al voor het weer wordt gebruikt, al client-side aangeroepen zonder proxy (`js/weather.js`). Best-effort: geeft `null` terug bij een netwerkfout, nooit een verzonnen waarde.

**Automatisch voor alle verblijven, eenmalig**: nieuwe zelfhelende migratie in `applyTripData()` (zelfde patroon als de bestaande Skjåk-kleur- en tijdzone-migraties) — elk verblijf zonder `elevationVerified` krijgt bij het laden automatisch de echte hoogte opgehaald en teruggeschreven naar Firestore. Dit corrigeert zowel de 4 seed-verblijven (nooit eerder geverifieerd) als elk later toegevoegd verblijf met `elevation: 0` (zoals Hotel Kolding), zonder dat de gebruiker iets hoeft te doen.

**Wél zelf kunnen wijzigen**: nieuw invoerveld "Hoogte boven zeeniveau (m)" in het verblijf-toevoeg/bewerk-formulier, met een ⛰️-knop om de hoogte expliciet (opnieuw) op te halen op basis van de ingevulde coördinaten — zelfde interactiepatroon als de bestaande 📍-knop (locatie uit link) en 🔍-knop (Komoot-autofill). Een handmatig ingevulde of expliciet opgehaalde waarde zet `elevationVerified` aan, zodat de achtergrondmigratie 'm daarna nooit meer overschrijft.

**Volgorde van vertrouwen** (nooit een bestaande/bewuste keuze overschrijven):
1. Handmatig ingevuld in het formulier → gebruikt en `elevationVerified: true`.
2. Automatisch opgehaald via coördinaten (bij het invullen van een locatie, of via de ⛰️-knop) → alleen als het veld nog leeg was.
3. Achtergrondmigratie bij het laden → alleen als `elevationVerified` nog nooit aan is gezet.

---

## Geverifieerd

`fetchElevationForCoords()` zelf kon niet live tegen Open-Meteo getest worden (dit sandbox-netwerk kan geen externe hosts bereiken, zelfde beperking als bij eerdere API-integraties in dit project). De bedrading eromheen is met een gemockte functie getest:
- Een verblijf zonder `elevationVerified` krijgt bij `applyTripData()` de (gemockte) hoogte + wordt gemarkeerd als geverifieerd.
- Een tweede keer laden roept de fetch niet opnieuw aan (waarde blijft ongewijzigd).
- Het bewerkformulier toont de opgeslagen hoogte correct.
- De ⛰️-knop vult het veld met de opgehaalde waarde.
- Een nieuw verblijf met een handmatig ingevulde hoogte krijgt `elevationVerified: true`, zodat de migratie 'm met rust laat.

**Nog te doen door de gebruiker**: controleren of Open-Meteo's elevation-API in de live app daadwerkelijk bereikbaar is en zinnige waarden teruggeeft voor de bestaande verblijven (inclusief of 520m voor Valdres / Noord-Aurdal klopt of gecorrigeerd wordt).

---

## Bijvangst

`createAccommodationForTrip()` (`js/state.js`) negeerde tot nu toe een ingevuld telefoonnummer bij het aanmaken van een nieuw verblijf (hardcoded `phone: null` i.p.v. `fields.phone`) — gefixt in dezelfde wijziging.

---

## Gewijzigde bestanden

`js/state.js` (`fetchElevationForCoords()`, zelfhelende hoogte-migratie in `applyTripData()`, `createAccommodationForTrip()` gebruikt nu `fields.elevation`/`fields.phone`), `js/screen-accommodation.js` (`handleFetchElevation()`, hoogteveld in `openEditAccommodationSheet()`/`openAddAccommodationSheet()`/`readAccommodationFormFields()`, auto-fetch in `fillExtractedLocation()`), `index.html` (hoogteveld + ⛰️-knop in `sheet-edit-accommodation`).
