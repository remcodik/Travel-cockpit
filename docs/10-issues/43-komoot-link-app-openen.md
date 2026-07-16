# Komoot-link: proberen de app te openen i.p.v. de browser (2026-07-14)

**Document ID:** TC-ISSUES-043
**Status:** ✅ Aangepast (binnen wat een web-app kan)
**Bron:** "Is 't mogelijk om bij een link van Komoot de Komoot app te openen i.p.v. via internet? Ik log zelf wel in indien nodig."

---

## Wat wél/niet kan

Een web-app kan een native app **niet forceren** te openen. Er is geen
publiek `komoot://`-URL-schema voor tours. Het openen van de Komoot-app
gebeurt via het besturingssysteem: **iOS Universal Links / Android App
Links** op gewone `https://www.komoot.com/...`-links. Dat werkt alleen als:
- de Komoot-app geïnstalleerd is, én
- app-link-afhandeling voor komoot.com aan staat (Komoot heeft hier zelf een
  support-artikel over: "Email links open in the browser instead of the
  komoot app").

Inloggen regelt de gebruiker zelf in de app — daar hoeft de web-app niets
voor te doen.

## Wat is aangepast

De "🥾 Komoot"-knop op het activiteit-detailscherm opende de tour altijd in
een **nieuw tabblad** (`target="_blank"`). Een popup/nieuw tabblad blijft
juist vaak in de (in-app) browser hangen; een gewone, aangetikte navigatie
naar komoot.com is precies wat Universal/App Links nodig hebben om de app te
openen. Daarom openen we een **echte komoot.com-tourlink nu in hetzelfde
venster** (geen `target="_blank"`), met een "→" achter het label als hint.

- Alleen voor echte `komoot.com`-links (`komootIsAppLink`).
- De zoek-terugval (`komootSearchUrl`, een Google-zoekopdracht — geen
  komoot.com) en de AI-"Bekijk op Komoot"-knop blijven een nieuw tabblad,
  want die kunnen de app sowieso niet openen.
- De `↗`-knoppen naast de Komoot-invoervelden gebruiken `window.open`
  (script-popup) — dat opent per definitie nooit de app, dus bewust
  ongewijzigd gelaten; die zijn bedoeld om een geplakte link even te
  controleren.

**Afweging:** in hetzelfde venster openen betekent dat je — als de app níet
geïnstalleerd is of de hand-off niet lukt — op komoot.com in de web-app
belandt en terug moet navigeren. Bewuste keuze, omdat het verzoek expliciet
was om de app te openen.

`sw.js`: `CACHE_VERSION` v35 → v36.
