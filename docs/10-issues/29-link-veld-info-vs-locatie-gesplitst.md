# "Link"-veld is voor info, apart veld voor locatie (2026-07-07)

**Document ID:** TC-ISSUES-029
**Status:** ✅ Gebouwd
**Bron:** "De link voor hotel in verblijf wil ik hebben voor voor info niet locatie geef de mogelijkheid om google maps link toe te voegen voor locatie (extra veld)."

---

## Probleem

Het "Link"-veld (getoond als "Boeking"-knop op het accommodatiescherm — puur info, een link die je later opent) deed dubbele dienst: de bijbehorende 📍-knop probeerde uit **datzelfde veld** ook coördinaten te halen (direct als het een Google Maps-link was, anders best-effort via de boekingspagina zelf). Plak je daar dus een boekingslink in voor info, dan kon de knop niets met locatie; plak je er een Maps-link in voor locatie, dan werd die als "boekingslink" opgeslagen en getoond — verwarrend, en niet wat de gebruiker wil.

---

## Fix

Twee volledig gescheiden velden en knoppen in het verblijf-formulier (`index.html`, `js/screen-accommodation.js`):

1. **"Link" (info)** — ongewijzigd van bedoeling, wordt opgeslagen als `acc.url` en getoond als "Boeking"-knop. De knop ernaast (`handleExtractInfoFromLink()`, nu 🔗 i.p.v. 📍) haalt nu **uitsluitend** naam/adres op via de boekingspagina (`api/extract-listing.js`) — raakt nooit coördinaten aan.
2. **"Google Maps-link" (locatie, nieuw veld)** — puur een scratch-invoerveld, wordt **niet** opgeslagen op het verblijf. De knop ernaast (`handleExtractLocationFromMapsLink()`, 📍) parseert de Maps-URL en vult **uitsluitend** lat/lng (+ hoogte, zoals voorheen) — raakt nooit het info-linkveld aan. Staat in de "Locatie instellen"-sectie, samen met de handmatige coördinaatvelden en de bestaande adres-gebaseerde 🔍-zoekknop (v1.37) — drie gelijkwaardige manieren om dezelfde coördinaten in te vullen.

`fillExtractedLocation()` is opgesplitst in `fillLocationCoords()` (coördinaten/hoogte/naam) en `fillNameAndAddress()` (naam/adres) — elke aanroeper raakt nu alleen de velden aan die bij zijn eigen doel horen.

---

## Geverifieerd

Headless-test: het Maps-link-veld bestaat apart van het info-linkveld met duidelijk onderscheiden placeholders; een Google Maps-link invullen en op 📍 tikken vult lat/lng/hoogte en laat het info-linkveld ongemoeid; een boekingslink invullen en op 🔗 tikken vult naam/adres en laat de coördinaten ongemoeid; een verkorte Maps-link geeft een nette foutmelding zonder te crashen; het Maps-link-veld start altijd leeg bij het (opnieuw) openen van het formulier (scratch-veld, niet opgeslagen). Regressietest gedraaid (adres-geocoding uit v1.37) — geen regressies.

---

## Gewijzigde bestanden

`index.html` (nieuw `edit-acc-maps-link-input`-veld, "Link"-placeholder/knop aangepast), `js/screen-accommodation.js` (`fillLocationCoords()`, `fillNameAndAddress()`, `handleExtractInfoFromLink()`, `handleExtractLocationFromMapsLink()`, veld-reset in `openEditAccommodationSheet()`/`openAddAccommodationSheet()`).
