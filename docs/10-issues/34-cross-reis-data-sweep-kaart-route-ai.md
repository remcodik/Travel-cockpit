# Cross-reis-sweep: Noorwegen-route/verblijven/AI lekten naar elke andere reis (2026-07-13)

**Document ID:** TC-ISSUES-034
**Status:** ✅ Gefixt
**Bron:** "Eerst nog kijken naar kaart daar zie ik nog oude verblijven en oude route. Kijk goed rond zodat alles van andere reis weg is overal act, tickets, verblijven ai alles moet aan reis gekoppeld zijn en dus bij nieuwe reis alles weg"

---

## Volledige sweep — wat was er nog NIET aan de reis gekoppeld?

| Plek | Lek | Fix |
|---|---|---|
| Kaart: routelijnen | `DRIVE_PATHS`/`FERRY_PATHS` (hardcoded Noorwegen-route, js/data.js) werden **éénmalig bij het aanmaken van de kaart** getekend en nooit meer aangeraakt — de Noorwegen-route bleef dus staan, welke reis er ook actief was | `renderMapRoutes()`: lijnen bijgehouden in `routeLines[]` en bij elk kaartbezoek opnieuw opgebouwd. Standaardreis → de handgetekende route (incl. ferry's); elke andere reis → generiek Thuis → verblijven (check-in-volgorde) → Thuis, per etappe nog steeds via `fetchRealRoute()` vervangen door een echte wegen-route |
| Kaart: routestrip onderaan | Hardcoded HTML-chips (Nijmegen/Hirtshals/Sogndal/…) in index.html | `renderMapRouteStrip()`: standaardreis rendert `ROUTE`-data, andere reizen Thuis → eigen verblijven → Thuis, met de verblijfkleuren |
| Kaart: NO/EU-knop | Zoomde naar vaste Noorwegen/Europa-coördinaten | Nu "Reis" (kadert de verblijven van de actieve reis) / "Alles" (incl. Thuis), via `fitMapToAllPins()` |
| Roadtrip: mini-kaart | Verblijf-pins werden alleen bij de **allereerste** keer uitklappen toegevoegd — na reiswissel bleven de pins van de vorige reis staan; terugval-middelpunt was hardcoded Noorwegen | Pins bij elk uitklappen opnieuw opgebouwd (`roadtripMiniMarkers[]`), middelpunt volgt actief verblijf met Thuis als terugval |
| Ideeën (AI): land | `country: 'Noorwegen'` hardcoded in het verzoek naar /api/suggestions — de AI suggereerde voor élke reis Noorse plekken | Land van de actieve reis meegestuurd |
| /api/suggestions systeemprompt | "een roadtrip-app voor Noorwegen" | Landneutraal — het land komt al via het userMessage mee |
| Activiteit toevoegen: verblijf-select | Hardcoded Sogndal/Skjåk/Valdres/Gjerstad-opties in index.html (werden bij openen wel overschreven, maar hoorden er niet te staan) | Leeg; wordt altijd per actieve reis gevuld |
| Browsertab-titel | Vast "Travel Cockpit · Noorwegen 2026" | Volgt de actieve reis (`applyTripData`) |
| Ideeën: "al toegevoegd"-markeringen | `AppState.discoveredAdded` werd bij reiswissel niet gewist | Gewist in `switchToTrip()` |

## Al eerder trip-gekoppeld (gecontroleerd, geen fix nodig)

- **Activiteiten, tickets, verblijven, notities, AI-cache, reisgids-cache,
  weer-historie**: allemaal onder `trips/{tripId}/…` (tripRef) — en het
  seed-activiteiten-lek bij herladen is al in TC-ISSUES-033 gefixt.
- **Kaart-pins/filterchips**: worden al bij elk bezoek uit de actieve reis
  opgebouwd (Fase B-fix).
- **Planning/Reisgids**: gebruikten al `(trip && trip.country)`.
- **Weer/laadpalen**: volgen het actieve verblijf en zijn null-veilig.

`sw.js`: `CACHE_VERSION` v25 → v26.
