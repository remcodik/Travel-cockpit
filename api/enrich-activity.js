// ═══════════════════════════════════════════════════════════
// api/enrich-activity.js — Vercel serverless function
// AI-verrijking voor ÉÉN specifieke, al bestaande activiteit — apart
// van api/suggestions.js (dat 5 NIEUWE Discover-suggesties voor een
// accommodatie genereert). Eerder werd de enrich-aanroep per ongeluk
// door api/suggestions.js afgehandeld: het custom "prompt"-veld dat
// de client meestuurde werd daar nooit gelezen, dus je kreeg gewoon
// het eerste van 5 verse, willekeurige suggesties terug — niet per se
// iets over de opgegeven activiteit zelf. Dit endpoint verrijkt
// daadwerkelijk de genoemde activiteit.
// ═══════════════════════════════════════════════════════════

import { fetchPageContext } from './_lib/fetchPageContext.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Alleen POST toegestaan' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY ontbreekt in Vercel environment variables' });
  }

  const { activityName, accommodationName, accommodationLocation, country, language, activityLink } = req.body || {};

  if (!activityName || typeof activityName !== 'string' || activityName.length > 200) {
    return res.status(400).json({ error: 'activityName ontbreekt of is ongeldig' });
  }
  if (!accommodationName || typeof accommodationName !== 'string' || accommodationName.length > 200) {
    return res.status(400).json({ error: 'accommodationName ontbreekt of is ongeldig' });
  }

  // Opgeslagen Komoot-/website-link (act.komootTourUrl of act.link) erbij
  // ophalen: de gebruiker koos deze link zelf als "dit is de plek", dus de
  // AI moet hierop gronden i.p.v. gokken op alleen de activiteitnaam — dat
  // gaf eerder een omschrijving die niets met de daadwerkelijk gelinkte
  // plek te maken had.
  let linkContext = null;
  if (activityLink && typeof activityLink === 'string' && /^https?:\/\//i.test(activityLink)) {
    linkContext = await fetchPageContext(activityLink);
  }

  const systemPrompt = `Je bent de reisassistent in Travel Cockpit. Je verrijkt ÉÉN al bestaande, door de gebruiker ingeplande activiteit met meer achtergrond — je stelt geen nieuwe plekken voor.

Regels die je ALTIJD volgt:
1. Verzin geen specifieke adressen, telefoonnummers of openingstijden die je niet zeker weet.
2. Noem onzekerheid over geschiedenis/feiten expliciet ("naar verluidt", "vermoedelijk") i.p.v. iets stellig te beweren dat je niet zeker weet.
3. Antwoord in de voorkeurstaal van de gebruiker.
4. Antwoord ALTIJD met geldige JSON, precies 1 object. Nooit platte tekst of markdown.

Retourneer exact dit formaat:
{
  "description": "4-6 zinnen — wat het is, waarom de moeite waard, wat je er kunt verwachten",
  "fun_fact": "1 kort, interessant achtergrondfeitje (geschiedenis/cultuur) — of null als je niets met voldoende zekerheid weet",
  "duration_minutes": getal of null,
  "distance_km": getal of null,
  "difficulty": "easy" | "medium" | "hard" | null,
  "tips": ["max 3 korte praktische tips"],
  "best_time": "beste tijd van de dag/het jaar, of null",
  "komoot_search": "zoekterm voor Komoot, alleen als dit een wandeling/hike is, anders null"
}`;

  const userMessage = `Activiteit: "${activityName}"
Verblijf: ${accommodationName}, ${accommodationLocation || ''}
Land: ${country || 'onbekend'}
Taal: ${language || 'nl'}
${linkContext ? `
De gebruiker heeft zelf deze link bij de activiteit opgeslagen (dit IS de
bedoelde plek — baseer je omschrijving hierop, niet alleen op de naam
hierboven):
Titel op de link: ${linkContext.title || '(geen titel gevonden)'}
Omschrijving op de link: ${linkContext.description || '(geen omschrijving gevonden)'}
` : ''}
Verrijk deze specifieke activiteit.`;

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
        max_tokens: 800,
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

    const cleaned = textBlock.text.replace(/```json|```/g, '').trim();
    let enriched;
    try {
      enriched = JSON.parse(cleaned);
    } catch {
      return res.status(502).json({ error: 'AI-antwoord was geen geldige JSON', raw: cleaned });
    }

    return res.status(200).json({ enriched });
  } catch (err) {
    return res.status(500).json({ error: 'Onverwachte serverfout', message: err.message });
  }
}
