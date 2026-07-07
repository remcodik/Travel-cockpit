# Weer van voorbije dagen bewaren (2026-07-06)

**Document ID:** TC-ISSUES-024
**Status:** ✅ Gebouwd
**Bron:** "Blijft t weer bewaard als de dag voorbij is" — vervolg op een eerder gestelde vraag, waarop het antwoord "nee" was (het weer werd nergens bewaard, alleen live opgehaald).

---

## Uitgangssituatie

Weer kwam altijd live van Open-Meteo's `/v1/forecast`-endpoint (`js/weather.js`): vandaag (`current`) + een 16-daagse forecast (`forecast_days=16`, geen `past_days`). Er was alleen een in-memory cache van 1 uur, geen enkele opslag. Zodra een datum niet meer in `daily.time` voorkwam (per definitie elke voorbije dag — de toekomst zit altijd binnen het 16-daagse venster), gaf `getWeatherForDate()` domweg `null` terug: "—°" / "Weer niet beschikbaar", ook al was het die dag misschien nog wél live opgehaald geweest.

Dit is vooral zichtbaar op het accommodatiescherm van een al afgelopen verblijf (zie `docs/10-issues/17-...`, oude verblijven zijn terug-navigeerbaar) — de weerstrip daar begint bij `checkIn` en kan dus volledig uit voorbije dagen bestaan.

---

## Fix

Elke keer dat er live een forecast wordt opgehaald, wordt de waarde van "vandaag" apart weggeschreven als een klein snapshot (max/min-temperatuur, weercode, regenkans) — Firestore (`trips/{tripId}/weather_history/{datum}_{lat}_{lng}`, gedeeld tussen reisgenoten) + localStorage-fallback (offline), hetzelfde dubbele-cache-patroon als de AI-suggesties-cache. Zodra die dag straks voorbij is en buiten Open-Meteo's venster valt, gebruikt `getWeatherForDate()` dit laatst opgeslagen snapshot i.p.v. domweg `null` terug te geven.

Concreet (`js/weather.js`):
- `persistTodaySnapshot(data, lat, lng)` — na elke succesvolle live-aanroep, slaat de "vandaag"-waarden op (fire-and-forget, blokkeert de eigenlijke weergave niet).
- `loadPastWeatherSnapshot(dateStr, lat, lng)` — geeft het opgeslagen snapshot terug voor een datum die buiten het live forecast-venster valt (Firestore eerst, dan localStorage).
- Nieuw veld `isHistorical: true` op het teruggegeven weer-object, zodat een aanroeper eventueel visueel onderscheid kan maken (nu nergens gebruikt in de UI, puur metadata).

Firestore-functies `dbSaveWeatherSnapshot()`/`dbLoadWeatherSnapshot()` toegevoegd in `js/firebase.js`, volgens hetzelfde `tripRef()`-patroon als de rest van de app.

---

## Bewuste grens

Dit is geen "historisch weer"-API — een dag waarop de app nooit geopend is geweest (dus nooit als "vandaag" live opgehaald), kan nooit met terugwerkende kracht opgevuld worden. Open-Meteo's forecast-endpoint geeft principieel geen enkele voorbije dag terug, dus er is geen bron om zo'n gemiste dag alsnog op te halen. In de praktijk dekt dit verreweg de meeste gevallen, omdat de app tijdens een lopende reis vrijwel dagelijks open staat.

---

## Geverifieerd

Headless-test: een direct opgeslagen snapshot (gesimuleerd als "3 dagen geleden, toen het nog vandaag was") wordt teruggevonden zodra diezelfde datum buiten een live forecast-respons valt die alleen de huidige dag bevat — inclusief het `isHistorical`-veld en de juiste temperatuurwaarden. Vandaag zelf blijft de live `current`-tak gebruiken (niet de historie-tak). Een datum die nooit is opgeslagen blijft gewoon `null`. Regressietest gedraaid (voortgangsstatistieken, thuis-dag-icoon, echte verplaatsdag, eerste-reisdag-fix) — geen regressies.

---

## Gewijzigde bestanden

`js/weather.js` (`persistTodaySnapshot()`, `loadPastWeatherSnapshot()`, `buildDailySnapshot()`, `weatherHistoryLsKey()`, aanroep in `fetchWeatherForLocation()` en fallback in `getWeatherForDate()`), `js/firebase.js` (`dbSaveWeatherSnapshot()`, `dbLoadWeatherSnapshot()`, `weatherHistoryDocId()`).
