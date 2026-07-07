# Service worker-updates werden nooit gedetecteerd (2026-07-07)

**Document ID:** TC-ISSUES-031
**Status:** ✅ Gefixt — **structurele/proces-fix, niet zomaar een eenmalige bug**
**Bron:** Screenshot van het verblijf-formulier met de oude UI (nog steeds "Coördinaten handmatig aanpassen" in een ingeklapt `<details>`, het oude gecombineerde 📍-linkveld) — dus meerdere fixes uit dezelfde sessie (`docs/10-issues/28`, `29`, `30`) waren zichtbaar niet aangekomen. "Hoe werkt het is mij niet duidelijk waar ik een Maps-link kan toevoegen. Denk eerst na want zo gaat het niet goed."

---

## Root cause

`sw.js` (de service worker, N1, "app-shell caching") bevat sinds z'n allereerste versie de instructie: *"Cache-versie ophogen bij een merge die JS/CSS/HTML aanpast."* Die instructie is **nooit opgevolgd** — `CACHE_VERSION` stond nog steeds op `'v1'`, ondanks tientallen daaropvolgende merges deze sessie die wél JS/HTML aanpasten.

Browsers detecteren een service-worker-update uitsluitend door te checken of `sw.js` zélf **byte-voor-byte** is veranderd. Omdat `CACHE_VERSION` (het enige dat ooit in dat bestand veranderde) nooit werd opgehoogd, bleef `sw.js` identiek — dus registreerde de browser nooit een update, dus vuurde de update-banner (`js/offline.js`, `showSwUpdateBanner()`) geen enkele keer af, hoeveel er in werkelijkheid ook wijzigde. De gebruiker bleef dus vastzitten op de allereerste versie van de app die zijn toestel ooit gecachet had.

**Los, tweede probleem, versterkend**: de fetch-handler in `sw.js` deed `fetch(req)` zonder `{ cache: 'no-store' }`. Ook los van de service-worker-eigen cache respecteert zo'n aanroep nog gewoon de normale HTTP-cache van de browser — de bedoelde "network-first"-strategie ("altijd de nieuwste versie proberen te halen") kon dus alsnog een oud, door de browser zelf gecacht antwoord terugkrijgen zonder ooit echt de server te bereiken. `vercel.json` had daarnaast geen enkele expliciete cache-control-header voor `index.html`/`js/*`/`css/*`/`sw.js`, dus gold Vercel's standaardgedrag — niet gegarandeerd "altijd verifiëren".

---

## Waarom dit zo lang onopgemerkt bleef

De app werkte voor het overgrote deel prima met een normale browser-tab-navigatie/refresh (die haalt meestal wél een verse `index.html` op). Het patroon werd pas zichtbaar zodra iemand de app een tijd open had staan of 'm als PWA/bladwijzer gebruikte zonder een volledig verse laad-cyclus — precies het scenario waarvoor de service worker juist bedoeld is.

---

## Fix

1. **`sw.js`**: `CACHE_VERSION` opgehoogd (`v1` → `v2`) — forceert nu wél een gedetecteerde update. Vanaf nu geldt de bestaande instructie in de commentaar weer echt: bij elke volgende merge die JS/CSS/HTML aanpast, dit getal ophogen.
2. **`sw.js`**: fetch-aanroep in de "network-first"-strategie krijgt nu expliciet `{ cache: 'no-store' }` — omzeilt de browser-eigen HTTP-cache, zodat "altijd verifiëren met de server" ook daadwerkelijk waar is, onafhankelijk van wat Vercel's headers doen.
3. **`vercel.json`**: expliciete `Cache-Control: no-cache, must-revalidate`-headers toegevoegd voor `/`, `/index.html`, `/js/*`, `/css/*`, `/manifest.json`, en `no-cache, no-store, must-revalidate` voor `/sw.js` zelf (dat bestand moet de browser bij elke gelegenheid opnieuw checken, anders werkt updatedetectie sowieso niet).
4. **Bijvangst**: `APP_SHELL`-lijst in `sw.js` miste `js/screen-guide.js` en `js/notes.js` (toegevoegd na de oorspronkelijke service-worker-bouw, nooit aan de precache-lijst toegevoegd) — nu compleet, gecontroleerd tegen alle `<script src="js/...">`-tags in `index.html`.

---

## Wat dit voor jou betekent

De volgende keer dat je de app opent, zou je bovenin een balk moeten zien verschijnen ("Nieuwe versie beschikbaar" — tik erop om te verversen). Zie je die niet binnen een paar keer openen, laat het weten — dan onderzoeken we een sterkere maatregel (of je kunt in Safari-instellingen handmatig de sitegegevens voor deze app wissen als noodgreep).

---

## Geverifieerd

Headless-test: de service worker registreert correct en maakt een `travel-cockpit-v2`-cache aan (niet meer `v1`); `APP_SHELL` bevat nu exact dezelfde bestanden als alle `<script src="js/...">`-tags in `index.html`; `vercel.json` is geldige JSON. De daadwerkelijke update-detectie-cyclus (installing → waiting → banner → skipWaiting → reload) is inherent alleen op een echt toestel met een al-geïnstalleerde oudere versie te verifiëren — dit is precies het scenario waarin de gebruiker het probleem meldde.

---

## Gewijzigde bestanden

`sw.js` (`CACHE_VERSION`, `{ cache: 'no-store' }`, `APP_SHELL` aangevuld), `vercel.json` (cache-control-headers).
