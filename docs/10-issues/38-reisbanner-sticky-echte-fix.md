# Reisbanner bleef tóch meescrollen — echte oorzaak: de hele pagina scrollt (2026-07-14)

**Document ID:** TC-ISSUES-038
**Status:** ✅ Gefixt (geverifieerd in een echte browser)
**Bron:** "Bij scrollen blijft top banner niet staan. Check s.v.p."

---

## Waarom de vorige poging (TC-ISSUES-037) niet werkte

De aanname was: de strip staat buiten `.scroll`, dus blijft hij vanzelf
staan. Dat klopt alleen als `.scroll` de daadwerkelijke scroll-regio is.

Maar `body` én `.screen` gebruiken allebei `min-height: 100dvh` zónder
vaste hoogte (en flex-items hebben standaard `min-height: auto`). Daardoor
groeit `.screen` gewoon mee met z'n inhoud en scrollt **de hele pagina
(body)** — `.scroll` overflowt nooit intern. De strip stond dus wél buiten
`.scroll`, maar scrolde samen met de body mee omhoog.

## Fix

`.trip-id-strip` krijgt `position: sticky; top: 0; z-index: 20`. Sticky pint
het element aan de bovenkant van het scrollvenster, ongeacht of de body of
een binnenste regio scrollt. Bewust géén verbouwing van het scroll-model
(`.screen` vaste hoogte + `.scroll` `min-height:0`) — dat raakt elk scherm
en is risicovoller; sticky is een gerichte, veilige oplossing.

## Verificatie (deze keer echt getest)

Headless Chromium (playwright-core) met de échte `css/styles.css` en de
exacte `.screen` → `.trip-id-strip` → `.scroll`-structuur, inhoud 2400px in
een 780px-viewport:
- vóór scrollen: strip `top = 0`
- na 1500px scrollen: strip `top = 0`, `bottom = 44` → blijft gepind.

`sw.js`: `CACHE_VERSION` v29 → v30.
