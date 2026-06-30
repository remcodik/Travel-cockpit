# Testronde 30 juni — Bevindingen

**Document ID:** TC-ISSUES-001
**Status:** Te bespreken — NIET starten met bouwen voordat dit is doorgenomen
**Bron:** Live testronde door Remco op iPhone, v6 modulaire build

---

## Werkwijze-afspraak

Vanaf nu: **eerst overleg, dan pas bouwen.** Elk punt hieronder wordt besproken, geprioriteerd en mogelijk verduidelijkt voordat er code wordt geschreven. Pas opleveren nadat iets daadwerkelijk werkt (zelf geverifieerd) of wanneer is vastgesteld dat het niet haalbaar is — niet eerder.

---

## A. Blokkerend — moet eerst opgelost

| # | Bevinding | Vermoedelijke oorzaak | Open vraag |
|---|---|---|---|
| A1 | Laadstations: na sleutel toevoegen + redeploy nog steeds geen data | Mogelijk verkeerde deployment gepromoot (rode stip zichtbaar op recente "Redeploy of F2sGZ157a") | Welke deployment is de juiste? Moet eerst correct READY + Production zijn voordat we verder testen |
| A2 | Tickets worden niet opgeslagen — verdwijnen na refresh | Tickets staan alleen in JS-geheugen (`AppState.tickets`), geen persistente opslag | Welke opslag: localStorage (simpel, lokaal) of een echte backend/database (duurzamer, werkt cross-device)? |
| A3 | Vanuit Ideeën een activiteit gepland → verschijnt niet in Planning | Vermoedelijk a) datum wordt niet meegegeven bij toevoegen vanuit Discover, of b) planning-rendering filtert verkeerd | Te onderzoeken voordat fix wordt voorgesteld |

---

## B. Kaart — route, pins, GPS

| # | Bevinding | Notitie |
|---|---|---|
| B1 | Heen- en terugroute zien er verschillend uit (Nijmegen↔Hirtshals) | Routes zijn nu handmatig getekende rechte lijnen in `DRIVE_PATHS`/`FERRY_PATHS` (data.js), geen echte wegen |
| B2 | Auto-route zou via Hamburg moeten (kloppend met echte rijroute), graag voor hele route als het niet te lastig is | Vereist een echte routing-API (bijv. OSRM) i.p.v. handgetekende coördinaten-arrays |
| B3 | Ferryroute Hirtshals→Stavanger heeft een onlogische knik en loopt over land | Zelfde oorzaak als B1/B2 — handgetekende lijn, geen zeeroute-logica |
| B4 | Activiteit-pin popup op kaart: kan niet naar activiteitdetail, alleen "Route" | `showToast()` bij klik geeft geen navigatie-optie naar het activiteitscherm |
| B5 | Accommodatiepins staan op centrum van stad/dorp, niet op het exacte adres | `data.js` lat/lng voor accommodaties zijn plaatscentrum-coördinaten, niet het werkelijke adres |
| B6 | Wens: GPS-trackline visueel onderscheid tussen ferry/auto/fiets/lopen, evt. instelbaar | Nieuw concept — moet worden uitgedacht (snelheid-gebaseerd automatisch detecteren? handmatige modus-keuze?) |
| B7 | Wens: alternatief voor de huidige simpele kaart, iets als Google Maps-stijl met activiteiten zichtbaar — maar alleen als het geen zware/complexe toevoeging wordt | Afweging nodig: meerwaarde vs. bouwcomplexiteit |

---

## C. Planning & activiteiten

| # | Bevinding | Notitie |
|---|---|---|
| C1 | Iconen in Planning zien er anders uit dan iconen vanuit AI-ideeën | Twee aparte databronnen (`ACTIVITIES` hardcoded vs AI-respons) met elk eigen emoji-logica, niet gesynchroniseerd |
| C2 | Geen manier om een activiteit uit Planning te verwijderen | Functionaliteit ontbreekt — alleen toevoegen en afvinken bestaat nu |
| C3 | Een handmatig toegevoegde activiteit zou "verrijkt" moeten kunnen worden met AI (details aanvullen) | Nieuw concept, nog niet gebouwd |
| C4 | Een geplande activiteit zou verplaatsbaar moeten zijn naar andere datum/verblijf | Bewerken bestaat nu niet, alleen aanmaken |
| C5 | Bij "Activiteit toevoegen": het dagkeuze-veld toont standaard Dag 1 (15 juni, lang voorbij) en Sogndal, ook als je vanuit dag 27/Gjerstad op de knop drukt | Het formulier zou de context (huidige geselecteerde dag/verblijf) moeten overnemen als beginwaarde |

---

## D. AI-ideeën (Discover)

| # | Bevinding | Notitie |
|---|---|---|
| D1 | Onduidelijk of suggesties automatisch verversen of alleen via de knop | Vermoeden: gebruiker wil dit **niet** automatisch — alleen op expliciete actie |
| D2 | "Route"-knop bij een suggestie doet niets | `showToast()` placeholder, geen echte actie. Gewenst: knop voor route vanaf huidige locatie, los van route vanaf verblijf |
| D3 | Wens: Komoot-link toevoegen bij wandelsuggesties voor meer detail | Externe link-koppeling, te onderzoeken of Komoot dit ondersteunt zonder API-sleutel |
| D4 | Cursieve "waarom relevant"-tekst is lastig leesbaar | Designkwestie — simpele CSS-aanpassing |
| D5 | Gewenst: tijd, afstand én hoogteverschil altijd zichtbaar per suggestie | Data komt al deels van AI terug (`duration_minutes`, `distance_km`) maar hoogteverschil ontbreekt nog in het schema |
| D6 | Wens: hoogtekaart van de hele route | Apart visueel element, nog te ontwerpen |
| D7 | Onduidelijk of suggesties gebaseerd zijn op accommodatie of actuele live locatie | Op dit moment: altijd op de actieve accommodatie, nooit op live GPS-positie |
| D8 | Wens: als een activiteit afgelopen is, wil de gebruiker een café in de buurt van de activiteit zien — niet terug naar het verblijf | Vereist live locatie als basis i.p.v. accommodatie-locatie, contextafhankelijk |
| D9 | Onduidelijk of "eten"-categorie ook cafés omvat, niet alleen restaurants | Te verifiëren/aan te passen in de AI-systeemprompt |
| D10 | Wens: suggesties moeten bewaard blijven, niet verdwijnen bij een ververs-actie | Hangt samen met D1 — cache-gedrag moet duidelijker |
| D11 | Suggesties tonen niet expliciet bij welk verblijf/dag ze horen wanneer je vanuit een specifieke dag naar Ideeën navigeert | Filter zou automatisch moeten matchen met het scherm waar je vandaan komt |

---

## E. Vandaag-scherm / cijfers

| # | Bevinding | Notitie |
|---|---|---|
| E1 | Onduidelijk waar de getallen bij de statistiekenstrip (Te doen/Gedaan/Tickets/Laders) vandaan komen — "Laders: 04" klopt niet, lijkt hardcoded | **Bevestigd**: "04" voor laders staat letterlijk vast in de HTML, geen live koppeling. Tickets-telling is wel deels echt (1 + AppState.tickets.length) |

---

## F. Overig / polish

| # | Bevinding | Notitie |
|---|---|---|
| F1 | App-icoon op iPhone-beginscherm is saai/onduidelijk | Huidig icoon was een eerste poging, toe aan een echt herontwerp |
| F2 | Tekst bovenin sommige schermen loopt door de systeembalk (klok/batterij) heen | Vermoedelijk ontbrekende `padding-top: env(safe-area-inset-top)` op specifieke schermen |
| F3 | Na een ticket "gebruikt" markeren (bijv. Klimapark) kan niet meer naar de details terug | Het gearchiveerde ticket-blok heeft geen klik-actie naar een detailweergave |
| F4 | Onduidelijk waar je accommodaties toevoegt — zowel bij het aanmaken van een nieuwe reis als tijdens een lopende reis | Functionaliteit ontbreekt volledig — "Reis toevoegen" vraagt nu geen accommodaties uit |

---

## Openstaande technische vraag (A1) die voorrang heeft

De laatste deployment-lijst toont een rode stip bij de bovenste regel ("Redeploy of F2sGZ157a"). Voordat we verder testen op laadstations/weer moet vastgesteld worden:
1. Is die rode stip een failed deployment?
2. Welke deployment is daadwerkelijk "Production" nu?
3. Is de OPENCHARGEMAP_API_KEY beschikbaar in de deployment die nu live staat?

---

## Volgende stap

Dit document doornemen punt voor punt, prioriteit bepalen (wat is blokkerend, wat is "nice to have"), en pas daarna een bouwvolgorde afspreken.
