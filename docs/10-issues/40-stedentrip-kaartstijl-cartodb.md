# Stedentrip krijgt een fijnere stadskaart (CartoDB Voyager) (2026-07-14)

**Document ID:** TC-ISSUES-040
**Status:** ✅ Gefixt
**Bron:** "Ja wel leuk om voor stedentrip wat te wijzigen klein. Laad labels kaart zoals 't is."

Vervolg op de vraag over Nederlandse namen (TC-ISSUES-039-gesprek): de
labels blijven in de lokale taal ("zoals 't is" — geen vertaling, geen
API-sleutel), maar een stedentrip krijgt een andere, fijnere kaartstijl.

## Wijziging

`applyMapBaseLayer()` (js/screen-map.js) kiest de basis-tegellaag op
reistype (`isCityTrip()`):
- **Rondreis** → de vertrouwde OpenStreetMap-kaart (ongewijzigd).
- **Stedentrip** → CartoDB **Voyager**: een rustiger, gedetailleerdere
  stadscartografie met duidelijke straten en POI-labels, prettiger bij het
  inzoomen op één stad. Gratis en sleutelloos (zelfde soort publieke
  raster-tegels als OSM), tot zoom 20. Attributie: © OpenStreetMap, © CARTO.

De laag wordt bijgewerkt bij het openen van de kaart én bij het opnieuw
bezoeken (initMap-heringang), zodat het wisselen tussen een stedentrip en
een rondreis meteen de juiste stijl toont. `baseTileLayerIsCity` onthoudt de
huidige stijl zodat er niet onnodig van laag gewisseld wordt.

## Opmerking over verificatie

De tegels konden niet vanuit deze sandbox gecontroleerd worden (de
agent-proxy blokkeert tile-CDN's — de bestaande OSM-tegels falen daar exact
zo, terwijl ze in de echte app gewoon werken). CartoDB Voyager is een breed
gebruikte publieke basiskaart; in de browser van de gebruiker laadt hij net
als OSM. Visuele controle op toestel aanbevolen.

`sw.js`: `CACHE_VERSION` v32 → v33.
