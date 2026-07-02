// ═══════════════════════════════════════════════════════════
// api/suggestions.js — Vercel serverless function
// Roept de Anthropic Claude API aan volgens docs/04-ai/01-ai-architecture.md
//
// Dit draait server-side zodat de API-sleutel nooit in de browser
// terechtkomt. De ANTHROPIC_API_KEY staat als environment variable
// in de Vercel projectinstellingen, niet in de broncode.
// ═══════════════════════════════════════════════════════════

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Alleen POST toegestaan' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'ANTHROPIC_API_KEY ontbreekt in Vercel environment variables',
    });
  }

  const {
    accommodationName,
    accommodationLocation,
    country,
    today,
    temperature,
    weatherCondition,
    rainProbability,
    userPreferences,
    alreadyPlanned,
    categoryFilter,
    language,
    weatherAdaptation,
  } = req.body || {};

  // Basisvalidatie tegen misbruik/kosten-opblazen: dit endpoint is publiek
  // bereikbaar (geen login-systeem), dus begrens in elk geval de omvang
  // van wat er in de prompt terechtkomt. Lost geen volledig rate-limiting-
  // vraagstuk op (dat vereist een aparte infrastructuurkeuze), maar
  // voorkomt de grofste misbruik-vectoren.
  if (!accommodationName || typeof accommodationName !== 'string' || accommodationName.length > 200) {
    return res.status(400).json({ error: 'accommodationName ontbreekt of is ongeldig' });
  }
  if (Array.isArray(alreadyPlanned) && alreadyPlanned.length > 200) {
    return res.status(400).json({ error: 'alreadyPlanned te groot' });
  }
  if (Array.isArray(userPreferences) && userPreferences.length > 50) {
    return res.status(400).json({ error: 'userPreferences te groot' });
  }

  // Systeemprompt — direct gebaseerd op docs/04-ai/01-ai-architecture.md
  // en docs/04-ai/01-ai-philosophy.md: AI suggereert, beslist nooit.
  const systemPrompt = `Je bent de reisassistent in Travel Cockpit, een roadtrip-app voor Noorwegen.

Regels die je ALTIJD volgt:
1. Je suggereert alleen, je beslist nooit voor de gebruiker.
2. Elke suggestie moet een "why_recommended" veld hebben dat uitlegt waarom dit relevant is.
3. Suggesties moeten relevant zijn voor de huidige locatie en het seizoen.
4. Suggesties mogen NIET overlappen met wat al gepland staat.
5. Houd je strikt aan het gekozen categoriefilter indien opgegeven.
6. Antwoord in de voorkeurstaal van de gebruiker.
7. Verzin geen specifieke adressen, telefoonnummers of openingstijden die je niet zeker weet.
8. Noem onzekerheid expliciet bij seizoensgebonden attracties.
9. Bij slecht weer: als weersuggesties aan staan, neem minstens één optie binnenshuis op. Staan ze uit, negeer het weer volledig voor je suggesties.
10. Antwoord ALTIJD met geldige JSON. Nooit platte tekst of markdown.

Retourneer een JSON array van precies 5 suggesties in dit formaat:
[
  {
    "name": "Naam van de plek",
    "category": "activity" | "restaurant" | "cafe" | "viewpoint",
    "description": "Korte beschrijving, max 2 zinnen.",
    "distance_km": 14,
    "duration_minutes": 240,
    "difficulty": "easy" | "medium" | "hard",
    "why_recommended": "Korte uitleg waarom dit relevant is voor deze gebruiker.",
    "google_maps_query": "Zoekterm voor Google Maps"
  }
]`;

  const userMessage = `Huidig verblijf: ${accommodationName}, ${accommodationLocation}
Land: ${country}
Vandaag: ${today}
Weer: ${temperature}°C, ${weatherCondition}, ${rainProbability}% kans op regen
Weersuggesties: ${weatherAdaptation === false ? 'uit — negeer het weer' : 'aan'}
Voorkeuren reiziger: ${(userPreferences || []).join(', ') || 'geen specifieke voorkeuren'}
Al gepland (niet dupliceren): ${(alreadyPlanned || []).join(', ') || 'nog niets'}
${categoryFilter && categoryFilter !== 'all' ? `Filter: alleen "${categoryFilter}"` : ''}
Taal: ${language || 'nl'}

Genereer 5 nieuwe suggesties die nog niet eerder genoemd zijn.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(502).json({ error: 'Anthropic API-fout', details: errText });
    }

    const data = await response.json();
    const textBlock = data.content.find(c => c.type === 'text');
    if (!textBlock) {
      return res.status(502).json({ error: 'Geen tekstantwoord van AI ontvangen' });
    }

    // Strip eventuele markdown-codeblokken voor het geval het model die toch toevoegt
    const cleaned = textBlock.text.replace(/```json|```/g, '').trim();
    let suggestions;
    try {
      suggestions = JSON.parse(cleaned);
    } catch (parseErr) {
      return res.status(502).json({ error: 'AI-antwoord was geen geldige JSON', raw: cleaned });
    }

    return res.status(200).json({ suggestions });
  } catch (err) {
    return res.status(500).json({ error: 'Onverwachte serverfout', message: err.message });
  }
}
