// Icons as tiny inline SVGs to avoid any icon library dependency
const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const EditIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
    <path d="M9 6V4h6v2"/>
  </svg>
);

export default function CategoryCard({ category, onAddLink, onEditLink, onDeleteLink, onDeleteCategory }) {
  return (
    <div className="card">
      <div className="card-header">
        <h2>{category.name}</h2>
        <div className="card-actions">
          <button
            className="icon-btn danger"
            title="Delete category"
            onClick={() => onDeleteCategory(category.id, category.name)}
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      {category.links.length === 0 ? (
        <p className="empty">No links yet</p>
      ) : (
        <ul className="link-list">
          {category.links.map((link) => (
            <li key={link.id} className="link-item">
              <a className="link-anchor" href={link.url} target="_blank" rel="noopener noreferrer">
                {link.name}
              </a>
              <div className="link-item-actions">
                <button className="icon-btn" title="Edit" onClick={() => onEditLink(link)}>
                  <EditIcon />
                </button>
                <button className="icon-btn danger" title="Delete" onClick={() => onDeleteLink(link.id)}>
                  <TrashIcon />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <button className="add-link-btn" onClick={() => onAddLink(category.id)}>
        <PlusIcon /> Add link
      </button>
    </div>
  );
}
