import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, AlertCircle } from 'lucide-react';

/**
 * ConfirmModal – a reusable confirmation dialog.
 *
 * Props:
 *   isOpen       boolean
 *   title        string
 *   message      string | ReactNode
 *   confirmLabel string  (default "Confirm")
 *   cancelLabel  string  (default "Cancel")
 *   variant      "danger" | "warning" | "primary"  (default "danger")
 *   onConfirm    () => void | Promise<void>
 *   onCancel     () => void
 *   loading      boolean (disables buttons while async action is running)
 */
const VARIANT = {
  danger:  { bg: '#fef2f2', color: '#ef4444', Icon: Trash2,        btnClass: 'confirm-danger' },
  warning: { bg: '#fffbeb', color: '#f59e0b', Icon: AlertTriangle,  btnClass: 'confirm-danger' },
  primary: { bg: '#eff6ff', color: '#3b82f6', Icon: AlertCircle,   btnClass: 'confirm-primary' },
};

const ConfirmModal = ({
  isOpen,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
  loading = false,
}) => {
  const v = VARIANT[variant] || VARIANT.danger;
  const Icon = v.Icon;

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onCancel?.(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="confirm-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onCancel?.()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div className="confirm-modal">
        <div
          className="confirm-modal-icon"
          style={{ background: v.bg, color: v.color }}
        >
          <Icon size={22} />
        </div>
        <h3 id="confirm-title">{title}</h3>
        <p>{message}</p>
        <div className="confirm-modal-actions">
          <button
            className="confirm-cancel"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            className={v.btnClass}
            onClick={onConfirm}
            disabled={loading}
            autoFocus
          >
            {loading ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
