const config = require('./config');
const { getActiveSoccerSports, getOddsForSport } = require('./oddsApi');
const { findAlerts, alertId } = require('./compare');
const { buildMessage, postDiscord } = require('./discord');
const { loadSeen, saveSeen } = require('./seen');

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function resolveSports() {
  if (config.sportKeysRaw.trim().toUpperCase() === 'AUTO') {
    const sports = await getActiveSoccerSports(config.apiKey);
    console.log(`AUTO soccer sports: ${sports.join(', ') || 'none'}`);
    return sports;
  }
  return config.sportKeys;
}

async function scanOnce() {
  if (!config.apiKey) throw new Error('Missing ODDS_API_KEY');

  const sports = await resolveSports();
  console.log(`Scanning soccer sports: ${sports.join(', ')}`);
  console.log(`Markets: ${config.markets.join(', ')} | Regions: ${config.regions} | Bookmakers: ${config.bookmakers.join(', ') || 'all in region'}`);

  const allEvents = [];
  for (const sportKey of sports) {
    try {
      const events = await getOddsForSport(sportKey, config);
      console.log(`${sportKey}: loaded ${events.length} events`);
      allEvents.push(...events.map(e => ({ ...e, sport_key: sportKey })));
      await sleep(250);
    } catch (err) {
      console.error(`${sportKey}: failed - ${err.message}`);
    }
  }

  console.log(`Total events loaded: ${allEvents.length}`);
  const alerts = findAlerts(allEvents, config.minOddsDiff);
  console.log(`Alerts found: ${alerts.length}`);

  const seen = loadSeen();
  let posted = 0;

  for (const alert of alerts.slice(0, 20)) {
    const id = alertId(alert);
    if (seen.has(id)) continue;
    await postDiscord(config.discordWebhookUrl, buildMessage(alert));
    seen.add(id);
    posted += 1;
    await sleep(500);
  }

  if (posted === 0 && config.postNoAlerts) {
    await postDiscord(config.discordWebhookUrl, { content: `No new soccer odds differences >= ${config.minOddsDiff}. Events scanned: ${allEvents.length}` });
  }

  saveSeen(seen);
  console.log(`New alerts posted: ${posted}`);
}

async function main() {
  const once = process.argv.includes('--once');
  await scanOnce();
  if (once) return;

  const intervalMs = config.scanIntervalMinutes * 60 * 1000;
  console.log(`Running every ${config.scanIntervalMinutes} minutes`);
  setInterval(() => {
    scanOnce().catch(err => console.error(err));
  }, intervalMs);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
