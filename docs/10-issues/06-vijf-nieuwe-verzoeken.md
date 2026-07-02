# Vijf nieuwe verzoeken — analyse en plan

**Document ID:** TC-ISSUES-006
**Status:** Afgerond. (1) short-label-bug gefixt. (2) Google Maps-linkherkenning gebouwd + best-effort adres uit boekingslinks (`api/extract-listing.js`). (3) Reis handmatig deactiveren gebouwd (`handleDeactivateTrip()`). (4) Icoon: gebruiker leverde uiteindelijk zelf een kant-en-klaar Europa-icoon aan (met pin op Nederland), ingebakken randlijn verwijderd. (5) Deel-links met view/edit-rechten: apart plan geschreven (`docs/10-issues/07-deel-links-permissies-plan.md`), nog niet gebouwd — wacht op akkoord.
**Bron:** Live gebruikersverzoek, vijf punten in één bericht.

---

## Overzicht van de vijf verzoeken

1. Adres van een verblijf automatisch ophalen uit een link (Booking.com/Airbnb).
2. Naam van een verblijf kunnen wijzigen.
3. Reis handmatig kunnen deactiveren én activeren.
4. Mooier icoon voor het beginscherm op iPhone — generiek of per reis.
5. Deel-links per reis met verschillende rechten: alleen bekijken vs. alles mogen, en één reis vs. alle reizen.

Deze vijf verschillen enorm in omvang. Hieronder per punt de bevinding en het voorstel.

---

## 2. Naam verblijf wijzigen — bug gevonden en gefixt ✅

Dit **kon al** (bewerk-formulier bestaat sinds Fase E), maar had een bug: de 3-letter afkorting (`short`) die op de kaart-pin en in chips getoond wordt, werd bij het opslaan van een naamswijziging **niet** meegenomen — `readAccommodationFormFields()` gaf dat veld niet terug, dus `updateAccommodation()` liet het ongewijzigd staan. Als je bv. "Hotel Nord" naar "Fjord Lodge" hernoemde, bleef de pin op de kaart "HOT" tonen.

**Fix:** `readAccommodationFormFields()` in `js/screen-accommodation.js` berekent nu ook `short` uit de (nieuwe) naam, net als bij het aanmaken van een nieuw verblijf. Al gepusht.

---

## 1. Adres uit een link ophalen — eerlijke inschatting

Er zijn twee heel verschillende dingen die dit kan betekenen, met heel verschillend risico:

- **Een Google Maps-link plakken en daar coördinaten uit halen.** Google Maps-links bevatten vaak `@52.37,4.89` of een `/place/.../@lat,lng` patroon in de URL zelf — dat kan **betrouwbaar en zonder externe dienst** uit de tekst van de link gehaald worden met een regex. Dit zet ik meteen om in adres/lat/lng in het formulier.
- **Een Booking.com- of Airbnb-link plakken en daar automatisch het adres uit "scrapen".** Dit is fundamenteel anders: die pagina's zijn JavaScript-gerenderd, hebben geen adres in de URL, en het ophalen zou moeten via een server-functie die de pagina downloadt en doorzoekt. Dat is fragiel (breekt bij elke site-redesign), zit tegen de gebruiksvoorwaarden van die platforms aan (scraping), en kan zomaar weer een key/rate-limit-probleem worden zoals bij Open Charge Map (G3).

**Voorstel:** ik bouw **alleen de Google Maps-link-herkenning** (laag risico, direct bruikbaar, geen externe afhankelijkheid) als onderdeel van deze batch. Booking/Airbnb-scraping bouw ik niet, tenzij je dat na deze uitleg alsnog expliciet wilt — dan wordt dat een eigen, apart afgewogen stukje werk.

---

## 3. Reis handmatig deactiveren én activeren

**Wat er nu is:** exact één reis is altijd actief (`isActive`). Je kan wisselen ("Activeren" bij een andere reis), maar er is geen manier om te zeggen "geen enkele reis is nu actief" — élk scherm (Vandaag, Kaart, Planning, Roadtrip, Discover) gaat er hard van uit dat er een actieve reis bestaat (`TRIP_START`/`TRIP_END`/`getCurrentTripId()` worden overal gebruikt zonder "geen reis"-controle).

Een echte "geen reis actief"-status toevoegen raakt dus **bijna elk scherm** — niet omdat het moeilijk is per scherm, maar omdat het overal een nieuwe lege-staat vereist (wat toont Vandaag als er niets actief is? Wat doet de kaart? Roadtrip-modus heeft sowieso geen betekenis zonder reis). Dat is een midden-grote wijziging, geen kleine.

**Vraag hieronder (vraag 1)** — ik denk dat er een kleinere versie is die waarschijnlijk oplost wat je bedoelt, zonder die hele operatie: zie de opties.

---

## 4. Mooier icoon voor het beginscherm

**Generiek (één icoon voor de hele app):** kan nu al direct verbeterd worden — de huidige `icon-192.png`/`icon-512.png` zijn automatisch opgeschaald vanuit het bestaande kleine `apple-touch-icon.png` (180×180), dus vrij grof. Ik kan een nieuw, scherper icoon ontwerpen in dezelfde spruce-green/topografische stijl als de rest van de app.

**Per reis (ander icoon per land/reis op het beginscherm):** dit is **niet zomaar mogelijk** met de huidige opzet. Eén PWA-manifest hoort bij één "app" op één domein; als je "Voeg toe aan beginscherm" doet, gebruikt iOS altijd hetzelfde `apple-touch-icon.png`, ongeacht welke reis net open stond. Om écht een ander icoon per reis op het beginscherm te krijgen, zou je per reis een **eigen URL** nodig hebben (bv. `/noorwegen`, `/italie`) met een eigen manifest — dat is een significante herstructurering, en lost een klein cosmetisch verlangen op met een grote technische ingreep.

**Voorstel:** ik verbeter het generieke icoon nu. Per-reis-icoon parkeer ik, tenzij je zegt dat het je toch veel waard is.

---

## 5. Deel-links met permissies per reis — belangrijke waarschuwing vooraf

Dit is verreweg het grootste punt, en ik wil het niet stilletjes meenemen. **De app heeft op dit moment geen enkele echte toegangscontrole.**

Ik heb `firestore.rules` opnieuw nagelezen: elke lezing is toegestaan voor iedereen (`allow read: if true`), op alle reizen, alle verblijven, alle activiteiten — zonder uitzondering. Schrijven wordt alleen gecontroleerd op *vorm* (juiste velden, juiste types), niet op *wie* het doet. Het bestaande "deel"-linkje (`copyTripShareUrl()`) is dus puur cosmetisch: het plakt `?trip=<id>` aan de URL zodat de app die ene reis toont bij openen — maar **iedereen met de basis-URL van de app kan nu al alles zien én wijzigen**, linkje of niet. Er bestaat geen login, geen wachtwoord, geen token — niets dat onderscheid maakt tussen "ik" en "iemand anders."

Wat je vraagt — een link die écht alléén kijken toestaat, een andere link die écht alles mag, een link die écht tot 1 reis beperkt is — kan dus niet als kleine toevoeging. Het vereist een van deze twee routes:

- **Route A — Firebase Authentication + herschreven Firestore-rules.** Elke deel-link wordt een uniek token gekoppeld aan een rechten-niveau (bekijken/bewerken × 1 reis/alle reizen), vastgelegd in Firestore en gecontroleerd door de rules zelf. Grondig, blijft "server-less" (rechtstreeks Firestore, geen eigen backend nodig), maar wel een stevige herziening van hoe de app authenticeert.
- **Route B — Een eigen API-laag.** Alle Firestore-toegang loopt voortaan via Vercel-functies (`/api/...`) die zelf de rechten controleren, i.p.v. dat de browser rechtstreeks met Firestore praat. Meer controle en flexibiliteit, maar een grotere herbouw van bijna elk databestand (`js/firebase.js` en alles wat het aanroept).

Beide zijn **stevige, veiligheidsgevoelige** ingrepen op een systeem waar je echte reisdata in staat — dit wil ik niet zonder een eigen, apart afgewogen plan en jouw expliciete akkoord bouwen. Een fout hierin kan betekenen dat je reisdata alsnog voor iedereen open blijft staan terwijl je dénkt dat het afgeschermd is, wat erger is dan de huidige eerlijke situatie.

---

## Vragen

1. **Reis deactiveren** (punt 3): wat dekt je wens het beste?
   - (a) **Kleine versie** — een reis kan "gearchiveerd/gepauzeerd" worden (blijft bestaan, telt niet mee als actief, maar er blijft altijd een andere reis actief als er meerdere zijn) — dus geen "leeg" app-scherm, wel expliciete controle over welke reis nu getoond wordt.
   - (b) **Grote versie** — een echte "geen enkele reis actief"-status, met een nette lege-staat op elk scherm. Dit raakt bijna alle schermen en is een aparte, grotere batch.
2. **Google Maps-linkherkenning** (punt 1): akkoord om dit te bouwen (laag risico), en Booking/Airbnb-scraping niet?
3. **Icoon** (punt 4): generiek verbeteren nu, per-reis parkeren — akkoord?
4. **Deel-links met rechten** (punt 5): wil je dat ik hier een apart, uitgewerkt plan voor schrijf (met een concrete aanbeveling tussen route A/B), voordat er iets gebouwd wordt? Of heeft dit voorlopig geen prioriteit?
