# Compleet accommodatiescherm — plan

**Document ID:** TC-ISSUES-009
**Status:** ✅ Gebouwd (2026-07-03), zie `docs/08-technical/03-web-vs-flutter-vergelijking.md` v1.9. Alle 6 punten opgeleverd: telefoonnummer-veld + werkende Bel-knop, echte check-in/check-out-tijden, reserveringsnummer-veld, meerdaagse weerstrip, tickets optioneel gekoppeld aan verblijf (algemene lijst blijft ongefilterd), directe "+ Activiteit" vanaf het accommodatiescherm.
**Bron:** "ik wil een echt compleet accomodatie scherm met zoveel info CRUD en ALLE. Info waar zie ik link komoot google tickets en AI info voor de activiteit" — na verduidelijking opgesplitst in twee sporen. Spoor 1 (Komoot/route-bug op activiteit-detail) is al gebouwd en gemerged. Dit document is spoor 2: het accommodatiescherm, "apart uit te werken" zoals bevestigd.

---

## Wat er nu al is (niet opnieuw bouwen)

`js/screen-accommodation.js` heeft al een behoorlijk compleet scherm:

- **Hero**: naam, hoogte, coördinaten, check-in/check-out-datums, weerbadge, foto (of topo-patroon als er geen foto is).
- **Snelacties**: Route, Kaart, Weer, Bel, Bewerk.
- **Infokaart**: check-in/check-out, aantal nachten, adres + Maps-knop, coördinaten, boekingslink (als `url` is ingevuld).
- **Notities**: vrij tekstveld, bewerkbaar.
- **"Vanaf hier"**: Geplande activiteiten, AI-ideeën nabij, Laadstations, Tickets, Kaart.
- **Activiteiten van dit verblijf**: gefilterde lijst.
- **Alle verblijven**: volledige CRUD-tijdlijn (toevoegen/bewerken/verwijderen, met keuzedialoog voor gekoppelde activiteiten bij verwijderen) — dit deel is al vrij volledig.

---

## Gevonden gaten

Ik ben het datamodel (`js/data.js`) en het scherm veld-voor-veld langsgelopen. Dit zijn de plekken waar "CRUD en ALLE info" nog niet klopt:

| # | Gat | Impact |
|---|---|---|
| 1 | **Telefoonnummer** — het veld `phone` bestaat in het datamodel maar is in élke accommodatie altijd `null`. Er is geen invoerveld in het bewerk-formulier om het ooit in te vullen. De "Bel"-snelknop is daardoor een permanente dode knop (toont alleen een toast "geen telefoonnummer opgeslagen"). | Knop die nooit werkt. |
| 2 | **Tickets zijn niet gekoppeld aan een verblijf.** Het ticket-datamodel heeft geen `accId`-veld. De "Tickets"-snellink op het accommodatiescherm gaat daardoor naar de volledige, ongefilterde tickets-lijst — niet naar "tickets die bij dit verblijf horen". | "Tickets" op dit scherm toont niet wat de knop belooft. |
| 3 | **Check-in/check-out-tijden zijn hardcoded nepteksten** ("vanaf 15:00", "voor 11:00") — niet per accommodatie instelbaar, ook al verschilt dit in werkelijkheid per verblijf. | Info kan feitelijk onjuist zijn. |
| 4 | **Geen boekingsreferentie/-bevestigingscode**, los van het `url`-boekingslinkveld dat er al is. Bij navraag bij een accommodatie (bijv. telefonisch, gap #1) heb je vaak een reserveringsnummer nodig. | Ontbrekende info-veld. |
| 5 | **Geen meerdaagse weersverwachting** op het accommodatiescherm — alleen één weerbadge in de hero (huidig moment). Voor een verblijf van meerdere nachten zou een strip per dag (zoals al bestaat in Roadtrip-modus, `fillWeatherStrip()`) nuttiger zijn. | Beperkte info, herbruikbare component bestaat al. |
| 6 | **Geen directe "+ activiteit"-knop** vanaf het accommodatiescherm zelf — je moet naar Planning navigeren om een activiteit aan dit verblijf te koppelen. | Extra stap voor een veelgebruikte actie. |

---

## Voorstel per punt

De meeste gaten zijn ondubbelzinnig te fixen — die bouw ik gewoon met een voor de hand liggende aanpak. Twee punten (#2 en #5) raken een echte ontwerpkeuze en leg ik hieronder als vraag voor.

1. **Telefoonnummer** → invoerveld toevoegen aan het bewerk-formulier (`sheet-edit-accommodation`), simpel tekstveld met `tel:`-link op de Bel-knop zodra ingevuld. Leeg = knop verborgen i.p.v. dode toast.
2. **Tickets koppelen aan verblijf** → zie open vraag hieronder (datamodel-wijziging).
3. **Echte check-in/check-out-tijden** → twee tijdvelden toevoegen aan het bewerk-formulier (naast de bestaande datumvelden), met de huidige teksten als standaardwaarde zodat niets breekt voor verblijven die nog niet zijn bijgewerkt.
4. **Boekingsreferentie** → apart tekstveld `bookingRef` naast het bestaande `url`-veld, getoond in de infokaart als "Reserveringsnummer" wanneer ingevuld.
5. **Meerdaagse weerstrip** → zie open vraag hieronder (scope-keuze).
6. **"+ Activiteit" direct vanaf accommodatiescherm** → knop bij "Activiteiten van dit verblijf" die direct het nieuwe-activiteit-formulier opent met dit verblijf al voorgeselecteerd (hergebruikt bestaande formulier-logica, geen nieuw scherm).

---

## Open vragen

**Vraag 1 — Tickets koppelen aan verblijf:** dit vereist een datamodel-wijziging (een `accId`-veld op tickets, zoals activiteiten al hebben). Niet elk ticket hoort bij een verblijf (bijv. een vlucht of trein hoort nergens specifiek bij). Voorstel: bij het toevoegen/bewerken van een ticket een optioneel keuzeveld "Hoort bij verblijf" toevoegen (leeg = geen koppeling, blijft zichtbaar in de algemene tickets-lijst). Het accommodatiescherm toont dan alleen tickets mét die koppeling.

**Vraag 2 — Meerdaagse weerstrip:** wil je dit erbij op het accommodatiescherm (herbruikt bestaande `fillWeatherStrip()`-component uit Roadtrip-modus, dus relatief kleine toevoeging), of is de huidige losse weerbadge in de hero voldoende en is dit onnodige extra info?

Zodra deze twee beantwoord zijn, bouw ik alles in één keer (punten 1, 3, 4, 6 zijn sowieso duidelijk; 2 en 5 hangen af van de antwoorden).
