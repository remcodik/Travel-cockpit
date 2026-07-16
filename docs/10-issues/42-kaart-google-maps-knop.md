# Kaartscherm: extra "Maps"-knop naar Google Maps (2026-07-14)

**Document ID:** TC-ISSUES-042
**Status:** ✅ Gefixt
**Bron:** "Zet op kaart ook een link naar google maps zodat ik die kan bekijken, zoom in op zelfde locatie als verblijf. Op andere plekken bijv vanuit act blijft dat gewoon zoals 't is, alleen kaart extra knop maps toevoegen."

---

## Wijziging

Op het **kaartscherm** staat naast "GPS" en "Reis/Alles" een nieuwe chip
**🗺️ Maps** (`openMapInGoogleMaps()` in js/screen-map.js). Die opent Google
Maps op precies hetzelfde middelpunt en zoomniveau als de kaart op dat
moment toont, via de `@lat,lng,zoomz`-URL-vorm. Omdat de kaart standaard op
het verblijf is gecentreerd (bij een stedentrip ingezoomd op de stad),
opent Google Maps dus ingezoomd op dezelfde locatie als het verblijf.

Bewust alleen hier toegevoegd — andere plekken (bv. de route-knop vanuit een
activiteit of het verblijfscherm) blijven ongewijzigd.

`sw.js`: `CACHE_VERSION` v34 → v35.
