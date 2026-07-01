// ═══════════════════════════════════════════════════════════
// api/charging-stations.js — Vercel serverless function
// Roept Open Charge Map aan voor laadstations bij een locatie
// of langs een reeks routepunten.
// Docs: https://api.openchargemap.io/v3/poi/
//
// OPENCHARGEMAP_API_KEY staat als Vercel environment variable.
// ═══════════════════════════════════════════════════════════

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Alleen GET toegestaan' });
  }

  const apiKey = process.env.OPENCHARGEMAP_API_KEY || '';
  const { lat, lng, points, distanceKm } = req.query;

  // DIAGNOSE: log naar Vercel function logs zodat we via "vercel logs"
  // of het dashboard kunnen zien wat er precies binnenkomt.
  console.log('charging-stations aangeroepen met:', { lat, lng, points, distanceKm, hasKey: !!apiKey });

  // Basisvalidatie tegen misbruik: begrens de straal en het aantal
  // routepunten, zodat één verzoek niet honderden upstream-aanroepen
  // naar Open Charge Map kan triggeren.
  const boundedDistanceKm = Math.min(parseFloat(distanceKm) || 25, 100);
  if (lat && (isNaN(parseFloat(lat)) || Math.abs(parseFloat(lat)) > 90)) {
    return res.status(400).json({ error: 'Ongeldige lat' });
  }
  if (lng && (isNaN(parseFloat(lng)) || Math.abs(parseFloat(lng)) > 180)) {
    return res.status(400).json({ error: 'Ongeldige lng' });
  }

  try {
    if (lat && lng) {
      const stations = await fetchStationsNear(
        parseFloat(lat),
        parseFloat(lng),
        boundedDistanceKm,
        apiKey
      );
      return res.status(200).json({ stations });
    }

    if (points) {
      const coords = points.split(';').slice(0, 20).map(p => {
        const [plat, plng] = p.split(',').map(Number);
        return { lat: plat, lng: plng };
      });

      const allStations = [];
      const seenIds = new Set();

      for (const point of coords) {
        const stations = await fetchStationsNear(
          point.lat, point.lng,
          Math.min(parseFloat(distanceKm) || 15, 100),
          apiKey
        );
        for (const station of stations) {
          if (!seenIds.has(station.id)) {
            seenIds.add(station.id);
            allStations.push(station);
          }
        }
      }

      return res.status(200).json({ stations: allStations });
    }

    return res.status(400).json({ error: 'Geef lat+lng of points op' });
  } catch (err) {
    // DIAGNOSE: stuur de volledige fout + stack mee in de response,
    // zodat de browser-toast de echte oorzaak kan tonen.
    console.error('charging-stations fout:', err);
    return res.status(500).json({
      error: 'Onverwachte fout',
      message: err.message,
      stack: err.stack ? err.stack.split('\n').slice(0, 3).join(' | ') : undefined,
    });
  }
}

async function fetchStationsNear(lat, lng, distanceKm, apiKey) {
  const params = new URLSearchParams({
    output: 'json',
    latitude: lat,
    longitude: lng,
    distance: distanceKm,
    distanceunit: 'KM',
    maxresults: '15',
    compact: 'true',
    verbose: 'false',
  });
  if (apiKey) params.set('key', apiKey);

  const url = `https://api.openchargemap.io/v3/poi/?${params.toString()}`;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'TravelCockpit/1.0' },
  });

  const bodyText = await response.text();

  if (!response.ok) {
    throw new Error(`Open Charge Map gaf HTTP ${response.status}: ${bodyText.slice(0, 200)}`);
  }

  let data;
  try {
    data = JSON.parse(bodyText);
  } catch (parseErr) {
    throw new Error(`Open Charge Map antwoord was geen geldige JSON: ${bodyText.slice(0, 200)}`);
  }

  // FIX: Open Charge Map kan bij een fout een object teruggeven
  // ipv een array (bijv. {"error": true, "reason": "..."}).
  // Zonder deze check crasht data.map() met een onduidelijke
  // "data.map is not a function" fout.
  if (!Array.isArray(data)) {
    throw new Error(`Open Charge Map gaf geen array terug: ${JSON.stringify(data).slice(0, 200)}`);
  }

  // Transformeer naar een compacte, voor de app bruikbare vorm.
  // Elke stap is defensief tegen ontbrekende velden, zodat één
  // vreemde POI niet de hele lijst laat crashen.
  return data
    .map(poi => {
      try {
        const connections = poi.Connections || [];
        const maxPowerKw = connections.reduce((max, c) => Math.max(max, c.PowerKW || 0), 0);
        const connectorTypes = [...new Set(
          connections.map(c => c.ConnectionType && c.ConnectionType.Title).filter(Boolean)
        )];

        return {
          id: poi.ID,
          name: (poi.AddressInfo && poi.AddressInfo.Title) || 'Laadstation',
          address: (poi.AddressInfo && poi.AddressInfo.AddressLine1) || '',
          town: (poi.AddressInfo && poi.AddressInfo.Town) || '',
          lat: poi.AddressInfo && poi.AddressInfo.Latitude,
          lng: poi.AddressInfo && poi.AddressInfo.Longitude,
          operator: (poi.OperatorInfo && poi.OperatorInfo.Title) || 'Onbekende operator',
          maxPowerKw,
          connectorTypes,
          numberOfPoints: poi.NumberOfPoints || connections.length || 1,
          isOperational: !poi.StatusType || poi.StatusType.IsOperational !== false,
        };
      } catch (mapErr) {
        // Eén kapotte POI mag de rest niet blokkeren
        console.error('Kon POI niet verwerken:', mapErr, poi && poi.ID);
        return null;
      }
    })
    .filter(s => s && s.lat && s.lng);
}
