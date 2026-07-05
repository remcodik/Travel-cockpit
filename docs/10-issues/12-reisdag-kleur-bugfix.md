# Reisdag-kleur na verblijf toevoegen (2026-07-05)

**Document ID:** TC-ISSUES-012
**Status:** ✅ Gebouwd
**Bron:** "Ik heb verblijf toegevoegd maar reisdag kleur werkt niet, kleur wordt niet veranderd nadat een dag een reisdag is geworden door extra verblijf."

---

## Bug 1 — check-in-dag kreeg geen kleur in een tijdzone vóór op UTC

**Root cause**: `<input type="date">`-velden geven een kale `"YYYY-MM-DD"`-string terug. `new Date(str)` parseert zo'n kale datumstring per specificatie (ECMA-262) als **UTC-middernacht**, niet als lokale middernacht. In een tijdzone vóór op UTC — Nederland zit in de zomer op CEST (UTC+2) — valt dat UTC-instant ná de lokale middernacht van diezelfde kalenderdag.

`getAccommodationForDate(date)` (`js/state.js`) bepaalt of een dag bij een verblijf hoort met `d >= acc.checkIn && d < acc.checkOut`, waarbij `d` lokaal-middernacht is (opgebouwd via `new Date(y, m, d)`, drie losse getallen — dat interpreteert JS altijd lokaal). Voor de check-in-dag zélf gold in CEST dus: lokale middernacht (`d`) ligt vóór het UTC-middernacht-instant van `acc.checkIn` — de vergelijking `d >= acc.checkIn` faalde, en die dag bleef daardoor ongekleurd/grijs in Planning, óók nadat het nieuwe verblijf 'm juist had moeten dekken.

De originele Noorwegen-seed (`js/data.js`) raakte hier nooit door getroffen, omdat die verblijven met de drie-argumenten-constructor (`new Date(2026, 5, 15)`, altijd lokaal) zijn opgebouwd — alleen verblijven die via een formulier zijn toegevoegd (kale datum-string) hadden dit probleem.

**Fix**: nieuwe helper `parseLocalDateInput(str)` (`js/state.js`) die een `"YYYY-MM-DD"`-string expliciet als lokale middernacht parseert (splitst op `-`, drie-argumenten-constructor). Toegepast op elke plek waar een kale datum-input-string wordt omgezet:
- `readAccommodationFormFields()` (`js/screen-accommodation.js`) — verblijf toevoegen/bewerken aan een bestaande reis.
- `saveTrip()` (`js/screen-tickets.js`) — verblijven bij het aanmaken van een gloednieuwe reis.

(Activiteit-datums waren niet getroffen: die `<select>`-opties gebruiken al volledige `toISOString()`-instants i.p.v. kale datum-strings, dus geen ambiguïteit bij het terug-parsen.)

**Geverifieerd** met een headless-Chromium-test met `timezoneId: 'Europe/Amsterdam'` (CEST, UTC+2): vóór de fix zou de check-in-dag van een nieuw verblijf niet als bij dat verblijf horend herkend worden; na de fix retourneert `getAccommodationForDate()` op de check-in-dag zelf correct het nieuwe verblijf, en toont `buildDayTabs()` de juiste randkleur.

---

## Bug 2 (bijvangst) — elk nieuw verblijf kreeg dezelfde vaste kleur

Terwijl de bovenstaande bug werd onderzocht, bleek `createAccommodationForTrip()` (`js/state.js`) en `saveTrip()` (`js/screen-tickets.js`) elk nieuw verblijf altijd dezelfde vaste kleur (`#5B8C7B`) te geven — ongeacht hoeveel verblijven er al bestonden. Bij een tweede handmatig toegevoegd verblijf zou dat dus geen enkel kleurverschil in Planning laten zien, en de vaste kleur lag bovendien qua tint dicht bij Sogndal's bestaande groen (`#2d6a4f`) — hetzelfde soort te-dicht-bij-elkaar-probleem dat eerder al voor Skjåk/Sogndal is opgelost (zie `03-web-vs-flutter-vergelijking.md` changelog).

**Fix**: nieuw, vast `ACCOMMODATION_COLOR_PALETTE` (8 onderling goed te onderscheiden kleuren, `js/state.js`) en `nextAccommodationColor()`, die de eerste nog niet in gebruik zijnde kleur uit dat palet teruggeeft. Toegepast op beide plekken waar een verblijf wordt aangemaakt.

---

## Bug 3 (vervolg, live gemeld met screenshots) — al opgeslagen verblijven bleven fout staan

Na het uitrollen van Bug 1's fix meldde de gebruiker (met screenshots van de live app): de kleur van 29 juni was er nu wél (nadat "Hotel Kolding" was toegevoegd), maar de verplaatsdag-weergave (🚗-icoon + tweekleurige rand, zie punt 5 in `10-activiteit-detail-feedback.md`) ontbrak — de dagkop toonde zelfs "reisdag · onderweg" i.p.v. "vanuit Hotel Kolding", wat betekent dat `getAccommodationForDate()` de dag ná de refresh nóg steeds niet aan Kolding toewees.

**Root cause**: Hotel Kolding was aangemaakt vlak vóórdat de Bug-1-fix live ging op Vercel. De code-fix corrigeert alleen *nieuwe* opslagacties — het Firestore-document van Kolding was op dat moment al met de kapotte UTC-middernacht-tijdstippen weggeschreven, en bleef dat ook na de deploy (een `git push` verandert nooit met terugwerkende kracht al bestaande database-documenten). Bovendien faalt niet alleen `getAccommodationForDate()`'s `>=`/`<`-vergelijking bij zo'n tijdsverschil, maar vooral de **exacte** `.getTime() ===`-check die `buildDayTabs()` gebruikt om een verplaatsdag te herkennen (checkOut van het ene verblijf = checkIn van het volgende) — die is veel gevoeliger voor een paar uur verschil dan de `>=`/`<`-vergelijking.

**Fix**: eenmalige zelfhelende migratie in `applyTripData()` (`js/state.js`), naar hetzelfde patroon als de bestaande Skjåk-kleurmigratie — bij elke keer dat de reisdata geladen wordt, wordt elk verblijf waarvan `checkIn`/`checkOut` niet exact op lokale middernacht staat gecorrigeerd én teruggeschreven naar Firestore. Dit lost niet alleen Hotel Kolding op, maar ook eventuele andere al bestaande verblijven die ooit via het (kapotte) formulier zijn opgeslagen of bewerkt — zonder dat de gebruiker iets opnieuw hoeft in te voeren.

**Geverifieerd**: een headless-test die exact dit scenario nabootst (een verblijf met de oude, kapotte UTC-middernacht-tijdstippen, zoals Kolding vóór de deploy zou zijn opgeslagen) laat zien dat `applyTripData()` de tijden terugbrengt naar lokale middernacht, waarna zowel de kleur als het verplaatsdag-icoon (🚗) correct verschijnen.

---

## Gewijzigde bestanden

`js/state.js` (`parseLocalDateInput()`, `ACCOMMODATION_COLOR_PALETTE`, `nextAccommodationColor()`, gebruikt in `createAccommodationForTrip()`, zelfhelende check-in/checkOut-migratie in `applyTripData()`), `js/screen-accommodation.js` (`readAccommodationFormFields()`), `js/screen-tickets.js` (`saveTrip()`).
