import fs from 'fs';
const FILE = 'seen-alerts.json';

export function loadSeen() {
  try { return new Set(JSON.parse(fs.readFileSync(FILE, 'utf8'))); }
  catch { return new Set(); }
}

export function saveSeen(seen) {
  const arr = [...seen].slice(-5000);
  fs.writeFileSync(FILE, JSON.stringify(arr, null, 2));
}
