# Vervolgstap-plan — N1/N2/N6/N8/H4 (klein) + N3/N7 (apart te bespreken)

**Document ID:** TC-ISSUES-004
**Status:** Plan ter bespreking — **niet bouwen voordat de vragen onderaan beantwoord zijn**
**Bron:** Vervolg op `03-fase-e-plan-en-nieuwe-ideeen.md`, nu elk item technisch geanalyseerd tegen de huidige code

---

## Deel 1 — Klein, snel te doen

### N1 — Echte offline-app-shell (Service Worker)

**Probleem:** Firestore-data cachet al lokaal (`db.enablePersistence()` staat al aan in `js/firebase.js`), maar de app zelf (`index.html`, `css/`, alle `js/*.js`) heeft geen eigen cache-strategie. Zonder bereik (Noorse fjorden/bergen) kan de browser de pagina zelf niet laden als de HTTP-cache leeg/verlopen is — dan zie je geen app met oude data, maar helemaal niets.

**Voorstel:** Een nieuw `sw.js` (Service Worker) die de app-shell cachet, met een **network-first**-strategie voor HTML/CSS/JS: als er internet is, haal je altijd de nieuwste versie op (en cache je die bij), alleen als dat faalt val je terug op de cache. Dit is bewust gekozen boven cache-first, omdat deze app bijna dagelijks bugfixes krijgt — cache-first zou een oude, mogelijk kapotte versie kunnen laten "vastplakken" totdat er handmatig geforceerd ververst wordt.

**Vraag 1:** Als er een nieuwe versie beschikbaar is terwijl je de app open hebt staan: automatisch en stil bijwerken (kan een actieve sessie onderbreken), of een bannertje "Nieuwe versie beschikbaar — herlaad" tonen zodat je zelf bepaalt wanneer?

---

### N2 — Web app manifest (`manifest.json`)

**Probleem:** er staan alleen iOS-specifieke meta-tags in `index.html` (`apple-mobile-web-app-capable` e.d.). Zonder een `manifest.json` krijgt een Android-gebruiker (een kennis, bijvoorbeeld) geen fatsoenlijke "installeer op beginscherm"-ervaring met correct icoon/naam/themakleur.

**Kanttekening:** er bestaat maar één icoonbestand (`apple-touch-icon.png`, 180×180px). Een manifest wil meestal ook een 192×192 en 512×512 variant. Ik kan die nu genereren door het bestaande icoon op te schalen (functioneel prima, maar op het grootste formaat iets zachter/wazig dan een origineel groot ontwerp). Geen blokkerende vraag — ik ga hiermee verder tenzij je liever eerst een nieuw icoon-ontwerp wil (zie ook het oude, nooit opgepakte puntje F1 "app-icoon is saai").

---

### N6 — Reisdata exporteren als JSON

**Probleem:** er is geen account-systeem, en Firestore-rules zijn bewust alleen schema-validatie, geen echte toegangscontrole (al eerder zo gedocumenteerd). Een "exporteer"-knop is een goedkope verzekering tegen dataverlies.

**Vraag 2:** Exporteer je **alleen de actieve reis** (verblijven + activiteiten + tickets van die ene reis), of **alle reizen tegelijk** als één backup-bestand? Het laatste is completer maar minder gericht.

---

### N8 — Meerdaagse weersverwachting-strip

**Probleem:** `js/weather.js` haalt nu al een **volledige 16-daagse Open-Meteo-forecast** op (`forecast_days=16`) — de data is er al, alleen de UI toont uitsluitend "vandaag". Dit is dus puur een weergave-taak, geen nieuwe data-integratie.

**Voorstel:** een horizontale strip van 4–5 dagen (vandaag + volgende dagen) op het Roadtrip-scherm, met per dag emoji + min/max-temperatuur — handig om vooruit te plannen (bijv. binnendag bij regen morgen).

Geen open vraag hier — duidelijk en laag risico, ik kan dit gewoon bouwen.

---

### H4 — Discover-suggesties: toevoegen i.p.v. vervangen bij verversen

**Probleem (bevestigd, ongewijzigd sinds de testronde):** `handleLoadMoreSuggestions()` in `js/screen-discover.js` doet `currentSuggestions = newSuggestions;` — dit **vervangt** de hele lijst bij elke "↻ Nieuwe ideeën"-klik. Suggesties die je nog niet had bekeken zijn daarna kwijt.

**Voorstel:** nieuwe suggesties **toevoegen** aan de bestaande lijst, met dedupe op naam (een AI-suggestie met dezelfde naam als een al bestaande wordt genegeerd) en een maximum van bijvoorbeeld 15 suggesties in de lijst (oudste, nog-niet-toegevoegde suggesties vallen er dan vanaf om de lijst niet oneindig te laten groeien).

**Vraag 3:** Is een limiet van 15 suggesties oké, of wil je een ander aantal?

---

## Deel 2 — Groter, apart te bespreken

### N7 — Route via echte wegen i.p.v. rechte lijnen

**Probleem:** `DRIVE_PATHS`/`FERRY_PATHS` in `js/data.js` zijn handgetekende coördinaten-arrays, specifiek voor de Noorwegen-reis. Dit veroorzaakt drie bekende klachten in één keer (heen/terug zien er verschillend uit, geen omweg via Hamburg, ferryroute loopt soms over land) — en werkt sowieso niet automatisch voor een nieuwe reis (andere trip = andere rechte lijnen nodig, niemand gaat die met de hand intekenen).

**Kernprobleem bij de oplossing: een routing-API bestaat voor autowegen, niet voor veerboten.** Elke routing-dienst (OSRM, OpenRouteService, GraphHopper, Mapbox) routeert **om water heen**, nooit **erover** — een ferry-oversteek (Hirtshals–Stavanger, Kristiansand–Hirtshals) kan geen enkele routing-API automatisch tekenen. Die stukken blijven sowieso handmatig ingetekend, wat wél kan automatiseren zijn de rij-stukken ertussen.

**Voorstel:**
- Rijroutes ophalen via een routing-API, **server-side** (nieuw `api/route.js`, zelfde patroon als de bestaande AI-/laadstations-proxy).
- Routes **eenmalig berekenen en opslaan** (bijv. in Firestore bij de accommodatie, of afgeleid bij het aanmaken/bewerken van een reis) i.p.v. live bij elk kaart-bezoek — een reisroute verandert niet elke dag, dus dat is goedkoper, sneller, en werkt ook nog als de routing-API zelf even niet bereikbaar is.
- Ferry-stukken blijven handmatig, met een simpel "dit is een ferry, geen wegroute"-mechanisme.

**Vraag 4:** Welke routing-dienst? Ik ken er een paar met een gratis niveau (OpenRouteService, GraphHopper) — ik wil niet zomaar een keuze maken zonder dat je weet dat dit een externe dienst + eventueel een gratis API-sleutel vereist (zelfde soort setup als de Open Charge Map-sleutel die nu al eens fout ging). Wil je dat ik dit uitzoek en een concreet voorstel doe, of heb je zelf een voorkeur/ervaring met een van deze diensten?

**Inschatting:** dit is het grootste stuk van alles wat nu nog open staat — een eigen fase, niet iets voor "snel erbij".

---

### N3 — Discover-modus "Bij deze activiteit"

**Probleem/wens (testronde D8, nog nooit gebouwd):** na een activiteit is Discover nu alleen "vanuit verblijf" of "hier" (live GPS) — niet "vanuit de activiteit die ik net heb afgerond". Als je bijvoorbeeld net een wandeling hebt gedaan en een koffie zoekt, moet je nu terug naar het verblijf als uitgangspunt, ook al sta je ergens anders.

**Voorstel:** een derde Discover-modus die de laatst-afgevinkte activiteit als basis-locatie gebruikt i.p.v. het verblijf.

**Vraag 5:** Waar moet dit vandaan getriggerd worden? Bijvoorbeeld:
- Automatisch: na het afvinken van een activiteit een toast/knop "Iets zoeken in de buurt?" die naar Discover in deze modus springt.
- Handmatig: gewoon een derde chip naast "Verblijf"/"Hier" in Discover zelf, die de laatst-afgevinkte activiteit als locatie gebruikt (of niets doet als er nog niets is afgevinkt vandaag).

---

## Volgende stap

Zodra bovenstaande vragen beantwoord zijn: N1/N2/N6/N8/H4 worden in één batch gebouwd (klein, laag risico). N7 en N3 worden pas gepland zodra er een concrete keuze ligt voor respectievelijk de routing-dienst en de trigger-vorm.
