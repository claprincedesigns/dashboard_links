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
  const [linkModal, setLinkModal]         = useState(null); // null | { initial?, defaultCatId? }
  const [showCatModal, setShowCatModal]   = useState(false);

  const fetchAll = useCallback(async () => {
    const res = await fetch(`${API}/categories`);
    setCategories(await res.json());
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Category actions ──────────────────────────────────
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

  // ── Link actions ──────────────────────────────────────
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

  // Pre-select the clicked category when opening "add link"
  const handleAddLink = (catId) => {
    setLinkModal({ defaultCatId: catId });
  };

  const handleEditLink = (link) => {
    setLinkModal({ initial: link });
  };

  // Build initial for LinkModal: if adding, fake an object so the select defaults correctly
  const linkModalInitial = linkModal?.initial
    ? linkModal.initial
    : linkModal?.defaultCatId
      ? { category_id: linkModal.defaultCatId }
      : null;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Dashboard</h1>
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
