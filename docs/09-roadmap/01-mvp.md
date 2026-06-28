# MVP

**Document ID:** TC-ROAD-001
**Version:** 2.0
**Status:** In Progress
**Last Updated:** 2026-06-28

---

# MVP Status

| Phase | Status |
|---|---|
| Phase AI — AI Integration | ✅ Complete |
| Phase 1 — Data Foundation | ✅ Complete |
| Phase 2 — Core Screens | ✅ Complete |
| Phase 3 — Map | ✅ Complete |
| Phase 4 — Discover & AI | ✅ Complete |
| Phase 5 — Energy & Tickets | 🟡 Partial — UI only |
| Phase 6 — Roadtrip Mode | ❌ Not started |
| Phase 7 — Offline & Polish | 🟡 Partial |

---

# What Works Now

## Trips
- Create trip with name, country (10 options), date range.
- Set one trip as active.
- Switch between trips.
- Delete trip with confirmation.
- Noorwegen 2026 seed data loaded on first launch.

## Accommodations
- 4 accommodations from Norway 2026 seed data.
- Active accommodation determined by today's date automatically (DL-005).
- Accommodation detail: name, address, check-in/out times, confirmation, contact with call button.
- All trip stops shown in sequence with active badge.
- Hero with topographic texture, live weather badge.

## Activities
- 19 activities from Norway 2026 seed data with real coordinates.
- Activity detail: description, notes, category, add/remove from planning, mark done.
- Google Maps navigation from activity detail.
- Komoot link from activity detail.

## Planning
- Scrollable day tab bar from trip start to end dates.
- Today's planning on dashboard with real place names.
- All planning items with swipe-to-delete and checkmark.
- Unscheduled items shown separately.

## Map
- Real OpenStreetMap tiles via flutter_map.
- All trip places as pins from database.
- Category filter chips.
- Real Norway 2026 route line.
- Real stop strip with 4 stays, dates, addresses.
- Tap pin to see details and navigate.

## AI Discover
- Claude claude-sonnet-4-6 via Anthropic API.
- Real weather context from Open-Meteo.
- Real already-planned list sent to AI (no duplicates).
- Real user preferences from PreferencesProvider.
- 24-hour cache per region.
- Offline: shows cached suggestions.
- Category filters: alles, activiteit, restaurant, café, regen.
- Load more: 5 additional suggestions.
- Add to planning: creates Place + PlanningItem in DB.

## Meer Menu
- Full navigation to all screens.
- Norway 2026 route info, travel tips from original reisplanning.
- Roadtrip quick card.

## Offline
- Offline banner when no internet (DL-010).
- All trip data from local SQLite.
- AI suggestions cached 24h.
- Weather cached 1h.

---

# What is Still Needed for MVP

## Priority 1 — Roadtrip Mode (DL-001: roadtrip-first)

Screen that shows:
- Distance and ETA to next accommodation.
- Today's first planned activity.
- Nearest charging station along route.
- Weather for current location.
- One-tap navigation launch.

## Priority 2 — Tickets (functional)

The ticket model exists. The screen shows demo data.
Needs: add ticket form, link to Klimapark 2469 ticket from seed, barcode scan.

## Priority 3 — Activity detail — walk fields

Description contains walk info as free text (km, level, duration).
Needs: structured fields shown as chips.

## Priority 4 — Map — add to planning with date

Currently adds without asking for a date.
Needs: date picker in the map place sheet.

## Priority 5 — Charging live data

Currently 4 hardcoded stations near Skjåk.
Needs: Open Charge Map API or OCPI integration.

---

# Build Order — Remaining

## Phase 6 — Roadtrip Mode

1. Distance calculation to next accommodation.
2. ETA display.
3. Weather strip for route.
4. Next planned activity display.
5. Nearest charger along route.
6. One-tap navigation to next stop.

## Phase 7 — Polish & Offline

1. Map tile download per country.
2. Offline status display (last synced time).
3. Edge cases: no trip, trip ended, no accommodations.
4. Performance: large planning lists.
5. Error states: all screens must handle errors gracefully.

---

# MVP Success Criteria

The MVP is successful when:

1. A traveller can load the app during the Norway 2026 trip and see their real planning.
2. The AI suggests relevant activities based on current location and weather.
3. The app works fully offline in a Norwegian mountain valley.
4. The traveller opens Travel Cockpit instead of Google Maps for the route overview.
5. A new trip can be created and used within 2 minutes.

---

# Change History

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-06-10 | Initial MVP spec |
| 2.0 | 2026-06-28 | Updated with current build status, phases 1-5 complete |
