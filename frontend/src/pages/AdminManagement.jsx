import React, { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, Edit, Trash2, Shield, Eye, EyeOff, AlertCircle, Search, Settings, CheckCircle, X } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import PageLoader from '../components/PageLoader';
import FeatureManagementModal from '../components/FeatureManagementModal';

const normalizeBusinessType = (businessType) => {
    const value = String(businessType || '').toLowerCase();
    if (value.includes('retail')) return 'retailer';
    if (value.includes('restaurant')) return 'restaurant';
    return '';
};

const AdminManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [featureUser, setFeatureUser] = useState(null);
    const [showFeatureModal, setShowFeatureModal] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        role: 'admin',
        business_name: '',
        phone: '',
        email: '',
        full_name: '',
        business_address: '',
        business_type: 'restaurant',
        tax_id: '',
        tax_rate: '',
        subscription_status: 'active',
        active_window_start: '',
        active_window_end: '',
        whatsapp_from_display: '',
    });

    const getKitchenUserFeatures = () => ({
        stock_management: false,
        ledger_management: false,
        parties_management: false,
        items_management: false,
        pos_billing: false,
        invoices: false,
        alerts: false,
        dashboard: false,
        admin_panel: false,
        kot_printing: true,
        order_management: true,
        payment_tracking: false,
        attendees_management: false,
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    
    // System password protection states
    const [showPasswordPrompt, setShowPasswordPrompt] = useState(true);
    const [systemPassword, setSystemPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    
    const { user } = useAuth();
    const navigate = useNavigate();

    // Security: Redirect if not sysadmin
    useEffect(() => {
        if (user && user.role !== 'sysadmin') {
            navigate('/');
        }
    }, [user, navigate]);

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleSystemPasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setIsVerifying(true);

        try {
            await api.post('/system/verify-password', {
                password: systemPassword
            });
            setShowPasswordPrompt(false);
            setSystemPassword('');
        } catch (err) {
            setPasswordError(err.response?.data?.detail || 'Invalid system password');
        } finally {
            setIsVerifying(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users/');
            setUsers(Array.isArray(response.data) ? response.data : []);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Failed to load users');
            setUsers([]);
            setLoading(false);
        }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const normalizedBusinessType = normalizeBusinessType(formData.business_type);
            if (formData.role === 'admin' && !normalizedBusinessType) {
                setError('Please choose whether this user is Restaurant or Retailer.');
                return;
            }

            const payload = {
                ...formData,
                business_type: normalizedBusinessType || formData.business_type,
            };

            if (formData.role === 'kitchen') {
                payload.business_type = payload.business_type || 'restaurant';
                payload.features = getKitchenUserFeatures();
            }

            await api.post('/users/', payload);
            setShowAddModal(false);
            setFormData({
                username: '',
                password: '',
                role: 'admin',
                business_name: '',
                phone: '',
                email: '',
                full_name: '',
                business_address: '',
                business_type: 'restaurant',
                tax_id: '',
                tax_rate: '',
                subscription_status: 'active',
                active_window_start: '',
                active_window_end: '',
                whatsapp_from_display: '',
            });
            fetchUsers();
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to create user');
        }
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const normalizedBusinessType = normalizeBusinessType(formData.business_type);
            if (formData.role === 'admin' && !normalizedBusinessType) {
                setError('Please choose whether this user is Restaurant or Retailer.');
                return;
            }

            const payload = {
                ...formData,
                business_type: normalizedBusinessType || formData.business_type,
            };

            await api.put(`/users/${selectedUser.id}`, payload);
            setShowEditModal(false);
            setSelectedUser(null);
            setFormData({
                username: '',
                password: '',
                role: 'admin',
                business_name: '',
                phone: '',
                email: '',
                full_name: '',
                business_address: '',
                business_type: 'restaurant',
                tax_id: '',
                tax_rate: '',
                subscription_status: 'active',
                active_window_start: '',
                active_window_end: '',
                whatsapp_from_display: '',
            });
            fetchUsers();
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to update user');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;

        try {
            await api.delete(`/users/${userId}`);
            fetchUsers();
        } catch (err) {
            alert(err.response?.data?.detail || 'Failed to delete user');
        }
    };

    const handleVerifyUser = async (userId) => {
        setError('');
        try {
            await api.post(`/users/${userId}/verify`);
            fetchUsers();
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to verify user');
        }
    };

    // Helper function to determine access status based on active window dates
    const getAccessStatus = (user) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (user.active_window_start) {
            const startDate = new Date(user.active_window_start);
            if (today < startDate) {
                return { status: 'pending', label: 'Not Yet Active', color: 'bg-yellow-500' };
            }
        }
        
        if (user.active_window_end) {
            const endDate = new Date(user.active_window_end);
            if (today > endDate) {
                return { status: 'expired', label: 'Expired', color: 'bg-red-500' };
            }
        }
        
        if (user.subscription_status === 'inactive') {
            return { status: 'inactive', label: 'Inactive', color: 'bg-red-500' };
        }
        
        return { status: 'active', label: 'Active', color: 'bg-green-500' };
    };

    const openEditModal = (user) => {
        setSelectedUser(user);
        setFormData({
            username: user.username,
            password: '',
            role: user.role,
            business_name: user.business_name || '',
            phone: user.phone || '',
            email: user.email || '',
            full_name: user.full_name || '',
            business_address: user.business_address || '',
            business_type: normalizeBusinessType(user.business_type) || 'restaurant',
            tax_id: user.tax_id || '',
            tax_rate: user.tax_rate || 0,
            subscription_status: user.subscription_status || 'active',
            active_window_start: user.active_window_start || '',
            active_window_end: user.active_window_end || '',
            whatsapp_from_display: user.whatsapp_from_display || '',
        });
        setShowEditModal(true);
        setError('');
    };

    const openFeatureModal = (user) => {
        setFeatureUser(user);
        setShowFeatureModal(true);
        setError('');
    };

    const closeFeatureModal = () => {
        setShowFeatureModal(false);
        setFeatureUser(null);
    };

    if (loading) {
        return (
            <div className="page-container with-mobile-header-offset sysadmin-page">
                <PageLoader message="Loading administrators..." />
            </div>
        );
    }

    return (
        <div className="page-container with-mobile-header-offset sysadmin-page" style={{ background: '#f8fafc' }}>
            {/* System Password Protection Modal */}
            {showPasswordPrompt && (
                <div className="modal-overlay sysadmin-modal-overlay">
                    <div className="modal-content sysadmin-password-modal">
                        <div className="sysadmin-modal-hero">
                            <div className="sysadmin-modal-icon">
                                <Shield size={28} />
                            </div>
                            <h2 className="text-xl font-bold mb-2">Admin Controls Access</h2>
                            <p className="text-sm text-muted">Enter system password to continue</p>
                        </div>

                        {passwordError && (
                            <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <AlertCircle size={18} />
                                <span>{passwordError}</span>
                            </div>
                        )}

                        <form onSubmit={handleSystemPasswordSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">System Password</label>
                                <input
                                    type="password"
                                    className="input"
                                    value={systemPassword}
                                    onChange={(e) => setSystemPassword(e.target.value)}
                                    placeholder="Enter system password"
                                    autoFocus
                                    required
                                />
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    type="submit"
                                    className="btn btn-primary w-full"
                                    disabled={isVerifying}
                                >
                                    {isVerifying ? 'Verifying...' : 'Access Admin Controls'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate('/')}
                                    className="btn btn-secondary w-full"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Header */}
            <PageHeader 
                icon={Shield}
                title="System Administration"
                subtitle="Manage users and access control"
            />

            {/* Content Area */}
            <div className="content-area">
                {/* Stats Cards */}
                <div className="grid grid-cols-auto-fit gap-6 mb-6">
                    <div className="card">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted mb-2">Total Users</p>
                                <h2 className="text-2xl font-bold">{users.length}</h2>
                            </div>
                            <div className="p-3" style={{ background: '#eef2ff' }}>
                                <Users size={24} color="#4f46e5" />
                            </div>
                        </div>
                    </div>
                    <div className="card">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted mb-2">Administrators</p>
                                <h2 className="text-2xl font-bold">{users.filter(u => u.role === 'admin').length}</h2>
                            </div>
                            <div className="p-3" style={{ background: '#fef3c7' }}>
                                <Shield size={24} color="#f59e0b" />
                            </div>
                        </div>
                    </div>
                    <div className="card">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted mb-2">Active Admins</p>
                                <h2 className="text-2xl font-bold">{users.filter(u => u.role === 'admin' && u.subscription_status === 'active').length}</h2>
                            </div>
                            <div className="p-3" style={{ background: '#d1fae5' }}>
                                <CheckCircle size={24} color="#16a34a" />
                            </div>
                        </div>
                    </div>
                    <div className="card">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted mb-2">System Admins</p>
                                <h2 className="text-2xl font-bold">{users.filter(u => u.role === 'sysadmin').length}</h2>
                            </div>
                            <div className="p-3" style={{ background: '#ddd6fe' }}>
                                <Shield size={24} color="#7c3aed" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Users Table */}
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="m-0">User Management</h2>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <div className="search-input-wrapper" style={{ maxWidth: '280px' }}>
                                <Search className="search-input-icon" size={16} />
                                <input
                                    className="search-input-field"
                                    placeholder="Search users..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{ paddingLeft: '36px' }}
                                />
                            </div>
                            <button className="btn" onClick={() => { setShowAddModal(true); setError(''); }}>
                                <UserPlus size={18} />
                                Add New User
                            </button>
                        </div>
                    </div>
                    <div className="overflow-hidden">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Username</th>
                                    <th>Business</th>
                                    <th>Role</th>
                                    <th>Subscription</th>
                                    <th>Features</th>
                                    <th>Verification</th>
                                    <th>Status</th>
                                    <th>Last Login</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    const filtered = users.filter(u => {
                                        if (!searchQuery) return true;
                                        const q = searchQuery.toLowerCase();
                                        return (
                                            (u.username && u.username.toLowerCase().includes(q)) ||
                                            (u.business_name && u.business_name.toLowerCase().includes(q)) ||
                                            (u.email && u.email.toLowerCase().includes(q)) ||
                                            (u.phone && u.phone.toLowerCase().includes(q)) ||
                                            (u.role && u.role.toLowerCase().includes(q))
                                        );
                                    });
                                    if (filtered.length === 0) {
                                        return (
                                            <tr>
                                                <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                                        <Search size={32} style={{ opacity: 0.3 }} />
                                                        <p>{searchQuery ? `No users found matching "${searchQuery}"` : 'No users found'}</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    }
                                    return filtered.map(u => (
                                        <tr key={u.id}>
                                            <td className="font-medium">
                                                {u.username}
                                                <div className="text-xs text-muted">{u.phone || ''}</div>
                                            </td>
                                            <td>
                                                <div>{u.business_name || <span className="text-xs text-muted">—</span>}</div>
                                                {u.business_type && (
                                                    <span className={`badge text-xs ${u.business_type === 'retailer' ? 'bg-orange-400' : 'bg-sky-500'}`} style={{ marginTop: '3px' }}>
                                                        {u.business_type}
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`badge ${u.role === 'admin' ? 'bg-blue-500' : u.role === 'sysadmin' ? 'bg-purple-500' : 'bg-emerald-500'}`}>
                                                    {u.role === 'admin' ? 'Admin' : u.role === 'sysadmin' ? 'Sys Admin' : u.role === 'kitchen' ? 'Kitchen' : u.role}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${u.subscription_status === 'active' ? 'bg-green-500' : u.subscription_status === 'trial' ? 'bg-yellow-500' : 'bg-red-500'}`}>
                                                    {u.subscription_status || 'active'}
                                                </span>
                                            </td>
                                            <td>
                                                {u.features ? (
                                                    <span className="badge bg-slate-500 text-white">
                                                        {Object.values(u.features).filter(Boolean).length}/{Object.keys(u.features).length}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-muted">—</span>
                                                )}
                                            </td>
                                            <td>
                                                {u.role === 'admin' ? (
                                                    <span className={`badge ${u.is_verified ? 'bg-green-500' : 'bg-yellow-500'}`}>
                                                        {u.is_verified ? 'Verified' : 'Pending'}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-muted">—</span>
                                                )}
                                            </td>
                                            <td>
                                                {(() => {
                                                    const accessStatus = getAccessStatus(u);
                                                    return (
                                                        <span className={`badge ${accessStatus.color}`} title={
                                                            u.active_window_start || u.active_window_end
                                                                ? `Access: ${u.active_window_start || 'No start'} to ${u.active_window_end || 'No end'}`
                                                                : 'Unlimited access'
                                                        }>
                                                            {accessStatus.label}
                                                        </span>
                                                    );
                                                })()}
                                            </td>
                                            <td className="text-xs text-muted">
                                                {u.last_login
                                                    ? new Date(u.last_login).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })
                                                    : <span style={{ color: '#d1d5db' }}>Never</span>}
                                            </td>
                                            <td>
                                                <div className="flex gap-2">
                                                    {u.role === 'admin' && !u.is_verified && (
                                                        <button className="btn-icon success" onClick={() => handleVerifyUser(u.id)} title="Verify admin">
                                                            <CheckCircle size={16} />
                                                        </button>
                                                    )}
                                                    <button className="btn-icon" onClick={() => openEditModal(u)} title="Edit User">
                                                        <Edit size={16} />
                                                    </button>
                                                    <button className="btn-icon" onClick={() => openFeatureModal(u)} title="Manage Features">
                                                        <Settings size={16} />
                                                    </button>
                                                    {u.id !== user?.id && (
                                                        <button className="btn-icon danger" onClick={() => handleDeleteUser(u.id)} title="Delete User">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ));
                                })()}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Add User Modal */}
            {showAddModal && (
                <div className="modal-overlay sysadmin-modal-overlay">
                    <div className="modal-content sysadmin-user-modal">
                        <div className="modal-header">
                            <div className="flex items-center gap-3">
                                <div className="sysadmin-modal-icon small">
                                    <UserPlus size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">Add New User</h2>
                                    <p className="text-sm text-muted">Create admin access and business details</p>
                                </div>
                            </div>
                            <button type="button" className="btn-icon" onClick={() => { setShowAddModal(false); setError(''); }}>
                                <X size={18} />
                            </button>
                        </div>
                        {error && (
                            <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded flex items-center gap-2">
                                <AlertCircle size={18} color="#dc2626" />
                                <span className="text-sm text-red-600">{error}</span>
                            </div>
                        )}
                        <form onSubmit={handleAddUser} className="modal-body">
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Username</label>
                                <input
                                    className="input"
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Business Name</label>
                                <input
                                    className="input"
                                    type="text"
                                    value={formData.business_name}
                                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Business Type</label>
                                <select
                                    className="input"
                                    value={formData.business_type}
                                    onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                                    required
                                >
                                    <option value="restaurant">Restaurant</option>
                                    <option value="retailer">Retailer</option>
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Business Address</label>
                                <textarea
                                    className="input"
                                    value={formData.business_address}
                                    onChange={(e) => setFormData({ ...formData, business_address: e.target.value })}
                                    rows="2"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Tax/VAT ID</label>
                                <input
                                    className="input"
                                    type="text"
                                    value={formData.tax_id}
                                    onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Global Tax Rate (%)</label>
                                <input
                                    className="input"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.tax_rate}
                                    onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                                />
                            </div>
                            <div className="row flex gap-4">
                                <div className="mb-4 flex-1">
                                    <label className="block text-sm font-medium mb-2">Full Name</label>
                                    <input
                                        className="input"
                                        type="text"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    />
                                </div>
                                <div className="mb-4 flex-1">
                                    <label className="block text-sm font-medium mb-2">Email</label>
                                    <input
                                        className="input"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Phone</label>
                                <input
                                    className="input"
                                    type="text"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">WhatsApp Business Number</label>
                                <input
                                    className="input"
                                    type="text"
                                    placeholder="+919876543210"
                                    value={formData.whatsapp_from_display}
                                    onChange={(e) => setFormData({ ...formData, whatsapp_from_display: e.target.value })}
                                />
                                <p className="text-xs text-muted mt-1">The number this admin will send invoices FROM (requires WhatsApp Business API credentials configured in Settings)</p>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Password</label>
                                <div className="relative">
                                    <input
                                        className="input"
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Role</label>
                                <select
                                    className="input"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="admin">Administrator</option>
                                    <option value="kitchen">Kitchen Staff</option>
                                    <option value="sysadmin">System Administrator</option>
                                </select>
                                {formData.role === 'kitchen' && (
                                    <p className="text-xs text-gray-500 mt-2">
                                        Kitchen staff can log in immediately with KOT and order status access.
                                    </p>
                                )}
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Subscription Status</label>
                                <select
                                    className="input"
                                    value={formData.subscription_status}
                                    onChange={(e) => setFormData({ ...formData, subscription_status: e.target.value })}
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="trial">Trial</option>
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Active Window (Login Access Period)</label>
                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                                        <input
                                            className="input"
                                            type="date"
                                            value={formData.active_window_start}
                                            onChange={(e) => setFormData({ ...formData, active_window_start: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs text-gray-500 mb-1">End Date</label>
                                        <input
                                            className="input"
                                            type="date"
                                            value={formData.active_window_end}
                                            onChange={(e) => setFormData({ ...formData, active_window_end: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Leave empty for unlimited access</p>
                            </div>
                            <p className="verification-note">
                                New admin accounts stay pending until you verify them from the user table.
                            </p>
                            <div className="flex gap-2">
                                <button type="submit" className="btn flex-1">Create User</button>
                                <button type="button" className="btn-secondary flex-1" onClick={() => { setShowAddModal(false); setError(''); }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {showEditModal && selectedUser && (
                <div className="modal-overlay sysadmin-modal-overlay">
                    <div className="modal-content sysadmin-edit-modal">
                        <div className="modal-header">
                            <div className="flex items-center gap-3">
                                <div className="sysadmin-modal-icon small">
                                    <Edit size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">Edit User Account</h2>
                                    <p className="text-sm text-gray-500">Update system access and business profile</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="btn-icon"
                                onClick={() => { setShowEditModal(false); setError(''); }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {error && (
                            <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded flex items-center gap-2">
                                <AlertCircle size={18} className="text-red-500" />
                                <span className="text-sm text-red-700">{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleUpdateUser} className="sysadmin-edit-form">
                            <div className="modal-body sysadmin-edit-body">

                            {/* Account Credentials */}
                            <div className="form-section">
                                <div className="form-section-header">
                                    <Shield size={18} className="text-indigo-600" />
                                    <h3 className="form-section-title">Account Credentials</h3>
                                    <span className="form-section-desc">Login & Access Control</span>
                                </div>
                                <div className="form-body">
                                    <div className="form-grid">
                                        <div>
                                            <label className="label-text">Username <span className="text-red-500">*</span></label>
                                            <input
                                                className="input"
                                                type="text"
                                                value={formData.username}
                                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="label-text">System Role</label>
                                            <select
                                                className="input"
                                                value={formData.role}
                                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                            >
                                                <option value="admin">Administrator</option>
                                                <option value="sysadmin">System Administrator</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="label-text">New Password</label>
                                            <div className="relative">
                                                <input
                                                    className="input pr-10"
                                                    type={showPassword ? 'text' : 'password'}
                                                    placeholder="••••••••"
                                                    value={formData.password}
                                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                />
                                                <button
                                                    type="button"
                                                    className="btn-icon password-toggle-btn"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                >
                                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                            <p className="input-helper">Leave empty to keep current password.</p>
                                        </div>
                                        <div>
                                            <label className="label-text">Subscription Status</label>
                                            <select
                                                className="input"
                                                value={formData.subscription_status}
                                                onChange={(e) => setFormData({ ...formData, subscription_status: e.target.value })}
                                            >
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                                <option value="trial">Trial Mode</option>
                                            </select>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="label-text">Active Window (Login Access Period)</label>
                                            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                                                <div style={{ flex: 1 }}>
                                                    <label className="text-xs text-gray-500" style={{ display: 'block', marginBottom: '4px' }}>Start Date</label>
                                                    <input
                                                        className="input"
                                                        type="date"
                                                        value={formData.active_window_start}
                                                        onChange={(e) => setFormData({ ...formData, active_window_start: e.target.value })}
                                                    />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <label className="text-xs text-gray-500" style={{ display: 'block', marginBottom: '4px' }}>End Date</label>
                                                    <input
                                                        className="input"
                                                        type="date"
                                                        value={formData.active_window_end}
                                                        onChange={(e) => setFormData({ ...formData, active_window_end: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <p className="input-helper">Leave empty for unlimited access. User can only login within this date range.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Business Profile */}
                            <div className="form-section">
                                <div className="form-section-header">
                                    <Users size={18} className="text-blue-600" />
                                    <h3 className="form-section-title">Business Profile</h3>
                                    <span className="form-section-desc">Entity Details</span>
                                </div>
                                <div className="form-body">
                                    <div className="form-grid">
                                        <div className="col-span-2">
                                            <label className="label-text">Business Name</label>
                                            <input
                                                className="input"
                                                type="text"
                                                value={formData.business_name}
                                                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                                                placeholder="e.g. Acme Corp"
                                            />
                                        </div>
                                        <div>
                                            <label className="label-text">Business Type</label>
                                            <select
                                                className="input"
                                                value={formData.business_type}
                                                onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                                                required
                                            >
                                                <option value="restaurant">Restaurant</option>
                                                <option value="retailer">Retailer</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="label-text">Tax / VAT ID</label>
                                            <input
                                                className="input"
                                                type="text"
                                                value={formData.tax_id}
                                                onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                                                placeholder="Tax Identification Number"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="label-text">Business Address</label>
                                            <textarea
                                                className="input"
                                                rows="2"
                                                value={formData.business_address}
                                                onChange={(e) => setFormData({ ...formData, business_address: e.target.value })}
                                                placeholder="Full street address"
                                            />
                                        </div>
                                        <div>
                                            <label className="label-text">Global Tax Rate (%)</label>
                                            <div className="relative">
                                                <input
                                                    className="input pr-8"
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    step="0.01"
                                                    value={formData.tax_rate}
                                                    onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                                                />
                                                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Details */}
                            <div className="form-section" style={{ marginBottom: 0 }}>
                                <div className="form-section-header">
                                    <Users size={18} className="text-green-600" />
                                    <h3 className="form-section-title">Contact Details</h3>
                                    <span className="form-section-desc">Primary Contact</span>
                                </div>
                                <div className="form-body">
                                    <div className="form-grid thirds">
                                        <div>
                                            <label className="label-text">Full Name</label>
                                            <input
                                                className="input"
                                                type="text"
                                                value={formData.full_name}
                                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                                placeholder="Contact Person"
                                            />
                                        </div>
                                        <div>
                                            <label className="label-text">Email Address</label>
                                            <input
                                                className="input"
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                placeholder="contact@email.com"
                                            />
                                        </div>
                                        <div>
                                            <label className="label-text">Phone Number</label>
                                            <input
                                                className="input"
                                                type="text"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                placeholder="+1 (555) 000-0000"
                                            />
                                        </div>
                                        <div>
                                            <label className="label-text">WhatsApp Business Number</label>
                                            <input
                                                className="input"
                                                type="text"
                                                value={formData.whatsapp_from_display}
                                                onChange={(e) => setFormData({ ...formData, whatsapp_from_display: e.target.value })}
                                                placeholder="+919876543210"
                                            />
                                            <p className="input-helper">Display number for WhatsApp Business API</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            </div>

                            <div className="modal-footer justify-end">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => { setShowEditModal(false); setError(''); }}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn">
                                    <Edit size={16} />
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <FeatureManagementModal
                isOpen={showFeatureModal}
                userId={featureUser?.id}
                userName={featureUser?.username}
                userBusinessType={featureUser?.business_type}
                onClose={closeFeatureModal}
                onSave={fetchUsers}
            />
        </div>
    );
};

export default AdminManagement;
