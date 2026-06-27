# Planning

**Document ID:** TC-DB-004  
**Version:** 0.1  
**Status:** Stable

## Purpose

Planning contains all activities that the traveller has explicitly decided to include in a Trip.

Planning is intentionally separate from Discover. Only confirmed decisions become part of Planning.

## Core Attributes

- Planning ID
- Trip
- Place
- Planned Date
- Planned Time (optional)
- Status
- Notes
- Priority

## Status Values

- Planned
- In Progress
- Completed
- Skipped
- Cancelled

## Relationships

A Planning item:

- Belongs to one Trip
- References one Place
- May reference one Accommodation
- May contain personal notes
- May include photos after completion

## Business Rules

- Only confirmed Places can be added to Planning.
- Planning does not automatically change based on AI suggestions.
- Planning supports flexible travel without enforcing a strict schedule.

## Guiding Principle

> Planning contains decisions, not ideas.
