import { useState } from 'react';
import Modal from './Modal.jsx';

export default function PanelModal({ onSave, onClose }) {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) onSave(name.trim());
  };

  return (
    <Modal title="New panel" onClose={onClose} onSubmit={handleSubmit}>
      <div className="field">
        <label>Name</label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="work"
          required
        />
      </div>
    </Modal>
  );
}
