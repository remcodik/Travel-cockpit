# Reis-levenscyclus — compleet plan (Fase F)

**Document ID:** TC-ISSUES-005
**Status:** Deel 1 en 2 gebouwd en gemerged (2026-07-02). Antwoorden: (1) expliciete keuze via keuzescherm — gekozen. (2) Verblijf toevoegen aan bestaande reis — gebouwd. (4) Verblijven sorteren op check-in datum i.p.v. handmatig herordenen — gekozen, en onderweg een kernbug gevonden: `orderBy('order')` sloot accommodaties zonder dat veld volledig uit, waardoor verblijven van elke nieuw aangemaakte reis nooit laadden. (3) Design per land en (5) zoekfunctie in Mijn reizen: nog open, apart te plannen.
**Bron:** Live gebruikersfeedback ("een andere reis werd geactiveerd zonder dat ik dat wilde", "kleuren/design zijn hetzelfde als de oude reis") + volledige audit van de reis/verblijf/activiteit-levenscyclus tegen de huidige code

---

## Aanleiding

Twee losse meldingen, die samen een bredere vraag oproepen: **is het volledige pad van "een reis beginnen tot en met er middenin zitten" consistent en volledig?** Onderstaand is dat pad in kaart gebracht, met wat al werkt, wat ontbreekt, en één bevestigde bug.

De gewenste flow, zoals gesteld: reis aanmaken → verblijven toevoegen/wijzigen/verwijderen → later activiteiten per dag toevoegen → AI-ideeën zoeken → tussen reizen wisselen/zoeken → reizen verwijderen/verlengen/herplannen, met verblijven-verwijderen inbegrepen.

---

## Deel 1 — Bevestigde bug: reis-activering moet altijd expliciet zijn

**Bevinding:** reis-aanmaken zelf activeert nooit automatisch (`createTrip()` zet bewust `isActive: false`) — dat klopt al. Maar er is precies één plek waar een reis-wissel **impliciet** gebeurt: `deleteTrip()` in `js/state.js` schakelt automatisch naar `AppState.trips[0]` als je de op dat moment actieve reis verwijdert. Dat is op zich onvermijdelijk (er moet íets actief zijn), maar het gebeurt nu **stil** — geen melding waarom, en `trips[0]` is niet gegarandeerd voorspelbaar (`dbLoadAllTrips()` heeft geen vaste sorteervolgorde). Als je een test-reis verwijderde terwijl die toevallig actief stond, kan dit precies aanvoelen als "er werd zomaar een andere reis geactiveerd".

**Voorstel:** zie Vraag 1 hieronder — twee opties, ik wil niet zomaar de UX kiezen zonder jouw voorkeur.

---

## Deel 2 — Ontbrekende functie: verblijf toevoegen aan een BESTAANDE reis

**Bevinding (bevestigd in code):** `addAnotherTripAccommodation()` en de bijbehorende invoervelden bestaan uitsluitend binnen de "Reis toevoegen"-flow (`sheet-trip`). Zodra een reis eenmaal is aangemaakt, kun je verblijven wél bewerken en verwijderen (Fase E), maar **nergens een nieuw verblijf toevoegen** aan die reis. Dit is precies wat je noemt: "adding, changing, deleting accommodations" — toevoegen ontbreekt voor bestaande reizen.

**Voorstel:** een "+ Verblijf toevoegen"-knop op het accommodatiescherm (bij "Alle verblijven") die hetzelfde formulier opent als de bewerk-sheet uit Fase E, maar dan leeg voor een nieuw verblijf. Reisdata herberekent automatisch mee (zelfde principe als bij bewerken).

---

## Deel 3 — Rest van de levenscyclus, puntsgewijs gecheckt

| Onderdeel | Status | Notitie |
|---|---|---|
| Reis aanmaken | ✅ Werkt | Met minstens één verblijf verplicht |
| Reis bewerken (naam/land) | ✅ Werkt | Fase E |
| Reis activeren | ✅ Werkt, maar zie Deel 1 | Expliciet via "Activeren"-knop — behalve de fallback-situatie |
| Reis verwijderen | ✅ Werkt | Dubbel-tik-bevestiging, kan niet de enige reis verwijderen |
| Reis "verlengen" | ✅ Werkt, indirect | Reisdata is bewust *afgeleid* van verblijf-data (DL-004-principe) — verlengen = een verblijf-datum aanpassen of een verblijf toevoegen, geen los "reis verlengen"-veld nodig |
| Verblijf toevoegen (bij aanmaken) | ✅ Werkt | |
| Verblijf toevoegen (aan bestaande reis) | ❌ **Ontbreekt** | Zie Deel 2 |
| Verblijf bewerken | ✅ Werkt | Fase E |
| Verblijf verwijderen | ✅ Werkt | Met keuze over activiteiten, Fase E |
| Verblijven herordenen | ❌ Ontbreekt | `order`-veld bestaat in het datamodel, geen UI om te herordenen als de volgorde niet klopt. Lage prioriteit — zie vraag 4 |
| Activiteit toevoegen per dag | ✅ Werkt | Handmatig of via AI-suggestie |
| Activiteit bewerken | ✅ Werkt | Fase E |
| Activiteit verplaatsen (dag/verblijf) | ✅ Werkt | |
| Activiteit verwijderen | ✅ Werkt | |
| AI-ideeën zoeken | ✅ Werkt | Per verblijf, live locatie, of net-afgevinkte activiteit (N3) — altijd correct geïsoleerd per actieve reis |
| Reizen bekijken/wisselen | ✅ Werkt | "Mijn reizen"-scherm |
| Reizen doorzoeken | ⚠️ Onduidelijk wat je bedoelt | Zie vraag 5 — letterlijk een zoekbalk, of gewoon door de lijst bladeren (bestaat al)? |

---

## Deel 4 — Losstaand: visueel ontwerp per reis/land

**Bevinding:** het volledige kleurenpalet en topografische thema (spruce-green, Noorse contourlijnen-stijl) is nu **hardcoded voor Noorwegen**, ongeacht welke reis actief is. Een Italië-reis ziet er identiek uit als de Noorwegen-reis — dat was ook precies de oorspronkelijke ambitie aan het begin van dit hele traject ("mooi creatief design beïnvloed door het land van de reis"), maar is nooit doorgevoerd naar de multi-trip-situatie.

Dit is een **apart, groter ontwerp-stuk** — geen bugfix, een designbeslissing (welk kleurenpalet per land/regio, hoe generiek moet het systeem worden). Ik wil dit niet stilletjes meenemen in dezelfde batch als de CRUD-gaten hierboven. Zie vraag 3.

---

## Open vragen

1. **Reis-activering-fallback** (Deel 1): als je de actieve reis verwijdert, wat moet er gebeuren?
   - (a) Een keuzescherm "welke reis wordt nu actief?" tonen — altijd expliciet, ook in dit randgeval.
   - (b) Automatisch de eerst-overgebleven reis activeren, maar met een duidelijke melding ("Noorwegen 2026 is verwijderd — Italië 2027 is nu je actieve reis").
2. **Verblijf toevoegen aan bestaande reis** (Deel 2): akkoord om dit te bouwen zoals voorgesteld (zelfde formulier als bewerken, maar leeg)?
3. **Design per land** (Deel 4): nu meenemen in de planning (grotere scope, apart te ontwerpen), of expliciet voor later parkeren totdat de CRUD-gaten klaar zijn?
4. **Verblijven herordenen**: nodig, of kun je prima leven met de volgorde waarin je ze hebt aangemaakt (jaagt dit een edge-case na die zelden voorkomt)?
5. **"Ik zoek naar andere reizen"**: bedoel je een letterlijke zoekbalk in "Mijn reizen" (handig bij veel reizen), of doelde je op gewoon tussen reizen kunnen bladeren/wisselen (dat bestaat al)?

---

## Volgende stap

Zodra bovenstaande vragen beantwoord zijn: Deel 1 (bugfix) en Deel 2 (verblijf toevoegen) worden als kern-batch gebouwd. Deel 4 (design per land) wordt een eigen vervolgplan zodra de scope daarvan is afgestemd.
