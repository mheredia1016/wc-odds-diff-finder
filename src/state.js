const fs = require('fs');
const path = require('path');
const FILE = path.join(process.cwd(), 'posted-alerts.json');

function loadPosted() {
  try { return new Set(JSON.parse(fs.readFileSync(FILE, 'utf8'))); }
  catch { return new Set(); }
}

function savePosted(set) {
  const arr = [...set].slice(-5000);
  fs.writeFileSync(FILE, JSON.stringify(arr, null, 2));
}

function alertId(alert) {
  return [
    alert.isLive ? 'live' : 'pregame',
    alert.event.id || alert.event.eventID || alert.event.eventId || alert.event.name,
    alert.key,
    alert.best.bookId,
    alert.best.price,
    alert.lowest.price,
  ].join('|');
}

module.exports = { loadPosted, savePosted, alertId };
