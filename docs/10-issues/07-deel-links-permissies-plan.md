# Deel-links met view/edit-rechten — architectuurplan

**Document ID:** TC-ISSUES-007
**Status:** Plan klaar, wacht op akkoord vóór bouw
**Bron:** Verzoek 5 uit `docs/10-issues/06-vijf-nieuwe-verzoeken.md`

---

## Waar dit voor is

Verschillende deel-links per reis, met echt afdwingbare rechten — niet gebonden aan een gebruikersaccount, maar aan de link zelf:

- Een link die één specifieke reis toont, alléén bekijken.
- Een link die alle reizen toont, alléén bekijken.
- Een link die één specifieke reis toont, met volledige bewerkrechten.
- Een link die alle reizen toont, met volledige bewerkrechten.

Kortom: een 2×2-matrix (bekijken/bewerken) × (1 reis/alle reizen), en jij (de eigenaar) kan zelf bepalen wie welke link krijgt.

## Waarom dit geen kleine toevoeging is

`firestore.rules` staat nu `allow read: if true` toe op alles, zonder uitzondering — bevestigd door het bestand opnieuw te lezen. Er bestaat geen login, ook niet voor jouzelf als eigenaar. Het huidige deel-linkje plakt alleen `?trip=<id>` aan de URL zodat de app die reis toont; het is een leesbaarheids-shortcut, geen slot. Om een link echt rechten te laten afdwingen, moet er ergens een controle komen die *voordat* data wordt gelezen of geschreven checkt: bij welke link hoort dit verzoek, en wat mag die link?

Dat "ergens" kan op twee manieren:

## Route A — Firebase Authentication (custom tokens) + herschreven Firestore-rules — **aanbevolen**

**Idee:** elke deel-link krijgt een eigen record in een nieuwe Firestore-collectie `shares/{shareId}` (bv. `{ scope: 'view'|'edit', tripId: '<id>' | null (= alle reizen), label: 'voor Jan', revoked: false }`). Als iemand de link `?share=<shareId>` opent, vraagt de app een tijdelijke sessie aan bij een nieuwe server-functie, die — met een geheime service-account-sleutel die alleen de server kent — een Firebase-"custom token" aanmaakt met die rechten erin gebakken. De browser logt daarmee anoniem in bij Firebase; vanaf dat moment controleren de Firestore-rules zelf (`request.auth.token.scope`, `.tripId`) of een lees/schrijf-actie is toegestaan.

**Waarom dit de voorkeur heeft:** de app blijft "server-less" voor het dagelijkse gebruik — dezelfde rechtstreekse Firestore-verbinding, inclusief de **live sync tussen toestellen** die er nu al is (dat is een net zo belangrijke, onopvallend werkende functie als de rechten zelf). Alleen het inloggen zelf loopt even langs een server-functie.

**Wat erbij komt:**
1. Firebase Anonymous Authentication aanzetten (Firebase Console, jouw actie — zelfde soort stap als de Firestore-rules zelf al zijn).
2. Nieuwe Firestore-collectie `shares/{shareId}`.
3. Nieuwe server-functie `/api/redeem-share` — zoekt het share-record op, maakt er een custom token van (vereist `firebase-admin` + een service-account-sleutel als Vercel-omgevingsvariabele — vergelijkbaar met de bestaande `OPENCHARGEMAP_API_KEY`, dus met dezelfde valkuil: eenmalig goed plakken, niet meer terug te lezen).
4. Nieuwe server-functie `/api/create-share` — alleen bruikbaar door jou als eigenaar (zie hieronder), maakt/herroept links.
5. Firestore-rules herschreven: `allow read/write` gebaseerd op `request.auth.token.scope`/`.tripId` i.p.v. `if true`.
6. Client (`js/firebase.js`): bij het openen van de app met `?share=...` wordt eerst ingelogd via het bovenstaande, vóór er iets van Firestore gelezen wordt.

**Los probleem dat dit oplost, en dat nu ook nog niet bestaat: hoe log jíj zelf in als eigenaar?** Er is nu ook voor jou geen account. Voorstel: één simpele toegangscode (een PIN die alleen jij weet, gecontroleerd door een server-functie) die jouw toestel een "eigenaar"-sessie geeft met volledig, blijvend toegang tot alles — dat hoeft maar één keer per toestel, Firebase onthoudt de sessie daarna zelf. Vanuit die eigenaar-sessie beheer je dan de deel-links (aanmaken, een naam geven zoals "voor Jan", herroepen).

## Route B — Eigen API-laag (alle Firestore-toegang via server-functies)

**Idee:** de browser praat niet meer rechtstreeks met Firestore. Elke actie (reis laden, verblijf opslaan, ticket archiveren, …) gaat via een `/api/...`-functie die zelf de rechten controleert op basis van een link-token, en pas dan bij Firestore leest/schrijft met een eigen, volledig vertrouwde server-sleutel.

**Waarom niet als eerste keuze:** dit vervangt vrijwel elke functie in `js/firebase.js` (zo'n 15-20 functies) én verliest de **live sync tussen toestellen** — Firestore's realtime `onSnapshot`-luisteraars (waarmee tickets/activiteiten nu automatisch bijwerken op andere toestellen) bestaan alleen bij een rechtstreekse Firestore-verbinding. Om dat te behouden zou er iets als polling of Server-Sent Events bovenop gebouwd moeten worden — een aparte, foutgevoelige heropbouw van iets dat vandaag al goed werkt. Meer controle, maar een veel grotere ingreep met een reëel risico op regressie in een functie die nu stilletjes goed draait.

## Rode team — risico's (voor Route A, de aanbevolen route)

- **Verkeerde rules kunnen jou buitensluiten van je eigen data.** Mitigatie: rules eerst testen met de Firebase Emulator Suite vóór ze gepubliceerd worden, en een aparte, altijd-volledige-toegang "eigenaar"-claim die nooit via een deel-link loopt.
- **De service-account-sleutel is een nieuw gevoelig geheim** (zelfde categorie als de Open Charge Map-sleutel die eerder al eenmalig verkeerd geplakt bleek — G3). Eenmaal fout ingevuld is dat niet terug te lezen, alleen te overschrijven.
- **Een gelekte deel-link geeft nog steeds toegang tot het bijbehorende niveau, totdat hij herroepen wordt** — dat is inherent aan "link = toegang" (net als een Google Docs-deelinkje). Verbetering t.o.v. nu: dit kan tenminste per link herroepen worden; nu kan dat helemaal niet.
- **Omvang:** dit is realistisch de grootste losse ingreep van het hele traject tot nu toe — groter dan Fase B (de multi-trip-migratie). Verdient een eigen sessie, niet een instapje naast andere werk.

## Voorstel voor volgorde, als je akkoord gaat

1. Firebase Anonymous Authentication aanzetten (jouw actie in de Console).
2. Eigenaar-PIN + `/api/owner-login` + jouw eigen toestel eenmalig laten inloggen.
3. `shares`-collectie + `/api/create-share` + `/api/redeem-share`.
4. Firestore-rules herschrijven, eerst getest in de Emulator Suite.
5. Een klein "Deel-links beheren"-schermpje (in Instellingen/Meer) om links aan te maken/te herroepen, met de vier vaste combinaties als knoppen (1 reis bekijken / 1 reis bewerken / alle reizen bekijken / alle reizen bewerken).

---

## Vraag

Wil je dat ik dit nu daadwerkelijk ga bouwen (dan begin ik bij stap 1-2 hierboven, met bevestiging per stap gezien de gevoeligheid), of blijft dit voorlopig alleen dit plan totdat je er klaar voor bent?
