const fs = require('fs');
const path = require('path');
const FILE = path.join(process.cwd(), 'seen-alerts.json');

function loadSeen() {
  try {
    return new Set(JSON.parse(fs.readFileSync(FILE, 'utf8')));
  } catch {
    return new Set();
  }
}

function saveSeen(seen) {
  const items = [...seen].slice(-2000);
  fs.writeFileSync(FILE, JSON.stringify(items, null, 2));
}

module.exports = { loadSeen, saveSeen };
