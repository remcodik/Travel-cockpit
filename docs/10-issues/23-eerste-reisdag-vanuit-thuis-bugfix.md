# Bugfix: eerste reisdag toont "vanuit Ferry" i.p.v. "Thuis → Ferry" (2026-07-06)

**Document ID:** TC-ISSUES-023
**Status:** ✅ Gefixt
**Bron:** Screenshot (dag 1, 15 juni): "🚗 Reisdag · vanuit Ferry". "Laatste dag is reisdag Kolding → thuis dat is goed. Eerste dag begint niet met thuis. Waarom niet? Vanuit ferry. Nee thuis → ferry."

---

## Root cause

Een verplaatsdag (bv. Sogndal → Skjåk) wordt herkend doordat een verblijf op die exacte dag uitcheckt (`ACCOMMODATIONS.find(a => a.checkOut.getTime() === day.getTime())`) én een ander verblijf diezelfde dag incheckt. Dat werkt correct op de laatste reisdag: Kolding checkt uit op `TRIP_END`, er is geen volgend verblijf, dus `acc` valt terug op de "Thuis"-placeholder — en de twee-tone weergave toont terecht "Kolding → Thuis".

Op de eerste reisdag zelf checkt er per definitie **niemand uit** (er is nog geen vorig verblijf om uit te checken) — ook al begint er die dag wél al een echt verblijf (de Ferry, met `checkIn === TRIP_START`). De zoekactie naar "wie checkt hier uit" vond dus niets, waardoor de dag niet als verplaatsdag werd herkend en gewoon behandeld werd als een doodgewone verblijfsdag: "vanuit Ferry" — zonder te vermelden dat je die dag feitelijk vanuit Thuis vertrekt.

---

## Fix

Nieuwe gedeelde functie `getChangeoverPrevAcc(day, acc)` (`js/screen-planning.js`): zoekt eerst zoals voorheen naar een verblijf dat op deze dag uitcheckt; vindt hij niets, én is dit exact `TRIP_START`, én is er die dag al een écht (niet-Thuis) verblijf actief, dan is de "vorige kant" van de overgang de `HOME_PSEUDO_ACC`-placeholder ("Thuis") — symmetrisch met hoe de laatste dag al werkt. Gebruikt op beide plekken die deze logica hadden (`buildDayTabs()` en `renderPlanningDay()`).

---

## Geverifieerd

Headless-test met een gesimuleerd "Ferry"-verblijf dat exact op `TRIP_START` incheckt en een "Kolding"-verblijf dat exact op `TRIP_END` uitcheckt (de bestaande seed-data heeft zelf geen verblijf dat precies op de reisgrens begint/eindigt, dus dit reproduceert de exacte situatie uit het screenshot): dag 1 toont nu de twee-tone rand/badge "Thuis → Ferry" (dagtab-tooltip: "Verplaatsdag: Thuis → Ferry"), symmetrisch met de laatste dag ("Kolding → Thuis", ongewijzigd). Een gewone dag midden in de reis (bv. "vanuit Skjåk Solside") blijft ongewijzigd. Regressietest gedraaid (thuis-dag-icoon, echte verplaatsdag tussen twee verblijven, self-heal kleurmigratie, swipe-navigatie, Ingepland-filter) — geen regressies.

---

## Gewijzigde bestanden

`js/screen-planning.js` (nieuwe `getChangeoverPrevAcc()`, gebruikt in `buildDayTabs()` en `renderPlanningDay()`).
