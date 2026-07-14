# Knoppen & navigatie-herindeling + reis-herkenningsstrip (2026-07-13)

**Document ID:** TC-ISSUES-035
**Status:** ✅ Gefixt
**Bron:** Gebruikersverzoek — Vandaag te leeg, snelacties toevoegen, koppen dunner, reisidentiteit op elk scherm, Meer-tab herindelen, deel-links-vraag.

---

## Reis-herkenningsstrip (op alle 5 hoofdtabs)

Nieuwe dunne balk bovenaan Vandaag, Kaart, Planning, Ideeën en Meer:
`🇳🇴 Noorwegen 2026 · 15–30 jun`. Zo weet je op elk scherm meteen welke
reis actief is en hoe lang die duurt.

- CSS: `.trip-id-strip` (css/styles.css).
- JS: `updateTripIdentityStrips()` + `formatTripDateRange()` (js/state.js) —
  vult alle strips in één keer (ze staan allemaal in de DOM). Aangeroepen
  vanuit `applyTripData()` (reis geladen/gewisseld), `renderHomeScreen()`,
  en `saveTripEdit()` (naam/datum gewijzigd).
- De bestaande dikke koppen op Vandaag/Meer/Planning zijn dunner gemaakt.

## Vandaag-scherm

- **Coördinaten-regel weg**, kop dunner (reisnaam-titel verdween — die staat
  nu in de strip; de dag-regel "Dag X · datum" blijft).
- **Huidig verblijf** compacter (hoogte 188→132px, kleinere titel).
- **Roadtrip-modus-knop** hierheen verplaatst vanuit Meer (compacte knop).
- Nieuw **snelacties-raster** (`.quick-grid`/`.quick-tile`, 2×2):
  - 🧭 Route → verblijf (`routeToCurrentAccommodation`)
  - 🧭 Route → activiteit van vandaag/eerstvolgende (`routeToTodayActivity`)
  - 🍽️ Eten & café nabij (`nearbyFoodForCurrentAccommodation`)
  - ⚡ Laadstation nabij (`openChargingStationsSheet`)
  - Sublabels tonen de concrete bestemming (verblijfnaam / activiteitnaam).
- **"+ Activiteit toevoegen" weg** (doe je op Planning) — de lege-dag-kaart
  verwijst nu naar Planning i.p.v. een toevoeg-knop.
- Ongebruikte, verborgen `stat-strip` (te doen/gedaan/tickets/laders)
  opgeruimd.

## Accommodatie-scherm

- **Reisgids** verhuisd van de onderste lijst naar de bovenste actierij,
  tussen Kaart en Weer: `Route · Kaart · Reisgids · Weer · Bel · Bewerk`.
- **⚡ Laden nabij**-knop toegevoegd bij de nabij-knoppen, met de coördinaten
  van het bekeken verblijf (i.p.v. altijd het actieve).

## Planning-scherm

- **▲ Verblijf-knop** in de kop (`goToAccommodationFromPlanning`) — opent het
  verblijf van de geselecteerde dag (Thuis/onderweg → actief verblijf).

## Activiteit-detail

- **⚡ Laden nabij**-knop toegevoegd (`openChargingStationsSheet(lat,lng,naam)`)
  — zo werkt laadstation-zoeken nu ook per activiteit, naast eten/café.

## Charging

- `openChargingStationsSheet()` neemt nu optioneel `lat, lng, label` — zonder
  argumenten rond het actieve verblijf (ongewijzigd gedrag voor Vandaag/Meer),
  mét argumenten rond een specifieke plek (verblijf/activiteit).

## Meer-tab herindeling

- **Roadtrip-hero weg** (verplaatst naar Vandaag).
- Sectie "Mijn route" nieuwe volgorde: **Mijn reizen → Accommodaties → Tickets**.
- **"Deel reislink" weg** uit Meer → verhuisd naar **Instellingen** (sectie
  Delen), naast "Deel-links beheren".
- Sectie "Onderweg": **Kaart-rij weg** (Kaart zit al in de onderbalk).
  Blijven: AI-ideeën, Laadstations.

## Deel-links — antwoord op de vraag "kan ik verschillende links met
verschillende functie delen?"

Ja. Er zijn twee mechanismen, nu beide onder Instellingen → Delen:

1. **Deel reislink** (`copyTripShareUrl`): simpele `?trip=…`-link, geen
   rechten, voor reisgenoten die dezelfde data zien/bewerken.
2. **Deel-links beheren** (`openShareLinksSheet`, PIN-gated): maak zoveel
   links als je wilt, elk met een eigen **recht** (alleen bekijken /
   bekijken+bewerken) en **bereik** (één specifieke reis / alle reizen) en
   optioneel label. Los in te trekken/heractiveren. Server-side afgedwongen
   via api/share.js (zie docs/10-issues/07).

## Overig

- `sw.js`: `CACHE_VERSION` v26 → v27.
- Browsertab-titel volgt de reis ook bij bewerken (`saveTripEdit`).
- Verwijderde, niet langer gerefereerde element-ID's: `home-trip-name`,
  `home-coord`, `stat-todo`, `stat-done` (gecontroleerd op verweesde refs).
