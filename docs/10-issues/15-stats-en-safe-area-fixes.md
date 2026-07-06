# Reisstatistieken + safe-area-onderrand (2026-07-06)

**Document ID:** TC-ISSUES-015
**Status:** ✅ Gebouwd

---

## 1. "Check de statistieken van reis — het gaat om ingeplande activiteiten (per verblijf), niet totaal aan activiteiten"

**Root cause**: `getProgress()` (`js/state.js`) en de "Voortgang per accommodatie"-mini-balkjes (`js/screen-home.js`) telden `AppState.activities` zonder te filteren op `act.date` — dat telt dus ook activiteiten mee die nog los bij een verblijf liggen te wachten om ingepland te worden (de "Beschikbaar vanuit X"-lijst in Planning, `act.date === null`). Op de Noorwegen-seed gaf dat bijvoorbeeld "9/19" i.p.v. het correcte "9/13" (19 activiteiten totaal, waarvan 6 nog niet ingepland).

**Fix**: beide plekken filteren nu eerst op `a.date` vóór ze tellen — "Voortgang reis" (thuisscherm-progressiebalk) en de per-verblijf mini-balkjes tonen nu alleen daadwerkelijk ingeplande activiteiten, consistent met wat Planning's dagteller (`getActivitiesForDate()`, die al altijd op datum filterde) al liet zien.

**Bewust ongewijzigd**: `relatedCount` in `openDeleteAccommodationSheet()` (waarschuwing bij het verwijderen van een verblijf) en de kaart-pins per verblijf tellen bewust nog steeds ALLE activiteiten (ingepland + niet-ingepland) — daar gaat het om "wat gebeurt er met deze activiteiten als ik dit verblijf verwijder", niet om voortgang.

---

## 2. "Past niet goed op scherm" (Route-strip op Kaart, onderkant chips net afgesneden)

**Root cause**: `.screen { padding-bottom: 76px; }` (`css/styles.css`) reserveerde een vaste ruimte onderaan elk scherm voor de vaste navigatiebalk (`.bottom-nav`). Die navigatiebalk zelf groeit op toestellen met een thuisbalk-indicator (de meeste moderne iPhones) met `env(safe-area-inset-bottom)` erbovenop (vaak 34px) — de vaste 76px hield daar geen rekening mee, waardoor de balk in werkelijkheid hoger was dan de gereserveerde ruimte. Gevolg: de laatste rij content vlak boven de navigatiebalk (bijvoorbeeld de Route-chips op het Kaart-scherm) werd voor een paar pixels achter de navigatiebalk verstopt — precies de "onderkant/rand mis" die gemeld werd.

**Fix**: `padding-bottom: calc(76px + env(safe-area-inset-bottom, 0px))`. Op een toestel zonder thuisbalk-indicator (of in deze test-omgeving) blijft dit exact 76px, geen wijziging. Dit is een schermbrede fix (`.screen` wordt door elk scherm gebruikt), dus lost hetzelfde potentiële probleem overal op, niet alleen bij de Route-strip.

---

## Gewijzigde bestanden

`js/state.js` (`getProgress()`), `js/screen-home.js` (per-verblijf mini-balkjes), `css/styles.css` (`.screen` padding-bottom).
