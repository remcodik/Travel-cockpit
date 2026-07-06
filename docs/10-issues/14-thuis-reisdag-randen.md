# "Thuis" op reisdagen vóór check-in / na check-out (2026-07-05)

**Document ID:** TC-ISSUES-014
**Status:** ✅ Gebouwd
**Bron:** "En start en eind datum altijd verblijf thuis."

---

## Context

Een reis heeft een eigen begin- en einddatum (`TRIP_START`/`TRIP_END`), onafhankelijk van de check-in/check-out-data van de verblijven zelf — bijvoorbeeld de vertrekdag (voordat je bij het eerste verblijf incheckt) of de terugreisdag (nadat je bij het laatste verblijf hebt uitgecheckt, zoals bij Hotel Kolding op 30 juni, zie `docs/10-issues/12-reisdag-kleur-bugfix.md`). Zulke dagen vielen tot nu toe buiten elk verblijf: Planning toonde dan gewoon "reisdag · onderweg" zonder kleur — technisch correct (er is geen verblijf voor die dag), maar niet hoe een reiziger er zelf naar kijkt: vóór vertrek en na aankomst ben je gewoon thuis.

---

## Oplossing

Nieuw, **puur virtueel** "Thuis"-pseudo-verblijf (`HOME_PSEUDO_ACC` in `js/state.js`, kleur `#45564C`) — bestaat alleen in het geheugen, wordt nergens opgeslagen. Nieuwe helper `getAccommodationOrHomeForDate(date)`:
- Roept eerst gewoon `getAccommodationForDate(date)` aan (ongewijzigd, blijft `null` teruggeven als er niets is).
- Alleen als dat niets oplevert én de dag vóór de vroegste check-in of op/na de laatste check-out van alle verblijven ligt: geeft het "Thuis"-object terug.
- Een gat **tussen** twee verblijven (bijvoorbeeld een vergeten boeking middenin de reis) blijft bewust "reisdag · onderweg" — dat wijst eerder op een ontbrekend verblijf dan op "thuis", en zou anders een echt databaas-probleem verbergen.

**Bewust beperkte toepassing**: alleen gebruikt in Planning's dagweergave (`buildDayTabs()`/`renderPlanningDay()` in `js/screen-planning.js`), niet in de algemene `getAccommodationForDate()` zelf. Dat blijft overal elders (o.a. `getActiveAccommodation()`, kaart, roadtrip-scherm) exact hetzelfde contract houden — `null` als er geen echt verblijf is. Zo kan niets elders in de app per ongeluk dit fictieve "verblijf" behandelen als een echt verblijf met adres, coördinaten, telefoonnummer, etc.

Op een verplaatsdag naar/vanaf "Thuis" verschijnt automatisch dezelfde 🚗-tweekleurige-rand-weergave als tussen twee echte verblijven (bestond al, hergebruikt zonder wijziging) — bijvoorbeeld "Hotel Kolding 🚗 Thuis" op de terugreisdag.

---

## Geverifieerd

Headless-test: een reis met een dag vóór de eerste check-in en een dag op de laatste check-out (exact het Kolding-scenario) toont "Thuis" in zowel de dagtab-rand als de dagkop-tekst, inclusief het verplaatsdag-icoon op de check-out-dag zelf. `getAccommodationForDate()` en `getActiveAccommodation()` blijven ongewijzigd (geen `null` → "Thuis"-lek naar de rest van de app).

---

## Gewijzigde bestanden

`js/state.js` (`HOME_PSEUDO_ACC`, `getAccommodationOrHomeForDate()`), `js/screen-planning.js` (`buildDayTabs()`/`renderPlanningDay()` gebruiken de nieuwe helper, elevatie-badge overgeslagen voor het virtuele verblijf).
