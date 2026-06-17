import { config } from './config.js';

function fmtOdds(n) {
  return n > 0 ? `+${n}` : String(n);
}

function fmtTime(value) {
  if (!value) return 'TBD';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('en-US', { timeZone: 'America/Chicago' });
}

export function buildDiscordMessage(alerts) {
  const top = alerts.slice(0, 10);
  return {
    username: 'Odds Difference Bot',
    embeds: top.map((alert) => ({
      title: `🚨 Odds Difference: +${alert.diff}`,
      description: [
        `**${alert.best.player}**`,
        `Market: **${alert.best.marketName}**`,
        alert.best.line !== '' ? `Line: **${alert.best.line}**` : null,
        `Side: **${alert.best.side}**`,
        '',
        `Best: **${alert.best.bookmakerId} ${fmtOdds(alert.best.odds)}**`,
        `Low: **${alert.worst.bookmakerId} ${fmtOdds(alert.worst.odds)}**`,
        '',
        `Event: ${alert.best.eventName}`,
        `Start: ${fmtTime(alert.best.startTime)}`,
        '',
        `All books: ${alert.allPrices.slice(0, 8).map((p) => `${p.bookmakerId} ${fmtOdds(p.odds)}`).join(' | ')}`
      ].filter(Boolean).join('\n')
    }))
  };
}

export async function postDiscord(alerts) {
  if (!alerts.length) return;

  const payload = buildDiscordMessage(alerts);
  const res = await fetch(config.discordWebhookUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Discord webhook failed ${res.status}: ${text}`);
  }
}
