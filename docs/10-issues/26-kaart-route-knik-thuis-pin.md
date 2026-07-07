# Kaart: rare knik in de rijroute, ontbrekende verblijven, thuis-pin (2026-07-07)

**Document ID:** TC-ISSUES-026
**Status:** ✅ Gefixt
**Bron:** Screenshot: "Waarom gaat de lijn op kaart door Duitsland (Hamburg) en raar met knik over Nederland." Gevolgd door: "Of zoek goede lijn zoals route gaat (GPS) of gewoon een rechte lijn tussen verblijven." Plus (zelfde sessie, los gemeld): "Graag alle verblijven op de kaart waarom is dat nu niet het geval en ook thuis op de kaart."

---

## 1. De "rare knik" bij Hamburg

`DRIVE_PATHS` (`js/data.js`) tekende de rijroute als een reeks handgetekende rechte lijnstukken met verzonnen tussenpunten om de lijn ruwweg langs een geloofwaardig traject te laten lopen. De heenrit (Nijmegen → Hirtshals) gebruikte tussenpunten langs de Nederlandse kust; de terugrit (Kolding → Nijmegen) gebruikte een heel ander tussenpunt, ter hoogte van Hamburg. Omdat beide lijnen bij Nijmegen samenkomen maar via andere tussenpunten weer noordwaarts lopen, kruisten ze elkaar zichtbaar rond de Nederlands-Duitse grens — precies de "rare knik" op het screenshot.

**Fix**: `DRIVE_PATHS` bestaat nu alleen nog uit rechte lijnen tussen de echte, al geverifieerde waypoints (dezelfde coördinaten als de accommodaties/ferrypunten) — geen verzonnen tussenpunten meer. Dit is exact de "gewoon een rechte lijn tussen verblijven"-optie die is voorgesteld. `fetchRealRoute()` (N7, `js/screen-map.js`) blijft ongewijzigd: zodra er een `ORS_API_KEY` in de Vercel-omgevingsvariabelen staat, vervangt die de rechte lijn alsnog door een echte, wegen-volgende route (de "GPS"-optie) — dat gebeurt automatisch zodra de sleutel is ingesteld, geen codewijziging nodig.

---

## 2. Niet alle verblijven zichtbaar op de kaart

Twee samenhangende oorzaken gevonden in `js/screen-map.js`:

1. **Vast gezichtsveld**: de kaart opende altijd met een hardcoded `setView([61.0, 8.0], 7)` (Noorwegen), ongeacht welke reis of verblijven daadwerkelijk actief zijn. Een verblijf buiten dat vaste kader kon dus prima een pin hebben, maar viel gewoon buiten beeld — leek dan verdwenen.
2. **Geen coördinaten ingevuld**: `readAccommodationFormFields()` (`js/screen-accommodation.js`) valt terug op `0` als lat/lng leeg blijven. Zo'n verblijf kreeg een pin op `[0, 0]` — in zee bij West-Afrika, dus in de praktijk net zo onzichtbaar.

**Fix**: nieuwe `fitMapToAllPins()` past het gezichtsveld bij elk bezoek van de kaart aan zodat alle verblijven mét geldige coördinaten (plus Thuis) gegarandeerd in beeld zijn. Een verblijf zonder geldige coördinaten (`isValidLatLng()`, sluit `0/0` en `NaN` uit) krijgt geen onzichtbare pin meer op `[0,0]`, maar wordt overgeslagen — met een melding in de debug-banner ("⚠️ Geen locatie ingesteld voor: ...") zodat het zichtbaar opvalt i.p.v. stilzwijgend te verdwijnen.

---

## 3. Thuis op de kaart

Nieuwe 🏠-pin op `HOME_LAT`/`HOME_LNG` (`js/data.js`, hetzelfde vertrek-/aankomstpunt dat de rijroutes al gebruikten). **Bewuste beperking**: er bestaat nog geen apart "thuisadres"-veld per reis — dit is dus het vaste punt van déze reis (Nijmegen), niet een instelbare locatie. Voor een toekomstige andere reis met een ander thuisadres is een eigen instelling nodig; dat is nu niet gebouwd (buiten scope van deze melding).

---

## Geverifieerd

Leaflet zelf (CDN, `cdnjs.cloudflare.com`) is niet bereikbaar vanuit deze sandbox, dus de daadwerkelijke kaartweergave kon hier niet visueel gecontroleerd worden — dit is een bekende beperking (zie het rode-team-punt over testbaarheid in eerdere sessies). Wel geverifieerd via headless test: `DRIVE_PATHS` bestaat nu overal uit precies 2 punten per segment (geen verzonnen tussenpunten meer), de Nijmegen↔Hirtshals- en Kolding↔Nijmegen-segmenten zijn exact de rechte lijn tussen de echte coördinaten, `isValidLatLng()` sluit `0/0` en `NaN` correct uit maar accepteert normale (ook negatieve) coördinaten, en `renderMapMarkers()`/`fitMapToAllPins()` falen niet als Leaflet ontbreekt. **Vraagt om handmatige bevestiging op het toestel van de gebruiker** zodra dit live staat.

---

## Gewijzigde bestanden

`js/data.js` (`DRIVE_PATHS` vereenvoudigd, nieuwe `HOME_LAT`/`HOME_LNG`), `js/screen-map.js` (nieuwe `isValidLatLng()`, `fitMapToAllPins()`, thuis-pin, invalide-coördinaten-melding in `renderMapMarkers()`, aanroepen in `initMap()`).
