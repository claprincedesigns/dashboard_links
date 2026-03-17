const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../data.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS panels (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    pos  INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS categories (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    name     TEXT NOT NULL,
    pos      INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS links (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    url         TEXT NOT NULL,
    pos         INTEGER NOT NULL DEFAULT 0
  );
`);

// Add panel_id to categories if it doesn't exist yet (migration)
try {
  db.exec('ALTER TABLE categories ADD COLUMN panel_id INTEGER REFERENCES panels(id) ON DELETE CASCADE');
} catch (_) { /* column already exists */ }

// Seed a default panel if none exist, then assign orphaned categories to it
const panelCount = db.prepare('SELECT COUNT(*) as c FROM panels').get().c;
if (panelCount === 0) {
  db.prepare("INSERT INTO panels (name, pos) VALUES ('main', 0)").run();
}
const defaultPanel = db.prepare('SELECT id FROM panels ORDER BY pos, id LIMIT 1').get();
db.prepare('UPDATE categories SET panel_id = ? WHERE panel_id IS NULL').run(defaultPanel.id);

module.exports = db;
