import React, { useState, useEffect } from 'react';
import api from '../api';
import { Check, X, AlertCircle, Settings } from 'lucide-react';

const FEATURE_GROUPS = {
  common: {
    label: 'Core Features',
    keys: ['pos_billing', 'invoices', 'dashboard', 'stock_management', 'payment_tracking', 'alerts', 'admin_panel', 'attendees_management'],
  },
  restaurant: {
    label: 'Restaurant Only',
    keys: ['items_management', 'kot_printing', 'order_management'],
  },
  retailer: {
    label: 'Retailer Only',
    keys: ['parties_management', 'ledger_management'],
  },
};

const Toggle = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => !disabled && onChange(!checked)}
    disabled={disabled}
    style={{
      position: 'relative',
      display: 'inline-flex',
      flexShrink: 0,
      width: '44px',
      height: '24px',
      borderRadius: '9999px',
      border: '2px solid transparent',
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'background-color 0.2s',
      backgroundColor: checked ? '#3b82f6' : '#d1d5db',
      outline: 'none',
    }}
  >
    <span
      style={{
        display: 'inline-block',
        width: '16px',
        height: '16px',
        borderRadius: '9999px',
        backgroundColor: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        transition: 'transform 0.2s',
        transform: checked ? 'translateX(20px)' : 'translateX(0px)',
        marginTop: '2px',
        marginLeft: '2px',
      }}
    />
  </button>
);

const FeatureManagementModal = ({ isOpen, userId, userName, userBusinessType, onClose, onSave }) => {
  const [features, setFeatures] = useState({});
  const [allFeatures, setAllFeatures] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [businessType, setBusinessType] = useState(userBusinessType || '');

  useEffect(() => {
    if (isOpen && userId) {
      fetchData();
    }
  }, [isOpen, userId]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/users/${userId}/features`);
      setAllFeatures(res.data.available_features || {});
      setBusinessType(res.data.business_type || userBusinessType || '');
      const merged = {};
      Object.keys(res.data.available_features || {}).forEach((k) => {
        merged[k] = Boolean((res.data.features || {})[k]);
      });
      setFeatures(merged);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load features');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key) => {
    setFeatures((prev) => ({ ...prev, [key]: !prev[key] }));
    setSuccess('');
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.put(`/users/${userId}/features`, features);
      setSuccess('Features updated successfully!');
      if (onSave) onSave();
      setTimeout(onClose, 1200);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update features');
    } finally {
      setSaving(false);
    }
  };

  const setGroup = (keys, value) => {
    setFeatures((prev) => {
      const next = { ...prev };
      keys.forEach((k) => { next[k] = value; });
      return next;
    });
    setSuccess('');
  };

  const normalizedBT = String(businessType || '').toLowerCase().includes('retail') ? 'retailer' : 'restaurant';

  const visibleGroups = [
    FEATURE_GROUPS.common,
    normalizedBT === 'restaurant' ? FEATURE_GROUPS.restaurant : FEATURE_GROUPS.retailer,
  ];

  const enabledCount = Object.values(features).filter(Boolean).length;
  const totalCount = Object.keys(features).length;

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '20px', backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: 'white', borderRadius: '12px', width: '100%', maxWidth: '520px',
        maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px 16px', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, background: 'white', zIndex: 1,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Settings size={18} color="#3b82f6" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Manage Features</h2>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{userName} · {enabledCount}/{totalCount} enabled</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '16px 24px 24px' }}>
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', padding: '10px 12px', marginBottom: '14px', display: 'flex', gap: '8px', fontSize: '13px', color: '#dc2626' }}>
              <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '1px' }} /> {error}
            </div>
          )}
          {success && (
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '6px', padding: '10px 12px', marginBottom: '14px', display: 'flex', gap: '8px', fontSize: '13px', color: '#16a34a' }}>
              <Check size={15} style={{ flexShrink: 0, marginTop: '1px' }} /> {success}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8', fontSize: '14px' }}>Loading features…</div>
          ) : (
            visibleGroups.map((group) => {
              const groupKeys = group.keys.filter((k) => k in allFeatures);
              if (groupKeys.length === 0) return null;
              const allOn = groupKeys.every((k) => features[k]);
              return (
                <div key={group.label} style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b' }}>{group.label}</span>
                    <button
                      type="button"
                      onClick={() => setGroup(groupKeys, !allOn)}
                      style={{ fontSize: '11px', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                    >
                      {allOn ? 'Disable all' : 'Enable all'}
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {groupKeys.map((key) => {
                      const info = allFeatures[key] || { name: key, description: '' };
                      const enabled = Boolean(features[key]);
                      return (
                        <div
                          key={key}
                          onClick={() => handleToggle(key)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '10px 12px', borderRadius: '8px', cursor: 'pointer',
                            border: `1px solid ${enabled ? '#bfdbfe' : '#e2e8f0'}`,
                            background: enabled ? '#f0f9ff' : '#fafafa',
                            transition: 'all 0.15s',
                          }}
                        >
                          <Toggle checked={enabled} onChange={() => handleToggle(key)} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>{info.name}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>{info.description}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}

          {/* Actions */}
          {!loading && (
            <div style={{ display: 'flex', gap: '8px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', marginTop: '4px' }}>
              <button
                onClick={onClose}
                disabled={saving}
                style={{ flex: 1, padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 600, color: '#64748b' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ flex: 2, padding: '10px', border: 'none', borderRadius: '8px', background: '#3b82f6', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 600, color: 'white', opacity: saving ? 0.7 : 1 }}
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeatureManagementModal;
