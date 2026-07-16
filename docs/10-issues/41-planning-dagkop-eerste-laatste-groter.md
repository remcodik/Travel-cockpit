# Planning: dagkop-badge groter op de eerste/laatste dag (2026-07-14)

**Document ID:** TC-ISSUES-041
**Status:** ✅ Gefixt
**Bron:** "Waarom is in planning datum banner voor eerste en laatste dag anders dan rest (groter)?"

---

## Waarom het gebeurde

De "DAG N"-badge in de planning-dagkop (`renderPlanningDay()`) krijgt een
**tweekleurige rand** op een verplaatsdag (van verblijf A naar B). Via
`getChangeoverPrevAcc()` gelden ook de rand-dagen als verplaatsdag:
- **eerste dag** (TRIP_START): Thuis → eerste verblijf;
- **laatste dag** (TRIP_END): laatste verblijf → Thuis.

Die tweekleurige rand werd gemaakt met `border:5px …;border-left:7px …`.
Een border vergroot de buitenmaat van het element, dus op die twee dagen
werd de badge — en daarmee de hele dagkop — zichtbaar groter dan op gewone
dagen. Een onbedoeld neveneffect van het gebruik van een border voor
kleurcodering.

## Fix

Elke badge heeft nu een **vaste buitenmaat** (`box-sizing:border-box;
width:48px;height:44px`) en altijd een 4px-rand:
- gewone dag: rand in de kleur van de vulling → onzichtbaar, maar wél even
  groot;
- verplaatsdag: rand in de verblijfkleur + dikkere linkerrand in de kleur
  van het vorige verblijf (de tweekleurige hint blijft).

Doordat `box-sizing:border-box` de rand naar binnen laat vallen, is de
buitenmaat per definitie identiek, ongeacht de randdikte — geen maatverschil
meer tussen de eerste/laatste en de overige dagen.

`sw.js`: `CACHE_VERSION` v33 → v34.
