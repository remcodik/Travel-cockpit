# Regionale Reisgids

**Document ID:** TC-FEAT-001
**Version:** 1.0
**Status:** Backlog — post-MVP
**Owner:** Product Team
**Last Updated:** 2026-06-28

---

# Wat is dit

De Regionale Reisgids is een lees-functie binnen Travel Cockpit die verhalende, informatieve tekst geeft over de regio waar de reiziger nu is of naartoe gaat.

Het is geen activiteitenlijst. Dat bestaat al. Het is contextuele achtergrondkennis — de soort informatie die je normaal in een reisgids of Wikipedia leest, maar dan kort, bondig en direct gerelateerd aan de huidige locatie.

---

# Wat het is en wat het niet is

## Wel

- Verhalende tekst over de geschiedenis van een regio of stad.
- Culturele wetenswaardigheden: gebruiken, tradities, typisch eten, taal.
- Geografische context: hoe het landschap is ontstaan, waarom het er zo uitziet.
- Bijzondere feiten die een plek interessanter maken terwijl je er bent.
- Korte introductie per streek bij aankomst.

## Niet

- Activiteitensuggesties — dat doet de AI Discover functie.
- Restaurants of cafés — dat doet de Discover functie.
- Laadstations of praktische informatie — dat heeft eigen schermen.
- Lange teksten van meerdere pagina's.

---

# Gebruikersscenario

De reiziger komt aan in Skjåk, Noorwegen. Hij opent de app en ziet op het dashboard een kleine kaart die zegt "Skjåk · Jotunheimen". Hij tikt erop en leest:

> Skjåk ligt in het droogste dal van Noorwegen — de bergen rondom houden de neerslag tegen waardoor het hier zonniger en droger is dan bijna nergens anders in het land. Het dal werd al in de Vikingentijd bewoond, wat je nog kunt zien aan de plaatsnamen. Lom, op zo'n twintig kilometer, was een belangrijke handelsroute tussen Oost- en West-Noorwegen.

Dat maakt het rijden naar Lom net iets betekenisvoller.

---

# Inhoud per regio

Elke regio krijgt maximaal 3–5 kaarten. Elke kaart is kort: 3–6 zinnen.

## Kaarttypen

| Type | Inhoud |
|---|---|
| Geschiedenis | Hoe de regio is ontstaan, historische gebeurtenissen |
| Geografie | Landschapsvorming, gletsjers, fjorden, bergketens |
| Cultuur | Tradities, gebruiken, typisch eten, dialecten |
| Feit | Één bijzonder feit dat je nergens anders leest |
| Naam | Waar de plaatsnaam vandaan komt |

## Regio's voor Noorwegen 2026 (voorbeeldinhoud)

### Sogndal / Lustrafjord
- Lustrafjord is de binnenste arm van de Sognefjord — de langste en diepste fjord ter wereld (204 km, 1308 m diep).
- De naam Solvorn komt van het Oudnoorse "sól" (zon) en "vorn" (klein meer) — het plaatsje vangt inderdaad meer zon dan de omgeving.
- Urnes Stavkerk (1130 n.Chr.) is de oudste bewaarde staafkerk ter wereld en staat op de UNESCO Werelderfgoedlijst.

### Skjåk / Lom
- Skjåk is het droogste bewoonde dal van Noorwegen, gemiddeld minder dan 300 mm neerslag per jaar.
- Lom Stavkyrkje stamt uit ca. 1158 en werd gebouwd op de plek van een heidense kultusplaats — een bewuste Christianisering van een oud heiligdom.
- Het gebied rondom Juvasshytta (1841 m) was tijdens de laatste ijstijd volledig bedekt met ijs. Het Klimapark 2469-project laat bezoekers dit vóelen.

### Valdres
- Valdres is een van de langste valleien van Noorwegen, bekend om zijn stølslandschap — zomerweiden op grote hoogte waar koeien in de zomer worden gehoed.
- Besseggen scheidt twee meren met een hoogteverschil van 400 m: het groene Gjende en het blauwe Bessvatnet. Het kleurverschil komt door mineraalgehalte en glaciaal materiaal.
- De naam Fagernes betekent letterlijk "mooie plek".

### Gjerstad / Sørlandet
- Sørlandet (de "Zuidkant") is het meest zonnige deel van Noorwegen — meer zonuren per jaar dan Spanje in bepaalde periodes.
- Risør werd in de 17e eeuw een rijke havenstad door de houtvaten handel. De witte houten huizen zijn bewaard gebleven omdat de stad nooit industrialiseerde.
- Het kustlandschap van Agder werd gevormd door duizenden jaren van gletsjers die het gesteente gladschuurden — de ronde rotsformaties heten "seinskjær".

---

# Hoe het werkt in de app

## Invoer (post-MVP beslissing)

Twee opties, allebei geldig:

**Optie A — AI gegenereerd (voorkeur)**
Claude genereert de reisgidstekst op basis van regio en land. De app vraagt dit op bij aankomst bij een nieuwe accommodatie, of wanneer de gebruiker de gids opent. Resultaat wordt gecached voor 7 dagen.

Voordeel: werkt voor elk land, geen handmatig onderhoud.
Nadeel: vereist internet voor generatie.

**Optie B — Vaste teksten per regio**
Teksten worden vooraf geschreven en meegeleverd in de app als JSON. Beschikbaar offline.

Voordeel: altijd offline beschikbaar, gecontroleerde kwaliteit.
Nadeel: vereist onderhoud per regio, schaalt niet automatisch.

**Beslissing:** Begin met Optie A (AI gegenereerd). Populaire regio's kunnen later worden omgezet naar vaste teksten na gebruikerstest.

## Locatie in de UI

- Op de HomeScreen: kleine kaart onderaan het dashboard met "Meer over deze regio".
- Als eigen tabblad of sectie binnen het Meer-menu.
- Optioneel: als onderdeel van de Accommodatie Detail screen, sectie "Over deze regio".

## Cache

- AI-gegenereerde tekst per regio: 7 dagen.
- Regio wordt bepaald op basis van `countryCode` + `accommodationLocation`.
- Maximaal 5 kaarten per regio.

---

# Data model

```dart
class RegionalGuideEntry {
  final String id;
  final String tripId;
  final String regionName;     // "Sogndal / Lustrafjord"
  final String countryCode;    // "NO"
  final GuideCardType type;    // history, geography, culture, fact, name
  final String title;          // "De oudste fjord"
  final String body;           // 3–6 zinnen verhalende tekst
  final String? imageQuery;    // voor eventuele afbeelding later
  final DateTime generatedAt;
}

enum GuideCardType { history, geography, culture, fact, name }
```

---

# AI Prompt structuur

```
Jij bent een compacte reisgids. Genereer 4 korte informatiekaarten over [regio], [land].

Elke kaart heeft:
- type: history | geography | culture | fact | name
- title: max 5 woorden
- body: 3–6 zinnen, verhalend, niet als opsomming

Onderwerpen: landschapsgeschiedenis, culturele context, plaatsnaamoorsprong, één verrassend feit.
Taal: [taal van de gebruiker]
Doelgroep: reizigers die nu in de regio zijn, nieuwsgierig maar niet academisch.

Geen activiteitssuggesties. Geen restaurants. Geen praktische tips.
Alleen achtergrondkennis die een plek betekenisvoller maakt.

Geef alleen JSON terug.
```

---

# Not in MVP

- Afbeeldingen per kaart.
- Audio (tekst-naar-spraek).
- Eigen teksten toevoegen door gebruiker.
- Offline kaarten voor alle regio's wereldwijd.

---

# Change History

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-06-28 | Initial spec — feature backlog post-MVP |
