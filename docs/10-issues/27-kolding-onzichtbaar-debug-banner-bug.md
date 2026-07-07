# Kolding onzichtbaar op de kaart + debug-banner werkte nooit (2026-07-07)

**Document ID:** TC-ISSUES-027
**Status:** ✅ Gefixt
**Bron:** "Waarom zie ik verblijf Kolding niet" (vervolg op de kaart-fixes van `docs/10-issues/26-kaart-route-knik-thuis-pin.md`), bevestigd: "Op de kaart".

---

## Root cause 1: Kolding heeft geen (geldige) coördinaten

De vorige fix (26) voorkomt dat een verblijf zonder ingevulde locatie een onzichtbare pin op `[0, 0]` krijgt (in zee bij West-Afrika) — zo'n verblijf wordt nu overgeslagen i.p.v. onvindbaar neergezet. Kolding is precies zo'n geval: waarschijnlijk toegevoegd zonder adres/coördinaten in te vullen (`readAccommodationFormFields()` valt terug op `0` als lat/lng leeg blijven), dus die fix sloot Kolding's pin terecht uit — maar de bijbehorende waarschuwing was zelf onzichtbaar (zie root cause 2), waardoor het leek of Kolding gewoon spoorloos verdwenen was.

---

## Root cause 2: de debug-banner werkte al deze tijd niet

`#debug-banner` (`index.html`) heeft een **inline** `style="display:none"`. Overal in de app waar een fout of waarschuwing getoond moest worden (`showFatalError()` in `index.html`, `reportMapError()` en de nieuwe "geen locatie"-melding in `js/screen-map.js`, de foutafhandeling in `js/navigation.js`) gebeurde dat via `banner.classList.add('show')` — maar er bestond nergens een CSS-regel `#debug-banner.show { display: ... }`. Een class kan een **inline** `display`-stijl nooit overschrijven zonder `!important`. Resultaat: deze banner is sinds hij bestaat nooit zichtbaar geweest, voor geen enkele fout — een blinde vlek die nu pas aan het licht kwam doordat de nieuwe "geen locatie"-melding (26) er specifiek van afhankelijk was.

---

## Fix

1. **CSS**: `#debug-banner.show { display: block !important; }` toegevoegd (`css/styles.css`) — lost de banner voor de hele app in één keer op, niet alleen voor de kaart.
2. **Kaart**: de "geen locatie ingesteld"-melding gebruikt nu óók een `showToast()` (naast de banner) — direct zichtbaar, en met een tik ("tik om te bewerken") direct naar `openEditAccommodationSheet()` voor het eerste verblijf zonder locatie, zodat het meteen op te lossen is i.p.v. alleen gemeld.

---

## Geverifieerd

Headless-test: `#debug-banner.show` levert nu daadwerkelijk `display: block` op (voorheen bleef `display: none` staan ondanks de class); een gesimuleerd Kolding-verblijf zonder coördinaten wordt correct gedetecteerd als "ongeldig"; de toast toont "⚠️ Geen locatie ingesteld: Kolding — tik om te bewerken" en is zichtbaar (`.show`-class aanwezig); een tik op de toast opent het bewerkformulier met Kolding's naam al ingevuld.

---

## Gewijzigde bestanden

`css/styles.css` (`#debug-banner.show`-regel), `js/screen-map.js` (toast toegevoegd naast de bestaande banner-melding in `renderMapMarkers()`).
