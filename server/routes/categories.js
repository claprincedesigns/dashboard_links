const express = require('express');
const db = require('../db');
const router = express.Router();

// GET categories (filtered by panel_id) with their links
router.get('/', (req, res) => {
  const { panel_id } = req.query;
  const categories = panel_id
    ? db.prepare('SELECT * FROM categories WHERE panel_id = ? ORDER BY pos, id').all(panel_id)
    : db.prepare('SELECT * FROM categories ORDER BY pos, id').all();

  const links = db.prepare('SELECT * FROM links ORDER BY pos, id').all();
  res.json(categories.map(cat => ({
    ...cat,
    links: links.filter(l => l.category_id === cat.id),
  })));
});

// POST create category
router.post('/', (req, res) => {
  const { name, panel_id } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'name required' });
  if (!panel_id)     return res.status(400).json({ error: 'panel_id required' });

  const maxPos = db.prepare('SELECT MAX(pos) as m FROM categories WHERE panel_id = ?').get(panel_id).m ?? -1;
  const result = db
    .prepare('INSERT INTO categories (name, pos, panel_id) VALUES (?, ?, ?)')
    .run(name.trim(), maxPos + 1, panel_id);
  res.status(201).json({ id: result.lastInsertRowid, name: name.trim(), pos: maxPos + 1, panel_id, links: [] });
});

// PATCH reorder categories
router.patch('/reorder', (req, res) => {
  const items = req.body;
  if (!Array.isArray(items)) return res.status(400).json({ error: 'array required' });
  const update = db.prepare('UPDATE categories SET pos = ? WHERE id = ?');
  db.transaction(() => items.forEach(({ id, pos }) => update.run(pos, id)))();
  res.status(204).end();
});

// DELETE category
router.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'not found' });
  res.status(204).end();
});

module.exports = router;
