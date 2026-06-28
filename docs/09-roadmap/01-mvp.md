# MVP Roadmap

**Document ID:** TC-ROAD-001
**Version:** 3.0
**Status:** In Progress
**Last Updated:** 2026-06-28

---

# Status per fase

| Fase | Status |
|---|---|
| Phase AI — AI integratie | ✅ Compleet |
| Phase 1 — Data fundament | ✅ Compleet |
| Phase 2 — Kernschermen | ✅ Compleet |
| Phase 3 — Kaart | ✅ Compleet |
| Phase 4 — Discover & AI | ✅ Compleet |
| Phase 5 — Energie & Tickets | ✅ Compleet (UI) |
| Phase 6 — Roadtrip-modus | ✅ **Compleet** |
| Phase 7 — Instellingen | ✅ **Compleet** |
| Phase 8 — Polish & Offline | 🟡 Gedeeltelijk |

---

# Wat werkt nu

## Alle schermen gebouwd
Geen enkel scherm is meer een placeholder — elk scherm heeft inhoud en functie.

## Roadtrip-modus (DL-001)
Het kernscherm is gebouwd. Weerstrip, huidig verblijf, volgende activiteit, voortgang, mini-kaart, snelknoppen, vandaag-lijst. Beschikbaar via /roadtrip en vanuit het Meer-menu.

## Instellingen
Schrijft echt naar SharedPreferences. Voertuigtype, 8 reisvoorkeur-stijlen (gaan naar AI), AI toggles, taal.

## Tickets
Werkende + knop met volledig formulier. Barcode uitklapbaar. Seed-ticket (Klimapark) aanwezig.

---

# Wat nog ontbreekt voor echte lancering

## Must-have
1. **ChargingScreen live API** — nu 4 hardcoded stations. Open Charge Map API gratis.
2. **Ticket DB-tabel** — nu in-memory, verlies bij herstart. Drift-tabel bestaat al, moet alleen gekoppeld worden.
3. **build_runner uitvoeren** — Freezed + Drift bestanden worden gegenereerd bij eerste `flutter pub get && flutter pub run build_runner build`.

## Nice-to-have
4. **ProfileScreen** — naam, avatar, reishistorie.
5. **NotificationsScreen** — check-in herinneringen, weerwaarschuwingen.
6. **Map date picker** — datum kiezen bij toevoegen aan planning via kaart.
7. **RegionaleGids** — AI-gegenereerde reisgids per regio (spec: docs/05-features/01-regional-guide.md).

---

# Samenvatting voortgang

Van 0 naar vrijwel complete app in één sessie:
- 14 schermen gebouwd
- 19 activiteiten met echte coordinates uit index.html
- 4 verblijven met echte adressen en datums
- Volledige route Nijmegen–Noorwegen–Nijmegen op kaart
- Dag-nummering D1–D16 door de hele app
- Live weer via Open-Meteo
- AI suggesties via Claude met echte context
- Offline banner + lokale SQLite database

---

# Changelog

| Versie | Datum | Wijziging |
|---|---|---|
| 1.0 | 2026-06-10 | Initieel |
| 2.0 | 2026-06-28 | Fases 1-5 compleet |
| 3.0 | 2026-06-28 | Roadtrip-modus + Settings gebouwd, alle schermen compleet |
