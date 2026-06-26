# Core Entities

**Document ID:** TC-DB-001  
**Version:** 1.0  
**Status:** Draft  
**Owner:** Product Team

---

# Purpose

This document defines the core entities of Travel Cockpit.

Every feature in the application is built around these entities.

New entities should only be introduced when absolutely necessary.

---

# Entity Overview

The application is built around the following core entities.

Trip

↓

Accommodation

↓

Place

↓

Planning

↓

Traveller

↓

Vehicle

↓

Ticket

↓

Photo

↓

AI Suggestion

---

# Trip

Represents one complete holiday.

Examples

- Norway 2026
- Tuscany 2027

Contains

- accommodations
- planning
- travel companions
- traveller profile
- route
- settings

---

# Accommodation

Represents where the traveller stays.

Contains

- address
- GPS
- dates
- notes
- photos
- nearby places

Every travel day starts here.

---

# Place

A Place represents every location that can appear on the map.

Examples

- Activity
- Restaurant
- Café
- Viewpoint
- Parking
- Charging Station
- Fuel Station
- Supermarket
- Museum
- Waterfall
- Beach

Every Place has

- GPS
- Name
- Category
- Description
- Photos
- Opening Hours
- Links

This keeps the database simple.

---

# Planning

Contains only Places that have been selected.

Status

- Planned
- Completed

Ideas are never stored in Planning.

---

# Traveller

Contains

- Name
- Preferences
- Accessibility options

No unnecessary personal information is stored.

---

# Vehicle

Supports

- Electric
- Fuel
- Hybrid

Contains

- Consumption
- Charging preferences
- Fuel preferences

---

# Ticket

Represents

- Ferry
- Museum
- Parking
- Events

Contains

- QR Code
- Booking Link
- Notes

---

# Photo

Can belong to

- Trip
- Accommodation
- Place

Personal photos always have priority over internet images.

---

# AI Suggestion

Represents a temporary recommendation.

Examples

- Suggested restaurant
- Suggested hike
- Rain alternative

Suggestions disappear unless accepted by the traveller.

---

# Design Principle

The application should use as few entity types as possible.

Instead of creating many object types, use one flexible Place entity with different categories.
