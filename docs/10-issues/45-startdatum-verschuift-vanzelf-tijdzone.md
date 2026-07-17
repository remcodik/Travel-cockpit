# Startdatum verschuift vanzelf bij het openen (auto-verruim op tijdstip) (2026-07-16)

**Document ID:** TC-ISSUES-045
**Status:** ✅ Gefixt
**Bron:** "Check wat er gebeurt met datums in planning: ik heb geen datums veranderd voor verblijf of reis en toch is mijn startdatum anders dan de vorige keer dat ik de app opende (vorige versie?)."

---

## Oorzaak

`applyTripData()` draait bij elke keer dat de app opent en bevat een
"verruim het reisvenster zodat elk verblijf erbinnen valt"-stap:

```js
if (accMinCheckIn.getTime() < TRIP_START.getTime()) { TRIP_START.setTime(...); windowWidened = true; }
if (windowWidened) updateTripMeta(trip.id, { startDate: new Date(TRIP_START), ... });
```

Dat vergeleek op **exact tijdstip**, niet op kalenderdag. `TRIP_START` en de
verblijf-check-ins konden door een oudere app-versie op een verschillend
tijdstip-van-de-dag zijn opgeslagen (bv. UTC-middernacht vs. lokale
middernacht). In een tijdzone vóór op UTC (NL, CEST = UTC+2) valt een
verblijf op lokale middernacht dan een paar uur "vóór" een als UTC-middernacht
opgeslagen reisstart → de check sloeg aan, verschoof de startdatum en
**schreef die terug naar Firestore**. Zo veranderde de startdatum "vanzelf",
zonder dat de gebruiker iets had gewijzigd — en bleef daarna zo staan.

(Zelfde klasse als TC-ISSUES-16 en de getFreshSnapshot-fix in firebase.js;
dit dekt de resterende tijdstip-route.)

## Fix

1. `applyTripData()` normaliseert `TRIP_START`/`TRIP_END` na het laden naar
   **lokale middernacht** in het geheugen (`setHours(0,0,0,0)`) — niet blind
   terugschrijven, alleen stabiliseren.
2. De auto-verruim-check vergelijkt nu expliciet op **kalenderdag** (lokale
   middernacht) via een `dayStart()`-helper. Het venster verruimt daardoor
   alleen nog wanneer een verblijf écht een hele dag buiten de reis valt,
   nooit meer door een tijdstip-verschil.
3. Een échte verruiming logt nu een `console.warn` (met oude → nieuwe datum),
   zodat een toekomstige, terechte verruiming traceerbaar is.

Geverifieerd met een reproductie in de Europe/Amsterdam-tijdzone: het oude
gedrag verruimde + schreef terug; het nieuwe laat de datum stabiel en doet
geen schrijfactie.

## Let op voor bestaande data

Als jouw startdatum al eerder verschoven is en teruggeschreven, staat die
verkeerde waarde nu in Firestore. Deze fix stopt verdere verschuiving, maar
zet een al-verschoven datum niet vanzelf terug — corrigeer die desgewenst
één keer via "Reis bewerken".

`sw.js`: `CACHE_VERSION` v37 → v38.
