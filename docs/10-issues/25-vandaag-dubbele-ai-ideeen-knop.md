# Vandaag: dubbele "AI-ideeën"-knop vervangen (2026-07-07)

**Document ID:** TC-ISSUES-025
**Status:** ✅ Gefixt
**Bron:** Screenshot: "Knoppen doen hetzelfde (ideeën) haal er 1 weg als ze inderdaad zelfde doen check dat of dat we andere leukere info kunnen weergeven op deze vandaag pagina."

---

## Bevestigd: echte duplicatie

Op Vandaag stonden twee knoppen die exact hetzelfde deden (`navigateTo('discover')`, zonder enig verschil in context of bestemming):

1. De "Bekijk AI-ideeën"-knop, alleen zichtbaar in de lege-staat van de "Vandaag"-kaart als er niets gepland is.
2. De altijd-zichtbare "Wat ligt er voor je? · AI-suggesties voor je verblijf"-banner direct eronder.

---

## Fix

De grote, altijd-zichtbare banner blijft staan (`index.html`) — dat is de primaire, herkenbare ingang naar Discover. De kleine, alleen-bij-lege-dag knop (`js/screen-home.js`, `renderHomeScreen()`) is vervangen door twee nuttigere dingen:

1. **"+ Activiteit toevoegen"** — opent meteen het toevoeg-formulier voor vandaag (`openAddActivitySheetForCurrentDay()`, hergebruikt de knop die ook op Planning/Accommodatie al bestaat), i.p.v. alleen door te verwijzen naar de banner eronder.
2. **"Volgende: [emoji] [naam] · [datum]"** — als er verderop in de reis nog een niet-afgevinkte, wél ingeplande activiteit staat, wordt die als klein voorproefje getoond. Aantikken springt direct naar die dag in Planning (nieuwe `goToActivityDay()` in `js/screen-home.js`, nieuwe `getNextUpcomingActivity()` in `js/state.js`). Als er niets meer volgt (bv. de reis is voorbij), verschijnt dit voorproefje simpelweg niet.

---

## Geverifieerd

Headless-test: bij een kunstmatig lege "vandaag" met een toekomstige geplande activiteit toont de lege-staat nu "+ Activiteit toevoegen" + "Volgende: 🥾 Molden · 10 jul →", zonder de oude dubbele Discover-knop; de grote banner blijft ongewijzigd aanwezig; aantikken van de "Volgende"-preview springt correct naar Planning met de juiste dag geselecteerd. Regressietest gedraaid (voortgangsstatistieken, thuis-dag-icoon, status/edit-flow) — geen regressies.

---

## Gewijzigde bestanden

`js/screen-home.js` (`renderHomeScreen()`'s lege-staat, nieuwe `goToActivityDay()`), `js/state.js` (nieuwe `getNextUpcomingActivity()`).
