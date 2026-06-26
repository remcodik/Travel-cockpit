# Planning Model

**Document ID:** TC-DB-004

**Project:** Travel Cockpit

**Version:** 1.0

**Status:** Draft

**Owner:** Product Team

---

# Purpose

Planning defines what the traveller actually intends to do.

Travel Cockpit is not a planning application.

Planning simply organises selected Places.

---

# Philosophy

A Place exists independently.

Planning references a Place.

This means the same Place may exist without ever being planned.

---

# Planning Status

Every planning item has exactly one status.

Possible values:

- Planned
- Completed

Ideas are **not** part of Planning.

---

# Planned

The traveller has decided to visit this Place.

The Place appears:

- Dashboard
- Map
- Timeline
- Accommodation

---

# Completed

The traveller has visited the Place.

Completed Places remain visible in the trip history.

---

# Ideas

Ideas are stored separately.

Examples:

- AI Suggestions
- Saved Ideas
- Interesting Places

Ideas only become part of Planning after explicit user confirmation.

---

# Ordering

Planning supports manual ordering.

The application never changes the order automatically.

The traveller remains in control.

---

# Accommodation

Every planning item belongs to exactly one accommodation.

Example

Skjåk

• Dønfoss

• Bakery

• Viewpoint

Loen

• Via Ferrata

• Restaurant

---

# Dates

Planning may optionally contain:

- Planned Day

No times are required.

Travel Cockpit intentionally avoids time-based scheduling.

---

# Navigation

Every planned item supports:

- Google Maps
- Komoot (when applicable)

Navigation always starts using GPS coordinates.

---

# AI

AI may recommend adding Places to Planning.

AI never adds them automatically.

---

# Offline

Planning remains fully available without internet.

This includes:

- order
- status
- notes
- photos

---

# Design Principle

Planning contains only decisions already made by the traveller.

Everything else belongs to Discover.
