const { americanOdds, buildPlayKey } = require('./normalize');

function asArray(x) {
  if (!x) return [];
  return Array.isArray(x) ? x : Object.values(x);
}

function looksLikeBookId(id, allowed) {
  return allowed.includes(String(id || '').toLowerCase());
}

function pickOdds(node) {
  return americanOdds(node.odds ?? node.price ?? node.americanOdds ?? node.american ?? node.value);
}

function pickDeeplink(node) {
  return node.deeplink || node.deepLink || node.link || node.url || node.betLink || node.sportsbookUrl || null;
}

function baseRaw(event, odd, marketHint = '') {
  return {
    marketID: odd.marketID || odd.marketId || odd.market || odd.statID || odd.statId || marketHint,
    playerName: odd.playerName || odd.player || odd.participantName || odd.participant || odd.entityName || odd.name,
    side: odd.side || odd.selection || odd.outcomeName || odd.outcome || odd.betName || odd.label,
    line: odd.line ?? odd.points ?? odd.handicap ?? odd.spread ?? odd.total ?? odd.value,
    periodID: odd.periodID || odd.period,
    raw: odd,
  };
}

function extractFromByBookmaker(event, allowedBookmakers) {
  const rows = [];
  const byBookmaker = event.byBookmaker || event.odds?.byBookmaker;
  if (!byBookmaker || typeof byBookmaker !== 'object') return rows;

  for (const [bookIdRaw, bookNode] of Object.entries(byBookmaker)) {
    const bookId = String(bookIdRaw).toLowerCase();
    if (!looksLikeBookId(bookId, allowedBookmakers)) continue;

    const candidates = [];
    if (Array.isArray(bookNode)) candidates.push(...bookNode);
    if (Array.isArray(bookNode.odds)) candidates.push(...bookNode.odds);
    if (Array.isArray(bookNode.markets)) {
      for (const market of bookNode.markets) {
        for (const outcome of asArray(market.outcomes || market.odds || market.selections)) {
          candidates.push({ ...outcome, marketID: outcome.marketID || market.marketID || market.key || market.name });
        }
      }
    }
    if (bookNode.markets && typeof bookNode.markets === 'object' && !Array.isArray(bookNode.markets)) {
      for (const [marketKey, marketVal] of Object.entries(bookNode.markets)) {
        for (const outcome of asArray(marketVal.outcomes || marketVal.odds || marketVal.selections || marketVal)) {
          if (typeof outcome === 'object') candidates.push({ ...outcome, marketID: outcome.marketID || marketKey });
        }
      }
    }

    // Some SGO odds objects are directly at bookNode level.
    if (!candidates.length && pickOdds(bookNode) != null) candidates.push(bookNode);

    for (const odd of candidates) {
      if (!odd || typeof odd !== 'object') continue;
      const price = pickOdds(odd);
      if (price == null) continue;
      const raw = baseRaw(event, odd, odd.marketID || odd.marketId || odd.market || 'market');
      rows.push({
        key: buildPlayKey(raw),
        event,
        raw,
        bookId,
        price,
        deeplink: pickDeeplink(odd) || pickDeeplink(bookNode),
      });
    }
  }
  return rows;
}

function extractFromOddsArray(event, allowedBookmakers) {
  const rows = [];
  const odds = Array.isArray(event.odds) ? event.odds : [];
  for (const odd of odds) {
    if (!odd || typeof odd !== 'object') continue;
    const byBook = odd.byBookmaker || odd.bookmakers || odd.books;
    if (byBook && typeof byBook === 'object') {
      for (const [bookIdRaw, bookNode] of Object.entries(byBook)) {
        const bookId = String(bookIdRaw).toLowerCase();
        if (!looksLikeBookId(bookId, allowedBookmakers)) continue;
        const price = pickOdds(bookNode);
        if (price == null) continue;
        const raw = baseRaw(event, { ...odd, ...bookNode }, odd.marketID || odd.marketId || odd.market || 'market');
        rows.push({ key: buildPlayKey(raw), event, raw, bookId, price, deeplink: pickDeeplink(bookNode) || pickDeeplink(odd) });
      }
    }
  }
  return rows;
}

function extractOddsRows(event, allowedBookmakers) {
  const allowed = allowedBookmakers.map(x => String(x).toLowerCase());
  const rows = [
    ...extractFromByBookmaker(event, allowed),
    ...extractFromOddsArray(event, allowed),
  ];

  const seen = new Set();
  return rows.filter(row => {
    const id = `${row.key}|${row.bookId}|${row.price}`;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

module.exports = { extractOddsRows };
