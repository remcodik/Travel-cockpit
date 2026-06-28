# Flutter Architecture

**Document ID:** TC-TECH-001
**Version:** 1.0
**Status:** Stable
**Owner:** Product Team
**Last Updated:** 2025-06-27

---

# Purpose

This document defines the technical architecture for the Travel Cockpit Flutter application.

It provides the foundation every developer needs before writing a single line of code.

---

# Platform

| Property | Value |
|---|---|
| Framework | Flutter 3.x (stable channel) |
| Language | Dart |
| Target platforms | iOS 16+ and Android 10+ |
| State management | Riverpod |
| Local database | Drift (SQLite) |
| Navigation | GoRouter |
| Maps | Flutter Map + OpenStreetMap tiles |
| HTTP client | Dio |
| AI | Anthropic Claude API via Dio |

---

# Architecture Pattern

Travel Cockpit uses a layered architecture with clear separation of concerns.

```
┌─────────────────────────────────┐
│           Presentation          │  Screens, Widgets
├─────────────────────────────────┤
│           Providers             │  Riverpod state & business logic
├─────────────────────────────────┤
│          Repositories           │  Data access abstraction
├─────────────────────────────────┤
│      Local DB  │  Remote API    │  Drift + Anthropic + external APIs
└─────────────────────────────────┘
```

### Presentation Layer

- Flutter screens and widgets only.
- No business logic in widgets.
- Widgets read from Riverpod providers and call provider methods.
- Screens are named after their route: `HomeScreen`, `MapScreen`, `PlanningScreen`.

### Providers Layer

- All business logic lives in Riverpod providers.
- Providers call repositories. They do not access the database directly.
- One provider per domain: `TripProvider`, `AccommodationProvider`, `PlanningProvider`, `AiProvider`.

### Repository Layer

- Each entity has a repository: `TripRepository`, `PlaceRepository`, `TicketRepository`.
- Repositories abstract the data source (local or remote).
- Offline-first: always read from local first, sync to remote when online.

### Data Layer

- Local: Drift (SQLite) for all trip data, planning, tickets, preferences.
- Remote: Anthropic API for AI suggestions. Google Places API for place search (optional).
- No backend server in MVP. All data is local.

---

# Folder Structure

```
lib/
├── main.dart
├── app.dart                     # App root, GoRouter setup, theme
│
├── core/
│   ├── constants/               # App-wide constants
│   ├── theme/                   # Colors, typography, design tokens
│   ├── utils/                   # Date helpers, distance calc, formatters
│   └── extensions/              # Dart extensions
│
├── data/
│   ├── local/
│   │   ├── database.dart        # Drift database definition
│   │   ├── tables/              # One file per table
│   │   └── daos/                # Data access objects per entity
│   ├── remote/
│   │   ├── anthropic_client.dart
│   │   └── google_places_client.dart
│   └── repositories/
│       ├── trip_repository.dart
│       ├── place_repository.dart
│       ├── planning_repository.dart
│       ├── ticket_repository.dart
│       └── ai_repository.dart
│
├── domain/
│   └── models/                  # Pure Dart data classes
│       ├── trip.dart
│       ├── place.dart
│       ├── accommodation.dart
│       ├── planning_item.dart
│       ├── ticket.dart
│       └── user_preferences.dart
│
├── providers/
│   ├── trip_provider.dart
│   ├── accommodation_provider.dart
│   ├── planning_provider.dart
│   ├── place_provider.dart
│   ├── ai_provider.dart
│   ├── ticket_provider.dart
│   └── preferences_provider.dart
│
└── ui/
    ├── screens/
    │   ├── home/
    │   ├── map/
    │   ├── planning/
    │   ├── discover/
    │   ├── activity_detail/
    │   ├── accommodation_detail/
    │   ├── accommodations/
    │   ├── charging/
    │   ├── tickets/
    │   ├── roadtrip/
    │   ├── trips/
    │   ├── profile/
    │   └── settings/
    └── widgets/
        ├── common/              # Buttons, cards, badges, rows
        ├── map/                 # Map pins, filters, bottom sheet
        ├── planning/            # Planning items, day tabs
        └── ai/                  # AI card, suggestion items
```

---

# Navigation

GoRouter handles all navigation.

```dart
final router = GoRouter(
  routes: [
    GoRoute(path: '/',          builder: (_,__) => HomeScreen()),
    GoRoute(path: '/map',       builder: (_,__) => MapScreen()),
    GoRoute(path: '/planning',  builder: (_,__) => PlanningScreen()),
    GoRoute(path: '/discover',  builder: (_,__) => DiscoverScreen()),
    GoRoute(path: '/place/:id', builder: (_,s)  => ActivityDetailScreen(id: s.pathParameters['id']!)),
    GoRoute(path: '/acc/:id',   builder: (_,s)  => AccommodationDetailScreen(id: s.pathParameters['id']!)),
    GoRoute(path: '/accommodations', builder: (_,__) => AccommodationsScreen()),
    GoRoute(path: '/charging',  builder: (_,__) => ChargingScreen()),
    GoRoute(path: '/tickets',   builder: (_,__) => TicketsScreen()),
    GoRoute(path: '/roadtrip',  builder: (_,__) => RoadtripScreen()),
    GoRoute(path: '/trips',     builder: (_,__) => TripsScreen()),
    GoRoute(path: '/profile',   builder: (_,__) => ProfileScreen()),
    GoRoute(path: '/settings',  builder: (_,__) => SettingsScreen()),
  ],
);
```

---

# Offline-First Strategy

1. All data is written to local SQLite (Drift) first.
2. No remote server exists in MVP. All data stays on device.
3. Maps are downloaded per country using flutter_map_tile_caching.
4. AI suggestions are cached locally for 24 hours per trip.
5. Tickets are always stored locally and never require internet to display.
6. The app shows an offline indicator when no internet is available.
7. No data is lost when going offline mid-session.

---

# Theme System

Design tokens are defined in `lib/core/theme/`.

```dart
class AppColors {
  // Fjord green — primary (70% of colour usage)
  static const primary     = Color(0xFF1B4D35);
  static const primaryDark = Color(0xFF0F2E1E);
  static const primaryMid  = Color(0xFF2A6B4A);
  static const primaryLight= Color(0xFFEBF5EF);
  static const action      = Color(0xFF1F7A49);

  // Norwegian flag red — accent (10%, badges, roadtrip CTA)
  static const flagRed     = Color(0xFFA8291F);
  static const flagRedLight= Color(0xFFFDECEA);

  // Fjord blue — navigation, water, info (20%)
  static const fjordBlue   = Color(0xFF1A3F6F);
  static const fjordBlueLt = Color(0xFFDDE8F5);

  // Surfaces — warm paper, not cold grey
  static const background  = Color(0xFFF2F0EC);
  static const card        = Color(0xFFFDFCFA);
  static const border      = Color(0xFFDDE5DF);

  // Text
  static const textPrimary = Color(0xFF111A14);
  static const textSecond  = Color(0xFF3D5244);
  static const textThird   = Color(0xFF7A9280);
}
```

Each trip can override `primary`, `primaryDark` and `primaryLight` based on the destination region.

---

# External Integrations

| Integration | Purpose | In MVP |
|---|---|---|
| Anthropic Claude API | AI suggestions | Yes |
| Google Maps (URL launch) | Navigation | Yes |
| Komoot (URL launch) | Hiking navigation | Yes |
| OpenStreetMap (flutter_map) | Map display | Yes |
| Open-Meteo API | Weather data | Yes |
| Google Places API | Place search | No — Phase 2 |
| OCPI / PlugShare API | Live EV availability | Partial — static data MVP |

---

# Key Dependencies

```yaml
dependencies:
  flutter_riverpod: ^2.x
  go_router: ^13.x
  drift: ^2.x
  flutter_map: ^6.x
  dio: ^5.x
  geolocator: ^11.x
  shared_preferences: ^2.x
  url_launcher: ^6.x
  qr_flutter: ^4.x
  barcode_widget: ^2.x
  intl: ^0.19.x
  google_fonts: ^6.x
```

---

# Change History

| Version | Date | Change |
|---|---|---|
| 1.0 | 2025-06-27 | Initial stable version |
