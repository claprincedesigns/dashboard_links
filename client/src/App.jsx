import { useState, useEffect, useCallback } from 'react';
import CategoryCard from './components/CategoryCard.jsx';
import LinkModal from './components/LinkModal.jsx';
import CategoryModal from './components/CategoryModal.jsx';
import PanelModal from './components/PanelModal.jsx';

const API = '/api';

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'good morning.';
  if (h < 17) return 'good afternoon.';
  if (h < 21) return 'good evening.';
  return 'good night.';
}

const XIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

export default function App() {
  const [panels, setPanels]             = useState([]);
  const [activePanelId, setActivePanelId] = useState(null);
  const [categories, setCategories]     = useState([]);

  // Modal state
  const [linkModal, setLinkModal]         = useState(null);
  const [showCatModal, setShowCatModal]   = useState(false);
  const [showPanelModal, setShowPanelModal] = useState(false);

  // Drag state
  const [drag, setDrag]             = useState(null);
  const [dropTarget, setDropTarget] = useState(null);

  // ── Data fetching ──────────────────────────────────────
  const fetchPanels = useCallback(async () => {
    const data = await fetch(`${API}/panels`).then(r => r.json());
    setPanels(data);
    return data;
  }, []);

  const fetchCategories = useCallback(async (panelId) => {
    if (!panelId) return;
    const data = await fetch(`${API}/categories?panel_id=${panelId}`).then(r => r.json());
    setCategories(data);
  }, []);

  // On mount: load panels, then activate the first one
  useEffect(() => {
    fetchPanels().then(data => {
      if (data.length > 0) setActivePanelId(data[0].id);
    });
  }, [fetchPanels]);

  // When active panel changes, load its categories
  useEffect(() => {
    fetchCategories(activePanelId);
  }, [activePanelId, fetchCategories]);

  // ── Panel actions ──────────────────────────────────────
  const handleAddPanel = async (name) => {
    const newPanel = await fetch(`${API}/panels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    }).then(r => r.json());
    setShowPanelModal(false);
    await fetchPanels();
    setActivePanelId(newPanel.id);
  };

  const handleDeletePanel = async (id) => {
    const panel = panels.find(p => p.id === id);
    if (!confirm(`Delete panel "${panel?.name}" and all its categories and links?`)) return;
    await fetch(`${API}/panels/${id}`, { method: 'DELETE' });
    const remaining = await fetchPanels();
    if (activePanelId === id && remaining.length > 0) {
      setActivePanelId(remaining[0].id);
    }
  };

  // ── Category actions ───────────────────────────────────
  const handleAddCategory = async (name) => {
    await fetch(`${API}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, panel_id: activePanelId }),
    });
    setShowCatModal(false);
    fetchCategories(activePanelId);
  };

  const handleDeleteCategory = async (id, name) => {
    if (!confirm(`Delete category "${name}" and all its links?`)) return;
    await fetch(`${API}/categories/${id}`, { method: 'DELETE' });
    fetchCategories(activePanelId);
  };

  // ── Link actions ───────────────────────────────────────
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
    fetchCategories(activePanelId);
  };

  const handleDeleteLink = async (id) => {
    if (!confirm('Delete this link?')) return;
    await fetch(`${API}/links/${id}`, { method: 'DELETE' });
    fetchCategories(activePanelId);
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

  // ── Drag event handlers ────────────────────────────────
  const onCatDragStart  = (catId)         => setDrag({ type: 'cat', id: catId });
  const onLinkDragStart = (linkId, catId) => setDrag({ type: 'link', id: linkId, catId });
  const onDragEnd       = ()              => cleanupDrag();

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

  const onCardDrop = (catId) => {
    if (!drag) return;
    if (drag.type === 'cat' && drag.id !== catId) reorderCats(drag.id, catId);
    else if (drag.type === 'link')                moveLink(drag.id, drag.catId, catId, null, null);
    cleanupDrag();
  };

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

  // ── Render ─────────────────────────────────────────────
  return (
    <div className="page">
      <div className="page-header">
        <h1>links <span className="greeting">— {greeting()}</span></h1>
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

      {/* Panel tab bar */}
      <div className="panel-bar">
        {panels.map(panel => (
          <div
            key={panel.id}
            className={`panel-tab${panel.id === activePanelId ? ' active' : ''}`}
          >
            <button
              className="panel-tab-label"
              onClick={() => setActivePanelId(panel.id)}
            >
              {panel.name}
            </button>
            {panels.length > 1 && (
              <button
                className="panel-tab-close"
                title={`Delete panel "${panel.name}"`}
                onClick={() => handleDeletePanel(panel.id)}
              >
                <XIcon />
              </button>
            )}
          </div>
        ))}
        <button className="panel-add" onClick={() => setShowPanelModal(true)} title="New panel">
          <PlusIcon />
        </button>
      </div>

      {/* Category grid */}
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

      {showPanelModal && (
        <PanelModal onSave={handleAddPanel} onClose={() => setShowPanelModal(false)} />
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
