# Dashboard

**Document ID:** TC-UX-002  
**Version:** 1.0  
**Status:** Draft  
**Owner:** Product Team

---

# Purpose

The Dashboard is the heart of Travel Cockpit.

It is the first screen shown when opening the application.

The dashboard always focuses on the current trip and the active accommodation.

The traveller should immediately know:

- Where am I?
- What is planned?
- What can I do today?
- What do I need right now?

---

# Design Principles

The dashboard should:

- feel calm
- require almost no thinking
- prioritise today's information
- hide unnecessary details
- adapt automatically during the journey

---

# Header

Display:

- Current trip
- Current accommodation
- Country flag
- Theme colour
- Weather
- Offline status

Selecting the trip allows switching to another trip.

---

# Today's Overview

Shows only relevant information.

Examples:

- Planned activities
- Distance to first activity
- Restaurants nearby
- Cafés nearby
- Energy points nearby
- Tickets
- AI suggestions

Past activities are hidden by default.

---

# AI Card

A dedicated AI card is always visible.

Examples:

- What can I do today?
- Suggest a scenic drive.
- Find a nice café nearby.
- Refresh ideas.
- Show rain alternatives.

AI never changes the planning automatically.

---

# Quick Actions

One tap actions.

- Navigate to accommodation
- Open Google Maps
- Open Komoot
- Add activity
- Discover nearby
- Find charging
- Find fuel
- View map

---

# Weather Card

Shows:

- Current weather
- Temperature
- Rain probability
- Wind

AI may use weather when generating suggestions.

---

# Accommodation Card

Shows:

- Name
- Remaining nights
- Check-out date
- Photo
- Distance from current location

Selecting the card opens the accommodation details.

---

# Planning Card

Displays only:

- Planned
- Completed

Ideas are not shown here.

The traveller can reorder activities manually.

---

# Map Preview

Small interactive map.

Displays:

- Accommodation
- Planned activities
- Route

Selecting opens the full map.

---

# Dynamic Behaviour

The dashboard changes automatically depending on the journey.

Before departure:

Focus on preparation.

During stay:

Focus on today's activities.

Travel day:

Focus on route and next accommodation.

After arrival:

Focus on the new accommodation.

---

# Design Goals

The traveller should never need to search.

The dashboard should answer:

"What is important right now?"
