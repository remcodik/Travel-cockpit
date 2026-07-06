# Eerste/laatste kalenderdag altijd reisdag, ook bij een echt verblijf (2026-07-06)

**Document ID:** TC-ISSUES-019
**Status:** ✅ Gebouwd
**Bron:** Screenshot van Planning (Ferry 15 juni → Sogndal 16 juni): "Dag 1 is nog geen reisdag."

---

## Context

Vervolg op `docs/10-issues/18-thuis-dag-altijd-reisdag-icoon.md`: die fix liet elke "Thuis"-dag (zonder verblijf) het 🚗-icoon tonen. Maar de gebruiker had ondertussen een Ferry-overnachting toegevoegd die **exact op de eerste dag van de reis** (`TRIP_START`) begint — dan is dag 1 geen "Thuis"-gat meer, maar een doodgewone verblijfsdag (Ferry's eigen kleur, geen icoon), terwijl het nog steeds de allereerste dag van de hele reis is en je feitelijk nog aan het reizen bent (op de boot).

---

## Fix

`buildDayTabs()`/`renderPlanningDay()` (`js/screen-planning.js`) tonen het 🚗-icoon nu ook wanneer de dag exact `TRIP_START` of `TRIP_END` is — ongeacht of die dag toevallig al door een echt verblijf gedekt wordt. De kleur/badge blijft gewoon die van het verblijf (bv. Ferry's rood); alleen het reisdag-icoon en het label ("Reisdag · vanuit Ferry" i.p.v. kaal "vanuit Ferry") worden toegevoegd.

Drie situaties, nu allemaal consistent:
1. Eerste/laatste dag zonder verblijf ("Thuis") → 🚗 + "Reisdag" (sinds punt 18).
2. Eerste/laatste dag mét een verblijf (zoals de Ferry hier) → 🚗 + "Reisdag · vanuit [verblijf]" (nieuw, deze fix).
3. Verplaatsdag tussen twee echte verblijven ergens middenin de reis (bestond al, ongewijzigd) → 🚗 + beide namen.

---

## Geverifieerd

Headless-test met exact het gemelde scenario (Ferry checkt in op `TRIP_START` zelf, checkt uit op de dag dat Sogndal incheckt): dag 1 wordt correct herkend als een echt verblijf (Ferry, geen "Thuis"), en toont nu toch het 🚗-icoon in zowel de dagtabs als de dagkop, met "Reisdag" in de tekst naast de verblijfsnaam. Bestaande verplaatsdag-detectie tussen twee echte verblijven (Sogndal → Skjåk) blijft ongewijzigd werken.

---

## Gewijzigde bestanden

`js/screen-planning.js` (`buildDayTabs()`, `renderPlanningDay()`).
