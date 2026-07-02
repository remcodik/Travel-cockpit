# Feedback 1 juli — na Fase B (multi-trip)

**Document ID:** TC-ISSUES-002
**Status:** Bugs opgelost, CRUD-uitbreiding genoteerd als Fase E — **niet starten met bouwen voordat de open vragen hieronder zijn beantwoord**
**Bron:** Handmatige check door Remco op iPhone, direct na het mergen van Fase B (PR #7/#8)

---

## Opgelost (direct gefixt, zie commit `600c18c`)

| # | Bevinding | Oorzaak | Fix |
|---|---|---|---|
| G1 | "Sommige scherm gaat bovenkant door batterij en wifi tekens heen" — hierdoor was de terug-knop op Tickets/Mijn reizen/Instellingen niet te bereiken | Planning, Meer, Tickets, Mijn reizen en Instellingen hadden een **dubbel `class`-attribuut** (`class="px" class="safe-top"`) — een browser negeert het tweede `class`-attribuut, dus de `safe-area-inset-top`-padding werd nooit toegepast. Kaart-scherm miste de `safe-top`-class volledig. Dit is een terugkerend punt: was al genoteerd als F2 in `01-testronde-30juni.md`, toen ogenschijnlijk gefixt maar de fix bevatte deze copy-paste-bug | Dubbel class-attribuut samengevoegd tot één (`class="px safe-top"`); Kaart-scherm-header kreeg de `safe-top`-class alsnog |

---

## Genoteerd — Fase E: verblijf-CRUD (nog niet bouwen)

De gebruiker wil dat verblijven (accommodaties) volledig bewerkbaar zijn, niet alleen aanmaken. Concreet gemeld:

| # | Bevinding | Notitie |
|---|---|---|
| E1 | Een verblijf kan niet verlengd worden (check-out-datum wijzigen) | Er bestaat nu geen "verblijf bewerken"-flow — alleen aanmaken bij het aanmaken van een reis (`saveTrip()` in `js/screen-tickets.js`) |
| E2 | Voorbije verblijven zijn niet meer terug te vinden/te bekijken | `ACCOMMODATIONS` in `js/state.js` toont waarschijnlijk alleen wat relevant is voor "nu"; er is geen "alle verblijven van deze reis"-overzicht met verleden+toekomst |
| E3 | Wens: link toevoegen aan een verblijf (bijv. Booking.com/Airbnb-link) | Nieuw veld nodig in het Accommodation-datamodel (`trips/{tripId}/accommodations/{accId}`) + UI om het te tonen/openen |
| E4 | Wens: verblijf kunnen verwijderen of vervangen door een ander | Ontbreekt volledig — er is nu geen delete/replace-actie op verblijf-niveau (wel op reis-niveau, `handleDeleteTrip()`) |
| E5 | Algemene wens: "veel moet wijzigbaar zijn (CRUD) flexibel" | Bredere vraag dan alleen verblijven — mogelijk ook van toepassing op reis-metadata zelf (naam/land achteraf wijzigen) |

### Aanvullende ideeën (nog niet gevraagd, wel logisch gezien E1–E5 — ter bespreking)

- Notitieveld per verblijf (parkeerinfo, wifi-code, check-in-instructies)
- Waarschuwing bij overlappende data tussen twee verblijven van dezelfde reis
- Verblijf dupliceren (snel een vergelijkbaar volgend verblijf aanmaken)
- Reis zelf bewerken (naam/land wijzigen nadat hij is aangemaakt, niet alleen bij aanmaak)
- Automatisch reis-start/eind-datum herberekenen wanneer een verblijf wordt gewijzigd/verwijderd (nu alleen bij aanmaak, zie `createTrip()`)

### Open vragen (moeten beantwoord zijn voordat Fase E gebouwd wordt)

1. Moet een verblijf-bewerk-scherm een volledig scherm zijn (zoals "Reis toevoegen") of een inline-bewerkbare rij/sheet per verblijf?
2. Bij het verlengen/verkorten van een verblijf: moet de reis start/einddatum automatisch meegroeien, of blijft dat een aparte handeling?
3. Voor "voorbije verblijven bekijken": is een simpele lijst (net als de huidige route-strip op de Kaart) voldoende, of moet dit ook terug-navigeerbaar zijn naar de bijbehorende activiteiten van toen?
4. Voor de link naar hotel/Airbnb: alleen een klikbare URL, of ook een los "boekingsnummer"/telefoonnummer-veld zoals tickets al hebben?
5. Moet verblijf-verwijderen ook de bijbehorende activiteiten van die dagen verwijderen, verplaatsen, of onaangeroerd laten?

---

## Notitie voor Fase D (topografisch design)

Verduidelijking (1 juli): **geen zelfgebouwde hoogtekaart/hoogteprofiel.** Dit schrapt het "hoogteprofiel-navigatie i.p.v. platte dagtabs"-idee uit het Fase D-plan als eigen bouwwerk. Wat wél gewenst is: bij een wandeling, indien mogelijk, de bestaande Komoot-hoogtegrafiek hergebruiken/tonen (Komoot-link bestaat al bij wandelsuggesties, zie D3 in `01-testronde-30juni.md` en de "🗺 Komoot"-knop in `js/screen-discover.js`) — dus embedden/doorlinken naar Komoot's eigen hoogteprofiel in plaats van zelf een hoogtekaart te bouwen. Te onderzoeken in Fase D of Komoot dit zonder API-sleutel ondersteunt (embed of alleen doorlink). Het overige topografische design (contourlijnen, kleur als wayfinding, iconen-unificatie) blijft ongewijzigd staan.

---

## Volgende stap

Fase C (functies overzetten uit Flutter) gaat nu eerst verder, zoals afgesproken. Fase E wordt opgepakt zodra bovenstaande vragen zijn beantwoord. Fase D houdt rekening met de hierboven genoteerde afbakening.
