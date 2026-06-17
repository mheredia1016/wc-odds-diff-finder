import { config } from './config.js';

function clean(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function pick(obj, keys) {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null && obj[key] !== '') return obj[key];
  }
  return undefined;
}

function toAmericanOdds(value) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'number' && Number.isFinite(value)) return Math.round(value);
  const parsed = Number(String(value).replace('+', '').trim());
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
}

function getEventName(event) {
  return clean(pick(event, ['name', 'eventName', 'gameName', 'matchup'])) ||
    [pick(event, ['awayTeamName', 'awayTeam']), pick(event, ['homeTeamName', 'homeTeam'])].filter(Boolean).join(' @ ') ||
    clean(event.eventID || event.id || 'Unknown event');
}

function getStartTime(event) {
  return pick(event, ['startTime', 'startDate', 'gameTime', 'commenceTime', 'scheduledTime']);
}

function extractOddRows(event) {
  const oddsObj = event.odds || event.markets || {};
  const rows = [];

  for (const [oddId, odd] of Object.entries(oddsObj)) {
    const byBookmaker = odd?.byBookmaker || odd?.bookmakers || odd?.sportsbooks || null;
    if (!byBookmaker || typeof byBookmaker !== 'object') continue;

    const statId = clean(pick(odd, ['statID', 'statId', 'stat', 'marketStatID', 'marketStatId']));
    const marketId = clean(pick(odd, ['marketID', 'marketId', 'market', 'type', 'betType']));
    const marketName = clean(pick(odd, ['marketName', 'name', 'label', 'description']));
    const player = clean(pick(odd, [
      'playerName', 'participantName', 'competitorName', 'athleteName', 'subjectName', 'selectionName'
    ]));
    const side = clean(pick(odd, ['side', 'betSide', 'outcomeType', 'selection', 'overUnder'])) || marketName;
    const line = pick(odd, ['line', 'points', 'total', 'value', 'handicap', 'threshold']);

    // Keep player prop stats only. If statId is missing, allow marketName fallback match.
    const statOrMarket = statId || marketId || marketName;
    const statLower = statOrMarket.toLowerCase();
    const wanted = [...config.targetStats].some((s) => statLower === s.toLowerCase() || statLower.includes(s.toLowerCase()));
    if (!wanted) continue;

    for (const [bookmakerId, book] of Object.entries(byBookmaker)) {
      const price = toAmericanOdds(pick(book, [
        'odds', 'americanOdds', 'price', 'american', 'currentOdds', 'decimalToAmerican'
      ]));
      if (price === null) continue;
      if (config.bookmakerIds.length && !config.bookmakerIds.includes(bookmakerId)) continue;

      rows.push({
        eventId: clean(event.eventID || event.id),
        eventName: getEventName(event),
        leagueId: event._leagueId || clean(event.leagueID || event.leagueId),
        startTime: getStartTime(event),
        oddId,
        statId: statOrMarket,
        marketName: marketName || statOrMarket,
        player: player || clean(pick(odd, ['teamName', 'team', 'participantID', 'participantId'])) || 'Unknown player/team',
        side: side || 'Outcome',
        line: line === undefined || line === null ? '' : String(line),
        bookmakerId,
        odds: price,
        deepLink: pick(book, ['deepLink', 'deeplink', 'url', 'betUrl'])
      });
    }
  }

  return rows;
}

function groupKey(row) {
  return [
    row.eventId,
    row.player.toLowerCase(),
    row.statId.toLowerCase(),
    row.line,
    row.side.toLowerCase()
  ].join('|');
}

export function findDifferences(events) {
  const grouped = new Map();

  for (const event of events) {
    for (const row of extractOddRows(event)) {
      const key = groupKey(row);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(row);
    }
  }

  const alerts = [];

  for (const rows of grouped.values()) {
    const uniqueBooks = new Map();
    for (const row of rows) {
      const existing = uniqueBooks.get(row.bookmakerId);
      if (!existing || row.odds > existing.odds) uniqueBooks.set(row.bookmakerId, row);
    }

    const prices = [...uniqueBooks.values()].sort((a, b) => b.odds - a.odds);
    if (prices.length < 2) continue;

    const best = prices[0];
    const worst = prices[prices.length - 1];
    const diff = best.odds - worst.odds;

    if (diff >= config.minOddsDiff) {
      alerts.push({
        key: `${best.eventId}|${best.player}|${best.statId}|${best.line}|${best.side}|${best.bookmakerId}|${best.odds}|${worst.bookmakerId}|${worst.odds}`,
        diff,
        best,
        worst,
        allPrices: prices
      });
    }
  }

  return alerts.sort((a, b) => b.diff - a.diff);
}
