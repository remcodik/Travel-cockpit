# Place Model

**Document ID:** TC-DB-002  
**Version:** 1.0  
**Status:** Draft  
**Owner:** Product Team

---

# Purpose

The Place entity is the central location model within Travel Cockpit.

Every location that can appear on the map is represented as a Place.

This avoids duplicate models and simplifies development.

---

# Definition

A Place represents a physical location.

Every Place has geographical coordinates and can optionally be visited.

---

# Examples

A Place may represent:

- Activity
- Hiking trail
- Waterfall
- Viewpoint
- Restaurant
- Café
- Bakery
- Museum
- Parking
- Accommodation
- Ferry
- Charging Station
- Fuel Station
- Supermarket
- Beach
- Scenic Route
- Information Centre
- Toilet

---

# Required Fields

Every Place contains:

- ID
- Name
- Category
- Latitude
- Longitude

---

# Optional Fields

- Description
- Website
- Phone
- Opening Hours
- Price Level
- Duration
- Difficulty
- Parking
- Best Time
- Photos
- Notes

---

# Categories

Each Place belongs to exactly one primary category.

Examples:

Nature

Food & Drinks

Accommodation

Transport

Energy

Culture

Shopping

Services

---

# Tags

Places may contain unlimited tags.

Examples

- Dog Friendly
- Family Friendly
- Rain Alternative
- Scenic
- Hidden Gem
- Free
- Accessible
- EV Friendly

Tags improve searching and AI recommendations.

---

# Personal Data

Users may add:

- Personal notes
- Personal photos
- Favourite
- Planned
- Completed
- Rating

This information never changes the original Place.

---

# Navigation

Every Place supports:

- Google Maps
- Copy Coordinates
- Share

---

# AI Support

AI may enrich Places with:

- Summary
- Visiting Tips
- Similar Places
- Best Time
- Nearby Recommendations

The traveller decides whether this information is stored.

---

# Design Principle

Every new location type should first be evaluated as a Place category before introducing a new entity.

Keeping one flexible model is preferred over creating multiple specialised models.
