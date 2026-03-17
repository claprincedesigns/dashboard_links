import { useState } from 'react';
import Modal from './Modal.jsx';

export default function CategoryModal({ onSave, onClose }) {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(name.trim());
  };

  return (
    <Modal title="New category" onClose={onClose} onSubmit={handleSubmit}>
      <div className="field">
        <label>Name</label>
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Work" required />
      </div>
    </Modal>
  );
}
