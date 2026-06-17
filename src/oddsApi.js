const BASE = 'https://api.the-odds-api.com/v4';

async function apiGet(path, params) {
  const url = new URL(`${BASE}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
  }

  const res = await fetch(url, { headers: { accept: 'application/json' } });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  const remaining = res.headers.get('x-requests-remaining');
  const used = res.headers.get('x-requests-used');
  const last = res.headers.get('x-requests-last');
  console.log(`The Odds API ${path}: status=${res.status} remaining=${remaining ?? '?'} used=${used ?? '?'} last=${last ?? '?'}`);

  if (!res.ok) {
    const msg = typeof data === 'string' ? data : JSON.stringify(data);
    throw new Error(`The Odds API ${res.status}: ${msg}`);
  }
  return data;
}

async function getActiveSoccerSports(apiKey) {
  const sports = await apiGet('/sports', { apiKey, all: false });
  return sports
    .filter(s => s.key && s.key.startsWith('soccer_') && s.active !== false)
    .map(s => s.key);
}

async function getOddsForSport(sportKey, config) {
  const params = {
    apiKey: config.apiKey,
    regions: config.bookmakers.length ? undefined : config.regions,
    bookmakers: config.bookmakers.length ? config.bookmakers.join(',') : undefined,
    markets: config.markets.join(','),
    oddsFormat: config.oddsFormat,
    dateFormat: 'iso'
  };

  const events = await apiGet(`/sports/${encodeURIComponent(sportKey)}/odds`, params);
  const now = Date.now();
  const maxTime = now + config.commenceWithinHours * 60 * 60 * 1000;

  return events
    .filter(event => {
      const t = new Date(event.commence_time).getTime();
      return Number.isFinite(t) && t <= maxTime;
    })
    .slice(0, config.maxEventsPerSport);
}

module.exports = { getActiveSoccerSports, getOddsForSport };
