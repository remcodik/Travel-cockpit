// ═══════════════════════════════════════════════════════════
// api/charging-stations.js — Vercel serverless function
// Roept Open Charge Map aan voor laadstations bij een locatie
// of langs een reeks routepunten.
// Docs: https://api.openchargemap.io/v3/poi/
//
// OPENCHARGEMAP_API_KEY staat als Vercel environment variable.
// Open Charge Map's publieke endpoint werkt ook zonder sleutel
// met een lager rate-limit — de functie valt daar netjes op terug
// als de sleutel ontbreekt, zodat de functie nooit hard faalt.
// ═══════════════════════════════════════════════════════════

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Alleen GET toegestaan' });
  }

  const apiKey = process.env.OPENCHARGEMAP_API_KEY || '';
  const { lat, lng, points, distanceKm } = req.query;

  try {
    // Modus 1: rondom één punt (bijv. bij een accommodatie)
    if (lat && lng) {
      const stations = await fetchStationsNear(
        parseFloat(lat),
        parseFloat(lng),
        parseFloat(distanceKm) || 25,
        apiKey
      );
      return res.status(200).json({ stations });
    }

    // Modus 2: langs een route — meerdere lat,lng paren gescheiden door ';'
    // bijv. ?points=61.21,7.15;61.91,8.27;60.98,9.23
    if (points) {
      const coords = points.split(';').map(p => {
        const [plat, plng] = p.split(',').map(Number);
        return { lat: plat, lng: plng };
      });

      const allStations = [];
      const seenIds = new Set();

      // Eén aanroep per routepunt, met een kleinere radius zodat we
      // een verspreide set langs de hele route krijgen ipv alles
      // rondom één plek.
      for (const point of coords) {
        const stations = await fetchStationsNear(
          point.lat, point.lng,
          parseFloat(distanceKm) || 15,
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
    return res.status(500).json({ error: 'Onverwachte fout', message: err.message });
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

  if (!response.ok) {
    throw new Error(`Open Charge Map gaf status ${response.status}`);
  }

  const data = await response.json();

  // Transformeer naar een compacte, voor de app bruikbare vorm
  return data.map(poi => {
    const connections = poi.Connections || [];
    const maxPowerKw = connections.reduce((max, c) => Math.max(max, c.PowerKW || 0), 0);
    const connectorTypes = [...new Set(connections.map(c => c.ConnectionType?.Title).filter(Boolean))];

    return {
      id: poi.ID,
      name: poi.AddressInfo?.Title || 'Laadstation',
      address: poi.AddressInfo?.AddressLine1 || '',
      town: poi.AddressInfo?.Town || '',
      lat: poi.AddressInfo?.Latitude,
      lng: poi.AddressInfo?.Longitude,
      operator: poi.OperatorInfo?.Title || 'Onbekende operator',
      maxPowerKw,
      connectorTypes,
      numberOfPoints: poi.NumberOfPoints || connections.length || 1,
      isOperational: poi.StatusType?.IsOperational !== false,
    };
  }).filter(s => s.lat && s.lng);
}
