# Reis kromp stilzwijgend na verblijf-wijziging (2026-07-06)

**Document ID:** TC-ISSUES-016
**Status:** ✅ Gebouwd
**Bron:** "Waar is mn eerste dag 15 juni gebleven, is een reisdag maar die was er wel en nu niet meer. Mn reis is korter geworden."

---

## Root cause

`recalculateTripDates()` (`js/state.js`) herberekent `TRIP_START`/`TRIP_END` telkens wanneer een verblijf wordt toegevoegd of bewerkt — bedoeld als "de reisdata groeit automatisch mee met verblijf-wijzigingen" (Fase E-besluit). De implementatie zette `TRIP_START`/`TRIP_END` echter altijd **exact gelijk** aan het min/max van alle verblijven, in plaats van alleen te verruimen:

```js
const newStart = new Date(Math.min(...ACCOMMODATIONS.map(a => a.checkIn.getTime())));
const newEnd = new Date(Math.max(...ACCOMMODATIONS.map(a => a.checkOut.getTime())));
```

De Noorwegen-reis begint bewust op **15 juni** — een dag vóór Sogndal's check-in (16 juni), namelijk de vertrek-/ferrydag (zie de "Route"-strip op het Kaart-scherm: "🏠 Nijmegen · 15 jun" → "⚓ Hirtshals · ferry" → ... → "▲ Sogndal · 16–19"). Zodra `recalculateTripDates()` draaide — wat al bij het allereerste toevoegen van "Hotel Kolding" gebeurde, en nogmaals bij de zelfhelende tijdzone-migratie uit `docs/10-issues/12-reisdag-kleur-bugfix.md` — werd `TRIP_START` teruggezet naar 16 juni (de vroegste check-in van een écht verblijf), en verdween 15 juni stilzwijgend uit de dagtabs.

---

## Fix

**1. `recalculateTripDates()` kan niet meer krimpen**, alleen nog verruimen:

```js
const newStart = accStart < TRIP_START ? accStart : new Date(TRIP_START);
const newEnd = accEnd > TRIP_END ? accEnd : new Date(TRIP_END);
```

Een nieuw verblijf dat buiten het huidige venster valt, verruimt de reis nog steeds correct (bijvoorbeeld Kolding, die de reis tot 30 juni liet doorlopen) — maar een reis kan niet meer per ongeluk krimpen tot alleen de verblijf-data.

**2. Eenmalig herstel voor de al foutief opgeslagen Noorwegen-reis**: in `applyTripData()` wordt, specifiek voor `DEFAULT_TRIP_ID` ("noorwegen-2026"), gecontroleerd of `TRIP_START` ooit voorbij de bekende oorspronkelijke 15 juni is opgeschoven — zo ja, dan wordt dat teruggezet en meteen opgeslagen. Dit is een eenmalige, doelgerichte correctie voor deze specifieke, bekende reis (zelfde patroon als de eerdere Skjåk-kleurmigratie) — geen generieke aanname over andere reizen, die nooit een impliciete "dag vóór het eerste verblijf"-conventie hadden.

---

## Geverifieerd

Headless-test: een gesimuleerde, al-gekrompen reis (startDate 16 juni) wordt bij het laden automatisch teruggezet naar 15 juni. Een daaropvolgende `recalculateTripDates()`-aanroep (bijvoorbeeld door een verblijf te bewerken) verandert `TRIP_START` niet meer. Een verblijf dat wél buiten het huidige venster valt, laat de reis nog steeds correct groeien (`TRIP_END` schuift op, `TRIP_START` blijft intact op 15 juni).

---

## Gewijzigde bestanden

`js/state.js` (`recalculateTripDates()`, eenmalig herstel in `applyTripData()`).
