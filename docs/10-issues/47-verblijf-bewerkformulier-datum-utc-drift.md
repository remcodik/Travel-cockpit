# DE oorzaak: verblijf-bewerkformulier toonde datum één dag te vroeg (UTC), dreef bij elke opslag weg (2026-07-16)

**Document ID:** TC-ISSUES-047
**Status:** ✅ Gefixt (echte grondoorzaak)
**Bron:** Twee screenshots van de gebruiker: het overzicht toont een andere check-in-datum dan het bewerkformulier ("zonder dat ik iets doe"), plus "ik heb NOOIT op 15 gezet, altijd 17".

---

## De grondoorzaak (bewezen)

`openEditAccommodationSheet()` (js/screen-accommodation.js) vulde de
datumvelden met:

```js
document.getElementById('edit-acc-checkin-input').value = acc.checkIn.toISOString().slice(0, 10);
```

`toISOString()` geeft de datum in **UTC**. Een check-in die als lokale
middernacht is opgeslagen ("…T22:00:00Z" in de Nederlandse zomertijd,
UTC+2) is in UTC de **dag ervóór**. Het bewerkformulier toonde de check-in
dus structureel één dag te vroeg — precies wat de screenshots laten zien:
overzicht **15 sep** (via `formatShortDate`, lokaal), bewerkformulier
**14 sep** (via UTC-slice).

Het venijnige gevolg: `readAccommodationFormFields()` leest datzelfde veld
weer uit met `parseLocalDateInput()`. Tik je in het formulier op **Opslaan**
— óók zonder de datum aan te raken — dan wordt de getoonde, één-dag-te-vroege
datum opgeslagen. Elke keer opnieuw een dag terug: **17 → 16 → 15 → …**. Dát
is de "startdatum verandert vanzelf en komt steeds terug"-klacht:

- het verblijf-check-in schoof per opslag een dag terug;
- de auto-verruim-stap trok daarna de reis-startdatum mee naar dat verblijf.

## Waarom eerdere fixes het niet stopten

TC-ISSUES-045/046 pakten de reis-kant aan (normaliseren, kalenderdag-
vergelijking, niet meer terugschrijven). Terecht, maar de échte bron zat in
het **verblijf-bewerkformulier** — dezelfde UTC-slice-bug die eerder al voor
het **reis**-bewerkformulier was gefixt (`formatDateInputValue`), maar bij
het verblijf-formulier over het hoofd was gezien.

## Fix

`openEditAccommodationSheet()` gebruikt nu `formatDateInputValue()` (lokale
kalenderdag, spiegelbeeldig aan `parseLocalDateInput()`):

```js
document.getElementById('edit-acc-checkin-input').value = formatDateInputValue(acc.checkIn);
document.getElementById('edit-acc-checkout-input').value = formatDateInputValue(acc.checkOut);
```

Geverifieerd (Europe/Amsterdam) voor de opgeslagen waarde
"2026-09-14T22:00:00Z": overzicht 15 sep, oud formulier 14 sep, nieuw
formulier 15 sep — formulier en overzicht komen nu overeen, en opslaan
verschuift niets meer.

De andere `toISOString().slice(0,10)`-plekken zijn gecontroleerd en zijn
geen probleem (een stabiele notitie-sleutel en een export-bestandsnaam).

## Bestaande, al-gedreven data

De datum die al is weggedreven (in dit geval naar 15 sep) staat nu zo
opgeslagen. Na deze fix toont het formulier de échte opgeslagen waarde en
blijft opslaan stabiel — corrigeer de datum daarna één keer naar de juiste
dag.

`sw.js`: `CACHE_VERSION` v39 → v40.
