# Web-app vs Flutter-app — functievergelijking

**Document ID:** TC-TECH-003
**Version:** 1.1
**Status:** Living document — bijwerken zodra een rij daadwerkelijk is overgezet
**Last Updated:** 2026-07-01

---

## Doel

Er bestaan twee parallelle implementaties van Travel Cockpit:

- **Web-app** (`index.html`, `js/*.js`, `css/styles.css`, `api/*.js`) — vanilla HTML/CSS/JS, geen build-stap, live op Vercel, wat de gebruiker vandaag daadwerkelijk gebruikt.
- **Flutter-app** (`lib/**/*.dart`) — Riverpod + Drift/SQLite + GoRouter, build-geverifieerd (zie `DL-014`) maar nog nooit door de gebruiker zelf getest; alleen als Android-debug-APK beschikbaar (zie `.github/workflows/flutter-android-build.yml`).

Besluit (2026-07-01): de web-app blijft het actief ontwikkelde product. Functies die alleen in Flutter zitten en waarde toevoegen, worden overgezet naar de web-app — zonder bestaande web-functionaliteit te verwijderen. Dit document is de vastgelegde inventarisatie waarop dat besluit is gebaseerd, en wordt bijgewerkt naarmate rijen daadwerkelijk worden overgezet.

Let op: een eerste geautomatiseerde scan van de Flutter-codebase onderschatte wat de web-app al kan, omdat die scan `js/`-bestanden niet meelas. De tabel hieronder is gecorrigeerd op basis van de daadwerkelijke web-app-code.

---

## Vergelijkingstabel

| Functie | Web-app | Flutter | Conclusie |
|---|---|---|---|
| Multi-trip (aanmaken/wisselen/verwijderen) | **Overgezet (Fase B)** — `js/screen-tickets.js` `saveTrip()`/`renderTripsScreen()`/`handleActivateTrip()`/`handleDeleteTrip()`, echt persistent in Firestore (`trips/{tripId}`), incl. accommodaties toevoegen bij aanmaken | Echt — `lib/data/repositories/trip_repository.dart`, `lib/providers/trip_provider.dart`, Drift-DB, DL-004 (1 actieve reis) | **Gelijkwaardig — beide echt, web-app leidend** |
| Datamodel accommodaties/activiteiten | **Overgezet (Fase B)** — accommodaties verhuisd van hardcoded `js/data.js`-array naar Firestore-subcollectie `trips/{tripId}/accommodations`, geladen via `dbLoadAccommodations()`/`applyTripData()` in `js/state.js`; activiteiten/tickets al in Firestore | Genormaliseerd: `Place`/`Accommodation`/`PlanningItem`/`Trip` (`lib/domain/models/*.dart`, `lib/data/local/tables/*.dart`) | **Gelijkwaardig — web-app gebruikt Firestore-documenten i.p.v. Drift-tabellen, functioneel gelijk fundament** |
| Instellingen | Voertuig (3), reisstijlen (6), AI-toggle — **niet persistent**, reset bij refresh | Voertuig (3), reisstijlen (8), AI + weer-toggle, taal (NL/EN/DE) — **persistent** (`lib/ui/screens/settings/settings_screen.dart`) | **Overzetten: persistentie + taal + 2 extra stijlen** |
| Laadstations | `js/charging.js`: alleen een toast met top-3, `renderChargingStationCard()` bestaat maar wordt nergens aangeroepen (dode code) | Echte lijst-UI: DC/AC-filter, beschikbaarheids-balken, navigeren (`lib/ui/screens/charging/charging_screen.dart`) | **Bouwen — lost meteen de dode-code-bug op** |
| Tickets | **Echt en verder**: Firebase-persistent, gedeeld tussen toestellen, foto-upload, archief-sectie (`js/screen-tickets.js`) — heeft bekende bugs (array-index-als-ID) | Nog niet aan de database gekoppeld, mooiere uitklapbare barcode-UI, personen-aantal-veld | **Web-app blijft leidend qua persistentie; alleen UI-vondsten (barcode, personen-aantal) overnemen** |
| AI-ideeën (Discover) | **Echt en verder**: categoriefilter, Verblijf/Hier-locatiemodus, Firestore-gedeelde cache + localStorage-fallback, offline-afhandeling, Komoot-links (`js/screen-discover.js`) | Categoriefilter, skeleton-loading-animatie, cache alleen per toestel (geen deling) | **Web-app blijft leidend; alleen skeleton-loading-polish overnemen** |
| Kaart | Leaflet, rechte lijnen (bekende bug), accommodatie+activiteit-pins, filters, GPS-tracker (bekende bug: stopt niet) (`js/screen-map.js`) | FlutterMap, zelfde route-data, dag-labels op pins ("D4-2"), klik-op-accommodatie-pin filtert | **Grotendeels gelijk — 2 UX-vondsten overnemen** |
| Roadtrip-modus | Bestaat al: weerstrip, huidig+volgend verblijf, volgende activiteit, voortgang, 4 snelknoppen (`js/screen-roadtrip.js`) | Bestaat: zelfde opzet + ingebouwde uitklapbare mini-kaart | **Geen ontbrekende functie — alleen mini-kaart-idee overnemen** |
| Offline-indicator | Ontbreekt volledig | Verbindings-banner (`lib/ui/widgets/offline_banner.dart`, `lib/providers/connectivity_provider.dart`) | **Toevoegen — echt gat** |
| Activiteit-detail | Bottom-sheet: AI-verrijking, verplaatsen naar andere dag, verwijderen, route (`sheet-place-detail` in `index.html` + `js/screen-planning.js`) | Volledig scherm: hero-afbeelding, share-knop — mist AI-verrijking/verplaatsen/verwijderen (`lib/ui/screens/activity/activity_detail_screen.dart`) | **Samenvoegen: visuele lay-out overnemen, alle bestaande acties behouden** |
| Weer | Echt (Open-Meteo) (`js/weather.js`) — **bug gefixt (Fase B)**: `getToday()` gebruikt nu altijd de echte datum, met eerlijke "reis begint over X dagen"/"reis afgerond"-banner buiten het reisvenster i.p.v. gefingeerde datums | Echt (Open-Meteo) (`lib/providers/weather_provider.dart`) | **Gelijk — niets meer over te nemen** |
| AI-architectuur | Server-side proxy via Vercel (`api/suggestions.js`) — API-sleutel blijft van het toestel af | Directe client-aanroep via Dio (`lib/data/remote/anthropic_client.dart`) | **Web-app's aanpak is veiliger — niets overnemen** |
| Regionale gids | Bestaat niet | Alleen een datamodel (`lib/domain/models/regional_guide_entry.dart`), geen tabel, geen UI — dormant | **Expliciet post-MVP (`DL-012`) — niet bouwen, alleen hier genoteerd voor later** |

---

## Wat blijft ongewijzigd van de web-app

Expliciet: de volgende web-app-functionaliteit wordt **niet** vervangen door een Flutter-equivalent, ook niet als Flutter een visueel andere aanpak heeft:

- Firestore-gedeelde AI-cache en Verblijf/Hier-locatiemodus in Discover
- Ticket-persistentie via Firestore, inclusief foto-upload en archief-sectie
- AI-verrijking, verplaatsen en verwijderen van activiteiten
- Server-side AI-proxy (API-sleutel blijft van het toestel af)

---

## Change History

| Versie | Datum | Wijziging |
|---|---|---|
| 1.0 | 2026-07-01 | Initiële vergelijking, opgesteld als basis voor het web-app-uitbreidingsplan |
| 1.1 | 2026-07-01 | Fase B gemerged (PR #7): multi-trip en het accommodatie/activiteiten-datamodel zijn overgezet naar Firestore, de weer-bug buiten het reisvenster is gefixt. Rijen "Multi-trip", "Datamodel accommodaties/activiteiten" en "Weer" bijgewerkt van "gat" naar "gelijkwaardig/gefixt". Fase C (instellingen, laadstations, offline-banner, activiteit-detail, kaart-/roadtrip-polish) en Fase D (design) staan nog open. |
