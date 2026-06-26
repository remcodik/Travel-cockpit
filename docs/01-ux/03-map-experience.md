# Map Experience

**Document ID:** TC-UX-003  
**Version:** 1.0  
**Status:** Draft  
**Owner:** Product Team

---

# Purpose

The map is one of the core screens of Travel Cockpit.

It provides a visual overview of the current trip and serves as the starting point for navigation and discovery.

The traveller should be able to understand the journey by looking at the map.

---

# Design Principles

The map should be:

- fast
- clean
- interactive
- informative
- uncluttered

The traveller should never feel overwhelmed.

---

# Default View

When opening the map, the application automatically displays:

- Current trip
- Active accommodation
- Planned activities
- Current location (if available)

The map automatically zooms to the relevant area.

---

# Accommodation Route

Accommodations are connected by a route line.

The traveller immediately understands:

- where they have been
- where they are
- where they are going

Only accommodations are connected.

Activities are never connected.

---

# Activities

Activities appear as map pins.

Different icons indicate different categories.

Examples:

🥾 Walk

🏛 Museum

🌄 Viewpoint

🚤 Boat trip

🏖 Beach

📷 Photo spot

Activities are never connected by lines.

---

# Restaurants & Cafés

Restaurants and cafés are shown using different icons.

They can be filtered independently.

Selecting a location opens:

- Details
- Distance
- Google Maps
- AI explanation

---

# Energy Points

Energy Points support:

- EV charging
- Fuel stations

The displayed type depends on the selected vehicle profile.

Examples:

EV Mode

Show charging stations.

Fuel Mode

Show fuel stations.

Hybrid

Show both.

---

# Filters

The traveller can enable or disable:

✔ Accommodations

✔ Planned activities

✔ Ideas

✔ Restaurants

✔ Cafés

✔ Energy Points

✔ Parking

✔ Scenic routes

✔ Hiking

✔ Museums

The last selected filters are remembered.

---

# Current Location

If permission is granted:

Display the traveller's current position.

Quick actions:

- Navigate home
- Navigate to accommodation
- Search nearby

---

# Selecting an Object

Selecting a pin opens a preview card.

The card contains:

- Name
- Photo
- Distance
- Category
- Planned status
- Google Maps
- AI
- Add to planning

---

# Map Behaviour

The map automatically adapts.

Travel day:

Highlight route.

Stay day:

Highlight activities.

Arrival:

Highlight accommodation.

---

# Offline

Downloaded map areas remain available.

Previously loaded objects remain visible.

Navigation launches Google Maps when available.

---

# Success

The traveller should be able to answer these questions immediately:

- Where am I?
- What is nearby?
- What have I planned?
- What have I already visited?
- Where can I charge or refuel?
