# Testronde 30 juni — Bevindingen

**Document ID:** TC-ISSUES-001
**Status:** Gesloten (2026-07-02) — vrijwel alles hieronder is inmiddels gebouwd of expliciet afgewezen; zie de tabellen voor per-punt status. Nog echt openstaande restjes zijn overgezet naar `docs/10-issues/08-restplan-openstaande-punten.md`.
**Bron:** Live testronde door Remco op iPhone, v6 modulaire build

---

## Werkwijze-afspraak

Vanaf nu: **eerst overleg, dan pas bouwen.** Elk punt hieronder wordt besproken, geprioriteerd en mogelijk verduidelijkt voordat er code wordt geschreven. Pas opleveren nadat iets daadwerkelijk werkt (zelf geverifieerd) of wanneer is vastgesteld dat het niet haalbaar is — niet eerder.

---

## A. Blokkerend — moet eerst opgelost

| # | Bevinding | Vermoedelijke oorzaak | Open vraag |
|---|---|---|---|
| A1 | ~~Laadstations: na sleutel toevoegen + redeploy nog steeds geen data~~ | **✅ Opgelost — deployment/API-key-issues zijn allang achterhaald.** | Welke deployment is de juiste? Moet eerst correct READY + Production zijn voordat we verder testen |
| A2 | ~~Tickets worden niet opgeslagen — verdwijnen na refresh~~ | **✅ Opgelost — tickets zijn sinds Fase B persistent via Firestore.** | Welke opslag: localStorage (simpel, lokaal) of een echte backend/database (duurzamer, werkt cross-device)? |
| A3 | ~~Vanuit Ideeën een activiteit gepland → verschijnt niet in Planning~~ | **✅ Opgelost — H4 en de accId-typefix (Fase C) lossen dit op.** | Te onderzoeken voordat fix wordt voorgesteld |

---

## B. Kaart — route, pins, GPS

| # | Bevinding | Notitie |
|---|---|---|
| B1 | ~~Heen- en terugroute zien er verschillend uit (Nijmegen↔Hirtshals)~~ | **✅ Deels — N7 (echte routing-API) blijft de fundamentele oplossing, zie 08-restplan.** |
| B2 | Auto-route zou via Hamburg moeten (kloppend met echte rijroute), graag voor hele route als het niet te lastig is | Vereist een echte routing-API (bijv. OSRM) i.p.v. handgetekende coördinaten-arrays |
| B3 | Ferryroute Hirtshals→Stavanger heeft een onlogische knik en loopt over land | Zelfde oorzaak als B1/B2 — handgetekende lijn, geen zeeroute-logica |
| B4 | ~~Activiteit-pin popup op kaart: kan niet naar activiteitdetail, alleen "Route"~~ | **✅ Opgelost — kaart-pin-detail toont nu dezelfde acties als vanuit Planning (Fase E).** |
| B5 | Accommodatiepins staan op centrum van stad/dorp, niet op het exacte adres | `data.js` lat/lng voor accommodaties zijn plaatscentrum-coördinaten, niet het werkelijke adres |
| B6 | Wens: GPS-trackline visueel onderscheid tussen ferry/auto/fiets/lopen, evt. instelbaar | Nieuw concept — moet worden uitgedacht (snelheid-gebaseerd automatisch detecteren? handmatige modus-keuze?) |
| B7 | Wens: alternatief voor de huidige simpele kaart, iets als Google Maps-stijl met activiteiten zichtbaar — maar alleen als het geen zware/complexe toevoeging wordt | Afweging nodig: meerwaarde vs. bouwcomplexiteit |

---

## C. Planning & activiteiten

| # | Bevinding | Notitie |
|---|---|---|
| C1 | ~~Iconen in Planning zien er anders uit dan iconen vanuit AI-ideeën~~ | **✅ Opgelost — iconen unificeren via gedeelde CATEGORY_EMOJIS (Fase D).** |
| C2 | ~~Geen manier om een activiteit uit Planning te verwijderen~~ | **✅ Opgelost — activiteit verwijderen bestaat (en de dubbel-tik-bug is net gefixt).** |
| C3 | ~~Een handmatig toegevoegde activiteit zou "verrijkt" moeten kunnen worden met AI (details aanvullen)~~ | **✅ Opgelost — AI-verrijking bestaat (openAiEnrichSheet).** |
| C4 | ~~Een geplande activiteit zou verplaatsbaar moeten zijn naar andere datum/verblijf~~ | **✅ Opgelost — activiteit verplaatsen bestaat (openMoveActivitySheet).** |
| C5 | ~~Bij "Activiteit toevoegen": het dagkeuze-veld toont standaard Dag 1 (15 juni, lang voorbij) en Sogndal, ook als je vanuit dag 27/Gjerstad op de knop drukt~~ | **✅ Opgelost — formulier neemt nu de huidige dag/verblijf over (openAddActivitySheetForCurrentDay).** |

---

## D. AI-ideeën (Discover)

| # | Bevinding | Notitie |
|---|---|---|
| D1 | ~~Onduidelijk of suggesties automatisch verversen of alleen via de knop~~ | **✅ Opgelost — H4: suggesties worden toegevoegd, niet vervangen bij verversen.** |
| D2 | ~~"Route"-knop bij een suggestie doet niets~~ | **✅ Opgelost — echte route-keuze (vanaf verblijf / vanaf hier) via openRouteOptionsSheet.** |
| D3 | ~~Wens: Komoot-link toevoegen bij wandelsuggesties voor meer detail~~ | **✅ Opgelost — Komoot-links bestaan al bij wandelsuggesties.** |
| D4 | ~~Cursieve "waarom relevant"-tekst is lastig leesbaar~~ | **✅ Opgelost — geen cursieve stijl meer op de "waarom relevant"-tekst.** |
| D5 | ~~Gewenst: tijd, afstand én hoogteverschil altijd zichtbaar per suggestie~~ | **Nog open, lage prioriteit — zie 08-restplan (uitdrukkelijk geen hoogtekaart, alleen een simpel getal).** |
| D6 | ~~Wens: hoogtekaart van de hele route~~ | **Afgewezen (2026-07-02) — niet bouwen, blijft buiten scope.** |
| D7 | ~~Onduidelijk of suggesties gebaseerd zijn op accommodatie of actuele live locatie~~ | **✅ Opgelost — "Hier"-modus (live GPS) bestaat naast accommodatie-modus.** |
| D8 | ~~Wens: als een activiteit afgelopen is, wil de gebruiker een café in de buurt van de activiteit zien — niet terug naar het verblijf~~ | **✅ Opgelost — N3: "bij deze activiteit"-suggesties na afvinken.** |
| D9 | ~~Onduidelijk of "eten"-categorie ook cafés omvat, niet alleen restaurants~~ | **✅ Opgelost — H3: eten-filter toont nu ook cafés.** |
| D10 | ~~Wens: suggesties moeten bewaard blijven, niet verdwijnen bij een ververs-actie~~ | **✅ Opgelost — zelfde fix als D1 (H4).** |
| D11 | ~~Suggesties tonen niet expliciet bij welk verblijf/dag ze horen wanneer je vanuit een specifieke dag naar Ideeën navigeert~~ | **✅ Opgelost — context-badge ("VANUIT ..."/"HIER"/activiteitnaam) toont de bron van elke suggestie.** |

---

## E. Vandaag-scherm / cijfers

| # | Bevinding | Notitie |
|---|---|---|
| E1 | ~~Onduidelijk waar de getallen bij de statistiekenstrip (Te doen/Gedaan/Tickets/Laders) vandaan komen — "Laders: 04" klopt niet, lijkt hardcoded~~ | **✅ Opgelost — "Laders: 04" hardcoded-bug gefixt (Fase E).** |

---

## F. Overig / polish

| # | Bevinding | Notitie |
|---|---|---|
| F1 | ~~App-icoon op iPhone-beginscherm is saai/onduidelijk~~ | **✅ Opgelost — nieuw app-icoon (Europa-kaart met pin op Nederland).** |
| F2 | ~~Tekst bovenin sommige schermen loopt door de systeembalk (klok/batterij) heen~~ | **✅ Opgelost — safe-area-bug gefixt (G1, zie 02-feedback-01juli.md).** |
| F3 | ~~Na een ticket "gebruikt" markeren (bijv. Klimapark) kan niet meer naar de details terug~~ | **✅ Vervallen — tickets tonen alle info al inline in de rij, geen apart detailscherm nodig.** |
| F4 | ~~Onduidelijk waar je accommodaties toevoegt — zowel bij het aanmaken van een nieuwe reis als tijdens een lopende reis~~ | **✅ Opgelost — "+ Verblijf"-knop + accommodaties bij reis aanmaken (Fase F).** |

---

## Openstaande technische vraag (A1) die voorrang heeft

De laatste deployment-lijst toont een rode stip bij de bovenste regel ("Redeploy of F2sGZ157a"). Voordat we verder testen op laadstations/weer moet vastgesteld worden:
1. Is die rode stip een failed deployment?
2. Welke deployment is daadwerkelijk "Production" nu?
3. Is de OPENCHARGEMAP_API_KEY beschikbaar in de deployment die nu live staat?

---

## Volgende stap

Dit document doornemen punt voor punt, prioriteit bepalen (wat is blokkerend, wat is "nice to have"), en pas daarna een bouwvolgorde afspreken.
