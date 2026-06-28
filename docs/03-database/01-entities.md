# Database Entities

**Document ID:** TC-DB-001
**Version:** 1.0
**Status:** Stable
**Owner:** Product Team
**Last Updated:** 2025-06-27

---

# Purpose

This document defines all data entities in Travel Cockpit.

Every entity must have a clear reason to exist.

Entities without a clear function during a trip are not included.

---

# Design Decisions

- Place is the central entity for all physical locations (DL-002).
- Accommodation is a specialised Place, not a separate location model (DL-003).
- Only one Trip can be active at a time (DL-004).
- Every Trip has one Active Accommodation (DL-005).
- Planning only contains confirmed decisions (DL-006).

---

# Entities

---

## Trip

A Trip is the top-level container for a journey.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | UUID | Yes | Primary key |
| name | String | Yes | e.g. "Noorwegen 2025" |
| country | String | Yes | ISO country code |
| country_flag | String | No | Emoji flag |
| start_date | Date | Yes | First day of trip |
| end_date | Date | Yes | Last day of trip |
| is_active | Boolean | Yes | Only one trip is active |
| theme_color_primary | String | No | Hex color, region-based |
| theme_color_secondary | String | No | Hex color |
| created_at | DateTime | Yes | Auto |
| updated_at | DateTime | Yes | Auto |

### Rules

- Only one Trip can have `is_active = true` at any time.
- Deleting a trip deletes all linked accommodations, activities and tickets.

---

## Place

Place is the central domain object for all physical locations.

All specific location types (Accommodation, Activity, Restaurant, etc.) are specialisations of Place.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | UUID | Yes | Primary key |
| trip_id | UUID | Yes | Foreign key → Trip |
| name | String | Yes | Display name |
| category | Enum | Yes | See categories below |
| latitude | Double | Yes | WGS84 |
| longitude | Double | Yes | WGS84 |
| address | String | No | Full address |
| description | String | No | User or AI-generated |
| distance_from_accommodation | Double | No | Kilometres, calculated |
| rating | Double | No | External rating 0–5 |
| rating_count | Integer | No | Number of ratings |
| website_url | String | No | |
| phone | String | No | |
| opening_hours | String | No | Freeform text |
| is_offline_available | Boolean | Yes | Default true |
| source | Enum | Yes | manual, ai, google_places |
| photos | List<String> | No | Local file paths or URLs |
| notes | String | No | Personal traveller notes |
| created_at | DateTime | Yes | Auto |
| updated_at | DateTime | Yes | Auto |

### Place Categories

| Value | Description |
|---|---|
| accommodation | Hotel, camping, B&B etc. |
| activity | Waterfall, viewpoint, hike etc. |
| restaurant | Restaurant, dinner |
| cafe | Café, bakery, lunch |
| ev_charging | EV charging station |
| fuel_station | Petrol or diesel station |
| supermarket | Grocery shopping |
| pharmacy | Pharmacy |
| parking | Parking area |
| other | Uncategorised |

### Place Source

| Value | Description |
|---|---|
| manual | Added by the traveller |
| ai | Suggested by AI and confirmed |
| google_places | Imported from Google Places API |

---

## Accommodation

Accommodation is a specialised Place with additional fields for stays.

Accommodation inherits all fields from Place and adds:

| Field | Type | Required | Notes |
|---|---|---|---|
| place_id | UUID | Yes | Foreign key → Place |
| check_in_date | Date | Yes | |
| check_out_date | Date | Yes | |
| check_in_time | Time | No | e.g. 15:00 |
| check_out_time | Time | No | e.g. 11:00 |
| nights | Integer | Yes | Calculated from dates |
| contact_name | String | No | Host or reception |
| contact_phone | String | No | |
| confirmation_number | String | No | Booking reference |
| is_active | Boolean | Yes | Derived from today's date |
| order_in_trip | Integer | Yes | Sequence number |

### Rules

- The accommodation whose `check_in_date` <= today <= `check_out_date` is the active accommodation.
- If no accommodation matches today, the nearest upcoming accommodation is shown.
- Accommodation order determines the route line on the map.

---

## PlanningItem

A PlanningItem links a confirmed Place to a specific date in a Trip.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | UUID | Yes | Primary key |
| trip_id | UUID | Yes | Foreign key → Trip |
| place_id | UUID | Yes | Foreign key → Place |
| planned_date | Date | No | Can be unscheduled |
| planned_time | Time | No | Optional time |
| status | Enum | Yes | See statuses below |
| priority | Integer | No | Manual sort order |
| notes | String | No | Personal notes |
| completed_at | DateTime | No | Set when marked done |
| created_at | DateTime | Yes | Auto |

### Planning Status

| Value | Description |
|---|---|
| planned | Confirmed, not yet done |
| in_progress | Currently happening |
| completed | Done |
| skipped | Deliberately skipped |
| cancelled | Removed but kept in history |

### Rules

- A Place can only appear once per date in planning.
- Planning status never changes automatically.
- Only the traveller can change a status.

---

## Ticket

| Field | Type | Required | Notes |
|---|---|---|---|
| id | UUID | Yes | Primary key |
| trip_id | UUID | Yes | Foreign key → Trip |
| name | String | Yes | e.g. "Geirangerfjord Cruise" |
| description | String | No | |
| date | Date | No | |
| time | Time | No | |
| persons | Integer | No | Number of persons |
| confirmation_number | String | No | |
| barcode_value | String | No | Barcode or QR data |
| barcode_type | Enum | No | qr, code128, ean13 |
| status | Enum | Yes | valid, used, expired, cancelled |
| is_offline_available | Boolean | Yes | Always true |
| place_id | UUID | No | Optional link to Place |
| file_path | String | No | PDF or image stored locally |
| created_at | DateTime | Yes | Auto |

---

## UserPreferences

Stored locally per device. Not synced between devices in MVP.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | UUID | Yes | Primary key |
| travel_styles | List<String> | No | nature, walking, culture, cafe, photography etc. |
| vehicle_type | Enum | No | ev, fuel, none |
| ev_networks | List<String> | No | ionity, tesla, chademo etc. |
| ev_min_power_kw | Integer | No | Minimum acceptable charger power |
| language | String | Yes | NL, EN etc. |
| units | Enum | Yes | metric, imperial |
| dark_mode | Boolean | Yes | Default false |
| ai_suggestions_enabled | Boolean | Yes | Default true |
| offline_maps_downloaded | List<String> | No | Country codes |
| created_at | DateTime | Yes | Auto |
| updated_at | DateTime | Yes | Auto |

---

## OfflineSyncLog

Tracks what has been synced and when, for offline-first support.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | UUID | Yes | Primary key |
| entity_type | String | Yes | trip, place, ticket etc. |
| entity_id | UUID | Yes | ID of the synced entity |
| last_synced_at | DateTime | Yes | |
| sync_status | Enum | Yes | synced, pending, failed |
| error_message | String | No | If sync failed |

---

# Entity Relationships

```
Trip
 ├── Accommodation (1..n, ordered)
 ├── Place (1..n)
 │    └── PlanningItem (0..n)
 └── Ticket (0..n)

UserPreferences (1, per device)
OfflineSyncLog (n, per entity)
```

---

# Change History

| Version | Date | Change |
|---|---|---|
| 1.0 | 2025-06-27 | Initial stable version |
