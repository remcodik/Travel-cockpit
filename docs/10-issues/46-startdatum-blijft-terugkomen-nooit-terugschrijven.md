# Startdatum verandert vanzelf en komt steeds terug — nooit meer terugschrijven (2026-07-16)

**Document ID:** TC-ISSUES-046
**Status:** ✅ Gefixt
**Bron:** "Dit is al vaker gebeurd maar komt iedere keer terug." / "Ik heb geen datum aangepast en de datum klopte van de reis en verblijven, en toch verandert de startdatum. Kun je uitleggen waar de datum verandert als ik geen enkele datum verander?"

---

## Waar de datum "vanzelf" veranderde

`applyTripData()` draait bij élke app-open en had een regel: *het reisvenster
moet altijd alle verblijven omvatten*. Concreet:

1. Voor elk verblijf vergeleek het de check-in/-out met de reis-start/-eind.
2. Lag een verblijf-datum ook maar iets vóór de start (of ná het eind), dan
   verschoof het de reis-start/-eind → **en schreef dat terug naar Firestore**
   (`updateTripMeta`).

Dat terugschrijven was de kern van "komt iedere keer terug": de gewijzigde
datum werd opgeslagen, dus bij de volgende open stond de foute datum er weer.

Waarom het gebeurde terwijl "alle datums klopten": de vergelijking gebeurde
(vóór TC-ISSUES-045) op **exact tijdstip**, niet op kalenderdag. Een oudere
app-versie kon een datum op een ander tijdstip-van-de-dag opslaan (UTC-
middernacht i.p.v. lokale middernacht). Op het scherm zie je in beide gevallen
dezelfde, correcte dag — maar onder water is de één een paar uur "eerder" dan
de ander. Dat kleine, onzichtbare verschil was genoeg om de "verruim de
reis"-regel te laten aanslaan en op te slaan.

## Fix (bovenop TC-ISSUES-045)

De opgeslagen reisdatums zijn nu **heilig**: `applyTripData()` schrijft ze
NOOIT meer automatisch terug. Het venster wordt hoogstens **in het geheugen**
verruimd zodat een verblijf zichtbaar blijft in Planning (zoals Hotel
Kolding), maar dat wordt niet opgeslagen — elk apparaat leidt die weergave
zelf af uit de verblijven. Valt een verblijf echt buiten je reisdatums, dan
verschijnt een niet-blokkerende melding met de naam ervan, zodat je de échte
oorzaak ziet en zelf kiest wat je aanpast (de reis of dat verblijf).

Samen met TC-ISSUES-045 (normaliseren naar lokale middernacht + vergelijken
op kalenderdag) kan de app dus:
- je opgeslagen reisdatums niet meer stilzwijgend wijzigen, en
- niet meer aanslaan op een onzichtbaar tijdstip-verschil.

## Bestaande, al-verschoven data

Staat er nu een verkeerde datum opgeslagen (door de oude terugschrijf-
route), dan corrigeer je die één keer via "Reis bewerken" — daarna blijft
hij staan.

`sw.js`: `CACHE_VERSION` v38 → v39.
