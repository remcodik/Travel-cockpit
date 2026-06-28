# Screen Status

**Document ID:** TC-UX-010
**Version:** 2.0
**Status:** Living document — updated after each build session
**Last Updated:** 2026-06-28

---

# Purpose

This document tracks the current build status of every screen, what is real vs hardcoded, and what still needs work.

---

# Screen Inventory

## HomeScreen `/`

**Status:** ✅ Functional — real data

| Element | Status | Notes |
|---|---|---|
| Trip header (name, flag, dates) | ✅ Real | From activeTripProvider |
| Hero accommodation card | ✅ Real | Name, address, dates from DB |
| Weather badge on hero | ✅ Real | Open-Meteo API |
| Stats row (todo/done/tickets) | ✅ Real | todo/done from planningProvider |
| Stats row (chargers) | 🟡 Static | Hardcoded 4 — no live API yet |
| Planning section (today) | ✅ Real | Real place names via placeByIdProvider |
| Nearby strip | 🟡 Static | Counts hardcoded — Phase 2 |
| AI card | ✅ Real | Real weather, trip name |
| Offline banner | ✅ Real | Shows when no internet (DL-010) |

---

## PlanningScreen `/planning`

**Status:** ✅ Functional — real data

| Element | Status | Notes |
|---|---|---|
| Day tab bar | ✅ Real | Scrollable, from trip dates |
| Today highlight | ✅ Real | |
| Planning items | ✅ Real | Real place names, emoji, description |
| Check off item | ✅ Real | Writes to DB |
| Swipe to delete | ✅ Real | Confirms before delete |
| Unscheduled items | ✅ Real | Shown separately |
| Add button → Discover | ✅ Real | |

---

## MapScreen `/map`

**Status:** ✅ Functional — real data

| Element | Status | Notes |
|---|---|---|
| OSM map tiles | ✅ Real | flutter_map + OpenStreetMap |
| Place pins | ✅ Real | From PlaceRepository via DB |
| Category filters | ✅ Real | Filter pins by type |
| Route line | ✅ Real | Real Norway 2026 coordinates |
| Route strip | ✅ Real | Real 4 stops, dates, addresses |
| Place sheet on tap | ✅ Real | Name, emoji, add + navigate |
| Navigate to place | ✅ Real | Opens Google Maps |
| Add to planning | 🟡 Partial | Saves but no date picker yet |

---

## DiscoverScreen `/discover` — AI Ideeën

**Status:** ✅ Functional — real AI

| Element | Status | Notes |
|---|---|---|
| AI header | ✅ Real | Live weather from WeatherProvider |
| Category filters | ✅ Real | 5 categories |
| Suggestions from Claude | ✅ Real | Anthropic claude-sonnet-4-6 |
| Already planned context | ✅ Real | Sends current planning to AI |
| Add to planning | ✅ Real | Creates Place + PlanningItem in DB |
| Load more | ✅ Real | Fetches 5 more, avoids duplicates |
| Offline state | ✅ Real | Shows cached suggestions |
| Detail sheet | ✅ Real | Description, why recommended, nav |

---

## AccommodationScreen `/accommodation`

**Status:** ✅ Functional — real data

| Element | Status | Notes |
|---|---|---|
| Hero with topo texture | ✅ Real | Name, address, dates from DB |
| Weather badge | ✅ Real | Open-Meteo |
| Back navigation | ✅ Real | |
| Check-in/out times | ✅ Real | From DB, fallback to 15:00/11:00 |
| Address with Maps link | ✅ Real | Opens Google Maps |
| Contact/phone with call | ✅ Real | |
| Booking number | ✅ Real | |
| Description/tips | ✅ Real | From place.description |
| From here section | ✅ Real | Links to all relevant screens |
| All stops on trip | ✅ Real | Real Norway 2026 stop labels |

---

## ActivityDetailScreen `/place/:id`

**Status:** ✅ Functional — real data

| Element | Status | Notes |
|---|---|---|
| Hero with emoji | ✅ Real | Category emoji, gradient |
| Place name | ✅ Real | From DB |
| Category label | ✅ Real | |
| Description | ✅ Real | From DB |
| In planning badge | ✅ Real | Checks allPlanningProvider |
| Add to planning | ✅ Real | Writes to DB |
| Remove from planning | ✅ Real | |
| Mark as done | ✅ Real | Toggle completed/planned |
| Route to Google Maps | ✅ Real | Coordinates from DB |
| Komoot link | ✅ Real | |
| Notes | ✅ Real | From place.notes |
| Walk info (km, level) | 🟡 Partial | In description text, not structured yet |
| Photos | ❌ Not built | Phase 3 |

---

## TripsScreen `/trips`

**Status:** ✅ Functional — real data

| Element | Status | Notes |
|---|---|---|
| Active trip | ✅ Real | |
| Previous trips | ✅ Real | |
| Create trip sheet | ✅ Real | Name, country (10), dates |
| Set active | ✅ Real | Deactivates others |
| Delete trip | ✅ Real | With confirmation |
| Country selector | 🟡 Limited | 10 countries only |

---

## TicketsScreen `/tickets`

**Status:** 🟡 UI only — not connected to DB

| Element | Status | Notes |
|---|---|---|
| Ticket cards | 🟡 Hardcoded | 2 demo tickets |
| Barcode display | ✅ Visual | Generated from code string |
| Valid/used badge | ✅ Visual | |
| Add ticket (+) | ❌ Not functional | No sheet yet |
| Real ticket model | ❌ Not built | Ticket table exists, not wired |

---

## ChargingScreen `/charging`

**Status:** 🟡 UI only — static data

| Element | Status | Notes |
|---|---|---|
| DC/AC toggle | ✅ Visual | Not functional yet |
| Station list | 🟡 Hardcoded | 4 demo stations near Skjåk |
| Availability badges | 🟡 Static | Not live |
| Navigate | ✅ Real | Opens Google Maps |
| Filter button | ❌ Not functional | |
| Real API | ❌ Not built | Phase 3 — OCPI/PlugShare |

---

## MeerScreen `/meer`

**Status:** ✅ Functional — navigation works

| Element | Status | Notes |
|---|---|---|
| Roadtrip card | ✅ Real | Weather, trip name |
| All navigation links | ✅ Real | All screens accessible |
| Norway 2026 info | ✅ Real | Real data from index.html |
| Travel tips | ✅ Real | From original reisplanning |
| Settings link | ✅ Links | Target is placeholder |
| Profile link | ✅ Links | Target is placeholder |

---

## Placeholder screens

| Screen | Status |
|---|---|
| RoadtripScreen `/roadtrip` | 🚧 Placeholder — high priority |
| SettingsScreen `/settings` | 🚧 Placeholder |
| ProfileScreen `/profile` | 🚧 Placeholder |
| NotificationsScreen `/notifications` | 🚧 Placeholder |

---

# Priority Queue

| # | What | Why |
|---|---|---|
| 1 | Roadtrip-modus scherm | DL-001: roadtrip-first. Core feature. |
| 2 | Tickets + knop werkend | Klimapark ticket uit reisdata |
| 3 | Activity detail — walk fields | Afstand/duur/niveau als chips |
| 4 | Charging live API | OCPI of PlugShare integratie |
| 5 | Country selector uitbreiden | Meer dan 10 landen |

---

# Change History

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-06-10 | Initial screen list |
| 2.0 | 2026-06-28 | Full audit, real vs hardcoded, all screens documented |
