# AI Architecture

**Document ID:** TC-AI-001
**Version:** 1.0
**Status:** Stable
**Owner:** Product Team
**Last Updated:** 2025-06-27

---

# Purpose

This document defines how AI works inside Travel Cockpit.

AI is a supporting feature, not a core function. The traveller is always in control.

---

# Core Rule

AI in Travel Cockpit follows one absolute rule, directly from the Product Blueprint and DL-008:

> AI advises. Users decide.

This means:

- AI never adds items to planning automatically.
- AI never removes items.
- AI never changes any data without explicit user confirmation.
- Every AI suggestion requires one deliberate tap to act on.

---

# What AI Does

## Suggestion Generation

AI generates suggestions for:

- Activities near the active accommodation.
- Restaurants near the active accommodation.
- Cafés near the active accommodation.
- Rain alternatives when weather is bad.
- Scenic drives or routes.
- Kid-friendly options when relevant.

## Context AI Uses

AI receives the following context with every request:

| Context Field | Description |
|---|---|
| active_accommodation | Name, location, country |
| today_date | Current date |
| weather | Current temperature, rain probability, conditions |
| user_preferences | Travel styles, vehicle type |
| existing_planning | Already planned activities (to avoid duplicates) |
| trip_country | To tailor suggestions to the region |
| language | User's preferred language |

## What AI Does Not Receive

- Personal data beyond preferences.
- Location history.
- Device identifiers.
- Payment information.

---

# AI Integration

## Model

Travel Cockpit uses the Anthropic Claude API for suggestion generation.

Model: `claude-sonnet-4-6` (or latest available Sonnet model).

## When AI is Called

AI is called when:

1. The traveller opens the Ideeën (Discover) screen.
2. The traveller taps "Meer ideeën laden" (Load more ideas).
3. The traveller changes a category filter on the Discover screen.
4. The dashboard AI card is tapped.

AI is not called:

- On app launch.
- In the background.
- Without user interaction.

## Request Structure

Each AI request contains:

```
System prompt: [see AI Rules document]

User message:
- Active accommodation: {name}, {location}
- Country: {country}
- Today: {date}
- Weather: {temperature}°, {conditions}, {rain_probability}% rain
- User preferences: {styles}
- Already planned: {existing_items}
- Filter: {selected_category}
- Language: {language}

Generate 5 suggestions. Return JSON only.
```

## Response Structure

AI returns a JSON array. The app parses this and never displays raw AI text.

```json
[
  {
    "name": "Tundradalen wandeling",
    "category": "activity",
    "description": "Prachtige valley met rivier. Geschikt voor alle niveaus.",
    "distance_km": 14,
    "duration_minutes": 240,
    "difficulty": "medium",
    "rating": 4.8,
    "why_recommended": "Past bij jouw voorkeur voor natuur en wandelen.",
    "lat": 61.8823,
    "lng": 8.4124,
    "google_maps_query": "Tundradalen Norway"
  }
]
```

## Error Handling

| Situation | Behaviour |
|---|---|
| No internet | Show cached suggestions if available, else show offline message |
| API error | Show friendly error message, offer retry |
| Empty response | Show "Geen ideeën gevonden" with retry option |
| Slow response | Show loading indicator, no timeout below 10 seconds |

---

# AI Rules

These rules are enforced in both the system prompt and the application logic.

1. AI only suggests. It never decides.
2. Every suggestion must include a `why_recommended` field explaining the reasoning.
3. Suggestions must be relevant to the current location and season.
4. Suggestions must not duplicate items already in planning.
5. AI must respect the selected category filter strictly.
6. AI must respond in the user's preferred language.
7. AI must not invent specific addresses, phone numbers or opening hours.
8. AI must not suggest closed or seasonal attractions without noting uncertainty.
9. If weather is poor, AI must automatically include at least one indoor option.
10. AI responses must always be valid JSON. Never return plain text or markdown.

---

# Offline Behaviour

When the device has no internet:

- The Discover screen shows the last successfully loaded suggestions with an "Offline" label.
- The AI card on the dashboard is visible but tapping it shows an offline message.
- No API calls are made.
- Cached suggestions are stored per trip and expire after 24 hours.

---

# Privacy

- AI context data is sent per request and not stored by Travel Cockpit servers.
- The Anthropic API privacy policy applies to data sent to the API.
- No personal identifiable information beyond location and preferences is sent.
- Users can disable AI suggestions in preferences. This disables all API calls.

---

# Future AI Features (Not in MVP)

These are intentionally excluded from version 1.0:

- AI-generated route planning.
- AI that learns from past trips.
- AI chat interface.
- Automatic rescheduling by AI.
- AI-generated trip summaries.

---

# Change History

| Version | Date | Change |
|---|---|---|
| 1.0 | 2025-06-27 | Initial stable version |
