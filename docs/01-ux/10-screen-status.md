# Screen Status

**Document ID:** TC-UX-010
**Version:** 4.0
**Status:** Living document
**Last Updated:** 2026-06-28

---

# Snelle status

| Scherm | Route | Status |
|---|---|---|
| HomeScreen | `/` | ✅ Volledig echt |
| PlanningScreen | `/planning` | ✅ Dag-nummers + acc-kleuren |
| MapScreen | `/map` | ✅ Volledige route + dag-labels |
| DiscoverScreen | `/discover` | ✅ Echte AI + weer + planning context |
| MeerScreen | `/meer` | ✅ Volledige navigatie |
| AccommodationScreen | `/accommodation` | ✅ Alle velden echt |
| ActivityDetailScreen | `/place/:id` | ✅ Echt |
| TripsScreen | `/trips` | ✅ Echt |
| **RoadtripScreen** | `/roadtrip` | ✅ **Nieuw — volledig gebouwd** |
| **SettingsScreen** | `/settings` | ✅ **Nieuw — voorkeuren echt** |
| TicketsScreen | `/tickets` | ✅ + knop werkend, barcode, seed |
| ChargingScreen | `/charging` | 🟡 UI, 4 statische stations |
| ProfileScreen | `/profile` | 🚧 Placeholder |
| NotificationsScreen | `/notifications` | 🚧 Placeholder |

---

# RoadtripScreen — nieuw gebouwd

Hoofdscherm voor gebruik onderweg (DL-001: roadtrip-first).

Bevat:
- **Weerstrip** — live temperatuur, conditie, regenkans, locatie. Gradient past op het weer.
- **Huidig verblijf** — naam, check-out datum en tijd, navigatieknop naar Google Maps. Volgende stop eronder.
- **Volgende activiteit** — eerste onafgevinkte activiteit van vandaag, naam, omschrijving, navigatieknop.
- **Voortgang** — progressiebalk: X/Y activiteiten afgerond, percentage.
- **Mini-kaart** — interactieve FlutterMap van het huidige gebied. Tik om volledig scherm te openen.
- **Snelknoppen** — Navigeer naar stop, Laadstation vinden, AI ideeën, Tankstation.
- **Vandaag-lijst** — alle geplande activiteiten van vandaag met checkmark en navigatieknop per item.

---

# SettingsScreen — nieuw gebouwd

Schrijft naar `PreferencesProvider` (persisted in `SharedPreferences`).

Bevat:
- **Voertuigtype** — EV / Benzine / Geen (3 opties, radio-select stijl).
- **Reisvoorkeur** — 8 stijlen als togglebare chips: Natuur, Wandelen, Fotografie, Eten, Cultuur, Geschiedenis, Water & fjord, Rust. Dit gaat direct naar de AI-context.
- **AI instellingen** — AI suggesties aan/uit, Weersuggesties aan/uit.
- **Taal** — Nederlands / Engels / Duits.
- **App info** — versie, kaartdata (OSM), weer (Open-Meteo), AI (Claude).

---

# TicketsScreen — verbeterd

- Barcode is nu uitklapbaar per ticket (tik om te tonen/verbergen).
- Werkende `+` knop opent een bottom sheet met: naam, locatie, boekingscode, datum, tijd, aantal personen.
- Klimapark 2469 seed-ticket aanwezig (status: gebruikt).
- Tickets verwijderbaar via uitgeklapte view.
- Lege state met call-to-action.

---

# Nog te bouwen

| Item | Reden |
|---|---|
| ProfileScreen | Naam, avatar, reishistorie |
| NotificationsScreen | Meldingen voor check-in, weer |
| ChargingScreen live API | Open Charge Map / OCPI |
| Map date picker bij toevoegen | Datum kiezen voor geplande activiteit |
| Ticket DB-tabel koppeling | Nu in-memory, moet naar Drift |

---

# Changelog

| Versie | Datum | Wijziging |
|---|---|---|
| 1.0 | 2026-06-10 | Initieel |
| 2.0 | 2026-06-28 | Volledige audit, echt vs hardcoded |
| 3.0 | 2026-06-28 | Bugfix-ronde, dag-nummering, route |
| 4.0 | 2026-06-28 | RoadtripScreen + SettingsScreen gebouwd, Tickets verbeterd |
