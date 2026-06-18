import { config } from './config.js';

const API_BASE = 'https://api.sportsgameodds.com/v2';

function addCommonParams(url) {
  url.searchParams.set('oddsAvailable', 'true');
  url.searchParams.set('includeAltLines', String(config.includeAltLines));
  url.searchParams.set('limit', String(config.eventLimit));
  if (config.finalized !== '') url.searchParams.set('finalized', config.finalized);
  if (config.bookmakerIds.length) url.searchParams.set('bookmakerID', config.bookmakerIds.join(','));
}

async function getJson(url, label) {
  const res = await fetch(url, {
    headers: { 'x-api-key': config.apiKey, accept: 'application/json' }
  });
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : null; }
  catch { throw new Error(`${label}: non-JSON response: ${text.slice(0, 500)}`); }
  if (!res.ok) throw new Error(`${label}: SportsGameOdds ${res.status}: ${JSON.stringify(json).slice(0, 800)}`);
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json?.events)) return json.events;
  if (Array.isArray(json?.response)) return json.response;
  return [];
}

async function fetchEvents(params = {}, label = 'events') {
  const url = new URL(`${API_BASE}/events`);
  addCommonParams(url);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && String(v) !== '') url.searchParams.set(k, v);
  }
  return getJson(url, label);
}

export async function fetchAllEvents() {
  const calls = [];

  if (config.leagueIds.length) {
    for (const leagueID of config.leagueIds) calls.push({ params: { leagueID }, label: `league ${leagueID}` });
  } else if (config.sportIds.length) {
    for (const sportID of config.sportIds) calls.push({ params: { sportID }, label: `sport ${sportID}` });
  } else {
    calls.push({ params: {}, label: 'all sports' });
  }

  const all = [];
  const seen = new Set();

  for (const call of calls) {
    try {
      const events = await fetchEvents(call.params, call.label);
      console.log(`${call.label}: ${events.length} events loaded`);
      for (const event of events) {
        const id = event.eventID || event.eventId || event.id || JSON.stringify([event.name, event.startTime]);
        if (seen.has(id)) continue;
        seen.add(id);
        all.push(event);
      }
    } catch (err) {
      console.error(`${call.label}: fetch failed - ${err.message}`);
    }
  }

  return all;
}
