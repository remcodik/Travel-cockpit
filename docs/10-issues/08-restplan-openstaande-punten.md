# Restplan — wat er nu echt nog openstaat

**Document ID:** TC-ISSUES-008
**Status:** Plan klaar, prioriteit/keuzes nog te bepalen
**Bron:** Opschoning van `01-testronde-30juni.md` (bijna alles daar is inmiddels gebouwd of afgewezen) + de nog niet afgehandelde punten uit latere plan-documenten.

---

## Uitdrukkelijk buiten dit plan

- **Firebase-setup voor de deel-links** (`docs/10-issues/07-deel-links-permissies-plan.md`) — jij pakt dit later zelf op, geen actie van mijn kant totdat je erom vraagt.
- **Hoogtekaart/hoogteprofiel in welke vorm dan ook** — al op 1 juli afgewezen (`02-feedback-01juli.md`), nu nogmaals bevestigd. Dit komt niet meer terug in een plan, ook niet als kleiner "simpel getal"-variant (D5 hieronder blijft daarom bewust laaste prioriteit en optioneel, niet als voorstel).

---

## 1. N7 — Echte routing via wegen/water (grootste post)

**Wat er nu is:** routes (Nijmegen→Hirtshals, ferry, Hamburg-omweg) zijn handgetekende rechte lijnen in `DRIVE_PATHS`/`FERRY_PATHS` (`js/data.js`) — geen echte wegen, vandaar de rare knikken en het feit dat een ferry-lijn soms over land lijkt te lopen.

**Wat nodig is:** een routing-API voor het autogedeelte. Realistische opties:
- **OSRM** (open-source, gratis te hosten of een publieke demo-server gebruiken — niet voor productie bedoeld maar wel om te proberen) — rijroute tussen twee punten, volgt echte wegen.
- **OpenRouteService** — gratis tier met API-key, vergelijkbaar met OSRM maar geen eigen server nodig.
- **GraphHopper** — vergelijkbaar, ook een gratis tier.

Voor het ferry-gedeelte bestaat geen "auto-routing"-equivalent — een zee-/ferryroute kan niet automatisch berekend worden zoals een rijroute. Praktische aanpak: rijroutes via een API, ferry-segmenten blijven een (verbeterde, met een paar tussenpunten) handgetekende lijn die niet over land loopt.

**Vraag:** welke van de drie routing-diensten heeft de voorkeur, of wil je dat ik er één kies (dan ga ik voor OpenRouteService — gratis tier zonder eigen server nodig, in dezelfde stijl als de bestaande Vercel-functies)?

---

## 2. Design/thema per reisland

**Wat er nu is:** het hele kleurenpalet en topografische thema (spruce-green, Noorse contourlijnen) is nog steeds hardcoded voor Noorwegen, ongeacht welke reis actief is — een Italië- of Spanje-reis ziet er identiek uit.

Dit is twee keer eerder geparkeerd (Fase F Deel 4, en bij het icoon-verzoek) omdat het een designbeslissing is, geen bugfix. Belangrijkste keuzes die eerst gemaakt moeten worden:
- Eén vast kleurenpalet per land/regio (bv. mediterraan warm voor Zuid-Europa, alpien voor bergland), of een kleiner aantal thema's die je zelf per reis kiest?
- Blijft de topografische contourlijnen-stijl overal hetzelfde, of verandert ook dát per regio (bv. vlakkere lijnen voor een kustreis)?

**Vraag:** wil je dit nu oppakken (dan heb ik antwoord op de twee punten hierboven nodig), of blijft dit geparkeerd?

---

## 3. Zoekfunctie in "Mijn reizen"

Nooit concreet beantwoord (vraag 5 uit `05-reis-levenscyclus-plan.md`). Klein, laagrisico stukje UI — een zoekbalk boven de reizenlijst die filtert op naam/land, zodra je meer dan een paar reizen hebt.

**Vraag:** wil je dit gebouwd hebben, of is "gewoon scrollen" (wat nu al kan) voldoende zolang je niet heel veel reizen hebt?

---

## 4. Kleine restjes (laag risico, losstaand)

| # | Punt | Voorstel |
|---|---|---|
| B5 | Accommodatiepins van bestaande/oude reizen staan op plaatscentrum, niet exact adres | Nieuwe verblijven kunnen dit al zelf oplossen via de 📍-knop (Google Maps-link of boekingslink). Voor bestaande verblijven: zelf de coördinaten even opnieuw invullen via bewerken — geen losse migratie nodig, tenzij je dat liever automatisch wilt. |
| B6 | GPS-trackline visueel onderscheid tussen ferry/auto/fiets/lopen | Nog uit te denken (automatisch via snelheid, of handmatige modus-keuze) — nice-to-have, geen bekende vraag ernaar sindsdien. |
| B7 | Alternatieve, uitgebreidere kaartstijl (Google Maps-achtig) | Afweging meerwaarde vs. bouwcomplexiteit — voorstel: laten liggen tenzij je de huidige kaart concreet te beperkt vindt. |
| D5 | Numeriek hoogteverschil tonen per AI-suggestie (géén kaart/grafiek) | Laagste prioriteit van dit hele document, puur optioneel. |

---

## Volgende stap

Zeg welke van de vier bovenstaande punten (of geen enkele voorlopig) je wilt oppakken — bij 1 en 2 heb ik eerst een keuze van jou nodig voordat ik kan bouwen, 3 kan direct als je 'm wilt, en 4 zijn losse, optionele kleinigheden die geen haast hebben.
