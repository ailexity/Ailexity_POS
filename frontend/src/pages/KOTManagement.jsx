import React, { useEffect, useState } from 'react';
import api from '../api';
import PageHeader from '../components/PageHeader';
import PageLoader from '../components/PageLoader';
import { Search, RefreshCw, CheckCircle, Clock3, Box, Circle, XCircle } from 'lucide-react';

const statusInfo = {
    pending: { label: 'Pending', color: '#f59e0b', emoji: '🟡' },
    preparing: { label: 'Preparing', color: '#eab308', emoji: '🟡' },
    ready: { label: 'Ready', color: '#22c55e', emoji: '🟢' },
    printed: { label: 'Printed', color: '#0ea5e9', emoji: '🔵' },
    completed: { label: 'Completed', color: '#10b981', emoji: '✅' },
    cancelled: { label: 'Cancelled', color: '#ef4444', emoji: '❌' },
};

const statusOptions = ['all', 'pending', 'preparing', 'ready', 'completed', 'cancelled'];

const KOTManagement = () => {
    const [kots, setKots] = useState([]);
    const [filteredKots, setFilteredKots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [refreshing, setRefreshing] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchKots();
        const interval = setInterval(fetchKots, 8000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        let result = [...kots];

        if (filterStatus !== 'all') {
            result = result.filter(kot => kot.status === filterStatus);
        }

        if (searchQuery.trim()) {
            const query = searchQuery.trim().toLowerCase();
            result = result.filter(kot => {
                return (
                    kot.id?.toLowerCase().includes(query) ||
                    kot.table_name?.toLowerCase().includes(query) ||
                    String(kot.table_number || '').includes(query) ||
                    (kot.notes || '').toLowerCase().includes(query) ||
                    kot.items?.some(item => String(item.item_name || '').toLowerCase().includes(query))
                );
            });
        }

        setFilteredKots(result);
    }, [kots, filterStatus, searchQuery]);

    const fetchKots = async () => {
        setError('');
        if (!refreshing) setLoading(true);

        try {
            const response = await api.get('/kots/', {
                params: filterStatus !== 'all' ? { status: filterStatus } : {}
            });
            setKots(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error('Error fetching KOTs:', err);
            setError(err.response?.data?.detail || 'Failed to load kitchen tickets.');
            setKots([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const updateStatus = async (kotId, nextStatus) => {
        setActionLoading(kotId);
        try {
            await api.put(`/kots/${kotId}/status`, { status: nextStatus });
            await fetchKots();
        } catch (err) {
            console.error('Error updating KOT status:', err);
            setError(err.response?.data?.detail || 'Failed to update KOT status.');
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusLabel = (status) => statusInfo[status]?.label || status;

    const getStatusColor = (status) => statusInfo[status]?.color || '#94a3b8';

    const getTimeSince = (createdAt) => {
        if (!createdAt) return 'Unknown';
        const now = new Date();
        const created = new Date(createdAt);
        const diffMs = now - created;
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return 'Now';
        if (diffMins < 60) return `${diffMins}m`;
        const hours = Math.floor(diffMins / 60);
        return `${hours}h`;
    };

    const renderActions = (kot) => {
        const status = kot.status;
        const isBusy = actionLoading === kot.id;
        if (status === 'completed' || status === 'cancelled') {
            return null;
        }

        const actions = [];
        if (status === 'pending') {
            actions.push({ label: 'Preparing', nextStatus: 'preparing' });
            actions.push({ label: 'Ready', nextStatus: 'ready' });
        }
        if (status === 'preparing') {
            actions.push({ label: 'Ready', nextStatus: 'ready' });
        }
        if (status === 'ready' || status === 'printed') {
            actions.push({ label: 'Complete', nextStatus: 'completed' });
        }
        actions.push({ label: 'Cancel', nextStatus: 'cancelled', danger: true });

        return (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '12px' }}>
                {actions.map((action) => (
                    <button
                        key={action.label}
                        onClick={() => updateStatus(kot.id, action.nextStatus)}
                        disabled={isBusy}
                        style={{
                            padding: '10px 14px',
                            borderRadius: '8px',
                            border: 'none',
                            color: 'white',
                            backgroundColor: action.danger ? '#ef4444' : '#2563eb',
                            opacity: isBusy ? 0.6 : 1,
                            cursor: isBusy ? 'not-allowed' : 'pointer',
                            fontSize: '13px',
                            fontWeight: 600,
                            minWidth: '110px'
                        }}
                    >
                        {isBusy ? 'Saving…' : action.label}
                    </button>
                ))}
            </div>
        );
    };

    return (
        <div className="page-container with-mobile-header-offset" style={{ backgroundColor: '#f8fafc', padding: '20px' }}>
            <PageHeader
                icon={Box}
                title="Kitchen Order Tickets"
                subtitle="Track kitchen orders and update status from pending to ready"
            />

            <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by order, table, item or note"
                            style={{ width: '100%', padding: '10px 12px 10px 40px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', fontSize: '13px' }}
                        />
                    </div>

                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', fontSize: '13px', cursor: 'pointer' }}
                    >
                        {statusOptions.map((status) => (
                            <option key={status} value={status}>{status === 'all' ? 'All Statuses' : statusInfo[status]?.label || status}</option>
                        ))}
                    </select>

                    <button
                        onClick={() => { setRefreshing(true); fetchKots(); }}
                        style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                        <RefreshCw size={16} color="#0ea5e9" />
                        Refresh
                    </button>
                </div>
            </div>

            {error && (
                <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: '10px', padding: '14px', marginBottom: '20px' }}>
                    {error}
                </div>
            )}

            {loading ? (
                <PageLoader message="Loading kitchen tickets..." compact />
            ) : filteredKots.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ fontSize: '40px', marginBottom: '14px' }}>🍳</div>
                    <p style={{ fontWeight: 600, fontSize: '16px', marginBottom: '6px' }}>No kitchen orders found</p>
                    <p style={{ margin: 0 }}>Create a kitchen order from the POS screen to see it here.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '18px', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
                    {filteredKots.map((kot) => (
                        <div key={kot.id} style={{ backgroundColor: 'white', borderRadius: '18px', border: `1px solid ${getStatusColor(kot.status)}33`, boxShadow: '0 15px 45px rgba(15, 23, 42, 0.04)', padding: '18px', minHeight: '220px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>KOT #{kot.id?.slice(-6)}</h3>
                                        <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#64748b' }}>{kot.table_name ? `${kot.table_name} (${kot.table_number || 'N/A'})` : `Table ${kot.table_number || 'N/A'}`}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '22px' }}>{statusInfo[kot.status]?.emoji || '◯'}</div>
                                        <div style={{ marginTop: '6px', fontSize: '12px', fontWeight: 700, color: getStatusColor(kot.status) }}>{getStatusLabel(kot.status)}</div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px' }}>
                                    <span style={{ backgroundColor: '#eff6ff', color: '#0369a1', padding: '6px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 600 }}>Items: {kot.items?.length || 0}</span>
                                    {kot.notes && <span style={{ backgroundColor: '#f8fafc', color: '#334155', padding: '6px 10px', borderRadius: '999px', fontSize: '12px' }}>{kot.notes}</span>}
                                </div>

                                <div style={{ marginTop: '18px', backgroundColor: '#f8fafc', borderRadius: '12px', padding: '12px', fontSize: '13px', color: '#334155' }}>
                                    {kot.items?.map((item, idx) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{item.item_name || 'Untitled'}</div>
                                                <div style={{ fontSize: '12px', color: '#64748b' }}>{item.quantity} × ₹{(item.unit_price || 0).toFixed(0)}</div>
                                            </div>
                                            <div style={{ fontWeight: 700, color: '#0f172a' }}>₹{(((item.unit_price || 0) * (item.quantity || 1)) || 0).toFixed(0)}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ marginTop: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#64748b' }}>
                                    <div><Clock3 size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> {getTimeSince(kot.created_at)} ago</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <CheckCircle size={14} color="#22c55e" />
                                        <span style={{ fontWeight: 600 }}>{kot.items?.reduce((sum, item) => sum + (item.quantity || 0), 0)} pcs</span>
                                    </div>
                                </div>
                                {renderActions(kot)}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default KOTManagement;
