# Trip Model

**Document ID:** TC-DB-003

**Project:** Travel Cockpit

**Version:** 1.0

**Status:** Draft

**Owner:** Product Team

---

# Purpose

The Trip is the highest level entity in Travel Cockpit.

Everything belongs to exactly one Trip.

A Trip represents one complete journey.

Examples:

- Norway 2026
- Tuscany 2027
- Scotland 2028

The application always has one Active Trip.

---

# Responsibilities

A Trip contains:

- Accommodations
- Places
- Planning
- Travel Companions
- Vehicle
- Traveller Profile
- Trip Profile
- Tickets
- Notes
- Photos
- Settings

---

# Active Trip

Only one Trip can be active.

Opening the application automatically opens the Active Trip.

The traveller may switch to another Trip at any time.

---

# Trip Theme

Every Trip may have its own visual identity.

Examples:

- Norway → Blue & Green
- Italy → Terracotta
- Scotland → Deep Green

Changing the theme never changes functionality.

---

# Trip Profile

A Trip Profile stores preferences that only apply to the current journey.

Examples:

Interested in:

- Waterfalls
- Scenic drives
- Fjords
- Local cafés

Less interested in:

- Shopping
- Nightlife

The Trip Profile improves AI recommendations.

---

# Travel Companions

A Trip may contain multiple travellers.

Every traveller can:

- View the trip
- Add Places
- Edit planning
- Add notes
- Upload photos

Permissions may differ per traveller in future versions.

---

# Vehicle

One vehicle belongs to a Trip.

Vehicle information is used for:

- Charging
- Fuel
- Route suggestions
- Consumption
- Energy calculations

Supported:

- Electric
- Fuel
- Hybrid

---

# Active Accommodation

Every Trip always has one Active Accommodation.

This determines:

- Dashboard
- Nearby suggestions
- AI context
- Planning
- Weather
- Default map

The traveller may manually change the Active Accommodation.

The application may also suggest switching when arriving at the next accommodation.

---

# Current Context

The application continuously builds a temporary Current Context.

Current Context includes:

- Current Location
- Active Accommodation
- Weather
- Current Day
- Planned Activities
- Completed Activities
- Vehicle
- Trip Profile

Current Context is temporary and is not stored permanently.

---

# Trip Status

Possible states:

Planning

Travelling

Completed

Archived

---

# Offline

All essential Trip information should remain available without internet.

Offline includes:

- Accommodations
- Planning
- Notes
- Tickets
- Photos
- Personal Places

---

# Design Principle

Everything belongs to a Trip.

Removing a Trip removes all related planning, places and personal data while leaving the master Place database unchanged.
