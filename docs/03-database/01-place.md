# Place

**Document ID:** TC-DB-001  
**Version:** 0.1  
**Status:** Stable

## Purpose

Place is the central entity within Travel Cockpit.

Every physical location is represented as a Place. This provides one consistent model for planning, maps, AI and navigation.

## Examples

A Place may represent:

- Accommodation
- Waterfall
- Viewpoint
- Restaurant
- Café
- Museum
- Parking
- Charging Station
- Fuel Station
- Hiking Trail
- Beach

## Core Attributes

Every Place contains:

- Unique ID
- Name
- Category
- Geographic coordinates
- Address (optional)
- Description
- Photos
- Opening hours (optional)
- Tags
- Rating (optional)
- Notes (optional)

## Relationships

A Place can be:

- Planned in a Trip
- Visited during a Trip
- Saved as a Favourite
- Recommended by AI
- Used as an Active Accommodation

## Design Principles

- One Place model for all locations
- Reuse before creating new entities
- Categories define behaviour, not separate tables
- AI enriches Places but does not own them

## Guiding Principle

> Every destination starts with a Place.
