# MVP Roadmap

**Document ID:** TC-ROAD-001
**Version:** 4.0
**Status:** Web prototype volledig · Flutter in ontwikkeling
**Last Updated:** 2026-06-29

---

## Versiehistorie prototype

| Versie | Datum | Wat |
|---|---|---|
| v1 | 2026-06-28 | Eerste HTML prototype — navigatie, echte data |
| v2 | 2026-06-29 | Fjord Cartography — React, Fraunces serif, topo animaties |
| v3 | 2026-06-29 | **Topografisk** — GPS tracker, acc-switcher, alle state werkend |

**Live:** https://travel-cockpit-virid.vercel.app/

---

## Huidige staat (v3 — Topografisk)

### ✅ Volledig werkend

**Data**
- Alle 19 activiteiten met echte coördinaten, hoogtes, datums
- 4 verblijven met adressen, check-in/out tijden, notities
- Dag-nummering D1–D16 (15–30 jun) door de hele app
- Accommodatie automatisch bepaald op basis van datum

**Kaart**
- Volledige route Nijmegen → Hirtshals → Stavanger → Bergen → NO-stops → Kristiansand → Hirtshals → Kolding → Nijmegen
- Rijden = groene lijn, ferry = blauwe stippellijn — altijd zichtbaar
- GPS locatie tracker — aan/uit knop, route wordt getekend
- Activiteiten als summit-driehoeken met dag-labels (D4-1, D8-2)
- Accommodatie-pins altijd groot, huidige gemarkeerd met oranje stip
- Filter per verblijf (Sgd/Skj/Val/Gjr)

**Planning**
- D1–D16 dagtabs met datum, maand, accommodatie-kleur
- Per dag: geplande activiteiten + beschikbare (niet ingepland)
- Afvinken werkt — state gedeeld door heel de app
- Vanuit Discover toevoegen → verschijnt in Planning

**Accommodaties**
- Switcher: tik op Sgd/Skj/Val/Gjr om te wisselen
- Actief verblijf gemarkeerd (oranje stipje)
- Per verblijf: adres, datums, hoogte, coördinaat, notities

**Roadtrip-modus**
- GPS aan/uit
- Huidig verblijf en volgend verblijf correct op datum
- Eerste onafgevinkte activiteit als "Volgende etappe"
- Afvinken werkt

**Design — Topografisk**
- Geen AI-design-default (geen warm cream + serif + terracotta)
- Referentie: Noorse N50 topografische kaart (Statens Kartverk)
- Archivo Condensed voor labels, Space Mono voor data/coördinaten
- Summit-driehoeken als signature element (icoon + kaart + planning)
- UTM-rasterpatroon als achtergrond op dataschermen
- Hoogte-annotaties (1100m, 1743m) als echte data, niet decoratie
- App-icoon: topografische bergtop met contourlijnen

**iOS installatie**
- `apple-mobile-web-app-capable` + `apple-touch-icon` ingesteld
- Safari → Deel → Zet op beginscherm → opent fullscreen

---

## Nog te doen

### Web prototype
| Item | Status |
|---|---|
| Charging live API | ❌ 4 hardcoded stations |
| Ticket DB | ❌ In-memory (verloren bij herstart) |
| Activiteit-detail scherm | ❌ Niet gebouwd |

### Flutter native
| Item | Status |
|---|---|
| Build runner (.freezed/.g) | ❌ Vereist Mac |
| Compileren naar IPA | ❌ Vereist Mac + Xcode |
| Supabase cloud database | ❌ Gepland, niet gestart |
| TestFlight deploy | ❌ Vereist Apple Developer account |

---

## Succescriteria MVP

De web-prototype voldoet aan alle functionele criteria:

1. ✅ Traveller opent app tijdens de reis en ziet echte planning
2. ✅ Accommodatie wisselt automatisch op basis van datum
3. ✅ Route volledig zichtbaar op kaart incl. ferry
4. ✅ GPS positie zichtbaar op kaart
5. ✅ Activiteiten afvinken werkt en blijft in session
6. ✅ App installeerbaar op iPhone beginscherm
7. ✅ Werkt offline (na eerste load)
