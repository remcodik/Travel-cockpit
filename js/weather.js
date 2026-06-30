// ═══════════════════════════════════════════════════════════
// weather.js — Live weer via Open-Meteo
// Gratis, geen API-sleutel nodig. Werkt voor elke locatie en
// toont zowel huidig weer als forecast voor toekomstige dagen.
// Docs: https://open-meteo.com/en/docs
// ═══════════════════════════════════════════════════════════

const WEATHER_CACHE_TTL_MS = 60 * 60 * 1000; // 1 uur, weer verandert traag genoeg
const weatherCache = new Map(); // key: "lat,lng" → { data, timestamp }

// WMO weathercode → emoji + Nederlandse omschrijving
// https://open-meteo.com/en/docs#weathervariables
const WEATHER_CODES = {
  0:  { emoji: '☀️', label: 'Helder' },
  1:  { emoji: '🌤️', label: 'Overwegend helder' },
  2:  { emoji: '⛅', label: 'Licht bewolkt' },
  3:  { emoji: '☁️', label: 'Bewolkt' },
  45: { emoji: '🌫️', label: 'Mist' },
  48: { emoji: '🌫️', label: 'Rijp en mist' },
  51: { emoji: '🌦️', label: 'Lichte motregen' },
  53: { emoji: '🌦️', label: 'Motregen' },
  55: { emoji: '🌧️', label: 'Dichte motregen' },
  61: { emoji: '🌧️', label: 'Lichte regen' },
  63: { emoji: '🌧️', label: 'Regen' },
  65: { emoji: '🌧️', label: 'Zware regen' },
  71: { emoji: '🌨️', label: 'Lichte sneeuw' },
  73: { emoji: '🌨️', label: 'Sneeuw' },
  75: { emoji: '❄️', label: 'Zware sneeuwval' },
  80: { emoji: '🌦️', label: 'Lichte buien' },
  81: { emoji: '🌧️', label: 'Buien' },
  82: { emoji: '⛈️', label: 'Zware buien' },
  95: { emoji: '⛈️', label: 'Onweer' },
  96: { emoji: '⛈️', label: 'Onweer met hagel' },
  99: { emoji: '⛈️', label: 'Zwaar onweer' },
};

function describeWeatherCode(code) {
  return WEATHER_CODES[code] || { emoji: '🌡️', label: 'Onbekend' };
}

function weatherCacheKey(lat, lng) {
  return `${lat.toFixed(2)},${lng.toFixed(2)}`;
}

// Haalt huidig weer + 16-daagse forecast op voor een locatie.
// Retourneert null bij netwerkfout (caller toont dan een nette fallback).
async function fetchWeatherForLocation(lat, lng) {
  const key = weatherCacheKey(lat, lng);
  const cached = weatherCache.get(key);
  if (cached && Date.now() - cached.timestamp < WEATHER_CACHE_TTL_MS) {
    return cached.data;
  }

  const url = `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lng}` +
    `&current=temperature_2m,weather_code,precipitation_probability` +
    `&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max` +
    `&timezone=auto&forecast_days=16`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Open-Meteo gaf status ' + response.status);
    const data = await response.json();
    weatherCache.set(key, { data, timestamp: Date.now() });
    return data;
  } catch (err) {
    console.error('Weer ophalen mislukt:', err);
    return null;
  }
}

// Geeft het weer voor een specifieke datum terug (vandaag of een
// dag in de toekomst, tot 16 dagen vooruit — exact wat gevraagd is).
// Voor dagen buiten het forecast-bereik: retourneert null.
async function getWeatherForDate(lat, lng, date) {
  const data = await fetchWeatherForLocation(lat, lng);
  if (!data) return null;

  const dateStr = formatISODate(date);
  const todayStr = formatISODate(new Date());
  const isToday = dateStr === todayStr;

  if (isToday && data.current) {
    const codeInfo = describeWeatherCode(data.current.weather_code);
    return {
      temperature: Math.round(data.current.temperature_2m),
      emoji: codeInfo.emoji,
      condition: codeInfo.label,
      rainProbability: data.current.precipitation_probability ?? 0,
      isForecast: false,
    };
  }

  // Zoek de datum in de dagelijkse forecast-array
  const dayIndex = data.daily.time.indexOf(dateStr);
  if (dayIndex === -1) return null; // buiten het 16-daagse bereik

  const codeInfo = describeWeatherCode(data.daily.weather_code[dayIndex]);
  const tempMax = data.daily.temperature_2m_max[dayIndex];
  const tempMin = data.daily.temperature_2m_min[dayIndex];

  return {
    temperature: Math.round((tempMax + tempMin) / 2),
    temperatureMax: Math.round(tempMax),
    temperatureMin: Math.round(tempMin),
    emoji: codeInfo.emoji,
    condition: codeInfo.label,
    rainProbability: data.daily.precipitation_probability_max[dayIndex] ?? 0,
    isForecast: true,
  };
}

function formatISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ── Render-helper: vult een weer-badge element met live data ──
// Toont een "…" placeholder tijdens het laden, dan het echte resultaat.
async function renderWeatherBadge(elementId, lat, lng, date) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const weather = await getWeatherForDate(lat, lng, date || getToday());
  if (!weather) {
    el.textContent = '— ·';
    return;
  }

  if (weather.isForecast) {
    el.innerHTML = `${weather.emoji} ${weather.temperatureMin}°–${weather.temperatureMax}°`;
  } else {
    el.innerHTML = `${weather.emoji} ${weather.temperature}°`;
  }
}

// Vult een badge-container (div met daarin een span) — gebruikt op
// Home, Accommodatie en Roadtrip in plaats van de vaste "14°" tekst.
async function fillWeatherBadge(containerId, lat, lng, date) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const span = container.querySelector('span');

  const weather = await getWeatherForDate(lat, lng, date || getToday());
  if (!weather) {
    if (span) span.textContent = '—°';
    return;
  }

  const tempLabel = weather.isForecast
    ? `${weather.temperatureMin}°–${weather.temperatureMax}°`
    : `${weather.temperature}°`;

  container.innerHTML = `<span style="font-size:14px">${weather.emoji}</span><span class="mono" style="color:inherit;font-size:13px;font-weight:700">${tempLabel}</span>`;
}

// Vult het grote weerpaneel op het Roadtrip-scherm (temperatuur +
// conditie + regenkans), met live data ipv de vaste "14°" tekst.
async function fillRoadtripWeather(lat, lng, date) {
  const tempEl = document.getElementById('rt-weather-temp');
  const condEl = document.getElementById('rt-weather-cond');
  if (!tempEl || !condEl) return;

  const weather = await getWeatherForDate(lat, lng, date || getToday());
  if (!weather) {
    tempEl.textContent = '—°';
    condEl.textContent = 'Weer niet beschikbaar';
    return;
  }

  tempEl.textContent = weather.isForecast
    ? `${weather.temperatureMin}°–${weather.temperatureMax}°`
    : `${weather.temperature}°`;
  condEl.textContent = `${weather.condition} · ${weather.rainProbability}% regen`;
}
async function showWeatherDetailForActiveAccommodation() {
  const acc = getActiveAccommodation();
  if (!acc) { showToast('Geen actief verblijf'); return; }

  showToast('Weer ophalen…');
  const weather = await getWeatherForDate(acc.lat, acc.lng, getToday());
  if (!weather) {
    showToast('Kon weer niet ophalen');
    return;
  }

  const tempLabel = weather.isForecast
    ? `${weather.temperatureMin}°–${weather.temperatureMax}°C`
    : `${weather.temperature}°C`;
  showToast(`${weather.emoji} ${tempLabel} · ${weather.condition} · ${weather.rainProbability}% regen`);
}
