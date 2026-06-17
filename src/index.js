import { validateConfig, config } from './config.js';
import { fetchAllEvents } from './sportsgameodds.js';
import { findDifferences } from './compare.js';
import { postDiscord } from './discord.js';

const sent = new Set();
const once = process.argv.includes('--once');

async function scan() {
  console.log(`Scanning leagues: ${config.leagueIds.join(', ')}`);
  const events = await fetchAllEvents();
  console.log(`Total events loaded: ${events.length}`);

  const alerts = findDifferences(events).filter((alert) => !sent.has(alert.key));
  console.log(`New alerts found: ${alerts.length}`);

  if (alerts.length) {
    await postDiscord(alerts);
    for (const alert of alerts) sent.add(alert.key);
    console.log(`Posted ${Math.min(alerts.length, 10)} alerts to Discord`);
  }
}

async function main() {
  validateConfig();
  await scan();

  if (once) return;

  const ms = config.scanIntervalMinutes * 60 * 1000;
  console.log(`Running every ${config.scanIntervalMinutes} minutes`);
  setInterval(() => {
    scan().catch((err) => console.error('Scan failed:', err));
  }, ms);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
