# 🗺 Travel Cockpit

> Roadtrip-companion voor Noorwegen 2026.

**Live demo:** https://travel-cockpit-virid.vercel.app/

Op je iPhone: open de link in Safari → Deel → Zet op beginscherm → dan opent de app fullscreen met het topografische icoon.

---

## Wat is Travel Cockpit?

Een mobile web-app die je helpt *tijdens* de reis, niet alleen ervoor of erna. Alle accommodaties, activiteiten, planning, kaart en AI-suggesties in één scherm.

Gebouwd voor: **Noorwegen Zomerreis 2026 · 15–30 juni · 4 verblijven · 19 activiteiten**

---

## Live app

| | |
|---|---|
| **URL** | https://travel-cockpit-virid.vercel.app/ |
| **Versie** | v3.0 — Topografisk redesign |
| **Werkt op** | iPhone Safari, Android Chrome, desktop |
| **Installeren** | Safari → Deel → Zet op beginscherm |

---

## Schermen

| Scherm | Functie |
|---|---|
| Vandaag | Dashboard met huidig verblijf, activiteiten vandaag, AI-kaart |
| Kaart | Volledige route NL→NO→NL, GPS tracker, filter per verblijf |
| Planning | D1–D16 dagtabs, activiteiten per dag en verblijf |
| Ideeën | AI-suggesties op basis van locatie en weer |
| Accommodaties | 4 verblijven met switcher, datums, adressen, hoogtes |
| Roadtrip-modus | Live navigatie, GPS, volgend verblijf en activiteit |
| Tickets | Klimapark 2469 + nieuw ticket toevoegen |
| Instellingen | Voertuig, reisvoorkeur, AI toggles |

---

## Route Noorwegen 2026

```
Nijmegen → Hirtshals (ferry nacht) → Stavanger (tussenstop) → Bergen (aankomst 13:00)
  → Sogndal (16–19 jun · 3 nachten · 12m)
  → Skjåk Solside (19–23 jun · 4 nachten · 1100m)
  → Valdres / Noord-Aurdal (23–27 jun · 4 nachten · 520m)
  → Gjerstad (27–29 jun · 2 nachten · 155m)
  → Kristiansand (ferry) → Hirtshals → Kolding → Nijmegen
```

---

## Tech stack

**Web prototype (live):** React 18 + Vite + Tailwind + Archivo + Space Mono

**Native Flutter app (in ontwikkeling):**
- Flutter 3.x · Riverpod · Drift (SQLite) · GoRouter
- Open-Meteo (weer, gratis) · Anthropic Claude API (AI)
- FlutterMap + OpenStreetMap

De Flutter app vereist een Mac om te compileren. De web prototype is de gedeelde versie.

---

## Navigatie: token intrekken

GitHub token werd gebruikt tijdens development. Trek hem in op:
https://github.com/settings/tokens
