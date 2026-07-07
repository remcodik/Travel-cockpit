# Automatisch coördinaten opzoeken bij adres/plaatsnaam (2026-07-07)

**Document ID:** TC-ISSUES-028
**Status:** ✅ Gebouwd
**Bron:** Vervolg op `docs/10-issues/27-kolding-onzichtbaar-debug-banner-bug.md`: "Zoek verblijf zelf coördinaten op of laat me adres in kunnen vullen op in ieder geval de plaats. Ik heb bij adres plaats Kolding ingevuld gebruik dat om locatie op kaart te bepalen."

---

## Uitgangssituatie

Een verblijf kreeg alleen coördinaten via drie handmatige routes: zelf lat/lng intikken, een Google Maps-link plakken (📍-knop), of een boekingslink laten uitlezen (`api/extract-listing.js`). Er was geen manier om alleen een adres of plaatsnaam te typen (zoals "Kolding") en daar automatisch een locatie bij te laten zoeken — precies waar Kolding (issue 27) op stukliep.

---

## Fix

**Nieuw endpoint** `api/geocode.js` — zoekt coördinaten op bij een vrije-tekst adres/plaatsnaam via OpenStreetMap Nominatim (gratis, geen API-sleutel, wel een vaste `User-Agent` vereist volgens Nominatim's gebruiksvoorwaarden — vandaar server-side i.p.v. rechtstreeks vanuit de client).

**Twee routes naar hetzelfde resultaat** (`js/screen-accommodation.js`):
1. **Directe knop**: nieuwe 🔍-knop naast het adresveld (`handleGeocodeAddress()`) — zoekt meteen op en vult lat/lng (+ hoogte, via de bestaande ⛰️-aanroep) in, voor direct feedback vóór het opslaan.
2. **Automatisch bij opslaan**: nieuwe `ensureAccommodationCoords()`, aangeroepen in zowel `saveAccommodationEdit()` als `saveAccommodationCreate()` — als er bij het opslaan nog geen geldige coördinaten staan (`isValidLatLng()`, uit `js/screen-map.js`) maar wel een adres, wordt dat automatisch opgezocht. Zo is het typen van alleen een plaatsnaam al genoeg voor een werkende pin, zonder dat de 🔍-knop apart aangetikt hoeft te worden — dit is precies wat Kolding nodig had.

Beide routes vullen nooit een al ingevulde (handmatige of eerder opgehaalde) waarde over — alleen als lat/lng nog leeg/`0` zijn.

---

## Geverifieerd

Headless-test (met een gemockt `/api/geocode`-endpoint, want deze sandbox heeft geen internettoegang tot Nominatim): `geocodeAddress()` geeft de juiste coördinaten terug bij een gevonden plaats en `null` bij een niet-gevonden plaats; `ensureAccommodationCoords()` vult automatisch lat/lng/hoogte aan wanneer er een adres maar geen geldige coördinaten zijn, laat al ingevulde geldige coördinaten ongemoeid (geen onnodige aanroep), en doet niets bij een leeg adres; de 🔍-knop bestaat in de DOM. **Volledige end-to-end-test**: een nieuw verblijf aanmaken met alleen naam + adres "Kolding" (geen handmatige coördinaten) resulteert na opslaan in een verblijf met geldige, correcte coördinaten. Regressietest gedraaid (voortgangsstatistieken) — geen regressies.

---

## Gewijzigde bestanden

`api/geocode.js` (nieuw), `js/screen-accommodation.js` (`geocodeAddress()`, `handleGeocodeAddress()`, `ensureAccommodationCoords()`, aanroepen in `saveAccommodationEdit()`/`saveAccommodationCreate()`), `index.html` (🔍-knop naast het adresveld).
