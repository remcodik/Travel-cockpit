# Reislengte losgekoppeld van verblijven + kleur in tussengaten (2026-07-06)

**Document ID:** TC-ISSUES-017
**Status:** ✅ Gebouwd
**Bron:** "Nu is mn laatste dag verdwenen en zie ik hotel kolding niet meer in planning. Mn reis is korter geworden. Reis begin en eind datum niet aanpassen afhankelijk van verblijven — die kan ik later toevoegen maar vakantie blijft even lang. Zet verblijven op datum volgorde in accommodatielijst en bovenaan met chips. Ik heb overnacht op ferry want is verblijf en ik zie weer geen kleuren op die dag 15 juni."

Vier losse, verwante problemen — alle terug te voeren op hetzelfde ontwerp: de reislengte werd tot nu toe *afgeleid* van de verblijven i.p.v. een eigen, door de gebruiker bepaald gegeven te zijn.

---

## 1. Laatste dag (30 juni) en Hotel Kolding verdwenen uit Planning

**Root cause**: `recalculateTripDates()` (`js/state.js`), aangeroepen bij elke verblijf-toevoeging/-wijziging, zette `TRIP_START`/`TRIP_END` altijd op het min/max van alle verblijven — vorige fix (v1.26) maakte dit "alleen verruimen", maar de reis was op dat moment (door de oudere, nog niet gefixte code) al eerder gekrompen tot een venster dat niet meer tot Kolding's check-out (30 juni) doorliep. Zodra dat venster eenmaal te smal was opgeslagen, bleef Kolding daarbuiten vallen — `getAllTripDays()` genereert geen dagtabs voorbij `TRIP_END`, dus Kolding was nergens in Planning te vinden, ook al bestond het verblijf nog gewoon (zichtbaar in de chips-lijst op het accommodatiescherm).

## 2. "Reis begin/eind datum niet aanpassen afhankelijk van verblijven"

Expliciet verzoek: de reislengte moet een eigen, stabiel gegeven zijn — verblijven toevoegen (nu of later) mag 'm niet laten meebewegen. **`recalculateTripDates()` is volledig verwijderd** — er wordt nergens meer automatisch herberekend bij het toevoegen/bewerken/verwijderen van een verblijf.

In plaats daarvan:
- **Nieuw, expliciet bewerkbaar**: "Reis bewerken" heeft nu een begin- en einddatumveld (`js/screen-tickets.js` `saveTripEdit()`, `index.html` `sheet-edit-trip`). Dit is nu de enige plek waar de reislengte verandert.
- **Permanente, alleen-verruimende ondergrens** blijft bestaan in `applyTripData()` (bij het laden): een verblijf dat buiten het huidige venster valt (zoals nu bij Kolding het geval was) verruimt het venster automatisch zodat het nooit onzichtbaar wordt in Planning — maar dit kán het venster nooit laten krimpen, en reageert niet op losse verblijf-CRUD-acties, alleen bij het laden van de reis. Dit is een vangnet tegen data-drift, geen actief "reislengte volgt verblijven"-gedrag meer.

## 3. Verblijven op datum-volgorde

**Root cause**: `createAccommodationForTrip()` deed `ACCOMMODATIONS.push(acc)` zonder daarna opnieuw te sorteren — een nieuw verblijf met een vroege check-in (zoals de Ferry-overnachting vóór Sogndal) kwam zo alsnog achteraan te staan. De accommodatie-chips (bovenaan het accommodatiescherm) én de "Alle verblijven"-tijdlijnlijst lezen allebei gewoon `ACCOMMODATIONS` in array-volgorde, dus dezelfde bug trof beide plekken.

**Fix**: `ACCOMMODATIONS.sort((a, b) => a.checkIn - b.checkIn)` na zowel `createAccommodationForTrip()` als `updateAccommodation()` (voor als een bewerking de check-in-datum verandert).

## 4. Geen kleur op 15 juni (gat tussen Ferry en Sogndal)

Na het toevoegen van de Ferry-overnachting (14–15 juni) als eigen verblijf viel 15 juni zelf (checkout-dag van de Ferry, vóór Sogndal's check-in op 16 juni) in een gat tússen twee verblijven — en `getAccommodationOrHomeForDate()` (zie `docs/10-issues/14-thuis-reisdag-randen.md`) liet zulke gaten bewust ongekleurd, in de veronderstelling dat een gat middenin de reis eerder op een ontbrekend verblijf wijst dan op een legitieme reisdag.

Deze aanname bleek te streng: een reisdag tussen twee verblijven (een lange rijdag, of — zoals hier — de dag na een nachtboot voordat je bij het volgende verblijf aankomt) is net zo reëel als de dagen vóór het eerste of ná het laatste verblijf. **Fix**: `getAccommodationOrHomeForDate()` behandelt nu élke dag binnen het reisvenster die niet door een verblijf gedekt wordt hetzelfde — of het nu aan de randen is of middenin de reis.

---

## Geverifieerd

Headless-test die het volledige gemelde scenario nabootst (reis eerder gekrompen tot 16–29 juni, Ferry 14–15 en Hotel Kolding 29–30 als verblijven): na laden verruimt het venster automatisch naar 14–30 juni, Kolding en 30 juni zijn weer zichtbaar in Planning, verblijven staan op datumvolgorde (Ferry eerst), en 15 juni toont nu de neutrale "Thuis"-kleur. Een verblijf toevoegen ván binnen het venster verandert de reisdata niet meer. Het nieuwe "Reis bewerken"-datumveld vult correct voor, slaat op, en werkt de actieve reis direct bij (inclusief validatie: einddatum vóór begindatum wordt geweigerd).

---

## Gewijzigde bestanden

`js/state.js` (`recalculateTripDates()` verwijderd, `applyTripData()`'s reisvenster-vangnet herschreven als generieke alleen-verruimende ondergrens, sortering na `createAccommodationForTrip()`/`updateAccommodation()`, `getAccommodationOrHomeForDate()` geldt nu voor elk gat), `js/screen-tickets.js` (`openEditTripSheet()`/`saveTripEdit()` met begin/einddatum), `index.html` (datumvelden in `sheet-edit-trip`).
