// ═══════════════════════════════════════════════════════════
// api/region-guide.js — Vercel serverless function
// Reisgids-achtige omgevingsinfo bij een verblijf: karakter van de
// streek, geschiedenis/cultuur, bezienswaardigheden en praktische
// tips — zoals een reisgids (Lonely Planet/ANWB-stijl) dat zou doen.
// Geen concrete adressen/telefoonnummers/openingstijden (die verzint
// een AI te makkelijk fout) — alleen namen + korte toelichting.
// On-demand aangeroepen (geen automatische kosten), resultaat wordt
// client-side gecached in Firestore (zie dbSaveRegionGuide()).
// ═══════════════════════════════════════════════════════════

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Alleen POST toegestaan' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY ontbreekt in Vercel environment variables' });
  }

  const { accommodationName, accommodationLocation, country, travelStyles, language } = req.body || {};

  if (!accommodationName || typeof accommodationName !== 'string' || accommodationName.length > 200) {
    return res.status(400).json({ error: 'accommodationName ontbreekt of is ongeldig' });
  }
  if (Array.isArray(travelStyles) && travelStyles.length > 50) {
    return res.status(400).json({ error: 'travelStyles te groot' });
  }

  const systemPrompt = `Je bent de reisassistent in Travel Cockpit. Je schrijft een korte reisgids-achtige introductie over de OMGEVING/STREEK van een verblijf — geen concrete activiteiten om in te plannen (dat doet een ander deel van de app al), maar achtergrond: hoe is de streek, wat is er geschiedkundig/cultureel interessant, en praktische dingen om te weten.

Regels die je ALTIJD volgt:
1. Verzin geen concrete adressen, telefoonnummers, openingstijden of prijzen.
2. Noem onzekerheid over geschiedenis/feiten expliciet ("naar verluidt", "vermoedelijk") i.p.v. iets stellig te beweren dat je niet zeker weet.
3. "highlights" zijn namen van plekken/dingen die de moeite waard zijn om te wéten dat ze bestaan (geen volledig uitgewerkte bezienswaardigheden-gids, dat overlapt met de AI-ideeën-functie elders in de app).
4. Antwoord in de voorkeurstaal van de gebruiker.
5. Antwoord ALTIJD met geldige JSON, exact 1 object. Nooit platte tekst of markdown.

Retourneer exact dit formaat:
{
  "paragraphs": ["3-4 alinea's: karakter van de streek, geschiedenis/cultuur, wat dit gebied kenmerkt"],
  "highlights": [{"name": "naam van een plek/ding om te weten", "note": "1 korte zin toelichting"}],
  "practicalTips": ["4-6 korte praktische tips: taal, gebruiken, veiligheid, lokale gewoontes — geen adressen/tijden"]
}`;

  const userMessage = `Verblijf: ${accommodationName}
Locatie: ${accommodationLocation || 'onbekend'}
Land: ${country || 'onbekend'}
Reisvoorkeuren: ${(travelStyles || []).join(', ') || 'geen specifieke voorkeuren'}
Taal: ${language || 'nl'}

Schrijf de reisgids-introductie voor deze omgeving.`;

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

    const cleaned = textBlock.text.replace(/```json|```/g, '').trim();
    let guide;
    try {
      guide = JSON.parse(cleaned);
    } catch {
      return res.status(502).json({ error: 'AI-antwoord was geen geldige JSON', raw: cleaned });
    }

    return res.status(200).json({ guide });
  } catch (err) {
    return res.status(500).json({ error: 'Onverwachte serverfout', message: err.message });
  }
}
