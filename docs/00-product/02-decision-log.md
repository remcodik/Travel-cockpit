# Decision Log

**Document ID:** TC-PROD-002
**Version:** 2.1
**Status:** Stable — updated as decisions are made
**Last Updated:** 2026-07-01

---

# Purpose

Every significant design or architecture decision is recorded here.

A decision log entry explains what was decided and why, so future developers and the product owner can understand the reasoning without needing to reconstruct it.

---

# Decisions

## DL-001 — Roadtrip First

**Decision:** Travel Cockpit is a roadtrip companion, not a trip planner.

The app is optimised for use while on the road, not for planning before departure.

Every feature is evaluated against the question: does this help someone who is currently driving or parked somewhere in Norway?

---

## DL-002 — Place is the Central Domain Object

**Decision:** Every physical location in the app is a `Place`.

Accommodations, activities, restaurants, cafés, charging stations — all are `Place` objects with a category. There is no separate `Activity` model or `Restaurant` model at the domain level.

This simplifies the database, removes duplication, and makes the map screen trivial: show all Places as pins.

---

## DL-003 — Accommodation Extends Place

**Decision:** `Accommodation` is a specialised extension of `Place`, not a separate location entity.

An accommodation has a `placeId` linking to its `Place`, plus check-in/out dates, times, confirmation number and contact details.

This means the map shows accommodation pins from the same Place table as activity pins.

---

## DL-004 — One Active Trip

**Decision:** Only one trip can be active at any time.

The active trip determines everything: which accommodation is shown, which planning items are loaded, which places appear on the map, what context the AI uses.

Switching trips is explicit and deliberate. It is not automatic.

---

## DL-005 — Active Accommodation by Date

**Decision:** The active accommodation is determined by today's date automatically.

The accommodation whose `checkInDate <= today < checkOutDate` is active. If no accommodation matches today, the nearest upcoming accommodation is shown.

The user does not manually set the active accommodation.

---

## DL-006 — Planning Contains Only Confirmed Decisions

**Decision:** The planning list only contains activities the traveller has explicitly confirmed they want to do.

AI suggestions are not in planning until the traveller taps "Toevoegen aan planning".

Browsing AI suggestions, viewing activity details, opening the map — none of these add anything to planning.

---

## DL-007 — Offline First

**Decision:** All trip data must be available without internet.

The app must work in Norwegian fjords, mountain passes and other areas with no coverage.

This means: local SQLite database (Drift), all trip data written locally first, map tiles downloadable per country, AI suggestions cached for 24 hours, tickets always stored locally.

---

## DL-008 — AI Never Acts Automatically

**Decision:** The AI never adds, changes or removes anything without explicit user action.

AI suggests. The user decides. Every AI suggestion requires one deliberate tap to act on.

This rule applies to planning, scheduling, and any future AI feature.

---

## DL-009 — Norway 2026 as Seed Data

**Decision:** The first real trip — Noorwegen Zomerreis 2026 — is used as seed data loaded on first app launch.

This gives the app real content immediately, makes testing realistic, and validates the data model against an actual trip.

Seed data: 4 accommodations, 19 activities, 11 planning items with real dates and statuses extracted from the original HTML travel planner (`index.html`).

---

## DL-010 — Offline Indicator

**Decision:** The app always shows when it is offline via a slim banner at the top of the screen.

The banner appears automatically via `ConnectivityProvider` and `OfflineBanner` widget. It states what still works and what requires internet.

---

## DL-011 — Weather via Open-Meteo

**Decision:** Weather data comes from the Open-Meteo API — free, no API key, no rate limits for reasonable usage.

Weather is fetched based on the active accommodation's coordinates. Cache: 1 hour. Shown in the hero card, AI card, and AI context.

---

## DL-012 — Regional Guide is Post-MVP

**Decision:** The Regional Guide feature (verhalende reisgidstekst per regio) is explicitly excluded from MVP.

The core loop (trip → accommodation → planning → AI) must work first. The guide enriches an existing experience; it does not create one.

See `docs/05-features/01-regional-guide.md` for the full spec.

---

## DL-013 — Meer Menu as Secondary Navigation

**Decision:** The fifth tab ("Meer") is a navigation hub, not a feature screen.

It contains: Accommodaties, Tickets, Reizen, Laadstations, Kaart, AI ideeën, Roadtrip-modus, Instellingen, Profiel.

The bottom nav tabs (Vandaag, Kaart, Planning, Ideeën) are the primary daily-use screens. Meer is for everything else.

---

## DL-014 — Web App First, Native Flutter App Deferred

**Decision:** Travel Cockpit ships as an installable mobile web app (Vercel + browser, "Add to Home Screen") as the primary, actively developed product. The native Flutter app described in `08-technical/01-flutter.md` is a deferred future target, not current work.

**Why:** Building and running a Flutter iOS app requires a Mac — Xcode only runs on macOS, and there is no Mac available. The only other machine available is a work-managed laptop on which installing development toolchains (Flutter SDK, Android Studio, etc.) is not permitted. Rather than block on hardware that isn't available, the choice was made to build a web app instead: no local toolchain needed, deployable and testable immediately, and it delivers a real, usable result now.

**Consequence:**
- `README.md` must describe the actual stack of the live app (plain HTML/CSS/JS + Leaflet + Firebase, no build step) rather than an aspirational one.
- `08-technical/01-flutter.md` remains valid as an architecture blueprint, but its status reflects "deferred, not started" rather than "stable/in progress" — no Flutter code exists in this repository.
- The native app remains the longer-term goal. When a Mac (or another suitable build environment, e.g. a cloud Mac build service) becomes available, `08-technical/01-flutter.md` is the starting point to resume that work.

**Status:** Open — revisit once a Mac or equivalent build environment is available.

---

# Change History

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-06-01 | Initial decisions DL-001 through DL-008 |
| 2.0 | 2026-06-28 | Added DL-009 through DL-013, full rewrites |
| 2.1 | 2026-07-01 | Added DL-014 — web app first, native app deferred due to lack of Mac / restricted work laptop |
