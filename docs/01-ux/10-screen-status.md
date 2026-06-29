# Screen Status

**Document ID:** TC-UX-010
**Version:** 5.0
**Status:** Living document
**Last Updated:** 2026-06-29

---

## Samenvatting

| Scherm | Route | Status | Echt data |
|---|---|---|---|
| HomeScreen | `/` | ✅ Volledig werkend | Ja |
| PlanningScreen | `/planning` | ✅ Volledig werkend | Ja — dag-nummers, acc-kleuren, afvinken werkt |
| MapScreen | `/map` | ✅ Volledig werkend | Ja — GPS tracker, route altijd zichtbaar |
| DiscoverScreen | `/discover` | ✅ Werkend | Ja — toevoegen aan planning werkt echt |
| AccommodationScreen | `/accommodation` | ✅ Volledig werkend | Ja — switcher op datum, alle 4 verblijven |
| RoadtripScreen | `/roadtrip` | ✅ Werkend | Ja — GPS, live positie |
| MeerScreen | `/meer` | ✅ Werkend | Ja — volledige navigatie |
| TicketsScreen | `/tickets` | ✅ Werkend | + knop functioneel |
| SettingsScreen | `/settings` | ✅ Werkend | Voorkeuren, AI toggle |

---

## Detail per scherm

### HomeScreen
- Verblijf bepaald via `activeAcc()` op basis van datum — niet hardcoded
- Dag-nummer correct (D1 = 15 jun, D16 = 30 jun)
- Activiteiten voor vandaag geladen vanuit gedeelde state
- Afvinken werkt — status wijzigt in state
- Progress bar toont per accommodatie

### MapScreen
- Volledige route altijd zichtbaar (rijden + ferry) — ook bij filtering
- GPS tracker via `navigator.geolocation.watchPosition`
- Knop bovenaan: 📍 GPS starten/stoppen
- Route wordt als oranje lijn getekend op de kaart
- Filter chips per accommodatie (Sgd/Skj/Val/Gjr)
- Connector-lijnen van verblijf naar activiteiten
- Activiteiten als summit-driehoeken met D-dag-label
- Accommodatie-pins altijd groot en zichtbaar, huidige gemarkeerd

### PlanningScreen
- Dag-tabs D1–D16 met datum, maand, accommodatie-kleur
- Selectie scrollt naar vandaag bij openen
- Dag-header: dag-nummer, datum, "vanuit [naam]", hoogte
- Items afvinken werkt (status done/planned)
- Niet-ingeplande activiteiten van huidig verblijf tonen als "beschikbaar"
- Swipe-to-delete zichtbaar in UI

### AccommodationScreen (nieuw in v3)
- Switcher bovenaan: 4 chips — tik om ander verblijf te bekijken
- Actief verblijf (op basis van datum) heeft oranje stipje
- Per verblijf: naam, adres, check-in/out, nachten, hoogte, coördinaat
- Notities per verblijf (bases voor activiteiten)
- Route-overzicht onderaan: alle 4 verblijven als klikbare lijst

### RoadtripScreen
- GPS aan/uit knop in de header
- Live coördinaten tonen als GPS actief
- Huidige verblijf op basis van datum
- Volgend verblijf correct berekend
- Eerste onafgevinkte activiteit van vandaag als "Volgende etappe"
- Afvinken werkt vanuit roadtrip-scherm

### DiscoverScreen
- "Toevoegen" voegt echt een activiteit toe aan de gedeelde state
- Verschijnt dan in Planning
- Toegevoegde items krijgen groene "✓ Gepland" badge

---

## Openstaand

| Item | Prioriteit |
|---|---|
| Charging live API (nu 4 hardcoded) | Medium |
| Tickets → Drift DB (nu in-memory) | Medium |
| Activiteit-detail scherm | Laag |
| Profiel / Meldingen schermen | Laag |
| Flutter native compileren (vereist Mac) | Wanneer hardware beschikbaar |

---

## Changelog

| Versie | Datum | Wijziging |
|---|---|---|
| 1.0 | 2026-06-10 | Initieel |
| 2.0 | 2026-06-28 | Volledige audit |
| 3.0 | 2026-06-28 | Bugfix-ronde |
| 4.0 | 2026-06-28 | RoadtripScreen + SettingsScreen gebouwd |
| 5.0 | 2026-06-29 | v3 Topografisk — GPS tracker, acc-switcher, alle state werkt |
