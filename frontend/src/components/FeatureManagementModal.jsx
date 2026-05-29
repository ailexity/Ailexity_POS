import React, { useState, useEffect } from 'react';
import api from '../api';
import { Check, X, AlertCircle, Settings } from 'lucide-react';

const FeatureManagementModal = ({ isOpen, userId, userName, onClose, onSave }) => {
    const [features, setFeatures] = useState({});
    const [allFeatures, setAllFeatures] = useState({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (isOpen && userId) {
            fetchUserFeatures();
            fetchAvailableFeatures();
        }
    }, [isOpen, userId]);

    const fetchUserFeatures = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await api.get(`/users/${userId}/features`);
            setFeatures(mergeFeatureSettings(response.data.features || {}, allFeatures));
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to load user features');
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableFeatures = async () => {
        try {
            const response = await api.get('/admin/features-list');
            const available = response.data.available_features || {};
            setAllFeatures(available);
            setFeatures(prev => mergeFeatureSettings(prev, available));
        } catch (err) {
            console.error('Failed to load available features:', err);
        }
    };

    const mergeFeatureSettings = (userFeatures = {}, availableFeatures = {}) => {
        const merged = {};
        Object.keys(availableFeatures).forEach((key) => {
            merged[key] = userFeatures[key] ?? false;
        });
        Object.keys(userFeatures).forEach((key) => {
            if (!(key in merged)) merged[key] = userFeatures[key];
        });
        return merged;
    };

    const handleToggleFeature = (featureKey) => {
        setFeatures(prev => ({
            ...prev,
            [featureKey]: !prev[featureKey]
        }));
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
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to update features');
        } finally {
            setSaving(false);
        }
    };

    const handleEnableAll = () => {
        const allEnabled = Object.keys(allFeatures).reduce((acc, key) => {
            acc[key] = true;
            return acc;
        }, {});
        setFeatures(allEnabled);
    };

    const handleDisableAll = () => {
        const allDisabled = Object.keys(allFeatures).reduce((acc, key) => {
            acc[key] = false;
            return acc;
        }, {});
        setFeatures(allDisabled);
    };

    if (!isOpen) return null;

    const enabledCount = Object.values(features).filter(v => v).length;
    const totalCount = Object.keys(features).length;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
            backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                background: 'white',
                borderRadius: '8px',
                padding: '24px',
                maxWidth: '500px',
                width: '100%',
                maxHeight: '80vh',
                overflow: 'auto',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '20px',
                    paddingBottom: '16px',
                    borderBottom: '1px solid #e2e8f0'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Settings size={24} style={{ color: '#3b82f6' }} />
                        <div>
                            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                                Manage Features
                            </h2>
                            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                                {userName}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '24px',
                            color: '#94a3b8'
                        }}
                    >
                        ×
                    </button>
                </div>

                {/* Status Summary */}
                <div style={{
                    background: '#f8fafc',
                    padding: '12px',
                    borderRadius: '6px',
                    marginBottom: '16px',
                    fontSize: '14px',
                    color: '#475569'
                }}>
                    Enabled: <strong>{enabledCount}/{totalCount}</strong> features
                </div>

                {/* Error Message */}
                {error && (
                    <div style={{
                        background: '#fef2f2',
                        border: '1px solid #fca5a5',
                        borderRadius: '6px',
                        padding: '12px',
                        marginBottom: '16px',
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'flex-start',
                        fontSize: '13px',
                        color: '#dc2626'
                    }}>
                        <AlertCircle size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                        <div>{error}</div>
                    </div>
                )}

                {/* Success Message */}
                {success && (
                    <div style={{
                        background: '#f0fdf4',
                        border: '1px solid #86efac',
                        borderRadius: '6px',
                        padding: '12px',
                        marginBottom: '16px',
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'flex-start',
                        fontSize: '13px',
                        color: '#16a34a'
                    }}>
                        <Check size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                        <div>{success}</div>
                    </div>
                )}

                {/* Features List */}
                <div style={{ marginBottom: '16px' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                            Loading features...
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {(Object.keys(allFeatures).length ? Object.entries(allFeatures) : Object.entries(features)).map(([key, featureInfoOrEnabled]) => {
                                const enabled = Boolean(features[key]);
                                const featureInfo = allFeatures[key] || { name: key, description: '' };
                                return (
                                    <label key={key} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '12px',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        background: enabled ? '#f0f9ff' : 'white',
                                        transition: 'all 0.2s'
                                    }}>
                                        <input
                                            type="checkbox"
                                            checked={enabled}
                                            onChange={() => handleToggleFeature(key)}
                                            style={{
                                                marginRight: '12px',
                                                width: '18px',
                                                height: '18px',
                                                cursor: 'pointer'
                                            }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <div style={{
                                                fontWeight: 600,
                                                fontSize: '14px',
                                                color: '#1e293b',
                                                marginBottom: '2px'
                                            }}>
                                                {featureInfo.name}
                                            </div>
                                            <div style={{
                                                fontSize: '12px',
                                                color: '#64748b'
                                            }}>
                                                {featureInfo.description}
                                            </div>
                                        </div>
                                        <div style={{
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '4px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: enabled ? '#10b981' : '#e2e8f0',
                                            color: enabled ? 'white' : '#94a3b8',
                                            fontSize: '14px'
                                        }}>
                                            {enabled ? <Check size={16} /> : <X size={16} />}
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                {!loading && (
                    <div style={{
                        display: 'flex',
                        gap: '8px',
                        marginBottom: '16px',
                        paddingTop: '12px',
                        borderTop: '1px solid #e2e8f0'
                    }}>
                        <button
                            onClick={handleEnableAll}
                            style={{
                                flex: 1,
                                padding: '8px 12px',
                                border: '1px solid #e2e8f0',
                                borderRadius: '4px',
                                background: 'white',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: 600,
                                color: '#3b82f6'
                            }}
                        >
                            Enable All
                        </button>
                        <button
                            onClick={handleDisableAll}
                            style={{
                                flex: 1,
                                padding: '8px 12px',
                                border: '1px solid #e2e8f0',
                                borderRadius: '4px',
                                background: 'white',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: 600,
                                color: '#64748b'
                            }}
                        >
                            Disable All
                        </button>
                    </div>
                )}

                {/* Action Buttons */}
                <div style={{
                    display: 'flex',
                    gap: '8px',
                    paddingTop: '16px',
                    borderTop: '1px solid #e2e8f0'
                }}>
                    <button
                        onClick={onClose}
                        disabled={saving || loading}
                        style={{
                            flex: 1,
                            padding: '10px 16px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            background: 'white',
                            cursor: saving || loading ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#64748b',
                            opacity: saving || loading ? 0.6 : 1
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || loading}
                        style={{
                            flex: 1,
                            padding: '10px 16px',
                            border: 'none',
                            borderRadius: '6px',
                            background: '#3b82f6',
                            cursor: saving || loading ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            fontWeight: 600,
                            color: 'white',
                            opacity: saving || loading ? 0.7 : 1
                        }}
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FeatureManagementModal;
