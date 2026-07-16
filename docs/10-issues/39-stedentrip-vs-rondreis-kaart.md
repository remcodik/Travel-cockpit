# Kaart past zich aan reistype aan: stedentrip (1 verblijf) vs. rondreis (2026-07-14)

**Document ID:** TC-ISSUES-039
**Status:** ✅ Gefixt
**Bron:** "Kun je een indicator aan reis toevoegen of 't rondreis of stedentrip is en daarmee een ander detail op kaart weergeven — bij stedentrip een gedetailleerde kaart van de stad en dan ook zo de activiteiten aangeven in de stad. Als ik meerdere verblijven opgeef dan rondreis, maar bij 1 verblijf een stedentrip. Dus indicator is niet nodig, je weet bij 1 verblijf de stedentrip en bij meerdere verblijven in diverse steden rondreis. En bij elke nieuwe reis en dus huidige reizen aanpassen."

---

## Aanpak: geen indicator, afgeleid uit het aantal verblijven

Zoals gevraagd is er **geen apart veld/indicator** — het reistype wordt puur
bij het renderen bepaald (`isCityTrip()` in js/screen-map.js):

- **1 verblijf → stedentrip**
- **meerdere verblijven → rondreis**

Omdat het runtime wordt afgeleid, geldt het **automatisch voor elke reis,
bestaand én nieuw** — er verandert niets aan de opgeslagen data en er is geen
migratie nodig.

## Wat verandert er op de kaart bij een stedentrip

1. **Inzoomen op de stad** (`fitMapToAllPins()`): kadert op het ene verblijf
   + de ingeplande activiteiten (met geldige coördinaten), met een hogere
   `maxZoom` (15) → straatniveau. Thuis telt bewust níet mee (zou weer
   uitzoomen). Eén enkel punt → `setView(..., 13)`. Zonder bruikbare
   coördinaten valt het terug op het brede overzicht.
2. **Geen rijroute** (`renderMapRoutes()`): een stedentrip is geen etappe
   onderweg, dus geen Thuis→stad→Thuis-lijn.
3. **Routestrip onderaan** (`renderMapRouteStrip()`): toont "🏙️ <stad> ·
   stedentrip" + de ingeplande activiteiten als chips, i.p.v.
   Thuis→verblijven→Thuis.
4. **Kop/legenda** (index.html + renderMapRouteStrip): "In de stad" zonder
   de rij/ferry-legenda.
5. De knop **"Alles"** (mapShowFullRoute) blijft werken: daarmee kun je bij
   een stedentrip alsnog het geheel incl. Thuis bekijken.

Een rondreis (meerdere verblijven) houdt exact het bestaande gedrag:
overzicht van alle verblijven + de route, Thuis erbij met "Alles".

`sw.js`: `CACHE_VERSION` v31 → v32.
