import 'dotenv/config';

function numberEnv(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) throw new Error(`${name} must be a number`);
  return n;
}

function boolEnv(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  return ['1', 'true', 'yes', 'y'].includes(String(raw).toLowerCase());
}

function listEnv(name, fallback = []) {
  const raw = process.env[name];
  if (!raw) return fallback;
  return raw.split(',').map((x) => x.trim()).filter(Boolean);
}

export const config = {
  apiKey: process.env.SPORTSGAMEODDS_API_KEY,
  discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL,
  minOddsDiff: numberEnv('MIN_ODDS_DIFF', 300),
  scanIntervalMinutes: numberEnv('SCAN_INTERVAL_MINUTES', 5),
  leagueIds: listEnv('LEAGUE_IDS', ['INTERNATIONAL_SOCCER']),
  eventLimit: numberEnv('EVENT_LIMIT', 50),
  includeAltLines: boolEnv('INCLUDE_ALT_LINES', true),
  bookmakerIds: listEnv('BOOKMAKER_IDS', []),
  targetStats: new Set(listEnv('TARGET_STATS', [
    'offsides',
    'shots',
    'shots_onGoal',
    'assists',
    'passes_attempted',
    'tackles'
  ])),
  finalized: process.env.FINALIZED ?? 'false'
};

export function validateConfig() {
  const missing = [];
  if (!config.apiKey) missing.push('SPORTSGAMEODDS_API_KEY');
  if (!config.discordWebhookUrl) missing.push('DISCORD_WEBHOOK_URL');
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
}
