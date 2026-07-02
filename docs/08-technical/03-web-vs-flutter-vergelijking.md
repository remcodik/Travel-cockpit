# Web-app vs Flutter-app — functievergelijking

**Document ID:** TC-TECH-003
**Version:** 1.4
**Status:** Living document — bijwerken zodra een rij daadwerkelijk is overgezet
**Last Updated:** 2026-07-02

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
| Instellingen | **Overgezet (Fase C)** — Voertuig (3), reisstijlen (8), AI + weer-toggle, taal (NL/EN/DE) — **persistent** via `localStorage` (`loadSettingsFromStorage()`/`saveSettingsToStorage()` in `js/state.js`, `renderSettingsScreen()` in `js/screen-tickets.js`) | Voertuig (3), reisstijlen (8), AI + weer-toggle, taal (NL/EN/DE) — persistent (`lib/ui/screens/settings/settings_screen.dart`) | **Gelijkwaardig — web-app gebruikt device-lokale `localStorage` i.p.v. SharedPreferences, functioneel gelijk** |
| Laadstations | **Overgezet (Fase C)** — echte lijst in `sheet-charging`: DC/AC-filter (afgeleid uit connectortype/vermogen), operator/vermogen/laadpunten, "buiten dienst"-badge, laadstations langs hele route (`openChargingStationsSheet()` in `js/charging.js`). Tik op een station opent Google Maps' plek-pagina (naam + coördinaten als zoekopdracht, `openGoogleMapsPlace()`) i.p.v. direct een route — zo is er eerst info/reviews te zien, met een route-knop op die pagina zelf. Bewust géén live beschikbaarheid getoond — Open Charge Map levert dat niet, dus geen verzonnen X/Y-cijfers | Lijst-UI met DC/AC-filter, maar beschikbaarheids-balken zijn **hardcoded mock-data** (`_stations` in `charging_screen.dart`), niet gekoppeld aan een echte API | **Web-app is nu eerlijker: minder visuele polish, maar 100% echte data. Geen mock-beschikbaarheid overnemen.** |
| Tickets | **Echt en verder**: Firebase-persistent, gedeeld tussen toestellen, foto-upload, archief-sectie (`js/screen-tickets.js`) — heeft bekende bugs (array-index-als-ID) | Nog niet aan de database gekoppeld, mooiere uitklapbare barcode-UI, personen-aantal-veld | **Web-app blijft leidend qua persistentie; alleen UI-vondsten (barcode, personen-aantal) overnemen** |
| AI-ideeën (Discover) | **Echt en verder, plus skeleton-loading (Fase C)**: categoriefilter, Verblijf/Hier-locatiemodus, Firestore-gedeelde cache + localStorage-fallback, offline-afhandeling, Komoot-links, shimmer-skeleton i.p.v. spinner tijdens laden (`js/screen-discover.js`, `.skeleton-shimmer` in `css/styles.css`) | Categoriefilter, skeleton-loading-animatie, cache alleen per toestel (geen deling) | **Web-app blijft leidend, nu ook qua laad-UX gelijkwaardig** |
| Kaart | **Overgezet (Fase C)**: dag-labels met volgnummer op pins ("D4-2") bij meerdere activiteiten per dag, tik-op-accommodatiepin filtert (nogmaals tikken opent detail), dynamische filterchips per reis i.p.v. hardcoded Noorwegen-chips, pins verversen nu bij elk bezoek i.p.v. alleen de allereerste keer (`js/screen-map.js`). Rechte lijnen (bekende bug) en GPS-tracker-stop-bug blijven open — apart, groter werk (echte routing-API) | FlutterMap, zelfde route-data, dag-labels op pins ("D4-2"), klik-op-accommodatie-pin filtert | **Gelijkwaardig — beide UX-vondsten overgenomen, plus een multi-trip-regressie (verouderde pins/chips na reiswissel) gevonden en gefixt** |
| Roadtrip-modus | **Overgezet (Fase C)**: bestond al (weerstrip, huidig+volgend verblijf, volgende activiteit, voortgang, 4 snelknoppen), nu met ingebouwde uitklapbare mini-kaart (`toggleRoadtripMiniMap()` in `js/screen-roadtrip.js`) | Bestaat: zelfde opzet + ingebouwde uitklapbare mini-kaart | **Gelijkwaardig — mini-kaart-idee overgenomen** |
| Offline-indicator | **Overgezet (Fase C)** — `navigator.onLine`-gebaseerde balk, duwt content naar beneden i.p.v. te overlappen (`js/offline.js`, `#offline-banner` in `index.html`) | Verbindings-banner (`lib/ui/widgets/offline_banner.dart`, `lib/providers/connectivity_provider.dart`) | **Gelijkwaardig** |
| Activiteit-detail | **Samengevoegd (Fase C)** — bottom-sheet blijft (geen aparte navigatie-stap), header nu een gekleurde hero-band met groter emoji + naam + meta-badges (`renderPdHero()` in `js/screen-map.js`), alle bestaande acties behouden: AI-verrijking, verplaatsen, verwijderen, route (`sheet-place-detail` in `index.html` + `js/screen-planning.js`) | Volledig scherm: hero-afbeelding, share-knop — mist AI-verrijking/verplaatsen/verwijderen (`lib/ui/screens/activity/activity_detail_screen.dart`) | **Web-app-aanpak is nu functioneel completer én visueel verrijkt — niets overnemen** |
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
| 1.2 | 2026-07-02 | Fase C afgerond: instellingen-persistentie + taal + weer-toggle + 2 extra reisstijlen, echte laadstations-lijst (zonder verzonnen beschikbaarheidscijfers, zie eerlijkheidsprincipe), offline-banner, discover-skeleton-loading, kaart-dag-labels + tik-op-accommodatie-filter + dynamische filterchips, roadtrip-mini-kaart, en visueel verrijkte activiteit-detail-hero. Bijvangst: een echte productiebug gevonden en gefixt — accommodatie-ID's werden sinds Fase B inconsistent als string (Firestore) én number (`parseInt()`/ongequote template-literals) gebruikt, wat "+Plan" in Discover, activiteit verplaatsen/toevoegen en de kaart-accommodatiefilter kon laten crashen of stil laten falen (`js/data.js`, `js/screen-planning.js`, `js/screen-discover.js`, `js/screen-accommodation.js`, `js/screen-map.js`). Losstaand: een safe-area/statusbalk-bug (dubbel `class`-attribuut) die de terug-knop op 5 schermen onbereikbaar maakte, is apart gefixt (zie `docs/10-issues/02-feedback-01juli.md`). Fase D (topografisch design, met Komoot-hoogteprofiel i.p.v. zelfgebouwde hoogtekaart) staat nog open. |
| 1.3 | 2026-07-02 | Laadstations-kaart: tik op een station opent nu Google Maps' plek-pagina (naam + coördinaten, `openGoogleMapsPlace()` in `js/charging.js`) i.p.v. direct een route-deeplink, zodat je eerst info/reviews kunt bekijken — met een route-knop op die pagina zelf. |
| 1.4 | 2026-07-02 | Fase D (deels): topografische contourlijnen zijn nu locatie-specifiek — seed afgeleid van echte coördinaten, ringdichtheid afgeleid van elevatie (`topoSeedForLocation()`/`generateTopoLines(seed, elevation)` in `js/topo.js`, toegepast op accommodatie-hero en Discover-header). Iconen unificeren tussen handmatige activiteiten en AI-suggesties via gedeelde `CATEGORY_EMOJIS` (`js/data.js`) — dit loste ook een echte bug op: het categorie-icoon van een AI-suggestie ging verloren (viel terug op generiek 📍) zodra je "+ Plan" tikte; handmatig toegevoegde activiteiten hebben nu ook een soort-kiezer i.p.v. altijd 📍. Nog open in Fase D: kleur-als-wayfinding verdiepen, en onderzoek of Komoot's hoogteprofiel embedbaar is bij wandelsuggesties (zie `docs/10-issues/02-feedback-01juli.md`). |
