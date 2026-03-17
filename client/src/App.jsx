import { useState, useEffect, useCallback } from 'react';
import CategoryCard from './components/CategoryCard.jsx';
import LinkModal from './components/LinkModal.jsx';
import CategoryModal from './components/CategoryModal.jsx';

const API = '/api';

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

export default function App() {
  const [categories, setCategories] = useState([]);

  // Modal state
  const [linkModal, setLinkModal]       = useState(null);
  const [showCatModal, setShowCatModal] = useState(false);

  // Drag state
  const [drag, setDrag]           = useState(null); // { type: 'cat'|'link', id, catId? }
  const [dropTarget, setDropTarget] = useState(null);

  const fetchAll = useCallback(async () => {
    const res = await fetch(`${API}/categories`);
    setCategories(await res.json());
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Category CRUD ──────────────────────────────────────
  const handleAddCategory = async (name) => {
    await fetch(`${API}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    setShowCatModal(false);
    fetchAll();
  };

  const handleDeleteCategory = async (id, name) => {
    if (!confirm(`Delete category "${name}" and all its links?`)) return;
    await fetch(`${API}/categories/${id}`, { method: 'DELETE' });
    fetchAll();
  };

  // ── Link CRUD ──────────────────────────────────────────
  const handleSaveLink = async ({ name, url, category_id }) => {
    const editing = linkModal?.initial;
    if (editing) {
      await fetch(`${API}/links/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, url, category_id }),
      });
    } else {
      await fetch(`${API}/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, url, category_id }),
      });
    }
    setLinkModal(null);
    fetchAll();
  };

  const handleDeleteLink = async (id) => {
    if (!confirm('Delete this link?')) return;
    await fetch(`${API}/links/${id}`, { method: 'DELETE' });
    fetchAll();
  };

  const handleAddLink  = (catId) => setLinkModal({ defaultCatId: catId });
  const handleEditLink = (link)  => setLinkModal({ initial: link });

  const linkModalInitial = linkModal?.initial
    ? linkModal.initial
    : linkModal?.defaultCatId
      ? { category_id: linkModal.defaultCatId }
      : null;

  // ── Drag helpers ───────────────────────────────────────
  const cleanupDrag = () => { setDrag(null); setDropTarget(null); };

  // Reorder categories in local state and persist
  const reorderCats = (fromId, toId) => {
    setCategories(prev => {
      const cats = [...prev];
      const fromIdx = cats.findIndex(c => c.id === fromId);
      const toIdx   = cats.findIndex(c => c.id === toId);
      const [moved] = cats.splice(fromIdx, 1);
      cats.splice(toIdx, 0, moved);
      const reordered = cats.map((c, i) => ({ ...c, pos: i }));
      fetch(`${API}/categories/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reordered.map(c => ({ id: c.id, pos: c.pos }))),
      });
      return reordered;
    });
  };

  // Move / reorder a link, optionally across categories
  const moveLink = (fromLinkId, fromCatId, toCatId, targetLinkId, side) => {
    setCategories(prev => {
      const cats = prev.map(c => ({ ...c, links: [...c.links] }));
      const srcCat = cats.find(c => c.id === fromCatId);
      const fromIdx = srcCat.links.findIndex(l => l.id === fromLinkId);
      const [movedLink] = srcCat.links.splice(fromIdx, 1);
      movedLink.category_id = toCatId;

      const dstCat = cats.find(c => c.id === toCatId);
      if (targetLinkId === null) {
        dstCat.links.push(movedLink);
      } else {
        const toIdx = dstCat.links.findIndex(l => l.id === targetLinkId);
        dstCat.links.splice(side === 'before' ? toIdx : toIdx + 1, 0, movedLink);
      }

      const updates = [];
      cats.forEach(cat => cat.links.forEach((l, i) => {
        l.pos = i;
        updates.push({ id: l.id, pos: i, category_id: cat.id });
      }));

      fetch(`${API}/links/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return cats;
    });
  };

  // ── Drag event handlers (passed to CategoryCard) ───────
  const onCatDragStart = (catId) => {
    setDrag({ type: 'cat', id: catId });
  };

  const onLinkDragStart = (linkId, catId) => {
    setDrag({ type: 'link', id: linkId, catId });
  };

  const onDragEnd = () => cleanupDrag();

  // Called on every card's onDragOver (handles both cat + link drags)
  const onCardDragOver = (catId, e) => {
    e.preventDefault();
    if (!drag) return;
    if (drag.type === 'cat') {
      if (drag.id === catId) { setDropTarget(null); return; }
      setDropTarget(prev =>
        prev?.type === 'cat' && prev.id === catId ? prev : { type: 'cat', id: catId }
      );
    } else if (drag.type === 'link') {
      setDropTarget(prev =>
        prev?.type === 'card' && prev.catId === catId ? prev : { type: 'card', catId }
      );
    }
  };

  // Called on each link's onDragOver (stops bubbling so card doesn't override)
  const onLinkDragOver = (linkId, catId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!drag || drag.type !== 'link' || drag.id === linkId) {
      setDropTarget(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const side = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
    setDropTarget(prev =>
      prev?.type === 'link' && prev.id === linkId && prev.side === side
        ? prev
        : { type: 'link', id: linkId, catId, side }
    );
  };

  // Drop on a card (empty area, header, or between links)
  const onCardDrop = (catId) => {
    if (!drag) return;
    if (drag.type === 'cat' && drag.id !== catId) {
      reorderCats(drag.id, catId);
    } else if (drag.type === 'link') {
      moveLink(drag.id, drag.catId, catId, null, null);
    }
    cleanupDrag();
  };

  // Drop on a specific link row
  const onLinkDrop = (targetLinkId, targetCatId) => {
    if (!drag || drag.type !== 'link') return;
    const side = dropTarget?.type === 'link' ? dropTarget.side : 'before';
    moveLink(drag.id, drag.catId, targetCatId, targetLinkId, side);
    cleanupDrag();
  };

  const dragProps = {
    drag, dropTarget,
    onCatDragStart, onLinkDragStart, onDragEnd,
    onCardDragOver, onLinkDragOver,
    onCardDrop, onLinkDrop,
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>links</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-ghost" onClick={() => setShowCatModal(true)}>
            <PlusIcon /> Category
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setLinkModal({})}
            disabled={categories.length === 0}
            title={categories.length === 0 ? 'Create a category first' : undefined}
          >
            <PlusIcon /> Link
          </button>
        </div>
      </div>

      {categories.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '80px', color: 'var(--muted)' }}>
          <p style={{ fontSize: '15px', marginBottom: '12px' }}>No categories yet.</p>
          <button className="btn btn-primary" onClick={() => setShowCatModal(true)}>
            <PlusIcon /> Create your first category
          </button>
        </div>
      ) : (
        <div className="grid">
          {categories.map((cat) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              onAddLink={handleAddLink}
              onEditLink={handleEditLink}
              onDeleteLink={handleDeleteLink}
              onDeleteCategory={handleDeleteCategory}
              {...dragProps}
            />
          ))}
        </div>
      )}

      {showCatModal && (
        <CategoryModal onSave={handleAddCategory} onClose={() => setShowCatModal(false)} />
      )}

      {linkModal !== null && (
        <LinkModal
          categories={categories}
          initial={linkModalInitial}
          onSave={handleSaveLink}
          onClose={() => setLinkModal(null)}
        />
      )}
    </div>
  );
}
