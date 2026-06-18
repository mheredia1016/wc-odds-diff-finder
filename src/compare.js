const { describePlay, isLiveEvent } = require('./normalize');

function hasExcludedMarket(row, config) {
  const text = [
    row.raw?.marketName,
    row.raw?.oddID,
    row.raw?.statID,
    row.raw?.betTypeID,
    row.raw?.sideID,
    row.raw?.label,
    row.raw?.name,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  // Do NOT exclude "total" globally because soccer goals/totals can be useful.
  // This keeps player goals, anytime goalscorer, team goals, and alternate goals alive.
  const excludes = (config.excludeMarketKeywords || [
    'yes/no',
    'any runs',
    'moneyline',
    'spread',
    'run line',
  ]);

  return excludes.some(keyword => text.includes(String(keyword).toLowerCase()));
}

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

    if (hasExcludedMarket(groupRows[0], config)) continue;

    const byBook = new Map();

    for (const row of groupRows) {
      // Only alert plus-money plays. This blocks alerts like -1600 vs -2500.
      if (row.price < 100) continue;
      if (Math.abs(row.price) > maxOdds) continue;

      const current = byBook.get(row.bookId);
      if (!current || row.price > current.price) {
        byBook.set(row.bookId, row);
      }
    }

    const prices = [...byBook.values()].sort((a, b) => b.price - a.price);
    if (prices.length < minBookCount) continue;

    const best = prices[0];
    const lowest = [...prices].sort((a, b) => a.price - b.price)[0];

    if (best.price < 100) continue;

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
