import React, { useEffect } from 'react';
import { Keyboard, X } from 'lucide-react';

const Kbd = ({ children }) => <span className="kbd">{children}</span>;
const Plus = () => <span className="shortcut-plus">+</span>;

const Row = ({ label, keys }) => (
  <div className="shortcut-row">
    <span className="shortcut-label">{label}</span>
    <span className="shortcut-keys">
      {keys.map((k, i) => (
        <React.Fragment key={i}>
          {i > 0 && <Plus />}
          <Kbd>{k}</Kbd>
        </React.Fragment>
      ))}
    </span>
  </div>
);

const GROUPS = [
  {
    title: 'Navigation',
    rows: [
      { label: 'Dashboard',       keys: ['Alt', 'D'] },
      { label: 'POS / Billing',   keys: ['Alt', 'B'] },
      { label: 'Invoice History', keys: ['Alt', 'H'] },
      { label: 'Items / Menu',    keys: ['Alt', 'I'] },
      { label: 'Stock',           keys: ['Alt', 'K'] },
      { label: 'Parties',         keys: ['Alt', 'P'] },
      { label: 'Ledger',          keys: ['Alt', 'G'] },
      { label: 'Online Orders',   keys: ['Alt', 'O'] },
      { label: 'Settings',        keys: ['Alt', 'S'] },
    ],
  },
  {
    title: 'Actions',
    rows: [
      { label: 'Focus search',     keys: ['Ctrl', '/'] },
      { label: 'Toggle fullscreen', keys: ['Alt', '↵'] },
      { label: 'Blur input / close', keys: ['Esc'] },
      { label: 'Logout',            keys: ['Alt', 'Q'] },
      { label: 'Show shortcuts',    keys: ['?'] },
    ],
  },
  {
    title: 'Sysadmin only',
    rows: [
      { label: 'Admin controls', keys: ['Alt', 'A'] },
      { label: 'Alerts',         keys: ['Alt', 'L'] },
    ],
  },
  {
    title: 'POS page',
    rows: [
      { label: 'Add item to cart', keys: ['Enter'] },
      { label: 'Next/Prev item',   keys: ['↑', '↓'] },
      { label: 'Clear search',     keys: ['Esc'] },
    ],
  },
];

const ShortcutsOverlay = ({ onClose }) => {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="shortcuts-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="shortcuts-modal" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">
        <div className="shortcuts-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Keyboard size={18} color="#3b82f6" />
            </div>
            <div>
              <h2>Keyboard Shortcuts</h2>
              <p>Press <Kbd>?</Kbd> anywhere to toggle this panel</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4, lineHeight: 1 }}
            aria-label="Close shortcuts"
          >
            <X size={20} />
          </button>
        </div>

        <div className="shortcuts-body">
          {GROUPS.map((group) => (
            <div key={group.title} className="shortcuts-group">
              <h3>{group.title}</h3>
              {group.rows.map((row) => (
                <Row key={row.label} label={row.label} keys={row.keys} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShortcutsOverlay;
