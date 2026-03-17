const express = require('express');
const db = require('../db');
const router = express.Router();

// POST create link
router.post('/', (req, res) => {
  const { category_id, name, url } = req.body;
  if (!category_id || !name?.trim() || !url?.trim())
    return res.status(400).json({ error: 'category_id, name, and url required' });

  const cat = db.prepare('SELECT id FROM categories WHERE id = ?').get(category_id);
  if (!cat) return res.status(404).json({ error: 'category not found' });

  const maxPos = db.prepare('SELECT MAX(pos) as m FROM links WHERE category_id = ?').get(category_id).m ?? -1;
  const result = db
    .prepare('INSERT INTO links (category_id, name, url, pos) VALUES (?, ?, ?, ?)')
    .run(category_id, name.trim(), url.trim(), maxPos + 1);

  res.status(201).json({ id: result.lastInsertRowid, category_id, name: name.trim(), url: url.trim(), pos: maxPos + 1 });
});

// PUT update link
router.put('/:id', (req, res) => {
  const { name, url, category_id } = req.body;
  if (!name?.trim() || !url?.trim())
    return res.status(400).json({ error: 'name and url required' });

  const existing = db.prepare('SELECT * FROM links WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'not found' });

  const newCatId = category_id ?? existing.category_id;
  db.prepare('UPDATE links SET name = ?, url = ?, category_id = ? WHERE id = ?')
    .run(name.trim(), url.trim(), newCatId, req.params.id);

  res.json({ id: Number(req.params.id), category_id: newCatId, name: name.trim(), url: url.trim(), pos: existing.pos });
});

// PATCH reorder/move links
router.patch('/reorder', (req, res) => {
  const items = req.body;
  if (!Array.isArray(items)) return res.status(400).json({ error: 'array required' });
  const update = db.prepare('UPDATE links SET pos = ?, category_id = ? WHERE id = ?');
  db.transaction(() => items.forEach(({ id, pos, category_id }) => update.run(pos, category_id, id)))();
  res.status(204).end();
});

// DELETE link
router.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM links WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'not found' });
  res.status(204).end();
});

module.exports = router;
