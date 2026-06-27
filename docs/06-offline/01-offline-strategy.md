# Offline Strategy

**Document ID:** TC-OFF-001
**Version:** 1.0
**Status:** Stable
**Owner:** Product Team
**Last Updated:** 2025-06-27

---

# Purpose

This document defines how Travel Cockpit works without internet.

Offline capability is a core design requirement, not an optional feature (DL-010).

A traveller in a Norwegian fjord, Alpine valley or rural France must be able to use the app fully.

---

# Core Principle

> The app must never fail the traveller because of a missing internet connection.

Everything that matters during a trip must work offline:

- Active trip data.
- Accommodations and check-in details.
- Today's planning.
- Tickets and barcodes.
- Maps.
- Roadtrip mode.

---

# What Works Offline

| Feature | Offline Available | Notes |
|---|---|---|
| Dashboard | ✅ Yes | All local data |
| Today's planning | ✅ Yes | |
| Activity details | ✅ Yes | |
| Accommodation details | ✅ Yes | Including contact info |
| Map display | ✅ Yes | If tiles downloaded |
| Map pins | ✅ Yes | All planned places |
| Tickets with barcode | ✅ Yes | Always stored locally |
| Roadtrip mode | ✅ Yes | No live data, uses local |
| User preferences | ✅ Yes | |
| Trip list | ✅ Yes | |
| Cached AI suggestions | ✅ Yes | Up to 24 hours old |
| Weather (cached) | ✅ Yes | Last known, clearly labelled |
| Nearby places (cached) | ✅ Yes | Last known results |

---

# What Requires Internet

| Feature | Requires Internet | Notes |
|---|---|---|
| New AI suggestions | 🌐 Yes | Anthropic API call |
| Live EV availability | 🌐 Yes | External API |
| Weather update | 🌐 Yes | Open-Meteo API |
| Google Places search | 🌐 Yes | Phase 2 feature |
| Map tile download | 🌐 Yes | One-time per region |

---

# Offline Indicator

The app always shows the user whether it is online or offline.

Rules:

- A small "Offline" badge appears in the status area when there is no internet.
- The badge shows the last sync time: "Offline · Gesynchroniseerd om 09:30".
- Features that require internet show a clear message when tapped while offline.
- The message explains what is not available and why, without technical jargon.

Example offline messages:

- "AI-ideeën zijn niet beschikbaar zonder internet. Kijk de opgeslagen ideeën."
- "Live beschikbaarheid van laadpunten is niet beschikbaar. Bel het station direct."
- "Weer wordt bijgewerkt zodra je weer verbinding hebt."

---

# Map Tiles

Map tiles are downloaded per country before or during a trip.

## Download Flow

1. Traveller goes to Settings → Offline Maps.
2. App shows a list of countries in the active trip.
3. Traveller taps "Download" per country.
4. Tiles are downloaded at zoom levels 5–16 (road detail level).
5. Download size is shown before confirming: typically 200–600 MB per country.
6. Download can be paused and resumed.
7. Tiles are stored in the app's private storage.

## Tile Source

- OpenStreetMap tiles via flutter_map_tile_caching.
- Tiles are cached per region bounding box.
- Tiles expire after 90 days and are re-downloaded automatically when online.

## Fallback

If map tiles are not downloaded and the device is offline:

- The map shows a grey background with a "Kaart niet beschikbaar offline" message.
- All pins are still displayed based on stored coordinates.
- Navigation via Google Maps still works (Google Maps handles its own offline maps).

---

# Local Data Storage

All trip data is stored in a local SQLite database using Drift.

## What is Stored Locally

- All trips and their settings.
- All accommodations.
- All places and activities.
- All planning items.
- All tickets including barcode data.
- User preferences.
- Cached AI suggestions per trip (with timestamp).
- Cached weather per location (with timestamp).
- Offline sync log.

## Storage Location

- iOS: App's Documents directory (backed up by iCloud if enabled).
- Android: App's internal storage (not accessible to other apps).

## Data Size Estimates

| Data type | Estimated size |
|---|---|
| One trip with 3 accommodations and 30 activities | ~200 KB |
| Cached AI suggestions (10 per trip) | ~50 KB |
| Tickets with barcode (5 tickets) | ~100 KB |
| Map tiles per country | 200–600 MB |

---

# Synchronisation

In MVP there is no backend server. All data lives on the device.

Sync in MVP means:

- AI suggestions are fetched from the Anthropic API when online.
- Weather is fetched from Open-Meteo when online.
- EV availability is fetched from the provider API when online.
- All fetched data is cached locally immediately.

## Cache Expiry

| Data type | Cache duration |
|---|---|
| AI suggestions | 24 hours |
| Weather | 1 hour |
| EV availability | 15 minutes |
| Map tiles | 90 days |

When cache expires and the device is offline, the app shows the last cached value with a timestamp.

---

# Sync in Phase 2 (Post-MVP)

The following sync features are planned for after the MVP:

- Cloud backup of trip data.
- Shared trips between devices.
- Background sync when wifi is available.
- Conflict resolution for shared trips.

These are explicitly excluded from version 1.0 (DL-012).

---

# Testing Requirements

Before release, the following offline scenarios must be tested:

1. Open app for first time with no internet → app shows setup screen, not crash.
2. Start app online, turn off wifi mid-session → app continues without error.
3. Open tickets offline → barcode displays correctly.
4. Open planning offline → all items visible.
5. Open map offline with tiles downloaded → map displays correctly.
6. Open map offline without tiles → graceful fallback message.
7. Tap AI card offline → clear offline message shown.
8. Restore phone from backup → trip data intact.

---

# Change History

| Version | Date | Change |
|---|---|---|
| 1.0 | 2025-06-27 | Initial stable version |
