function americanToNumber(price) {
  const n = Number(price);
  return Number.isFinite(n) ? n : null;
}

function pointKey(outcome) {
  return outcome.point === undefined || outcome.point === null ? '' : String(outcome.point);
}

function outcomeKey(event, market, outcome) {
  return [
    event.id,
    market.key,
    outcome.name || '',
    pointKey(outcome)
  ].join('|');
}

function lineLabel(marketKey, outcome) {
  if (marketKey === 'h2h') return outcome.name;
  if (marketKey === 'totals') return `${outcome.name} ${outcome.point ?? ''}`.trim();
  if (marketKey === 'spreads') return `${outcome.name} ${outcome.point > 0 ? '+' : ''}${outcome.point ?? ''}`.trim();
  return `${outcome.name}${outcome.point === undefined ? '' : ` ${outcome.point}`}`;
}

function collectLines(events) {
  const map = new Map();

  for (const event of events) {
    for (const bookmaker of event.bookmakers || []) {
      for (const market of bookmaker.markets || []) {
        for (const outcome of market.outcomes || []) {
          const price = americanToNumber(outcome.price);
          if (price === null) continue;

          const key = outcomeKey(event, market, outcome);
          if (!map.has(key)) {
            map.set(key, {
              eventId: event.id,
              sportKey: event.sport_key,
              homeTeam: event.home_team,
              awayTeam: event.away_team,
              commenceTime: event.commence_time,
              market: market.key,
              outcome: outcome.name,
              point: outcome.point,
              label: lineLabel(market.key, outcome),
              prices: []
            });
          }

          map.get(key).prices.push({
            bookKey: bookmaker.key,
            bookTitle: bookmaker.title || bookmaker.key,
            price,
            lastUpdate: bookmaker.last_update || market.last_update || null
          });
        }
      }
    }
  }

  return [...map.values()];
}

function findAlerts(events, minDiff) {
  const lines = collectLines(events);
  const alerts = [];

  for (const line of lines) {
    const uniqueBooks = new Map();
    for (const p of line.prices) {
      const current = uniqueBooks.get(p.bookKey);
      if (!current || p.price > current.price) uniqueBooks.set(p.bookKey, p);
    }
    const prices = [...uniqueBooks.values()];
    if (prices.length < 2) continue;

    prices.sort((a, b) => a.price - b.price);
    const worst = prices[0];
    const best = prices[prices.length - 1];
    const diff = best.price - worst.price;

    if (diff >= minDiff) {
      alerts.push({ ...line, worst, best, diff, prices: prices.sort((a, b) => b.price - a.price) });
    }
  }

  return alerts.sort((a, b) => b.diff - a.diff);
}

function alertId(alert) {
  return [alert.eventId, alert.market, alert.outcome, alert.point ?? '', alert.best.bookKey, alert.best.price, alert.worst.bookKey, alert.worst.price].join('|');
}

module.exports = { findAlerts, alertId };
