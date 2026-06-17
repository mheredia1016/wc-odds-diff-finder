import { config } from './config.js';

const API_BASE = 'https://api.sportsgameodds.com/v2';

export async function fetchEventsForLeague(leagueId) {
  const url = new URL(`${API_BASE}/events`);
  url.searchParams.set('leagueID', leagueId);
  url.searchParams.set('oddsAvailable', 'true');
  url.searchParams.set('includeAltLines', String(config.includeAltLines));
  url.searchParams.set('limit', String(config.eventLimit));

  if (config.finalized !== '') url.searchParams.set('finalized', config.finalized);
  if (config.bookmakerIds.length) url.searchParams.set('bookmakerID', config.bookmakerIds.join(','));

  const res = await fetch(url, {
    headers: {
      'x-api-key': config.apiKey,
      'accept': 'application/json'
    }
  });

  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`SportsGameOdds returned non-JSON for ${leagueId}: ${text.slice(0, 300)}`);
  }

  if (!res.ok) {
    throw new Error(`SportsGameOdds ${res.status} for ${leagueId}: ${JSON.stringify(json).slice(0, 500)}`);
  }

  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json?.events)) return json.events;
  if (Array.isArray(json?.response)) return json.response;
  return [];
}

export async function fetchAllEvents() {
  const all = [];
  for (const leagueId of config.leagueIds) {
    try {
      const events = await fetchEventsForLeague(leagueId);
      console.log(`${leagueId}: ${events.length} events loaded`);
      all.push(...events.map((event) => ({ ...event, _leagueId: leagueId })));
    } catch (err) {
      console.error(`${leagueId}: fetch failed`, err.message);
    }
  }
  return all;
}
