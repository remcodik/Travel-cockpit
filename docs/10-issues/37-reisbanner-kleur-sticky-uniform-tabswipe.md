# Reisbanner: gekleurd per land, sticky, op elk scherm + swipen tussen tabs (2026-07-14)

**Document ID:** TC-ISSUES-037
**Status:** ✅ Gefixt
**Bron:** "Kun je top banner van reis laten staan bij scrollen en die reis kleur geven van land — ik zie geen verschil tussen Polen en Noorwegen qua kleuren. Banner mag iets opvallender of kleur of groter. En voeg banner ook toe aan schermen van accommodaties en alle overige schermen bij meer tab, dat alles uniform is. Kun je ook toevoegen dat ik kan swipen tussen de tabs."

---

## 1. Banner blijft staan bij scrollen (sticky)
De `.trip-id-strip` is een directe child van `.screen` (flex-kolom) vóór de
`.scroll`-regio, met `flex-shrink:0`. Daardoor blijft hij bovenaan staan
terwijl alleen de inhoud eronder scrollt — op elk scherm.

## 2. Gekleurd per land + opvallender
Voorheen was de strip wit met donkere tekst — geen zichtbaar kleurverschil
tussen reizen. Nu:
- Achtergrond is een **verloop per land** (`tripStripBackground()` in
  js/state.js): van de terrein-tint (links) naar de accent-tint (rechts),
  ingesteld door `updateTripIdentityStrips()`. Witte tekst, vlag in een chip,
  datums rechts uitgelijnd.
- `getTripThemeColors()` kreeg er `accentDeep` bij (accent, donker genoeg
  voor witte tekst).
- Grotere/duidelijkere strip (font 15px, schaduw).

**Let op — Noorwegen vs. Polen blijft verwant:** het app-palet geeft veel
(noordelijke) landen bewust een groen-terrein-thema. Noorwegen (groen→oranje)
en Polen (groen→rood) verschillen nu in de accent-kant, maar blijven
familie; de **vlag** is het duidelijkste onderscheid. Landen als Italië
(groen→cyaan) of Japan (magenta→teal) verschillen wél sterk. Wil je Noorwegen
en Polen dramatisch anders, dan moet de land→kleur-toewijzing (COUNTRY_HUES)
breder over het kleurenwiel — een grotere wijziging, op aanvraag.

## 3. Banner op alle schermen (uniform)
De strip stond op de 5 hoofdtabs; nu ook op **accommodatie, reisgids,
roadtrip, tickets, mijn reizen, instellingen en notities** (12 in totaal).
Alle strips worden in één keer gevuld door `updateTripIdentityStrips()`
(ze staan allemaal in de DOM). De bestaande `safe-top` op die schermkoppen
is verplaatst naar de strip, zodat er geen dubbele notch-padding ontstaat.

## 4. Swipen tussen de tabs
Nieuw `initTabSwipe()` (js/navigation.js, gebonden op `DOMContentLoaded`):
horizontaal vegen wisselt naar de vorige/volgende tab in de
onderbalk-volgorde (`MAIN_SCREENS`). Een veeg wordt genegeerd wanneer die
begint op iets dat zélf horizontaal reageert:
- de Leaflet-kaart (pannen) — `.leaflet-container` / `#map-container`
- horizontale chip-/dagbalken — `.hscroll` / `#day-tabs`
- de planning-daginhoud (`#screen-planning .scroll`, heeft z'n eigen
  dag-swipe uit docs/10-issues/21)
- formuliervelden, en wanneer er een sheet open staat

Drempel 70px en overwegend horizontaal (dx > dy·1.8), zodat verticaal
scrollen nooit per ongeluk van tab wisselt. Op detailschermen (geen hoofdtab
actief) doet de swipe niets.

---

`sw.js`: `CACHE_VERSION` v28 → v29.
