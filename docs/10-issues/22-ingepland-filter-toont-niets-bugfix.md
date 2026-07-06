# Bugfix: "Ingepland"-filter toont niets ondanks activiteit-teller (2026-07-06)

**Document ID:** TC-ISSUES-022
**Status:** ✅ Gefixt
**Bron:** "Button ingepland filter bij planning laat niets zien / Niets ingepland maar aantal act op dag is 1 / Dat lijkt niet te kloppen" (met screenshot: dagtab toont teller "1", maar de daginhoud met "Ingepland"-filter aan toont "Niets ingepland op deze dag")

---

## Root cause

`status: 'todo'` is een legacy-veld uit de allereerste seed (`js/data.js`) — altijd gepaard met `date: null`, dus feitelijk niets anders dan "nog niet ingepland idee". Zodra zo'n activiteit via "+ Inplannen", verplaatsen, of bewerken alsnog een datum kreeg, bleef de `status` stil op `'todo'` staan: `updateActivity()` (`js/state.js`) veranderde alleen de velden die expliciet werden meegegeven, en niets koppelde `date` en `status` ooit aan elkaar.

`renderPlanningDay()` (`js/screen-planning.js`) had daarnaast, alleen actief als het "Ingepland"-filter aanstond, een extra filter `dayActivities.filter(a => a.status !== 'todo')`. Dat sloot dus alsnog-ingeplande activiteiten met de vergeten `'todo'`-status uit — terwijl de dagtab-teller (`getActivitiesForDate(day).length`, die alleen op datum telt, niet op status) diezelfde activiteit wél meetelde. Vandaar de tegenstrijdigheid uit het screenshot: teller "1", maar "Niets ingepland op deze dag".

Deze tweede filter was sowieso overbodig: `getActivitiesForDate()` geeft per definitie alleen activiteiten terug mét een datum die op de gekozen dag valt — dat is per definitie al "ingepland". Het "Ingepland"-filter hoort alléén de aparte "Beschikbaar vanuit [verblijf]"-lijst (niet-ingeplande activiteiten) te verbergen, wat al correct gebeurde via de `unscheduled`-variabele.

---

## Fix

1. `updateActivity(id, changes)` (`js/state.js`): migreert `status: 'todo'` automatisch naar `'planned'` zodra in dezelfde aanroep een `date` wordt toegekend. Dit is de centrale functie waar alle planningsacties doorheen lopen, dus dekt alle paden (inplannen, verplaatsen, bewerken).
2. `renderPlanningDay()` (`js/screen-planning.js`): de overbodige/foutieve `filter(a => a.status !== 'todo')` op `dayActivities` is verwijderd. Het "Ingepland"-filter blijft alleen de `unscheduled`-lijst gate'n.

---

## Geverifieerd

Headless-test: een legacy `'todo'`-activiteit (Besseggen, `date: null`) via `handleQuickSchedule()` ingepland op een dag → status wordt `'planned'`, datum wordt gezet. Dagtab-teller telt 1. Met "Ingepland"-filter aan: de activiteit verschijnt gewoon in de lijst, "Niets ingepland op deze dag" verschijnt niet meer.

Regressietest gedraaid op de bestaande testsuite (status/edit-flow, uit-planning-halen, categorieën, voortgangsstatistieken, self-heal verblijfswissel, thuis-dag auto-icoon, changeover-dag, verblijf-kiezer in Discover) — geen regressies.

---

## Ook gecontroleerd: Discover-suggesties per verblijf (geen bug)

Los onderzocht (tweede punt uit dezelfde melding): "Als ik nieuwe ideeën ophaal voor verblijf A en daarna voor verblijf B, blijft alles bestaan totdat ik dingen verwijder." Dit is bevestigd **gewenst gedrag, geen bug**: suggesties worden gecachet per `accId` (zowel in Firestore via `dbSaveAiSuggestions(accId, ...)` als in `localStorage` onder `tc_ai_cache_${accId}`). Wisselen van verblijf via `setDiscoverAccommodation()` laadt alleen de cache van dat specifieke verblijf; de suggesties van het andere verblijf blijven ongewijzigd bestaan en verschijnen weer zodra je terugwisselt. Geverifieerd via headless-test: suggesties voor verblijf A en B blijven na wisselen los van elkaar bestaan, geen kruisbesmetting.

---

## Gewijzigde bestanden

`js/state.js` (`updateActivity()`), `js/screen-planning.js` (`renderPlanningDay()`).
