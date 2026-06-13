import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Search, Printer, MessageSquare, X, RefreshCw, ShoppingBag } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import PageLoader from '../components/PageLoader';

const OrderManagement = () => {
    const allowedSources = ['zomato', 'swiggy', 'website', 'app'];
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user && !user.enable_order_management) {
            navigate('/');
        }
    }, [user, navigate]);

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        let result = [...orders];

        if (searchQuery) {
            result = result.filter(order =>
                order.id?.toString().includes(searchQuery) ||
                order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.customer_phone?.includes(searchQuery)
            );
        }

        if (filterStatus !== 'all') {
            result = result.filter(order => order.status === filterStatus);
        }

        if (filterType !== 'all') {
            result = result.filter(order => order.order_type === filterType);
        }

        if (sortBy === 'newest') {
            result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }

        setFilteredOrders(result);
    }, [orders, searchQuery, filterStatus, filterType, sortBy]);

    const fetchOrders = async () => {
        try {
            const res = await api.get('/online-orders/');
            const formattedOrders = (Array.isArray(res.data) ? res.data : []).map(invoice => ({
                id: invoice.id || invoice.invoice_number,
                invoice_number: invoice.invoice_number,
                customer_name: invoice.customer_name || 'Online Customer',
                customer_phone: invoice.customer_phone || 'N/A',
                customer_address: invoice.customer_address || invoice.delivery_address || 'N/A',
                order_type: invoice.order_type || 'delivery',
                order_source: invoice.order_source || 'website',
                status: invoice.status || 'new',
                total_amount: invoice.total_amount || 0,
                payment_mode: invoice.payment_mode,
                payment_status: invoice.payment_status || 'pending',
                items: invoice.items || [],
                created_at: invoice.created_at,
                table_name: invoice.table_name
            })).filter(order => allowedSources.includes(String(order.order_source || '').toLowerCase()));
            setOrders(formattedOrders);
        } catch (e) {
            console.error('Error fetching orders:', e);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            new: '#ef4444',
            accepted: '#f97316',
            preparing: '#eab308',
            ready: '#22c55e',
            out_for_delivery: '#3b82f6',
            delivered: '#10b981'
        };
        return colors[status] || '#9ca3af';
    };

    const getStatusEmoji = (status) => {
        const emojis = {
            new: '🔴',
            accepted: '🟠',
            preparing: '🟡',
            ready: '🟢',
            out_for_delivery: '🔵',
            delivered: '✅'
        };
        return emojis[status] || '⚪';
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'dine-in':
                return '🍽️';
            case 'takeaway':
                return '📦';
            case 'delivery':
                return '🚗';
            default:
                return '🛍️';
        }
    };

    const getTimeSince = (createdAt) => {
        const now = new Date();
        const created = new Date(createdAt);
        const diffMs = now - created;
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return 'Now';
        if (diffMins < 60) return `${diffMins}m`;
        const hours = Math.floor(diffMins / 60);
        return `${hours}h`;
    };

    return (
        <div className="page-container with-mobile-header-offset" style={{ backgroundColor: '#f8fafc', padding: '20px' }}>
            <PageHeader 
                icon={ShoppingBag}
                title="Online Orders"
                subtitle="Manage orders from all platforms"
            />

            <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
                        <input
                            type="text"
                            placeholder="Order ID, Customer..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 12px 10px 40px',
                                borderRadius: '6px',
                                border: '1px solid #e2e8f0',
                                fontSize: '13px',
                                backgroundColor: 'white'
                            }}
                        />
                    </div>

                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        style={{
                            padding: '10px 12px',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                            backgroundColor: 'white',
                            fontSize: '13px',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="all">All Status</option>
                        <option value="new">New</option>
                        <option value="accepted">Accepted</option>
                        <option value="preparing">Preparing</option>
                        <option value="ready">Ready</option>
                        <option value="out_for_delivery">Out for Delivery</option>
                        <option value="delivered">Delivered</option>
                    </select>

                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        style={{
                            padding: '10px 12px',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                            backgroundColor: 'white',
                            fontSize: '13px',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="all">All Types</option>
                        <option value="dine-in">Dine-in</option>
                        <option value="takeaway">Takeaway</option>
                        <option value="delivery">Delivery</option>
                    </select>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        style={{
                            padding: '10px 12px',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                            backgroundColor: 'white',
                            fontSize: '13px',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="newest">Newest</option>
                        <option value="oldest">Oldest</option>
                    </select>

                    <button
                        onClick={fetchOrders}
                        style={{
                            padding: '10px 12px',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                            backgroundColor: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                        }}
                    >
                        <RefreshCw size={16} color="#0284c7" />
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                {loading ? (
                    <div style={{ gridColumn: '1/-1' }}>
                        <PageLoader message="Loading orders..." compact />
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', gridColumn: '1/-1' }}>
                        <ShoppingBag size={48} style={{ margin: '0 auto 12px', color: '#cbd5e1' }} />
                        <p style={{ fontSize: '15px', fontWeight: '600', color: '#64748b', margin: 0 }}>No orders</p>
                    </div>
                ) : (
                    filteredOrders.map(order => (
                        <OrderCard
                            key={order.id}
                            order={order}
                            isSelected={selectedOrder?.id === order.id}
                            onSelect={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                            getStatusColor={getStatusColor}
                            getStatusEmoji={getStatusEmoji}
                            getTypeIcon={getTypeIcon}
                            getTimeSince={getTimeSince}
                        />
                    ))
                )}
            </div>

            {selectedOrder && (
                <OrderDetailsModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    getStatusEmoji={getStatusEmoji}
                    getTypeIcon={getTypeIcon}
                />
            )}
        </div>
    );
};

const OrderCard = ({ order, isSelected, onSelect, getStatusColor, getStatusEmoji, getTypeIcon, getTimeSince }) => {
    return (
        <div
            onClick={onSelect}
            style={{
                backgroundColor: 'white',
                border: isSelected ? `2px solid ${getStatusColor(order.status)}` : '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: isSelected ? `0 4px 12px ${getStatusColor(order.status)}20` : '0 1px 3px rgba(0,0,0,0.05)'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div>
                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', margin: 0, marginBottom: '2px' }}>
                        #{order.invoice_number || order.id}
                    </h3>
                    <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
                        {getTimeSince(order.created_at)} ago
                    </p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', marginBottom: '2px' }}>
                        {getStatusEmoji(order.status)}
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '600', color: getStatusColor(order.status) }}>
                        {order.status.replace('_', ' ').toUpperCase()}
                    </span>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', fontSize: '13px' }}>
                <span style={{ backgroundColor: '#f0fdf4', color: '#166534', padding: '2px 6px', borderRadius: '3px', fontWeight: '600' }}>
                    {getTypeIcon(order.order_type)} {order.order_type.toUpperCase()}
                </span>
                <span style={{ backgroundColor: '#f3f4f6', color: '#4b5563', padding: '2px 6px', borderRadius: '3px', fontSize: '11px' }}>
                    {order.order_source}
                </span>
            </div>

            <div style={{ marginBottom: '10px', padding: '8px', backgroundColor: '#f8fafc', borderRadius: '4px' }}>
                <p style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', margin: '0 0 2px 0' }}>
                    {order.customer_name}
                </p>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                    📞 {order.customer_phone}
                </p>
                {order.order_type === 'delivery' && (
                    <p style={{ fontSize: '11px', color: '#64748b', margin: '4px 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        📍 {order.customer_address}
                    </p>
                )}
            </div>

            <div style={{ marginBottom: '10px', padding: '6px 8px', backgroundColor: '#fef3c7', borderRadius: '4px' }}>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#92400e', margin: 0 }}>
                    {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''} • ₹{order.total_amount?.toFixed(0) || '0'}
                </p>
            </div>

            <div style={{ display: 'flex', gap: '8px', fontSize: '11px' }}>
                <span style={{
                    flex: 1,
                    backgroundColor: order.payment_status === 'paid' ? '#d1fae5' : '#fecaca',
                    color: order.payment_status === 'paid' ? '#065f46' : '#991b1b',
                    padding: '4px 6px',
                    borderRadius: '3px',
                    fontWeight: '600',
                    textAlign: 'center'
                }}>
                    {order.payment_status === 'paid' ? '✓ Paid' : '⏳ Pending'}
                </span>
                {order.table_name && (
                    <span style={{
                        flex: 1,
                        backgroundColor: '#e0e7ff',
                        color: '#3730a3',
                        padding: '4px 6px',
                        borderRadius: '3px',
                        fontWeight: '600',
                        textAlign: 'center'
                    }}>
                        {order.table_name}
                    </span>
                )}
            </div>

            {isSelected && (
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
                    <p style={{ fontSize: '11px', color: '#0284c7', margin: 0, fontWeight: '600' }}>
                        📋 Scroll down for details
                    </p>
                </div>
            )}
        </div>
    );
};

const OrderDetailsModal = ({ order, onClose, getStatusEmoji, getTypeIcon }) => {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'flex-end',
            zIndex: 50
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '16px 16px 0 0',
                width: '100%',
                maxHeight: '85vh',
                overflowY: 'auto',
                padding: '20px',
                boxShadow: '0 -10px 30px rgba(0,0,0,0.2)'
            }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        zIndex: 10
                    }}
                >
                    <X size={24} color="#64748b" />
                </button>

                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#1e293b', margin: 0, marginBottom: '4px' }}>
                            #{order.invoice_number || order.id}
                        </h1>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{ fontSize: '28px' }}>
                                {getStatusEmoji(order.status)}
                            </span>
                            <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>
                                {order.status.replace('_', ' ').toUpperCase()}
                            </span>
                            <span style={{ fontSize: '28px', marginLeft: '8px' }}>
                                {getTypeIcon(order.order_type)}
                            </span>
                        </div>
                    </div>
                </div>

                <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', margin: '0 0 8px 0' }}>Customer</h3>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', margin: 0, marginBottom: '4px' }}>
                        {order.customer_name}
                    </p>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: 0, marginBottom: '4px' }}>
                        📞 {order.customer_phone}
                    </p>
                    {order.order_type === 'delivery' && order.customer_address && (
                        <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                            📍 {order.customer_address}
                        </p>
                    )}
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', margin: '0 0 10px 0' }}>Items</h3>
                    <div style={{ display: 'grid', gap: '8px' }}>
                        {order.items && order.items.length > 0 ? (
                            order.items.map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', backgroundColor: '#f0f9ff', borderRadius: '4px' }}>
                                    <div>
                                        <p style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', margin: 0, marginBottom: '2px' }}>
                                            {item.item_name}
                                        </p>
                                        <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
                                            {item.quantity} × ₹{(item.unit_price || 0).toFixed(0)}
                                        </p>
                                    </div>
                                    <p style={{ fontSize: '13px', fontWeight: '700', color: '#059669', margin: 0 }}>
                                        ₹{((item.unit_price || 0) * (item.quantity || 1)).toFixed(0)}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>No items</p>
                        )}
                    </div>
                </div>

                <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                        <span style={{ color: '#64748b' }}>Subtotal</span>
                        <span style={{ fontWeight: '600', color: '#1e293b' }}>₹{order.total_amount?.toFixed(0) || '0'}</span>
                    </div>
                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '700' }}>
                        <span style={{ color: '#1e293b' }}>Total</span>
                        <span style={{ color: '#059669' }}>₹{order.total_amount?.toFixed(0) || '0'}</span>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ backgroundColor: '#fef3c7', padding: '12px', borderRadius: '6px' }}>
                        <p style={{ fontSize: '11px', color: '#92400e', fontWeight: '600', margin: 0, marginBottom: '4px' }}>Payment Mode</p>
                        <p style={{ fontSize: '13px', color: '#92400e', fontWeight: '600', margin: 0 }}>
                            {order.payment_mode}
                        </p>
                    </div>
                    <div style={{ backgroundColor: order.payment_status === 'paid' ? '#d1fae5' : '#fecaca', padding: '12px', borderRadius: '6px' }}>
                        <p style={{ fontSize: '11px', color: order.payment_status === 'paid' ? '#065f46' : '#991b1b', fontWeight: '600', margin: 0, marginBottom: '4px' }}>Payment Status</p>
                        <p style={{ fontSize: '13px', color: order.payment_status === 'paid' ? '#065f46' : '#991b1b', fontWeight: '600', margin: 0 }}>
                            {order.payment_status === 'paid' ? '✓ Paid' : '⏳ Pending'}
                        </p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button style={{
                        padding: '10px',
                        backgroundColor: '#0284c7',
                        color: 'white',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                    }}>
                        <Printer size={14} /> Print KOT
                    </button>
                    <button style={{
                        padding: '10px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                    }}>
                        <MessageSquare size={14} /> Print Bill
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderManagement;
