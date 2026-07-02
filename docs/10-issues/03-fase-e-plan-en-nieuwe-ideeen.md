# Fase E — plan: verblijf/reis/ticket-CRUD + rode-team-bevindingen + nieuwe ideeën

**Document ID:** TC-ISSUES-003
**Status:** Plan ter bespreking — **niet bouwen voordat de vragen onderaan beantwoord zijn**
**Bron:** Red-team code-review van de hele app (backlog `01-testronde-30juni.md` + `02-feedback-01juli.md` + `docs/09-roadmap/01-mvp.md` opnieuw langsgelopen tegen de huidige code) + brainstorm nieuwe functies

---

## Deel 1 — Bevestigde, nog openstaande bugs (rode team)

Onderstaande zijn stuk voor stuk geverifieerd in de huidige code — geen aannames.

| # | Bevinding | Bewijs | Voorstel |
|---|---|---|---|
| H1 | "Laders: 04" op het Vandaag-scherm is nog steeds hardcoded, ondanks dat de laadstations-subtitel op Meer al eerder eerlijk gemaakt is | `index.html`: `<span class="stat-num">04</span><span class="stat-label">Laders</span>` — geen `id`, nergens door JS aangeraakt | Vervangen door iets eerlijks: geen getal tonen (gewoon "Laders" met bliksem-icoon, linkt door), of een echte teller die pas telt ná een opgehaalde lijst |
| H2 | Het "Gearchiveerd"-ticket ("Klimapark 2469") is 100% hardcoded HTML — niet gekoppeld aan `AppState.tickets`, nergens klikbaar, kan nooit wijzigen of verdwijnen | `index.html` regel ~350: statische `<div class="card">` met vaste tekst, los van de ticket-render-logica in `js/screen-tickets.js` | Zie H2-uitwerking hieronder — hangt samen met een structurele omissie: tickets hebben nu geen "gebruikt/archiveer"-status, alleen aanmaken/verwijderen |
| H3 | Discover-filterchip "Eten & café" toont in werkelijkheid alleen suggesties met `category === 'restaurant'` — cafés (`category === 'cafe'`) worden stilzwijgend uitgefilterd, ondanks de knoptekst | `js/screen-discover.js` `renderSuggestionList()`: `list.filter(s => s.category === currentCategoryFilter ...)`, chip geeft alleen `'restaurant'` mee | Filter zo aanpassen dat de "Eten & café"-chip zowel `restaurant` als `cafe` toont |
| H4 | Nieuwe suggesties vervangen bij elke "↻ Nieuwe ideeën"-klik de hele lijst — oudere suggesties zijn daarna weg, ook al had je ze nog niet bekeken/gebruikt | `js/screen-discover.js` `handleLoadMoreSuggestions()`: `currentSuggestions = newSuggestions;` (overschrijft, plakt niet erbij) | Al genoteerd als D10 in `01-testronde-30juni.md`, nooit opgelost. Voorstel: bij verversen toevoegen i.p.v. vervangen, met een max-lijstlengte en dedupe op naam |
| H5 | Vanuit de kaart een activiteit-pin tikken geeft alleen "+ Plan" en "Route" — de acties Verplaatsen/AI-verrijking/Verwijderen (die wél bestaan vanuit Planning) ontbreken hier, terwijl het dezelfde sheet is | `js/screen-map.js` `openPlaceDetailSheet()` vult `#pd-extra-actions` nooit; `js/screen-planning.js` `openActivityDetailSheet()` wel | Dit was testronde-punt B4, gedeeltelijk opgelost. Voorstel: beide functies laten samenkomen zodat de sheet overal dezelfde acties toont |
| H6 | Geen enkele manier om een reis (naam/land), een ticket, of een activiteit-naam/beschrijving achteraf te **bewerken** — overal alleen aanmaken + verwijderen, nooit wijzigen | Doorgelicht: `js/screen-tickets.js`, `js/state.js` — geen `updateTrip`/`updateTicket`-achtige functie bestaat (wel `updateActivity`, maar alleen voor dag/verblijf, niet naam/beschrijving) | Hoort bij de kern van Fase E — "veel moet wijzigbaar zijn" |
| H7 | Accommodatiepins staan op plaatscentrum-coördinaten, niet het echte adres | Testronde B5, nog steeds zo — `js/data.js` lat/lng zijn centrumcoördinaten | Lost zichzelf op zodra Fase E een "verblijf bewerken"-formulier heeft: dan kun je zelf de exacte coördinaten invullen |

---

## Deel 2 — Nieuwe functie-ideeën (brainstorm, nog geen van alle gebouwd)

| # | Idee | Waarom waardevol | Inschatting |
|---|---|---|---|
| N1 | **Echte offline-app-shell** (Service Worker, cache-first voor HTML/CSS/JS) | Firestore-data is al offline beschikbaar (`enablePersistence` staat al aan), maar de app zelf (HTML/CSS/JS) heeft geen eigen cache-strategie. In Noorse fjorden/bergen is er vaak geen bereik — dit is precies waar de app dan zou moeten blijven werken, en dat is nu niet gegarandeerd | Middel — één nieuw bestand (`sw.js`) + registratie, geen datamodel-impact |
| N2 | **Web app manifest** (`manifest.json`) | Nu alleen iOS-specifieke meta-tags; een manifest geeft ook Android-vrienden een fatsoenlijk "installeer op beginscherm" en een correct app-icoon/splash-scherm overal | Klein |
| N3 | **"Bij deze activiteit" Discover-modus** | Los van "Vanuit verblijf" en "Hier" (live GPS): na het afvinken van een activiteit meteen iets vlakbij díe activiteit voorstellen (café, volgende stop) i.p.v. terug naar het verblijf. Dit is letterlijk testronde-wens D8, nooit gebouwd | Middel — hergebruikt bestaande Discover-infrastructuur met een 3e modus |
| N4 | **Ticket archiveren i.p.v. alleen verwijderen** | Lost H2 structureel op: een ticket krijgt een "markeer als gebruikt"-knop, verhuist naar een echte (niet hardcoded) "Gearchiveerd"-sectie, blijft aantikbaar voor details. Voorkomt ook dataverlies (nu is verwijderen de enige optie na gebruik) | Klein–middel |
| N5 | **Notitieveld per activiteit** (niet alleen per verblijf) | Parkeertip, reserveringsnummer, praktische info bij één specifieke activiteit — verblijven hebben dit al (`notes`), activiteiten niet | Klein |
| N6 | **Reisdata exporteren (JSON-download)** | Er is geen account-systeem en Firestore-rules zijn bewust alleen schema-validatie, geen echte toegangscontrole (eerder al zo gedocumenteerd). Een simpele "exporteer deze reis"-knop is een goedkope verzekering tegen dataverlies, geheel onder eigen controle | Klein |
| N7 | **Route via echte wegen** (OSRM i.p.v. rechte lijnen) | Lost B1/B2/B3 in één keer op (heen/terug-route zien er nu verschillend uit, geen Hamburg-omweg, ferryroute loopt over land) | **Groot** — vereist een routing-API-integratie, eigen fase waard, niet in Fase E |
| N8 | **Meerdaagse weersverwachting-strip** | Nu alleen "vandaag" zichtbaar in Roadtrip/Discover; een 3–5-daagse strip zou vooruitplannen (bijv. binnendag bij regen) makkelijker maken | Klein — Open-Meteo geeft dit al terug, kwestie van tonen |

---

## Deel 3 — Prioriteringsvoorstel

**Voorstel om samen met Fase E (verblijf-CRUD) op te pakken, want zelfde soort werk / zelfde bestanden:**
H1, H2+N4 (samen), H3, H5, H6, N5

**Voorstel als aparte, kleine vervolgstap na Fase E (los, snel te doen):**
N1, N2, N6, N8, H4

**Voorstel om NIET nu te doen, apart te bespreken:**
N7 (grote scope, eigen fase), N3 (leuk maar niet urgent), H7 (lost zichzelf vanzelf op zodra Fase E er is)

---

## Open vragen (beantwoorden voordat er gebouwd wordt)

1. Ga je akkoord met bovenstaande indeling (H1/H2/H3/H5/H6/N5 in Fase E, N1/N2/N6/N8/H4 als snelle vervolgstap, N7 en N3 apart bespreken)? Of wil je zelf schuiven?
2. Voor **H6** (reis/ticket/activiteit bewerken): moet dit losse "bewerken"-knoppen worden op bestaande schermen, of een centraal "bewerken"-icoon per kaart/rij zoals bij de nieuwe laadstations-lijst?
3. Voor **N4** (ticket archiveren): moet er ooit een archiveren-knop dubbel-tikken-bevestiging nodig hebben (zoals nu bij reis/verblijf verwijderen), of mag dat direct?
4. Voor **N6** (JSON-export): alleen een download, of ook een manier om die JSON weer te **importeren** (bijv. als je van toestel wisselt)? Import is meer werk en meer risico (kan bestaande data overschrijven).
5. Blijven de vijf open vragen uit `02-feedback-01juli.md` over verblijf-CRUD (bewerkscherm vs. inline, automatisch reisdata herberekenen, hoe ver terug-navigeerbaar bij oude verblijven, boekingsnummer-veld, wat gebeurt er met activiteiten bij verblijf-verwijderen) nog steeds relevant en onbeantwoord — wil je die nu samen met bovenstaande beantwoorden?

---

## Antwoorden (2026-07-02) — definitief bouwplan

1. **Indeling akkoord.** H1, H2+N4, H3, H5, H6, N5 worden nu in Fase E gebouwd. N1/N2/N6/N8/H4 volgen als snelle vervolgstap. N7 (echte routing) en N3 (Discover "bij activiteit") apart later.
2. **Bewerk-UI (H6):** los potlood-icoontje per rij/kaart — niet via het detail-sheet.
3. **Archiveren (N4):** direct, geen dubbel-tik-bevestiging (niet destructief, terug te zetten).
4. **Export/import (N6):** geparkeerd als backlog-item, geen keuze gemaakt over import — wordt behandeld als losse vervolgstap, niet in Fase E zelf.
5. **Fase E verblijf-CRUD, definitief:**
   - Reis start/einddatum groeit automatisch mee met verblijf-wijzigingen (herberekend uit min/max van alle verblijf-data, zoals bij aanmaken).
   - Oude verblijven zijn terug-navigeerbaar naar hun activiteiten van toen (niet alleen een lijst).
   - Verblijf krijgt alleen een klikbare URL (hotel/Airbnb-link) — geen apart boekingsnummer/telefoonveld, dat kan later als het nodig blijkt.
   - Verblijf verwijderen: **vraagt het elke keer** wat er met de bijbehorende activiteiten moet gebeuren (verwijderen of onaangeroerd laten zonder verblijf).

### Concreet bouwplan Fase E

1. **Verblijf bewerken** — potlood-icoon per verblijf-rij (Mijn reizen, accommodatie-switcher-tijdlijn) opent een bewerkformulier: naam, adres, check-in/uit, lat/lng, notities, URL. Opslaan herberekent de reis start/einddatum uit alle verblijven.
2. **Verblijf verwijderen met keuze** — bij verwijderen een sheet/dialoog: "Ook de X activiteiten van deze dagen verwijderen?" met twee knoppen (verwijderen / laten staan zonder verblijf).
3. **Oude verblijven terug-navigeerbaar** — de bestaande "alle verblijven"-tijdlijn (in het accommodatiescherm) krijgt filtering op datum-in-het-verleden mogelijk maken, en een tik op zo'n oud verblijf toont de activiteiten van toen (niet per se "vandaag").
4. **Reis bewerken** — potlood-icoon op de actieve-reis-kaart in "Mijn reizen": naam/land wijzigen.
5. **Ticket bewerken + archiveren** — potlood-icoon per ticket-rij voor bewerken; een "markeer als gebruikt"-knop verplaatst 'm naar een echte (dynamische) Gearchiveerd-sectie, direct, geen bevestiging. De hardcoded "Klimapark 2469" wordt een gewoon (eerste) archief-ticket-object.
6. **Activiteit bewerken** — potlood-icoon in de activiteit-detail-sheet-rij binnen Planning voor naam/beschrijving (niet alleen dag/verblijf zoals nu al kan via "Verplaatsen").
7. **H1 fix** — "Laders: 04" op Vandaag-scherm eerlijk maken (geen los getal tonen).
8. **H3 fix** — "Eten & café"-filter toont ook cafés.
9. **H5 fix** — kaart-pin-detail-sheet krijgt dezelfde Verplaatsen/AI-verrijking/Verwijderen-acties als vanuit Planning.

---

## Volgende stap

Zodra bovenstaande vragen beantwoord zijn, wordt dit document samengevoegd met de bestaande Fase E-aantekeningen in `02-feedback-01juli.md` tot één concreet bouwplan, en pas dán wordt er gebouwd.
