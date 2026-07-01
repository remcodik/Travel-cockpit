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

**Web app (live, actief in ontwikkeling):**
- Vanilla HTML/CSS/JS — geen build-stap, geen framework
- Leaflet + OpenStreetMap (kaart) · Open-Meteo (weer, gratis)
- Firebase Firestore — persistente, real-time gedeelde data (activiteiten, tickets)
- Vercel serverless functions — Anthropic Claude API (AI-suggesties), Open Charge Map (laadstations)

**Native Flutter app (toekomstplan — nog niet gestart):**
- Flutter 3.x · Riverpod · Drift (SQLite) · GoRouter
- Volledige architectuur staat uitgewerkt in `docs/08-technical/01-flutter.md`

**Waarom nu een web-app in plaats van de native app?**
Een Flutter iOS-app bouwen en testen vereist een Mac (Xcode draait alleen op macOS) — die is er niet. De enige beschikbare laptop is een werklaptop waar geen ontwikkelsoftware op geïnstalleerd mag worden. Om toch snel een écht werkend resultaat te hebben, is gekozen voor een web-app: geen lokale toolchain nodig, direct bruikbaar in de browser, installeerbaar op het beginscherm. Zodra er een Mac (of andere geschikte build-omgeving) beschikbaar is, blijft de native app het uiteindelijke doel. Zie besluit `DL-014` in `docs/00-product/02-decision-log.md`.

---

## Navigatie: token intrekken

GitHub token werd gebruikt tijdens development. Trek hem in op:
https://github.com/settings/tokens
