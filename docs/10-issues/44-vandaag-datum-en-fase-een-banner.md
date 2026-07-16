# Vandaag: datum + reisfase op één banner, nieuwe aftel-bewoording (2026-07-16)

**Document ID:** TC-ISSUES-044
**Status:** ✅ Gefixt
**Bron:** "Op vandaag kun je datum en reis begint op 1 banner zetten. En niet 'reis begint over' maar 'nog xx dagen tot datum'."

---

## Wijziging

Op het Vandaag-scherm stonden de datum (de dunne dag-rij, `home-day`) en de
reisfase (de aparte banner, `home-trip-phase-banner`) op twee losse regels.
Die zijn nu samengevoegd:

- **Tijdens de reis**: alleen de dunne dag-rij "Dag X · datum" (geen
  fase-banner) — ongewijzigd.
- **Vóór/na de reis**: de losse dag-rij wordt verborgen; de fase-banner is nu
  de enige regel en bevat de datum zélf:
  - vóór: `◷ Vandaag <datum> · nog xx dagen tot <startdatum>`
  - na: `◷ Vandaag <datum> · reis afgerond op <einddatum>`

De bewoording is op verzoek gewijzigd van "Reis begint over xx dagen ·
<datum>" naar **"nog xx dagen tot <startdatum>"** (met correct enkelvoud
"nog 1 dag").

Implementatie: `home-day-row` (id op de datum-container) wordt getoond/
verborgen in `renderHomeScreen()`; `renderTripPhaseBanner()` bouwt de
gecombineerde regel.

`sw.js`: `CACHE_VERSION` v36 → v37.
