# MVP

**Document ID:** TC-ROAD-001
**Version:** 1.0
**Status:** Draft
**Owner:** Product Team
**Last Updated:** 2025-06-27

---

# Purpose

This document defines the minimum viable product for Travel Cockpit version 1.0.

The MVP is the smallest version of the application that delivers real value to a traveller on the road.

Every feature in this document must justify its inclusion against the Product Blueprint design rule:

> Does this make travelling easier while being on the road?

---

# MVP Philosophy

The MVP does not aim to be feature-complete.

It aims to be useful during one real trip.

A traveller with a real trip should be able to use Travel Cockpit as their primary travel companion for the full duration of that trip.

---

# Included in MVP

## Trips

- Create a trip with a name, country and date range.
- Set one trip as active.
- Switch between trips.
- Only one trip can be active at a time.

## Accommodations

- Add accommodations to a trip.
- Set check-in and check-out dates.
- One accommodation is automatically active based on today's date.
- View accommodation details: name, location, dates, contact info.
- Link activities and nearby places to the active accommodation.

## Activities

- Add activities manually to a trip.
- Assign an activity to a date.
- Add name, category, location, distance and notes.
- Mark activity as completed.
- Reorder activities manually.
- Remove activities from planning.

## Planning

- View today's planned activities.
- View upcoming planned activities by day.
- Planning only contains confirmed decisions.
- AI suggestions are not in planning until the traveller confirms them.

## Map

- Show all planned activities on a map.
- Show all accommodations on the route.
- Filter by category: activities, restaurants, energy, cafés.
- Tap a pin to view place details.
- Launch Google Maps from any place.
- Route line between accommodations.

## Discover (AI Ideas)

- Ask AI for activity suggestions based on current location, weather and user preferences.
- Filter suggestions by category: activities, restaurants, cafés, rain alternatives.
- Add a suggestion to planning with one tap.
- AI never adds suggestions automatically.

## Energy Points

- View nearby charging stations and fuel stations.
- Filter by connector type and minimum power.
- View live availability per station.
- Launch navigation to a station with one tap.
- Find stations along the route.

## Tickets

- Add a ticket manually to a trip.
- Store ticket name, date, time and number of persons.
- Display a barcode or QR code.
- Tickets are available offline.
- Mark a ticket as used.

## Roadtrip Mode

- Show distance to next accommodation.
- Show estimated arrival time.
- Show first stop on today's route.
- Show nearest charging station along the route.
- Show weather forecast for the route.
- Launch navigation with one tap.

## User Preferences

- Set travel preferences: nature, walking, culture, cafés, photography etc.
- Set vehicle type: EV or fuel.
- Set EV charging networks and minimum power.
- Preferences are saved and used by AI suggestions.

## Offline Support

- All trip data available without internet.
- Maps downloadable per country.
- Tickets available offline.
- AI suggestions require internet.
- App notifies user when offline.

---

# Not Included in MVP

These features are deliberately excluded from version 1.0.

- Shared trips and collaboration.
- Social features.
- Booking accommodations.
- Reviews.
- Cost tracking.
- Navigation engine.
- Automatic planning by AI.
- Gamification.
- Chat.

---

# MVP Success Criteria

The MVP is successful when:

1. A traveller can create a real trip and use the app for its full duration.
2. The traveller opens Travel Cockpit before opening Google Maps, Booking or any other travel app.
3. The traveller adds at least three activities to planning during the trip.
4. The traveller uses AI suggestions at least once.
5. The app works offline at a location with no internet.

---

# MVP Screens

| Screen | Status |
|---|---|
| Vandaag (Dashboard) | Required |
| Kaart (Map) | Required |
| Planning | Required |
| Ideeën (AI Discover) | Required |
| Activiteit Detail | Required |
| Accommodatie Detail | Required |
| Accommodaties Overzicht | Required |
| Laadstations | Required |
| Tickets | Required |
| Roadtrip-modus | Required |
| Mijn Reizen | Required |
| Profiel & Voorkeuren | Required |
| Instellingen | Required |

---

# Build Order

Build in this sequence. Each phase must work fully before the next begins.

## Phase 1 — Data Foundation

1. Trip model: create, read, update, delete.
2. Accommodation model linked to trip.
3. Activity / Place model linked to trip.
4. Local database with offline-first storage.
5. Active trip and active accommodation logic.

## Phase 2 — Core Screens

1. Dashboard showing active trip, accommodation and today's planning.
2. Planning screen with day tabs and activity list.
3. Activity detail screen with Google Maps integration.
4. Accommodations overview and detail.

## Phase 3 — Map

1. Map screen with pins for activities and accommodations.
2. Route line between accommodations.
3. Category filters.
4. Place detail sheet on pin tap.

## Phase 4 — Discover & AI

1. AI suggestion screen with category filters.
2. Add suggestion to planning with one tap.
3. User preferences saved and sent to AI.

## Phase 5 — Energy & Tickets

1. Charging station list with live availability.
2. Filter by connector and power.
3. Ticket storage with barcode display.
4. Offline ticket access.

## Phase 6 — Roadtrip Mode

1. Distance and ETA to next accommodation.
2. First stop display.
3. Nearest charger along route.
4. Weather strip.
5. One-tap navigation launch.

## Phase 7 — Offline & Polish

1. Map download per country.
2. Offline indicator in UI.
3. Sync status display.
4. Performance optimisation.
5. Edge cases: no trip, no accommodation, no internet.

---

# Change History

| Version | Date | Change |
|---|---|---|
| 1.0 | 2025-06-27 | Initial draft |
