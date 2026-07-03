# Restplan — wat er nu echt nog openstaat

**Document ID:** TC-ISSUES-008
**Status:** Punten 1, 2 en 4 (D5) gebouwd (2026-07-03) — 1 vereist nog een API-sleutel van jou. Punt 3 (zoekfunctie) nog niet opgepakt.
**Bron:** Opschoning van `01-testronde-30juni.md` (bijna alles daar is inmiddels gebouwd of afgewezen) + de nog niet afgehandelde punten uit latere plan-documenten.

---

## Uitdrukkelijk buiten dit plan

- **Firebase-setup voor de deel-links** (`docs/10-issues/07-deel-links-permissies-plan.md`) — jij pakt dit later zelf op, geen actie van mijn kant totdat je erom vraagt.
- **Hoogtekaart/hoogteprofiel in welke vorm dan ook** — al op 1 juli afgewezen (`02-feedback-01juli.md`), nu nogmaals bevestigd. Dit komt niet meer terug in een plan, ook niet als kleiner "simpel getal"-variant (D5 hieronder blijft daarom bewust laaste prioriteit en optioneel, niet als voorstel).

---

## 1. N7 — Echte routing via wegen/water ✅ Gebouwd, wacht op API-sleutel

**Gekozen:** OpenRouteService (gratis tier, geen eigen server nodig).

**Gebouwd:**
- `api/route.js` — nieuwe Vercel-functie, roept OpenRouteService's Directions-API aan met de bestaande waypoints uit `DRIVE_PATHS` en geeft de wegen-volgende routegeometrie terug.
- `js/screen-map.js` — elke rijroute tekent meteen de bestaande rechte lijn (nooit een lege kaart), en vraagt op de achtergrond de echte route op via `fetchRealRoute()`; komt die binnen, dan vervangt hij de rechte lijn. Resultaten worden in `localStorage` gecached (voorkomt herhaalde aanroepen bij elk bezoek, respecteert de gratis-tier rate limit). Lukt het ophalen niet (geen sleutel, netwerkfout, rate limit), dan blijft gewoon de rechte lijn staan — geen zichtbare fout.
- Ferry-segmenten blijven bewust rechte lijnen — daar bestaat geen "auto-routing"-equivalent voor.

**Nog nodig van jou:** een gratis API-sleutel op [openrouteservice.org](https://openrouteservice.org/dev/#/signup), als Vercel-omgevingsvariabele `ORS_API_KEY`. Zonder die sleutel blijft de kaart gewoon de rechte lijnen tonen zoals nu — niets breekt, het is puur een verbetering die aan staat te wachten.

---

## 2. Design/thema per reisland ✅ Gebouwd

**Gekozen:** automatisch op basis van land, alleen kleuren wisselen (contourlijnen-patroon blijft overal gelijk).

**Gebouwd:** drie thema's (`css/styles.css`, `body[data-theme=...]`), automatisch toegepast via `applyCountryTheme()` in `js/state.js` zodra een reis geladen/geactiveerd wordt:
- **Scandinavisch/alpien** (standaard, ongewijzigd) — Noorwegen, Zweden, IJsland, Zwitserland, Oostenrijk.
- **Mediterraan** (warm terracotta/roest, dieptzee-teal, zanderig papier) — Italië, Spanje, Portugal, Griekenland, Kroatië.
- **Continentaal** (koeler bos-groen, brandhout-accent) — Duitsland, Frankrijk.

De topografische contourlijnen (`js/topo.js`) volgen automatisch mee via CSS-variabelen (`var(--summit)`/`var(--paper)`) — geen aparte logica per thema nodig.

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
| D5 | ~~Numeriek hoogteverschil tonen per AI-suggestie~~ | **✅ Gebouwd** — `elevation_gain_m` toegevoegd aan het AI-schema (`api/suggestions.js`), getoond als "▲ 150m" naast afstand/duur (`js/screen-discover.js`), alleen bij een relevante wandeling — geen kaart/grafiek. |

---

## Volgende stap

Nog open: **punt 3** (zoekfunctie Mijn reizen) — zeg of je die gebouwd wilt hebben. Punt 1 werkt pas zichtbaar zodra je zelf een `ORS_API_KEY` hebt aangevraagd en in Vercel gezet.
