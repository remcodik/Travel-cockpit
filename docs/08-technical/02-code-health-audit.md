# Code Health Audit

**Document ID:** TC-TECH-002
**Version:** 2.0
**Last Updated:** 2026-06-29

---

## Samenvatting

| Pass | Datum | Bugs gevonden | Bugs opgelost |
|---|---|---|---|
| Pass 1 | 2026-06-28 | 6 | 6 |
| Pass 2 | 2026-06-29 | Architectuurproblemen | Herontwerp |

---

## Pass 1 — 2026-06-28

Bugs gevonden en opgelost in de Flutter-codebase:

| # | Bestand | Probleem | Fix |
|---|---|---|---|
| 1 | `ai_context.dart` | `\$`-escape artifacts in string interpolatie | Herschreven |
| 2 | `empty_state.dart` | Bestand bestond niet (404) — compile-fout | Aangemaakt |
| 3 | `hero_accommodation_card.dart` | StreamProvider binnen `build()` — memory leak | Top-level providers |
| 4 | `nearby_strip.dart` | Alle tellingen hardcoded | Echt DB via `getByCategory` |
| 5 | `place_provider.dart` | `allPlacesProvider` dode code | Werkend gemaakt |
| 6 | `ai_provider.dart` | `_globalPrefs!` stille null-crash | Assert met duidelijke melding |

---

## Pass 2 — 2026-06-29

### Probleem: web prototype werkte niet als echte app

De v1 en v2 HTML prototype hadden:
- Hardcoded accommodatie (altijd Skjåk — klopt niet op datum)
- State niet gedeeld tussen schermen
- Knoppen die `showToast` aanriepen maar niets deden
- Geen GPS functionaliteit
- Viewport niet correct voor iPhone

### Oplossingen in v3 (Topografisk)

**Data laag:**
- `activeAcc()` berekent huidig verblijf op `TODAY` — niet hardcoded
- Gedeelde `acts` state via React hooks, doorgegeven via props
- Toevoegen vanuit Discover → verschijnt in Planning (echte state-update)
- `TODAY` ingesteld op huidige datum als binnen de trip, anders D8 als demo

**Kaart:**
- Route altijd zichtbaar (groen + blauw) — ook bij acc-filter
- `navigator.geolocation.watchPosition` voor GPS tracking
- Route wordt als polyline op kaart getekend (max 200 punten)

**Accommodatie-switcher:**
- `viewAcc` state los van `activeAcc()` — bekijken en actief zijn zijn gescheiden
- Chips bovenaan: tik om ander verblijf te bekijken
- Huidige verblijf gemarkeerd met oranje stip

**iOS:**
- `viewport-fit=cover` + `maximum-scale=1.0` — geen onbedoeld zoomen
- `apple-mobile-web-app-capable` — fullscreen bij installatie
- `apple-touch-icon` — topografisch icoon op beginscherm

---

## Design audit — v3

Gecontroleerd tegen `frontend-design` skill:

| Check | Resultaat |
|---|---|
| Geen AI-default (warm cream + serif + terracotta) | ✅ — Topografisk is anders |
| Signature element uniek voor het product | ✅ — summit-driehoeken als navigatiemarkers |
| Typografie bewust gekozen | ✅ — Archivo Condensed (kaartlabels) + Space Mono (data) |
| Copy functioneel, geen marketing | ✅ — "D4·1 · 1100m · 7 km" niet "Ontdek de mooiste wandeling" |
| Boldness op één plek | ✅ — oranje summit-accent, verder terughoudend |

---

## Bekende openstaande items

| Item | Impact | Wanneer |
|---|---|---|
| Flutter build runner | Blokkeert native compile | Bij Mac beschikbaar |
| Charging live API | Lage prioriteit | Phase 3 |
| Ticket Drift-koppeling | State verloren bij herstart | Phase 3 |
| Supabase integratie | Vereist voor data-sync | Toekomst |
