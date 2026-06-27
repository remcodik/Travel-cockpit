# Activity

**Document ID:** TC-DB-005  
**Version:** 0.1  
**Status:** Stable

## Purpose

An Activity represents something the traveller does at a Place during a Trip.

## Attributes

- Activity ID
- Related Trip
- Related Place
- Category
- Planned Date
- Status
- Duration (optional)
- Notes
- Photos

## Rules

- Every Activity belongs to one Trip.
- Every Activity references one Place.
- Activities may be planned or spontaneous.

> Activities describe experiences, not locations.
