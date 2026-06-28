# Screen Status

**Document ID:** TC-UX-010
**Version:** 3.0
**Status:** Living document
**Last Updated:** 2026-06-28

---

# Quick Status

| Screen | Status | Real data |
|---|---|---|
| HomeScreen `/` | ✅ Werkend | Ja — offline banner, hero, stats, planning, nearby (echt) |
| PlanningScreen `/planning` | ✅ Werkend | Ja — dag-nummers, accommodatie-kleuren |
| MapScreen `/map` | ✅ Werkend | Ja — volledige route, dag-labels, kleur per verblijf |
| DiscoverScreen `/discover` | ✅ Werkend | Ja — echt weer, echte planning-context |
| AccommodationScreen `/accommodation` | ✅ Werkend | Ja — alle velden uit DB |
| ActivityDetailScreen `/place/:id` | ✅ Werkend | Ja |
| TripsScreen `/trips` | ✅ Werkend | Ja |
| MeerScreen `/meer` | ✅ Werkend | Ja — volledige navigatie |
| TicketsScreen `/tickets` | 🟡 UI only | Nee — demo tickets |
| ChargingScreen `/charging` | 🟡 UI only | Nee — 4 statische stations |
| RoadtripScreen `/roadtrip` | 🚧 Placeholder | — |
| Settings/Profile/Notifications | 🚧 Placeholder | — |

---

# Detail per scherm

## HomeScreen — ✅ volledig echt
- Offline banner (DL-010) bovenaan, verschijnt bij geen internet.
- Trip header met vlag, datums, dagen-teller, meldingen-badge.
- Hero accommodatie: echte naam, adres, datums, live weer. **Provider leak gefixt** — providers nu top-level.
- Stats row: te-doen/gedaan echt uit DB, tickets uit seed, laders.
- Planning sectie: echte plaatsnamen via `placeByIdProvider`.
- Nearby strip: **echte categorie-tellingen** uit DB (was hardcoded, nu gefixt).
- AI card: echt weer + trip naam.

## PlanningScreen — ✅ dag-nummering + accommodatie-kleur
- Dag-tabs: `D1`–`D16`, gekleurd per verblijf, accommodatie-stip, legenda-strip.
- Dag-header: `Dag 4 · woensdag 18 jun · vanuit Sogndal`, vandaag-badge.
- Items: gekleurde band links per accommodatie, gekleurd index-badge, swipe-delete, afvinken.

## MapScreen — ✅ volledige route + dag-labels
- Volledige route Nijmegen → Hirtshals → Stavanger → Bergen → 4 verblijven → Kristiansand → Hirtshals → Kolding → Nijmegen.
- Rijden = groene lijn, ferry = blauwe stippellijn.
- Accommodaties = grote pins met naam-label (Sgd/Skj/Val/Gjr).
- Activiteiten = gekleurd per verblijf, dag-label `D4-2`.
- Dunne lijnen verbinden verblijf met zijn activiteiten.
- Filter per verblijf (chips + tik op pin).
- 🌍/🇳🇴 toggle voor heel Europa of alleen Noorwegen.
- Legenda onderaan.

## DiscoverScreen — ✅ echte AI-context
- **Echt weer** van WeatherProvider (was hardcoded 18°C, gefixt).
- **Echte al-geplande lijst** naar AI gestuurd zodat geen duplicaten (was leeg, gefixt).
- Echte voorkeuren uit PreferencesProvider.
- `EmptyState` widget **toegevoegd** (was 404, brak compile).
- Add-to-plan schrijft Place + PlanningItem naar DB.
- Load more, categorie-filters, offline-cache.

## AccommodationScreen — ✅ herbouwd
- Was 404 → volledig herbouwd.
- Hero met topografisch patroon, live weer.
- Check-in/out tijden, adres + Maps-knop, bellen, boekingsnummer, omschrijving.
- "Vanaf hier" navigatie, alle 4 stops met actief-badge.

---

# Change History

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-06-10 | Initial |
| 2.0 | 2026-06-28 | Full audit, real vs hardcoded |
| 3.0 | 2026-06-28 | Na bugfix-ronde: nearby echt, hero leak gefixt, empty_state toegevoegd, dag-nummering + route compleet |
