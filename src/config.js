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
  sportKeysRaw: process.env.SPORT_KEYS || 'soccer_epl,soccer_uefa_champs_league,soccer_usa_mls',
  sportKeys: csv('SPORT_KEYS', 'soccer_epl,soccer_uefa_champs_league,soccer_usa_mls'),
  markets: csv('MARKETS', 'h2h,spreads,totals'),
  regions: process.env.REGIONS || 'us',
  bookmakers: csv('BOOKMAKERS', ''),
  oddsFormat: process.env.ODDS_FORMAT || 'american',
  minOddsDiff: num('MIN_ODDS_DIFF', 300),
  scanIntervalMinutes: num('SCAN_INTERVAL_MINUTES', 5),
  maxEventsPerSport: num('MAX_EVENTS_PER_SPORT', 20),
  commenceWithinHours: num('COMMENCE_WITHIN_HOURS', 72),
  postNoAlerts: String(process.env.POST_NO_ALERTS || 'false').toLowerCase() === 'true'
};
