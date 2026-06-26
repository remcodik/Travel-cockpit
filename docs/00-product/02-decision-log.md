# Decision Log

**Document ID:** TC-PRD-002  
**Version:** 1.0  
**Status:** Active  
**Owner:** Product Team

---

# Purpose

The Decision Log records all major product and architecture decisions made during the development of Travel Cockpit.

Every important decision should be documented together with the reasoning behind it.

This prevents the same discussions from happening multiple times and ensures consistency throughout the project.

---

# Decision Status

Possible statuses:

- Proposed
- Approved
- Locked
- Deprecated

---

# Decisions

## DL-001

### Title

Travel Cockpit is primarily used during the journey.

### Status

Locked

### Reason

Most travel applications focus on planning before departure.

Travel Cockpit focuses on supporting travellers while travelling.

---

## DL-002

### Title

The active accommodation is the starting point.

### Status

Locked

### Reason

Travellers naturally think from their current accommodation.

Activities, restaurants, cafés and routes all originate from that location.

---

## DL-003

### Title

AI never changes data automatically.

### Status

Locked

### Reason

Users remain in control.

AI may suggest.

Users decide.

---

## DL-004

### Title

Google Maps remains the primary navigation system.

### Status

Locked

### Reason

Navigation is not part of the product vision.

Travel Cockpit launches navigation using GPS coordinates.

---

## DL-005

### Title

The map is a primary screen.

### Status

Locked

### Reason

Travellers should understand their trip by looking at the map.

---

## DL-006

### Title

Offline support is mandatory.

### Status

Locked

### Reason

Road trips often take place in areas with limited internet connectivity.

---

## DL-007

### Title

Planning contains only planned and completed activities.

### Status

Locked

### Reason

Ideas remain separate from the daily planning.

This keeps the planning clean and focused.

---

## DL-008

### Title

Energy Points support both EV charging and fuel stations.

### Status

Locked

### Reason

Travel Cockpit must support electric, fuel and hybrid vehicles using the same architecture.

---

## DL-009

### Title

One tap to Google Maps.

### Status

Locked

### Reason

Users should never manually search for destinations.

Travel Cockpit always launches navigation using coordinates.

---

## DL-010

### Title

Travel Cockpit is a Travel Companion rather than a traditional Travel Planner.

### Status

Locked

### Reason

The application supports decisions during the journey instead of replacing the traveller's planning.
