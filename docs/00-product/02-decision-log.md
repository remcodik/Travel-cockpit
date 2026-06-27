# Decision Log

**Document ID:** TC-PROD-011  
**Version:** 0.2  
**Status:** Stable

## Purpose

The Decision Log records architectural decisions that influence the design of Travel Cockpit.

Each decision is considered binding unless explicitly replaced by a newer decision.

---

## DL-001
Travel Cockpit is designed as a roadtrip-first application.

## DL-002
Place is the central domain object for all physical locations.

## DL-003
Accommodation is a specialised Place, not a separate location model.

## DL-004
Only one Trip can be active at a time.

## DL-005
Every Trip has one Active Accommodation that acts as the operational centre.

## DL-006
Planning only contains confirmed traveller decisions.

## DL-007
Discover contains inspiration and suggestions only.

## DL-008
AI supports the traveller but never makes decisions automatically.

## DL-009
Current Context is used throughout the application to personalise the experience.

## DL-010
Offline capability is a core design requirement.

## DL-011
The first release targets a single traveller.

## DL-012
Connected Travel and collaboration are future functionality and are intentionally postponed.

---

## Change Process

Architectural decisions are never silently changed.

If a decision changes, a new Decision Log entry is added describing the reason.
