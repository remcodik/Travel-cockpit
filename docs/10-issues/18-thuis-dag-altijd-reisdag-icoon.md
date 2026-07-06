# "Thuis"-dagen krijgen altijd het reisdag-icoon (2026-07-06)

**Document ID:** TC-ISSUES-018
**Status:** ✅ Gebouwd
**Bron:** "Maak van eerste en laatste dag altijd ook een reisdag (auto icoon)."

---

## Context

Sinds `docs/10-issues/14-thuis-reisdag-randen.md` en `17-reislengte-losgekoppeld-en-tussengaten.md` toont elke dag zonder verblijf (vóór het eerste, ná het laatste, of een gat middenin de reis) de neutrale "Thuis"-kleur. Het 🚗-verplaatsdag-icoon verscheen daar alleen bovenop, ván de bestaande logica die zoekt naar een écht verblijf dat exact op die dag uitcheckt (`prevAcc`). Voor de allereerste dag van de reis (vóór het allereerste verblijf) bestaat zo'n `prevAcc` per definitie niet — die dag toonde dus alleen "vanuit Thuis" zonder icoon, terwijl het net zo goed een reisdag is (de vertrekdag zelf).

---

## Fix

`buildDayTabs()` en `renderPlanningDay()` (`js/screen-planning.js`) tonen het 🚗-icoon nu **altijd** wanneer de dag op de "Thuis"-pseudo-accommodatie uitkomt (`acc.isHome`), niet alleen wanneer er toevallig een verblijf exact op die dag uitcheckt. De bestaande tweekleurige-rand/twee-namen-weergave (bijvoorbeeld "Hotel Kolding 🚗 Thuis") blijft ongewijzigd voor het geval er wél een aangrenzend verblijf is — voor een dag zonder zo'n aangrenzend verblijf (zoals de eerste dag van de hele reis) toont de dagkop nu simpelweg "🚗 Reisdag" i.p.v. "vanuit Thuis".

---

## Geverifieerd

Headless-test met een reisvenster dat twee dagen wijder is dan het eerste/laatste verblijf dekt (dus zonder enig aangrenzend verblijf op die randdagen): zowel de allereerste als de allerlaatste dag van de reis tonen nu het 🚗-icoon, zowel in de dagtabs-strip als in de dagkop ("Reisdag").

---

## Gewijzigde bestanden

`js/screen-planning.js` (`buildDayTabs()`, `renderPlanningDay()`).
