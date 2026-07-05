# AI-verrijking uitbreiden + reisgids-info bij verblijf — plan

**Document ID:** TC-ISSUES-011
**Status:** Plan geschreven, wacht op antwoord op de open vragen onderaan. Punt 1 (reisdag-icoon) is al gebouwd, niet meer onderdeel van dit plan.
**Bron:** vervolgverzoek na de dagtabs-styling: reisdag-icoon bij activiteit toevoegen (✅ gebouwd), Komoot-link-autofill, meer AI-tekst bij activiteit/verblijf, en reisgids-achtige omgevingsinfo met links — expliciet met het verzoek om eerst na te denken/plannen/rode-team en vragen te stellen vóór het bouwen.

---

## 1. Reisdag/auto-icoon bij "Activiteit toevoegen" ✅ Gebouwd

De badge naast de dag-keuze toont nu, net als de dagtabs in Planning, een 🚗-icoon met een subtiele twee-kleuren-rand (links = vorig verblijf, rechts = nieuw verblijf) zodra de gekozen dag een verplaatsdag is. Geen open vraag, dit is al klaar.

---

## 2. Komoot-link → andere velden invullen als ze leeg zijn

**Wat je vraagt**: als je een Komoot-routelink plakt, moeten afstand/duur/hoogtewinst automatisch ingevuld worden (als ze nog leeg zijn).

**Eerlijk technisch probleem**: Komoot heeft geen publieke data-API. De enige "opening" is de officiële embed (`komoot.com/tour/{id}/embed?profile=1`), maar dat is een iframe die render-only is — de pagina die 'm toont krijgt geen toegang tot de cijfers ín die iframe (cross-origin, geen postMessage-koppeling met Komoot). Automatisch aflezen van de rendered grafiek is dus niet mogelijk.

**Wat wel een optie is — zelfde aanpak als `api/extract-listing.js`**: die functie haalt server-side de HTML van een boekingslink op en zoekt naar gestructureerde data (JSON-LD/Open Graph). Een vergelijkbare `api/extract-komoot-tour.js` zou hetzelfde kunnen proberen bij een Komoot-tourpagina. Eerlijke inschatting van het risico: toen ik zelf (via de WebFetch-tool, ook een niet-browser HTTP-verzoek) een Komoot-pagina probeerde op te halen voor onderzoek, blokkeerde Komoot dat met HTTP 403 — vermoedelijk bot-detectie (Cloudflare-achtig). Het is dus goed mogelijk dat een Vercel-server-functie hetzelfde overkomt. Dat is geen showstopper — net als bij `extract-listing.js` zou het gewoon "niet gevonden, vul zelf aan" teruggeven zonder iets te breken — maar ik kan van tevoren niet garanderen dat het werkt, alleen dat het nooit gokt of iets verzint.

**Wat ik NIET wil doen**: de AI (Claude) laten "schatten" wat de afstand/duur/hoogte van een specifieke Komoot-tour is op basis van de naam. Dat zou geen scraping van echte tourdata zijn maar een educated guess die er als een harde meting uitziet — dat botst met het eerlijkheidsprincipe dat in deze hele app is aangehouden (geen verzonnen cijfers, zoals bij laadstations en weer).

**Voorstel**: `api/extract-komoot-tour.js` bouwen volgens het `extract-listing.js`-patroon (server-side ophalen, zoeken naar JSON-LD/gestructureerde data over afstand/duur/hoogte in de Komoot-pagina zelf), alleen de leeg-gebleven velden invullen, stil falen (huidige gedrag) als het niet lukt. Zie open vraag 1 hieronder — dit is de moeite van het bouwen waard, maar ik wil niet garanderen dat het ook echt werkt op de live Komoot-site voordat we het geprobeerd hebben.

---

## 3. Meer AI-tekst bij activiteit-detail

Er bestaat al "AI-verrijking" per activiteit (`openAiEnrichSheet()` in `js/screen-planning.js`) — een 2-3 zinnen beschrijving, tips, beste tijdstip, Komoot-zoekterm. Dit is al on-demand (jij tikt op de knop, geen automatische AI-kosten) en al zichtbaar op het activiteit-detailscherm zodra je 'm opslaat.

**Voorstel (kan direct, geen open vraag)**: de prompt in `api/suggestions.js`/`openAiEnrichSheet()` uitbreiden zodat de beschrijving iets uitgebreider wordt (4-6 zinnen i.p.v. 2-3) én een klein "wist-je-dat"/context-feitje toevoegt (geschiedenis, waarom deze plek bekend is) — met dezelfde bestaande regel dat de AI onzekerheid expliciet benoemt i.p.v. iets te verzinnen. Dit is een kleine, veilige aanpassing van een bestaande, al-geaccepteerde flow.

---

## 4. Reisgids-achtige omgevingsinfo bij een verblijf (nieuw)

Dit is de grootste, nieuwe toevoeging: geen AI-verrijking per activiteit, maar een AI-blok over de **omgeving/stad/regio** van een verblijf zelf — zoals een reisgids (Lonely Planet/ANWB/Trotter-stijl) dat zou doen: iets van geschiedenis, karakter van de streek, praktische tips, waar je meer info kunt vinden.

**Wat er nu bestaat**: niets vergelijkbaars. Het `notes`-veld bij een accommodatie is puur handmatig (jouw eigen tekst). Er is geen AI-aanroep die over een régio/omgeving gaat — alleen over een individuele activiteit (Discover-suggesties, AI-verrijking).

**Voorstel-opzet**:
- Nieuwe sectie op het accommodatiescherm, bijv. "Over deze omgeving" — een AI-blok met 2-4 korte alinea's (karakter van de streek, iets van geschiedenis/cultuur, praktische tips zoals openingstijden-cultuur, taal, etage-gewoontes e.d.).
- **On-demand knop**, net als AI-verrijking bij activiteiten — geen automatische aanroep bij elk bezoek (kost geld per Anthropic-aanroep, en de content verandert toch nauwelijks — cachen is dus prima).
- **Cache**: net als de Discover-suggesties opslaan in Firestore (`ai_cache`-patroon, gedeeld tussen apparaten) zodat je niet elke keer opnieuw betaalt/wacht — regio-info wordt immers niet snel "oud".
- **Links**: geen AI-gegenereerde URL's (risico op een verzonnen/niet-bestaande link — exact het Komoot-probleem dat we net gefixt hebben). In plaats daarvan: een paar **veilige, altijd-werkende zoeklinks** die de app zelf samenstelt uit de plaatsnaam (zelfde patroon als `komootSearchUrl()`), bijvoorbeeld naar Wikipedia en Wikivoyage. Geen gegokte kant-en-klare artikel-URL (die kan 404'en bij een spellingsverschil), wel een zoekopdracht die altijd iets relevants teruggeeft.

**Rode-team / risico's**:
- **Kosten**: elke AI-aanroep kost geld (Anthropic-API). On-demand + cachen houdt dit beperkt, net als bij AI-verrijking.
- **Betrouwbaarheid van AI-beweringen**: geschiedenis/cultuur-teksten kunnen subtiel onjuist zijn. Zelfde regel als de bestaande system-prompt: onzekerheid benoemen, geen stellige "feiten" verzinnen. Dit is inherent aan elk AI-tekstblok, niet volledig te elimineren — daarom een duidelijk klein label/disclaimer ("AI-samenvatting, geen gegarandeerde feiten") bij het blok.
- **Scope-kruip**: dit kan uitdijen tot een mini-Wikipedia in de app. Ik hou het bewust kort (2-4 alinea's, geen aparte lijst met bezienswaardigheden — dat doet Discover al).
- **Overlap met bestaande features**: Discover (AI-ideeën) en de nieuwe reisgids-sectie kunnen elkaar overlappen qua toon. Onderscheid: Discover = concrete activiteiten om te plannen; reisgids-sectie = achtergrond/context over de plek zelf, niet actie-gericht.

---

## Open vragen

**Vraag 1 — Komoot-autofill bouwen, ondanks onzekere haalbaarheid?**
Ik kan `api/extract-komoot-tour.js` bouwen volgens het bestaande, veilige patroon (server-side scrapen, stil falen als het niet lukt) — maar ik weet niet zeker of Komoot dit blokkeert (hun site blokkeerde mijn eigen onderzoekspoging al met HTTP 403). Wil je dat ik het toch bouw (kost niets als het niet werkt, valt gewoon terug op handmatig invullen), of vind je dat niet de moeite waard gezien de onzekerheid?

**Vraag 2 — Waar moet de reisgids-sectie komen en hoe geactiveerd?**
Voorstel: nieuwe sectie op het bestaande accommodatiescherm, met een knop "Genereer omgevingsinfo" (on-demand, zoals AI-verrijking) — geen automatische aanroep. Ben je het hiermee eens, of zie je het liever anders (bijv. automatisch bij eerste bezoek, of als apart tabblad)?

**Vraag 3 — Hoeveel tekst/links wil je precies?**
Voorstel: 2-4 korte alinea's (karakter streek, geschiedenis/cultuur, praktische tips) + 2 vaste zoeklinks (Wikipedia, Wikivoyage) — geen losse lijst met bezienswaardigheden (dat doet Discover al). Is dat de juiste hoeveelheid, of wil je meer/minder?

Zodra deze drie beantwoord zijn, bouw ik punt 2 (indien gewenst), 3 en 4 in één keer.
