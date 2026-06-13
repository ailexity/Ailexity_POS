import React, { useState, useEffect } from 'react';
import api from '../api';
import { Bell, Send, Trash2, Users, Clock, CheckCircle, XCircle, Plus, X, Lock, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import PageLoader from '../components/PageLoader';

const AlertsManagement = () => {
    const [alerts, setAlerts] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    
    // Password protection state
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        type: 'info', // info, warning, success, error
        target_users: [], // empty means all users
        expires_at: ''
    });

    useEffect(() => {
        // Only fetch data if authenticated
        if (isAuthenticated) {
            fetchAlerts();
            fetchUsers();
        }
    }, [isAuthenticated]);

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setIsVerifying(true);
        
        try {
            await api.post('/system/verify-password', {
                password: password
            });
            setIsAuthenticated(true);
            setPassword('');
            setLoading(true);
        } catch (err) {
            setPasswordError(err.response?.data?.detail || 'Incorrect password');
        } finally {
            setIsVerifying(false);
        }
    };

    const fetchAlerts = async () => {
        try {
            const response = await api.get('/alerts/');
            setAlerts(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error fetching alerts:', error);
            setAlerts([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users/');
            const usersData = Array.isArray(response.data) ? response.data : [];
            // Filter out sysadmin
            setUsers(usersData.filter(u => u.role !== 'sysadmin'));
        } catch (error) {
            console.error('Error fetching users:', error);
            setUsers([]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (!formData.title || !formData.content) {
            setMessage({ type: 'error', text: 'Title and content are required' });
            return;
        }

        try {
            await api.post('/alerts/', {
                ...formData,
                target_users: formData.target_users.length > 0 ? formData.target_users : null
            });
            setMessage({ type: 'success', text: 'Alert sent successfully!' });
            setShowModal(false);
            resetForm();
            fetchAlerts();
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.detail || 'Error sending alert' });
        }
    };

    const handleDelete = async (alertId) => {
        if (!window.confirm('Are you sure you want to delete this alert?')) return;
        
        try {
            await api.delete(`/alerts/${alertId}`);
            fetchAlerts();
            setMessage({ type: 'success', text: 'Alert deleted successfully' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Error deleting alert' });
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            content: '',
            type: 'info',
            target_users: [],
            expires_at: ''
        });
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'success': return { bg: '#dcfce7', border: '#bbf7d0', text: '#166534' };
            case 'warning': return { bg: '#fef3c7', border: '#fde68a', text: '#92400e' };
            case 'error': return { bg: '#fee2e2', border: '#fecaca', text: '#991b1b' };
            default: return { bg: '#dbeafe', border: '#bfdbfe', text: '#1e40af' };
        }
    };

    const toggleUserSelection = (userId) => {
        setFormData(prev => ({
            ...prev,
            target_users: prev.target_users.includes(userId)
                ? prev.target_users.filter(id => id !== userId)
                : [...prev.target_users, userId]
        }));
    };

    // Password Protection Screen
    if (!isAuthenticated) {
        return (
            <div className="page-container" style={{ 
                background: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh'
            }}>
                <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '40px',
                    maxWidth: '420px',
                    width: '100%',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }}>
                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                            borderRadius: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 20px'
                        }}>
                            <Shield size={32} color="white" />
                        </div>
                        <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#1e293b', margin: '0 0 8px' }}>
                            Alerts Management
                        </h1>
                        <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
                            Enter password to access this section
                        </p>
                    </div>

                    {passwordError && (
                        <div style={{
                            padding: '12px 16px',
                            marginBottom: '20px',
                            background: '#fee2e2',
                            border: '1px solid #fecaca',
                            borderRadius: '8px',
                            color: '#991b1b',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <XCircle size={18} />
                            {passwordError}
                        </div>
                    )}

                    <form onSubmit={handlePasswordSubmit}>
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ 
                                display: 'block', 
                                fontSize: '13px', 
                                fontWeight: '500', 
                                color: '#64748b', 
                                marginBottom: '8px' 
                            }}>
                                System Password
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} style={{ 
                                    position: 'absolute', 
                                    left: '14px', 
                                    top: '50%', 
                                    transform: 'translateY(-50%)',
                                    color: '#94a3b8'
                                }} />
                                <input
                                    type="password"
                                    className="input"
                                    style={{ 
                                        width: '100%', 
                                        paddingLeft: '44px',
                                        height: '48px',
                                        fontSize: '15px'
                                    }}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Enter password"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                type="button"
                                onClick={() => navigate('/system')}
                                style={{
                                    flex: 1,
                                    padding: '14px 24px',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    backgroundColor: 'white',
                                    color: '#64748b',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={e => e.target.style.background = '#f1f5f9'}
                                onMouseLeave={e => e.target.style.background = 'white'}
                            >
                                Go Back
                            </button>
                            <button
                                type="submit"
                                disabled={isVerifying || !password}
                                style={{
                                    flex: 1,
                                    padding: '14px 24px',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    cursor: isVerifying || !password ? 'not-allowed' : 'pointer',
                                    background: isVerifying || !password ? '#cbd5e1' : '#6366f1',
                                    color: 'white',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {isVerifying ? 'Verifying...' : 'Access Alerts'}
                            </button>
                        </div>
                    </form>

                    <p style={{ 
                        fontSize: '12px', 
                        color: '#94a3b8', 
                        textAlign: 'center', 
                        marginTop: '24px' 
                    }}>
                        🔒 This area is protected by system password
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container with-mobile-header-offset" style={{ background: '#f8fafc' }}>
            {/* Header */}
            <PageHeader 
                icon={Bell}
                title="Alerts Management"
                subtitle="Send notifications to your users"
            >
                <button
                    onClick={() => setShowModal(true)}
                    className="btn"
                >
                    <Plus size={18} />
                    Create Alert
                </button>
            </PageHeader>

            <div style={{ padding: '0 24px' }}>
                {message.text && (
                    <div style={{
                        padding: '12px 16px',
                        marginBottom: '20px',
                        background: message.type === 'success' ? '#dcfce7' : '#fee2e2',
                        border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
                        color: message.type === 'success' ? '#166534' : '#991b1b',
                        fontSize: '14px'
                    }}>
                        {message.text}
                    </div>
                )}

                {/* Stats Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ background: 'white', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Total Alerts</p>
                        <p style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b', margin: 0 }}>{alerts.length}</p>
                    </div>
                    <div style={{ background: 'white', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Active Alerts</p>
                        <p style={{ fontSize: '28px', fontWeight: '700', color: '#10b981', margin: 0 }}>
                            {alerts.filter(a => !a.expires_at || new Date(a.expires_at) > new Date()).length}
                        </p>
                    </div>
                    <div style={{ background: 'white', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Total Users</p>
                        <p style={{ fontSize: '28px', fontWeight: '700', color: '#3b82f6', margin: 0 }}>{users.length}</p>
                    </div>
                    <div style={{ background: 'white', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Expired Alerts</p>
                        <p style={{ fontSize: '28px', fontWeight: '700', color: '#94a3b8', margin: 0 }}>
                            {alerts.filter(a => a.expires_at && new Date(a.expires_at) <= new Date()).length}
                        </p>
                    </div>
                </div>

                {/* Alerts List */}
                <div style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: 0 }}>All Alerts</h2>
                    </div>

                    {loading ? (
                        <PageLoader message="Loading alerts..." compact />
                    ) : alerts.length === 0 ? (
                        <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
                            <Bell size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
                            <p style={{ fontSize: '14px', margin: 0 }}>No alerts created yet</p>
                            <p style={{ fontSize: '12px', margin: '4px 0 0' }}>Click "Create Alert" to send your first notification</p>
                        </div>
                    ) : (
                        <div>
                            {alerts.map((alert) => {
                                const typeColor = getTypeColor(alert.type);
                                const isExpired = alert.expires_at && new Date(alert.expires_at) <= new Date();
                                
                                return (
                                    <div
                                        key={alert.id}
                                        style={{
                                            padding: '16px 20px',
                                            borderBottom: '1px solid #f1f5f9',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'flex-start',
                                            opacity: isExpired ? 0.5 : 1
                                        }}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                                                <span style={{
                                                    padding: '2px 8px',
                                                    background: typeColor.bg,
                                                    border: `1px solid ${typeColor.border}`,
                                                    color: typeColor.text,
                                                    fontSize: '11px',
                                                    fontWeight: '500',
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {alert.type}
                                                </span>
                                                {isExpired && (
                                                    <span style={{
                                                        padding: '2px 8px',
                                                        background: '#f1f5f9',
                                                        color: '#64748b',
                                                        fontSize: '11px'
                                                    }}>
                                                        Expired
                                                    </span>
                                                )}
                                                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                                                    {new Date(alert.created_at).toLocaleDateString('en-US', { 
                                                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                                                    })}
                                                </span>
                                            </div>
                                            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b', margin: '0 0 4px' }}>
                                                {alert.title}
                                            </h3>
                                            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                                                {alert.content}
                                            </p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
                                                <span style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Users size={12} />
                                                    {alert.target_users ? `${alert.target_users.length} users` : 'All users'}
                                                </span>
                                                {alert.expires_at && (
                                                    <span style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Clock size={12} />
                                                        Expires: {new Date(alert.expires_at).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(alert.id)}
                                            style={{
                                                padding: '8px',
                                                background: 'transparent',
                                                border: 'none',
                                                color: '#ef4444',
                                                cursor: 'pointer'
                                            }}
                                            title="Delete alert"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Create Alert Modal */}
            {showModal && (
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
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'white',
                        width: '100%',
                        maxWidth: '500px',
                        maxHeight: '90vh',
                        overflow: 'auto'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '16px 20px',
                            borderBottom: '1px solid #e2e8f0'
                        }}>
                            <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Create New Alert</h2>
                            <button
                                onClick={() => { setShowModal(false); resetForm(); }}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
                            >
                                <X size={20} color="#64748b" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                                    Alert Title *
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g., System Maintenance"
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid #d1d5db',
                                        fontSize: '14px'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                                    Message Content *
                                </label>
                                <textarea
                                    value={formData.content}
                                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                                    placeholder="Enter your message here..."
                                    rows={4}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid #d1d5db',
                                        fontSize: '14px',
                                        resize: 'vertical'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                                    Alert Type
                                </label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {['info', 'success', 'warning', 'error'].map(type => {
                                        const color = getTypeColor(type);
                                        return (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, type })}
                                                style={{
                                                    flex: 1,
                                                    padding: '8px 12px',
                                                    background: formData.type === type ? color.bg : 'white',
                                                    border: `2px solid ${formData.type === type ? color.text : '#e5e7eb'}`,
                                                    color: formData.type === type ? color.text : '#6b7280',
                                                    fontSize: '12px',
                                                    fontWeight: '500',
                                                    textTransform: 'capitalize',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {type}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                                    Target Users (leave empty for all)
                                </label>
                                <div style={{ 
                                    maxHeight: '150px', 
                                    overflow: 'auto', 
                                    border: '1px solid #e5e7eb',
                                    padding: '8px'
                                }}>
                                    {users.length === 0 ? (
                                        <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>No users available</p>
                                    ) : (
                                        users.map(user => (
                                            <label
                                                key={user.id}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    padding: '6px',
                                                    cursor: 'pointer',
                                                    background: formData.target_users.includes(user.id) ? '#f0f9ff' : 'transparent'
                                                }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={formData.target_users.includes(user.id)}
                                                    onChange={() => toggleUserSelection(user.id)}
                                                />
                                                <span style={{ fontSize: '13px' }}>{user.username}</span>
                                                <span style={{ fontSize: '11px', color: '#94a3b8' }}>({user.business_name || 'No business'})</span>
                                            </label>
                                        ))
                                    )}
                                </div>
                                {formData.target_users.length === 0 && (
                                    <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                                        All users will receive this alert
                                    </p>
                                )}
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                                    Expires At (optional)
                                </label>
                                <input
                                    type="datetime-local"
                                    value={formData.expires_at}
                                    onChange={e => setFormData({ ...formData, expires_at: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid #d1d5db',
                                        fontSize: '14px'
                                    }}
                                />
                            </div>

                            <button
                                type="submit"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    background: '#6366f1',
                                    color: 'white',
                                    border: 'none',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                            >
                                <Send size={16} />
                                Send Alert
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AlertsManagement;
