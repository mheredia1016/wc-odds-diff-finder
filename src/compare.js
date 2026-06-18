const { describePlay, isLiveEvent } = require('./normalize');

function compareRows(rows, config) {
  const groups = new Map();
  for (const row of rows) {
    if (!groups.has(row.key)) groups.set(row.key, []);
    groups.get(row.key).push(row);
  }

  const alerts = [];

  for (const [key, groupRows] of groups.entries()) {
    const isLive = isLiveEvent(groupRows[0].event);
    const minBookCount = isLive ? config.liveMinBookCount : config.minBookCount;
    const minDiff = isLive ? config.liveMinOddsDiff : config.minOddsDiff;
    const maxOdds = isLive ? config.liveMaxOdds : config.maxOdds;

    const byBook = new Map();
    for (const row of groupRows) {
      if (Math.abs(row.price) > maxOdds) continue;
      const current = byBook.get(row.bookId);
      if (!current || row.price > current.price) byBook.set(row.bookId, row);
    }

    const prices = [...byBook.values()].sort((a, b) => b.price - a.price);
    if (prices.length < minBookCount) continue;

    const best = prices[0];
    const lowest = [...prices].sort((a, b) => a.price - b.price)[0];
    const diff = best.price - lowest.price;
    if (diff < minDiff) continue;

    alerts.push({
      key,
      isLive,
      event: best.event,
      raw: best.raw,
      description: describePlay(best.raw),
      best,
      lowest,
      prices,
      diff,
      score: diff + prices.length * 25 + (best.deeplink ? 100 : 0) + (isLive ? 50 : 0),
    });
  }

  return alerts.sort((a, b) => b.score - a.score);
}

module.exports = { compareRows };
