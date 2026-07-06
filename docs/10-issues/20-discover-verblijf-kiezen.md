# Discover: zelf een verblijf kiezen voor ideeën (2026-07-06)

**Document ID:** TC-ISSUES-020
**Status:** ✅ Gebouwd
**Bron:** "Nieuwe ideeen kan ik ophalen voor verblijf of huidige locatie / Ik wil het verblijf kunnen aanpassen nu kan t alleen voor huidige verblijf."

---

## Root cause

Discover heeft al twee locatie-modi: "Verblijf" en "Hier" (GPS). In de "Verblijf"-modus was de basis-locatie altijd `getActiveAccommodation()` — het verblijf dat op de huidige datum actief is, zonder enige manier om een ánder verblijf te kiezen. Wilde je bijvoorbeeld alvast ideeën ophalen voor je volgende stop (vóórdat je daar bent), dan kon dat niet.

---

## Fix

Nieuwe verblijf-kiezer: een chips-rij (`discover-acc-chips`, zelfde patroon als de kaart-filterchips) onder de bestaande modus-knoppen, met alle verblijven van de reis. Zichtbaar alleen in "Verblijf"-modus (verborgen in "Hier"). Nieuwe state `discoverAccId` + `getDiscoverAccommodation()` (`js/screen-discover.js`) — geeft het expliciet gekozen verblijf terug, of valt terug op `getActiveAccommodation()` als er niets gekozen is. Alle plekken die voorheen altijd `getActiveAccommodation()` gebruikten voor Discover (header, ophalen van nieuwe suggesties, suggestie-kaarten, route-knop) gebruiken nu deze nieuwe helper.

De gekozen keuze blijft behouden bij het wisselen tussen "Verblijf" en "Hier" — pas als je zelf een ander verblijf aantikt, verandert de keuze.

---

## Geverifieerd

Headless-test: de chips-rij toont alle verblijven; standaard is het huidige (actieve) verblijf geselecteerd; een ander verblijf kiezen werkt de header, de suggestie-kaarten én de route-knop bij; de rij verbergt zich in "Hier"-modus en de keuze blijft bewaard bij terugschakelen naar "Verblijf".

---

## Gewijzigde bestanden

`js/screen-discover.js` (`discoverAccId`, `getDiscoverAccommodation()`, `renderDiscoverAccChips()`, `setDiscoverAccommodation()`, bestaande functies aangepast om de nieuwe helper te gebruiken), `index.html` (`discover-acc-chips`-container).
