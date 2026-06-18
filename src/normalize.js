const BOOK_NAMES = {
  fanduel: 'FanDuel',
  draftkings: 'DraftKings',
  hardrockbet: 'Hard Rock',
  bet365: 'Bet365',
  thescorebet: 'theScore Bet',
  fanatics: 'Fanatics',
  betmgm: 'BetMGM',
};

function americanOdds(value) {
  if (value == null) return null;
  if (typeof value === 'number') return value;
  const raw = String(value).replace(/[+\s]/g, '');
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function fmtOdds(n) {
  if (n == null) return 'n/a';
  return n > 0 ? `+${n}` : String(n);
}

function marketName(key = '') {
  return String(key)
    .replace(/^player_/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace('H 1', '1H')
    .replace('H 2', '2H');
}

function eventName(event) {
  const home = event.homeTeamName || event.home_team || event.homeTeam || event.home || event.teams?.home?.name;
  const away = event.awayTeamName || event.away_team || event.awayTeam || event.away || event.teams?.away?.name;
  if (away && home) return `${away} @ ${home}`;
  return event.name || event.eventName || event.shortName || event.id || 'Event';
}

function eventStart(event) {
  const t = event.startTime || event.commence_time || event.commenceTime || event.eventTime || event.scheduledTime;
  if (!t) return '';
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago',
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short'
    }).format(new Date(t));
  } catch { return String(t); }
}

function isLiveEvent(event) {
  const status = String(event.status || event.eventStatus || event.state || '').toLowerCase();
  return Boolean(event.isLive || event.live || status.includes('live') || status.includes('in_progress') || status.includes('in-progress'));
}

function playKeyParts(raw) {
  const market = raw.marketID || raw.marketId || raw.market || raw.statID || raw.statId || raw.type || 'market';
  const player = raw.playerName || raw.player || raw.participantName || raw.participant || raw.name || raw.entityName || '';
  const side = raw.side || raw.selection || raw.outcomeName || raw.outcome || raw.betName || raw.label || '';
  const line = raw.line ?? raw.points ?? raw.handicap ?? raw.spread ?? raw.total ?? raw.value ?? '';
  const period = raw.periodID || raw.period || '';
  return { market, player, side, line, period };
}

function clean(x) {
  return String(x ?? '').trim().replace(/\s+/g, ' ');
}

function buildPlayKey(raw) {
  const p = playKeyParts(raw);
  return [p.market, p.player, p.side, p.line, p.period].map(clean).join('|').toLowerCase();
}

function describePlay(raw) {
  const p = playKeyParts(raw);
  const bits = [];
  if (p.player) bits.push(`Player: ${p.player}`);
  bits.push(`Market: ${marketName(p.market)}`);
  if (p.side || p.line !== '') bits.push(`Line: ${[p.side, p.line].filter(x => x !== '' && x != null).join(' ')}`);
  if (p.period) bits.push(`Period: ${p.period}`);
  return bits.join('\n');
}

module.exports = { BOOK_NAMES, americanOdds, fmtOdds, marketName, eventName, eventStart, isLiveEvent, buildPlayKey, describePlay };
