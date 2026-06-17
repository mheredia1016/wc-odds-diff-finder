require('dotenv').config();

function csv(name, fallback = '') {
  const raw = process.env[name] ?? fallback;
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

function num(name, fallback) {
  const value = Number(process.env[name] ?? fallback);
  return Number.isFinite(value) ? value : fallback;
}

module.exports = {
  apiKey: process.env.ODDS_API_KEY,
  discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL,
  sportKeysRaw: process.env.SPORT_KEYS || 'soccer_fifa_world_cup',
  sportKeys: csv('SPORT_KEYS', 'soccer_fifa_world_cup'),
  markets: csv('MARKETS', 'player_shots,player_shots_on_target,player_goal_scorer_anytime,player_goals_alternate,player_assists,player_tackles_alternate,player_fouls,player_to_receive_card'),
  regions: process.env.REGIONS || 'us',
  bookmakers: csv('BOOKMAKERS', ''),
  oddsFormat: process.env.ODDS_FORMAT || 'american',
  minOddsDiff: num('MIN_ODDS_DIFF', 300),
  scanIntervalMinutes: num('SCAN_INTERVAL_MINUTES', 5),
  maxEventsPerSport: num('MAX_EVENTS_PER_SPORT', 20),
  commenceWithinHours: num('COMMENCE_WITHIN_HOURS', 72),
  apiDelayMs: num('API_DELAY_MS', 350),
  eventMarketChunkSize: num('EVENT_MARKET_CHUNK_SIZE', 1),
  forceEventOdds: String(process.env.FORCE_EVENT_ODDS || 'false').toLowerCase() === 'true',
  postNoAlerts: String(process.env.POST_NO_ALERTS || 'false').toLowerCase() === 'true'
};
