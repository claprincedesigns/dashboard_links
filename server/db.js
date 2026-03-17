const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../data.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    pos  INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS links (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    url         TEXT NOT NULL,
    pos         INTEGER NOT NULL DEFAULT 0
  );
`);

module.exports = db;
