# Planning: swipen door de dagen heen (2026-07-06)

**Document ID:** TC-ISSUES-021
**Status:** ✅ Gebouwd
**Bron:** "Kan ik met swipen in planning door de dagen heen swipen"

---

## Feature

Planning kende alleen navigatie via de dagtabs bovenaan (aantikken van een specifieke dag). Op mobiel is een horizontale swipe over de daginhoud een natuurlijker gebaar om naar de vorige/volgende dag te gaan.

---

## Implementatie

`initPlanningSwipeIfNeeded()` (`js/screen-planning.js`) bindt eenmalig `touchstart`/`touchend`-listeners op `#screen-planning .scroll` (de scrollbare daginhoud). Een horizontale swipe telt alleen als de uitwijking groter is dan 60px én minstens 1,5× groter dan de verticale uitwijking — dat voorkomt dat een verticale scroll door de activiteitenlijst of een gewone tik per ongeluk als swipe wordt gezien. Swipe naar links → volgende dag, naar rechts → vorige dag, via de nieuwe `goToAdjacentPlanningDay(offset)`, die dezelfde `TRIP_START`/`TRIP_END`-grenzen respecteert als de bestaande dagtab-navigatie (swipen voorbij het reisvenster wordt genegeerd).

De listener wordt één keer gebonden (niet bij elke render) — hij leest bij elke swipe de actuele geselecteerde dag uit `AppState`, dus hoeft niet opnieuw gekoppeld te worden na een re-render.

---

## Geverifieerd

Headless-test met echte DOM `Touch`/`TouchEvent`-simulatie: swipe naar links op de daginhoud gaat naar de volgende dag; swipen voorbij `TRIP_END` blijft op de laatste dag staan; swipen voorbij `TRIP_START` blijft op de eerste dag staan; normale navigatie binnen het reisvenster werkt.

---

## Gewijzigde bestanden

`js/screen-planning.js` (`initPlanningSwipeIfNeeded()`, `goToAdjacentPlanningDay()`, aanroep toegevoegd in `renderPlanningScreen()`).
