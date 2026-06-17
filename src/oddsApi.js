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

function baseOddsParams(config, markets) {
  return {
    apiKey: config.apiKey,
    regions: config.bookmakers.length ? undefined : config.regions,
    bookmakers: config.bookmakers.length ? config.bookmakers.join(',') : undefined,
    markets: markets.join(','),
    oddsFormat: config.oddsFormat,
    dateFormat: 'iso'
  };
}

function withinWindow(event, config) {
  const now = Date.now();
  const maxTime = now + config.commenceWithinHours * 60 * 60 * 1000;
  const t = new Date(event.commence_time).getTime();
  return Number.isFinite(t) && t <= maxTime;
}

async function getEventsForSport(sportKey, config) {
  const events = await apiGet(`/sports/${encodeURIComponent(sportKey)}/events`, {
    apiKey: config.apiKey,
    dateFormat: 'iso'
  });

  return events
    .filter(event => withinWindow(event, config))
    .slice(0, config.maxEventsPerSport);
}

async function getSportLevelOdds(sportKey, config, markets) {
  const events = await apiGet(`/sports/${encodeURIComponent(sportKey)}/odds`, baseOddsParams(config, markets));
  return events
    .filter(event => withinWindow(event, config))
    .slice(0, config.maxEventsPerSport);
}

async function getEventOdds(sportKey, eventId, config, markets) {
  return apiGet(
    `/sports/${encodeURIComponent(sportKey)}/events/${encodeURIComponent(eventId)}/odds`,
    baseOddsParams(config, markets)
  );
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function getOddsForSport(sportKey, config) {
  const normalMarkets = config.markets.filter(m => !m.startsWith('player_'));
  const playerMarkets = config.markets.filter(m => m.startsWith('player_'));
  const allEvents = [];

  if (normalMarkets.length) {
    const sportLevelEvents = await getSportLevelOdds(sportKey, config, normalMarkets);
    allEvents.push(...sportLevelEvents);
  }

  if (playerMarkets.length || config.forceEventOdds) {
    const events = await getEventsForSport(sportKey, config);
    console.log(`${sportKey}: found ${events.length} events for event-level odds`);

    // Keep chunks small. The Odds API can reject a whole call if one market is not valid for this event/endpoint.
    const marketChunks = config.eventMarketChunkSize > 0
      ? chunk(playerMarkets.length ? playerMarkets : config.markets, config.eventMarketChunkSize)
      : [playerMarkets.length ? playerMarkets : config.markets];

    for (const event of events) {
      for (const markets of marketChunks) {
        try {
          const eventOdds = await getEventOdds(sportKey, event.id, config, markets);
          if (eventOdds) {
            allEvents.push({ ...eventOdds, sport_key: sportKey });
            const marketCount = (eventOdds.bookmakers || []).reduce((sum, b) => sum + (b.markets || []).length, 0);
            console.log(`${sportKey}: ${event.home_team} vs ${event.away_team} loaded ${marketCount} bookmaker markets for ${markets.join(',')}`);
          }
        } catch (err) {
          console.error(`${sportKey}: event ${event.id} failed for ${markets.join(',')} - ${err.message}`);
        }
        await new Promise(resolve => setTimeout(resolve, config.apiDelayMs));
      }
    }
  }

  return allEvents;
}

module.exports = { getActiveSoccerSports, getOddsForSport };
