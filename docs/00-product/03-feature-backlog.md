# Feature Backlog

**Document ID:** TC-PROD-003
**Version:** 1.0
**Status:** Living document — updated as features are decided
**Owner:** Product Team
**Last Updated:** 2026-06-28

---

# Purpose

This document tracks features that are deliberately NOT in the MVP but are confirmed for future versions. Every item here has been discussed and has a reason it belongs here instead of in the MVP.

---

# Post-MVP Features

## 1. Regionale Reisgids

**Status:** Backlog — first candidate after MVP stabilises

**What:** Verhalende, informatieve tekst per regio over geschiedenis, cultuur, geografie en wetenswaardigheden. Geen activiteiten — die zijn er al. Pure contextuele achtergrondkennis.

**Why not in MVP:** The MVP must first prove that the core loop works — trip → accommodation → planning → AI suggestions. The guide is an enrichment layer, not a core function.

**Design decision:** AI-generated via Claude, cached 7 days per region. Max 4–5 cards per region, each 3–6 sentences. See `docs/05-features/01-regional-guide.md` for full spec.

**UI placement:** Small card on HomeScreen ("Meer over deze regio") + section in Meer menu.

---

## 2. Cloud Backup & Sync

**Status:** Backlog — Phase 3

**What:** Optional cloud backup of trip data so users don't lose data when switching phones.

**Why not in MVP:** No backend server in MVP. All data is local. Sync adds complexity that could delay launch.

---

## 3. Shared Trips

**Status:** Backlog — Phase 3

**What:** Share a trip with travel companions. Both can add activities, see each other's planning.

**Why not in MVP:** Requires backend, authentication, conflict resolution. Out of scope for v1.

---

## 4. Cost Tracking

**Status:** Backlog — undecided

**What:** Log expenses per day or per category. See total spend vs budget.

**Why not in MVP:** Adds significant UI complexity. Many dedicated apps exist. Not core to the roadtrip experience.

---

## 5. Route Optimisation

**Status:** Backlog — Phase 2

**What:** AI suggests the most efficient order to visit planned activities based on location and time.

**Why not in MVP:** Requires map routing API integration. DL-008 says AI never changes planning automatically — this would need careful UX design.

---

## 6. Photo Journal

**Status:** Backlog — undecided

**What:** Attach photos to activities. Build a visual diary of the trip.

**Why not in MVP:** Storage, permissions, UI complexity. Nice to have but not core.

---

## 7. Audio Guide

**Status:** Backlog — far future

**What:** Text-to-speech for regional guide cards. Listen while driving.

**Why not in MVP:** Depends on regional guide being built first. Requires TTS API.

---

## 8. Gamification

**Status:** Rejected

**What:** Badges, streaks, points for completing activities.

**Why rejected:** Inconsistent with the calm, intentional travel experience Travel Cockpit aims for. Makes the app feel like a game rather than a companion.

---

# Change History

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-06-28 | Initial backlog — regional guide, sync, sharing, cost tracking |
