# Vercel function-limiet: élke deploy sinds #60 faalde stil (2026-07-07)

**Document ID:** TC-ISSUES-032
**Status:** ✅ Gefixt — **kritiek, blokkeerde alle live-updates**
**Bron:** Vervolg op de service-worker-fix (#63): "Zie nog geen verandering" na een merge + volgens de gebruiker geen zichtbaar effect ondanks de update-banner-fix.

---

## Root cause — de échte oorzaak, dieper dan de service worker

De service-worker-fix (#63, `docs/10-issues/31-...`) was op zichzelf correct, maar loste het probleem niet op omdat er iets fundamentelers mis was: **elke productie-deploy sinds PR #60 is stilzwijgend mislukt.**

Vercel's Hobby-plan (het gratis plan) staat **maximaal 12 Serverless Functions per deployment** toe. Elk los bestand direct in `api/` telt als een eigen functie. Vóór PR #60 stonden er 12 bestanden in `api/` — precies op de grens. PR #60 voegde `api/geocode.js` toe (de adres-naar-coördinaten-lookup) — bestand nummer 13, over de grens.

Vanaf dat moment faalde de build van élke volgende production-deploy met:
```
errorCode: "exceeded_serverless_functions_per_deployment"
errorMessage: "No more than 12 Serverless Functions can be added to a
  Deployment on the Hobby plan. Create a team (Pro plan) to deploy more."
```

De GitHub PR-merges zelf gingen prima door (de code op `main` was steeds correct en up-to-date), maar Vercel kon de bijbehorende productie-omgeving niet meer bouwen. De live site (`travel-cockpit-virid.vercel.app`) bleef daardoor vastzitten op de laatste geslaagde deploy — de code van **PR #59**, drie merges vóór het probleem ontstond. Dit verklaart alles: geen enkele wijziging uit #60, #61, #62 of #63 kwam ooit live, ongeacht wat er met de service worker gebeurde — de service worker deed precies waarvoor hij bedoeld was (netwerkverzoeken doen), maar het netwerk gaf gewoon steeds dezelfde, oude versie terug omdat er nooit een nieuwere bestond om naar te wijzen.

**Waarom dit niet eerder opviel**: GitHub's PR-merge-flow en Vercel's build-proces zijn losse systemen. Een geslaagde merge zegt niets over een geslaagde deploy — dat vereiste een expliciete controle bij Vercel zelf (via de Vercel MCP-tools), die tot nu toe niet was gedaan omdat elke eerdere melding leek te wijzen op een kleinere, lokale oorzaak (een los stukje UI, een cache-probleem).

---

## Fix

De 5 nauwst-verwante endpoints — allemaal PIN-gated, allemaal leunend op dezelfde `_lib/firebaseAdmin.js` — zijn samengevoegd tot één functie, met behoud van exact dezelfde logica (geverifieerd via een letterlijke diff, zie hieronder):

| Vóór (5 losse bestanden) | Na |
|---|---|
| `api/owner-login.js` | `api/share.js`, `POST { action: 'login' }` |
| `api/create-share.js` | `api/share.js`, `POST { action: 'create' }` |
| `api/list-shares.js` | `api/share.js`, `POST { action: 'list' }` |
| `api/revoke-share.js` | `api/share.js`, `POST { action: 'revoke' }` |
| `api/redeem-share.js` | `api/share.js`, `GET ?id=...` |

`api/`-functietelling: 13 → **9** (5 verwijderd, 1 nieuwe erbij), ruim onder de limiet van 12 met marge voor toekomstige eindpunten.

Client-side aangepast (`js/firebase.js`: `redeemShareLink()`, `signInAsOwner()`; `js/screen-tickets.js`: de vier `callShareApi(...)`-aanroepen in het "Deel-links beheren"-scherm) om naar het nieuwe, gecombineerde eindpunt te wijzen.

---

## Geverifieerd

- **Logica-gelijkheid**: elke handler in `api/share.js` is via `diff` letterlijk vergeleken met de oorspronkelijke bestanden — de enige verschillen zijn de functie-signature (wrapper) en de nu-centrale method-check; alle statuscodes, foutmeldingen en Firestore-operaties zijn woordelijk ongewijzigd.
- **Headless-test**: alle vijf client-aanroepen (`redeemShareLink`, `signInAsOwner`, en de drie `callShareApi`-paden voor lijst/aanmaken/intrekken) sturen nu correct naar `/api/share` met de juiste `action`/query-parameter; geen enkele aanroep gaat nog naar een van de vijf oude endpoint-URL's.
- **Functietelling**: `api/`-map bevat nu 9 top-level `.js`-bestanden (was 13).

---

## Wat dit voor jou betekent

Zodra deze fix gemerged en gedeployed is, zou de eerstvolgende deploy voor het eerst sinds PR #60 weer moeten **slagen** — daarmee komen in één klap ook alle wijzigingen uit #60, #61, #62 en #63 alsnog live. Dit is te controleren via de Vercel-dashboard of door de site na een paar minuten te verversen.

---

## Gewijzigde bestanden

`api/share.js` (nieuw, consolidatie van 5 endpoints), `api/owner-login.js`/`create-share.js`/`list-shares.js`/`revoke-share.js`/`redeem-share.js` (verwijderd), `js/firebase.js`, `js/screen-tickets.js`.
