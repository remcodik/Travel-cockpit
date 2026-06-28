# Code Health Audit

**Document ID:** TC-TECH-002
**Version:** 1.0
**Status:** Living — updated each audit pass
**Last Updated:** 2026-06-28

---

# Purpose

This document records the result of full-codebase consistency checks: bugs found, fixes applied, and known remaining work. It is the record of "is everything actually wired up and working".

---

# Audit Pass — 2026-06-28

## Bugs found and fixed

| # | File | Problem | Fix |
|---|---|---|---|
| 1 | `ai_context.dart` | String interpolation contained literal `\$` escape artifacts from an earlier push — `formattedDate` and `weatherSummary` would render broken text | Rewrote with correct `${}` interpolation |
| 2 | `empty_state.dart` | File was missing (404) but imported by `DiscoverScreen` — full compile failure | Created the widget with offline/error/empty variants |
| 3 | `hero_accommodation_card.dart` | Created a `StreamProvider` *inside* `build()` — provider leak, and a single-yield `async*` stream that never updated | Moved providers to top-level `family` providers |
| 4 | `nearby_strip.dart` | All 6 category counts hardcoded; ignored `tripId` | Real counts from `PlaceRepository.getByCategory` |
| 5 | `place_provider.dart` | `allPlacesProvider` returned `Stream.empty()` — dead code | Wired to active trip; added `placesByCategoryProvider` |
| 6 | `ai_provider.dart` | `_globalPrefs!` would crash silently if unset | Added assert with clear message |

## Verified consistent and correct

These were checked and found working — no changes needed:

- **Repositories** (`trip`, `place`, `planning`) — clean row↔model mapping, all CRUD present.
- **DAOs** (Drift) — correct queries, ordering, watch streams.
- **`database_provider.dart`** — singleton injected via override in `main()`, no duplicate DB instances.
- **`trip_provider.dart`** — `TripNotifier` with create/setActive/delete all wired.
- **`planning_provider.dart`** — `addPlace` writes both Place and PlanningItem (DL-008 honoured: only on explicit tap).
- **`weather_provider.dart`** — Open-Meteo, derives coordinates from active accommodation, 1h staleness.
- **`ai_provider.dart`** — `load`, `loadMore`, `setFilter`, `markAdded` all present and matching DiscoverScreen calls.
- **Models** (`Place`, `Trip`, `Accommodation`, `PlanningItem`) — real UUIDs via `uuid` package, Freezed, `fromJson`/`create` factories.
- **`app_colors.dart`** — matches locked design system exactly (fjord green/blue, flag red, warm paper).

---

# Design system consistency

All screens verified against the locked palette:

| Token | Value | Usage |
|---|---|---|
| primary | `#1B4D35` | Dominant ~70% |
| fjordBlue | `#1A3F6F` | Navigation, water, ferry ~20% |
| flagRed | `#A8291F` | Key actions, alerts ~10% |
| background | `#F2F0EC` | Warm paper, never cold grey |
| card | `#FDFCFA` | Surfaces |

Accommodation colour-coding (planning + map) is separate from the brand palette by design — each stay has a distinct identifier colour from the original `index.html`:

| Stay | Colour |
|---|---|
| Sogndal | `#2d6a4f` green |
| Skjåk | `#1565c0` blue |
| Valdres | `#ef6c00` orange |
| Gjerstad | `#6a1b9a` purple |

---

# Known remaining work (not bugs — planned)

| Item | Status | Priority |
|---|---|---|
| Roadtrip-modus screen | Placeholder | High (DL-001) |
| Tickets `+` button | Not functional | Medium |
| Charging live API | Hardcoded 4 stations | Medium |
| Activity walk fields (km/level as chips) | In description text | Low |
| Map add-to-planning date picker | Adds without date | Low |
| Settings / Profile / Notifications | Placeholders | Low |
| Build runner (.freezed/.g generation) | Runs locally on first build | Required before compile |

---

# Compile readiness

The codebase cannot be compiled in this environment (no Flutter SDK, owner has iPhone only). Before first compile on a Mac/Windows machine:

```bash
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs
flutter run
```

`build_runner` generates the `.freezed.dart`, `.g.dart` and Drift `.g.dart` files that are git-ignored. Until then the imports referencing those parts will show as unresolved — this is expected.

---

# Change History

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-06-28 | First full audit — 6 bugs fixed, consistency verified |
