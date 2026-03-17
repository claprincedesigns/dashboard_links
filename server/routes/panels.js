const express = require('express');
const db = require('../db');
const router = express.Router();

// GET all panels
router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM panels ORDER BY pos, id').all());
});

// POST create panel
router.post('/', (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'name required' });

  const maxPos = db.prepare('SELECT MAX(pos) as m FROM panels').get().m ?? -1;
  const result = db.prepare('INSERT INTO panels (name, pos) VALUES (?, ?)').run(name.trim(), maxPos + 1);
  res.status(201).json({ id: result.lastInsertRowid, name: name.trim(), pos: maxPos + 1 });
});

// PATCH reorder panels
router.patch('/reorder', (req, res) => {
  const items = req.body;
  if (!Array.isArray(items)) return res.status(400).json({ error: 'array required' });
  const update = db.prepare('UPDATE panels SET pos = ? WHERE id = ?');
  db.transaction(() => items.forEach(({ id, pos }) => update.run(pos, id)))();
  res.status(204).end();
});

// DELETE panel (blocked if it's the last one)
router.delete('/:id', (req, res) => {
  const count = db.prepare('SELECT COUNT(*) as c FROM panels').get().c;
  if (count <= 1) return res.status(400).json({ error: 'cannot delete the last panel' });
  const info = db.prepare('DELETE FROM panels WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'not found' });
  res.status(204).end();
});

module.exports = router;
