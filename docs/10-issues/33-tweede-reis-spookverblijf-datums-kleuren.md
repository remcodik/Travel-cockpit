# Tweede reis: datum-errors, "verblijven uit een andere reis" en geen eigen kleuren (2026-07-13)

**Document ID:** TC-ISSUES-033
**Status:** ✅ Gefixt
**Bron:** "k hen 2 reis toegevoegd en krijg errors op datum en meldingen over verblijven uit andere reis hoe is dat mogelijk sowieso moeten de datums van de reis gewoon opgeslagen kunnen worden zonder verblijven. En ik zie ook geen andere kleuren alleen een vlaggetje .. indien lastig te bepalen welke kleuren gebruik dan de vlag kleuren"

---

## Wat er precies gebeurde (vier samenspelende oorzaken)

### 1. Spookverblijf bij "Reis toevoegen" (root cause van de datum-errors)

Het "Reis toevoegen"-formulier had **geen eigen datumvelden** — de reisdatums
werden uitsluitend afgeleid uit de verblijven, en minstens één verblijf was
verplicht. Erger: een **leeg gelaten** verblijf-blok werd stilzwijgend tóch
een verblijf ("Verblijf 1", want `name: accName || 'Verblijf 1'` maakte de
lege-blokken-filter `filter(a => a.name)` een no-op), met check-in én
check-out op **"nu"** — inclusief het tijdstip van dat moment.

Gevolg: de nieuwe reis kreeg begindatum = einddatum = vandaag, plus een
onzichtbaar aangemaakt verblijf dat de gebruiker nooit bewust had ingevoerd.

### 2. Dat spookverblijf blokkeerde vervolgens élke datumwijziging

Wie daarna via "Reis bewerken" de échte reisdatums wilde instellen, liep
tegen de (op zich terechte) controle aan die weigert een reisvenster op te
slaan waar een bestaand verblijf buiten valt. Het spookverblijf (check-in
"vandaag") valt buiten elk toekomstig reisvenster → ⚠️ "Verblijf 1 valt
buiten deze data". Een melding over een verblijf dat je niet kent, voelt als
"een verblijf uit een andere reis". Bovendien vergeleek die controle op
**exact tijdstip** i.p.v. kalenderdag: een verblijf met check-out "vandaag
14:32" viel al "buiten" een venster dat op *diezelfde* dag eindigt (14:32 >
middernacht).

### 3. Bewerkformulier toonde de begindatum één dag te vroeg (UTC-shift)

`openEditTripSheet()` vulde de datumvelden met `.toISOString().slice(0, 10)`
— dat is de **UTC**-dag. Een reisdatum die als lokale middernacht is
opgeslagen (Nederland, CEST = UTC+2) valt in UTC nog op de dag ervóór; het
formulier toonde dus structureel één dag te vroeg, en elke keer "Opslaan"
schoof de reis daarna écht een dag terug. Nieuw: `formatDateInputValue()`
(js/state.js), het spiegelbeeld van het bestaande `parseLocalDateInput()`.

### 4. Noorwegen-seed-activiteiten lekten naar de nieuwe reis

`AppState.activities` start als de hardcoded Noorwegen-seed (js/data.js).
Bij een pagina-herlaad met een **andere** actieve reis werd dat geheugen
nooit leeggemaakt: bij een lege remote bleven de seed-activiteiten (mét hun
verwijzingen naar de Noorwegen-verblijven) gewoon staan, en bij een niet-lege
remote voegde de "localOnly"-merge in `startFirebaseSync()` ze er zelfs
tussen. Zo doken in een net aangemaakte tweede reis activiteiten en
verblijfsnamen uit de Noorwegen-reis op — het "verblijven uit andere
reis"-deel van de klacht.

---

## Fixes

1. **`index.html` + `js/screen-tickets.js` (`saveTrip`)**: "Reis toevoegen"
   heeft nu eigen Begin/Eind-datumvelden; verblijven zijn optioneel
   ("kan ook later"). Alleen verblijf-blokken waar echt iets is ingevuld
   worden een verblijf; ontbrekende verblijfdatums vallen terug op het
   reisvenster (lokale middernacht), nooit meer op "nu" mét tijdstip. Het
   reisvenster wordt alleen verruimd als een meteen toegevoegd verblijf er
   buiten valt (zelfde regel als `applyTripData`).
2. **`js/screen-tickets.js` (`saveTripEdit`)**: de buiten-venster-controle
   vergelijkt nu op kalenderdag i.p.v. exact tijdstip.
3. **`js/screen-tickets.js` (`openEditTripSheet`)**: datumvelden gevuld via
   het nieuwe `formatDateInputValue()` (lokale kalenderdag) + null-guard.
4. **`js/state.js` (`initAppState`)**: seed-activiteiten worden gewist
   zodra de actieve reis niet de standaardreis is — geen cross-reis-lek meer.
5. **`js/state.js` (`getActiveAccommodation`)**: null-guard voor een reis
   zonder verblijven (crashte voorheen op `last.checkOut` van undefined).
6. **Kleuren per reis** (`getTripThemeColors()` in js/state.js +
   `renderTripCard`): elke reiskaart in "Mijn reizen" draagt nu de kleuren
   van haar eigen land — rand, vlag-tegel en actief-knop — i.p.v. alleen een
   vlaggetje. Bewust dezelfde tinten als `applyCountryTheme()` voor dat land
   op `:root` zet (en niet losse vlag-kleuren): zo matchen de kaartkleuren
   altijd exact het app-thema dat verschijnt zodra je die reis activeert, en
   werkt het deterministisch voor élk vrij getypt land.
7. **`sw.js`**: `CACHE_VERSION` v23 → v24.

---

## Vervolg (zelfde dag): verblijf-velden volledig weg uit "Reis toevoegen"

**Bron:** "Kun je verblijf weghalen bij t maken van reis ik heb reis
verwijderd en opnieuw toegevoegd en datums veranderen"

De eerste fix maakte de verblijven al optioneel, maar de blokken stonden
nog in het formulier — en zolang de oude (ge-cachete) versie draaide, bleef
opnieuw toevoegen hetzelfde spookverblijf + verspringende datums opleveren.
Op verzoek is het aanmaken nu tot de kern teruggebracht:

- **`index.html` + `js/screen-tickets.js`**: het "Reis toevoegen"-formulier
  is puur naam + land + begin/einddatum (datums nu verplicht — er is niets
  meer om ze uit af te leiden). `pendingNewAccommodations`,
  `renderTripAccommodationFields()` en `addAnotherTripAccommodation()` zijn
  verwijderd; een nieuwe reis start altijd zonder verblijven. In het
  formulier staat een hint dat verblijven daarna via het Verblijf-scherm
  ("+ Verblijf") worden toegevoegd, los van de reisdatums.
- **`sw.js`**: `CACHE_VERSION` v24 → v25.
