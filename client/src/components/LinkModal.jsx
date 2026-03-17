import { useState, useEffect } from 'react';
import Modal from './Modal.jsx';

export default function LinkModal({ categories, initial, onSave, onClose }) {
  const isEdit = !!initial;

  const [name, setName] = useState(initial?.name ?? '');
  const [url, setUrl]   = useState(initial?.url ?? '');
  const [catId, setCatId] = useState(
    initial?.category_id ?? categories[0]?.id ?? ''
  );

  // Auto-prefix https:// on blur if missing
  const handleUrlBlur = () => {
    if (url && !/^https?:\/\//i.test(url)) setUrl('https://' + url);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ name, url, category_id: Number(catId) });
  };

  return (
    <Modal title={isEdit ? 'Edit link' : 'Add link'} onClose={onClose} onSubmit={handleSubmit}>
      <div className="field">
        <label>Name</label>
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="GitHub" required />
      </div>
      <div className="field">
        <label>URL</label>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onBlur={handleUrlBlur}
          placeholder="https://github.com"
          required
        />
      </div>
      <div className="field">
        <label>Category</label>
        <select value={catId} onChange={(e) => setCatId(e.target.value)} required>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
    </Modal>
  );
}
