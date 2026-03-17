const express = require('express');
const db = require('../db');
const router = express.Router();

// GET all categories with their links
router.get('/', (req, res) => {
  const categories = db.prepare('SELECT * FROM categories ORDER BY pos, id').all();
  const links = db.prepare('SELECT * FROM links ORDER BY pos, id').all();

  const grouped = categories.map(cat => ({
    ...cat,
    links: links.filter(l => l.category_id === cat.id),
  }));

  res.json(grouped);
});

// POST create category
router.post('/', (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'name required' });

  const maxPos = db.prepare('SELECT MAX(pos) as m FROM categories').get().m ?? -1;
  const result = db.prepare('INSERT INTO categories (name, pos) VALUES (?, ?)').run(name.trim(), maxPos + 1);
  res.status(201).json({ id: result.lastInsertRowid, name: name.trim(), pos: maxPos + 1, links: [] });
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
