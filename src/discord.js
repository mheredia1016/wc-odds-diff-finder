const { BOOK_NAMES, fmtOdds, eventName, eventStart, isLiveEvent } = require('./normalize');

function chunk(str, max = 900) {
  if (!str) return '';
  return str.length > max ? `${str.slice(0, max - 3)}...` : str;
}

function alertMessage(alert) {
  const live = isLiveEvent(alert.event);
  const title = live ? '⚡ LIVE DISCREPANCY' : '🚨 PREGAME DISCREPANCY';
  const bestBook = BOOK_NAMES[alert.best.bookId] || alert.best.bookId;
  const lowBook = BOOK_NAMES[alert.lowest.bookId] || alert.lowest.bookId;
  const books = alert.prices
    .map(p => `• ${BOOK_NAMES[p.bookId] || p.bookId}: ${fmtOdds(p.price)}${p.deeplink ? ' 🔗' : ''}`)
    .join('\n');

  const linkLine = alert.best.deeplink
    ? `\n🎯 Bet Here: ${alert.best.deeplink}`
    : '\n🎯 Bet Here: deeplink unavailable';

  return `${title}\n\n${eventName(alert.event)}\n${eventStart(alert.event)}\n\n${alert.description}\n\nBest: ${bestBook} ${fmtOdds(alert.best.price)}\nLowest: ${lowBook} ${fmtOdds(alert.lowest.price)}\nDifference: +${alert.diff}${linkLine}\n\nBooks:\n${chunk(books)}${live ? '\n\n⚠️ Live odds may move quickly.' : ''}`;
}

async function postDiscord(webhookUrl, alert) {
  if (!webhookUrl) return;
  const body = { content: alertMessage(alert) };
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Discord ${res.status}: ${text}`);
  }
}

module.exports = { postDiscord, alertMessage };
