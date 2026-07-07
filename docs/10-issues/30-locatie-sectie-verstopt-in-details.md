# Locatie-sectie onvindbaar (verstopt in ingeklapt `<details>`) (2026-07-07)

**Document ID:** TC-ISSUES-030
**Status:** ✅ Gefixt
**Bron:** "Ik zie niet hoe ik kan bewerken de locatie van verblijf" — vervolg op `docs/10-issues/29-link-veld-info-vs-locatie-gesplitst.md`.

---

## Root cause

De net toegevoegde "Locatie instellen"-sectie (Google Maps-link, breedte-/lengtegraad, hoogte) stond in het verblijf-formulier binnen een `<details>`/`<summary>`-element — standaard ingeklapt, met alleen een kleine, grijze, kleine-hoofdletters tekstregel als aanwijzing dat er meer te vinden was. Dit patroon bestond al langer (voorheen "Coördinaten handmatig aanpassen"), maar viel nu extra op omdat er sinds de vorige twee wijzigingen (adres-geocoding, Maps-link-veld) een compleet, nuttig subsysteem achter die ene onopvallende regel verstopt zat. Geen CSS-aanpassing voor de standaard `<summary>`-marker (▶) maakte het nog minder zichtbaar als "hier zit meer".

---

## Fix

De `<details>`/`<summary>`-wrapper is vervangen door een gewone, altijd zichtbare sectie — net als elk ander veld in het formulier. Duidelijk gelabeld met "📍 Locatie (voor de kaart)" in een lichte, afgeronde kaart (`index.html`), zodat alle drie de manieren om een locatie in te stellen (Maps-link, handmatige coördinaten, adres-gebaseerd zoeken via het adresveld hierboven) meteen zichtbaar zijn zodra het formulier opent — geen extra tik nodig om te ontdekken dat ze bestaan.

---

## Geverifieerd

Headless-test + screenshot: geen `<details>`-element meer in het verblijf-formulier; het Maps-link-veld, de breedte-/lengtegraad-velden en het hoogteveld zijn allemaal direct zichtbaar (`offsetParent !== null`) zodra het formulier opent, zonder interactie.

---

## Gewijzigde bestanden

`index.html` (locatie-sectie van `<details>` naar een altijd-zichtbare sectie met duidelijk label).
