# Trip

**Document ID:** TC-DB-002  
**Version:** 0.1  
**Status:** Stable

## Purpose

A Trip represents one complete journey within Travel Cockpit.

All planning, accommodations, activities and memories belong to exactly one Trip.

## Core Attributes

- Trip ID
- Name
- Description
- Country or Region
- Start Date
- End Date
- Status (Planned, Active, Completed)
- Cover Photo (optional)

## Relationships

A Trip contains:

- Places
- Planning Items
- Activities
- Accommodations
- Notes
- Photos

Each traveller can have multiple Trips, but only one Trip can be Active at a time.

## Business Rules

- Exactly one Active Trip is allowed.
- Deleting a Trip also removes its planning data.
- Traveller Profile is shared across Trips.
- Trip Profile belongs only to this Trip.

## Guiding Principle

> A Trip is the container that connects every travel experience.
