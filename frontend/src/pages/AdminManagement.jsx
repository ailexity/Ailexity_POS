import React, { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, Edit, Trash2, Shield, Eye, EyeOff, AlertCircle, Search } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import PageLoader from '../components/PageLoader';

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
        active_window_end: ''
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
                active_window_end: ''
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
                active_window_end: ''
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
            active_window_end: user.active_window_end || ''
        });
        setShowEditModal(true);
        setError('');
    };

    if (loading) {
        return (
            <div className="page-container with-mobile-header-offset">
                <PageLoader message="Loading administrators..." />
            </div>
        );
    }

    return (
        <div className="page-container with-mobile-header-offset">
            {/* System Password Protection Modal */}
            {showPasswordPrompt && (
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
                    zIndex: 9999
                }}>
                    <div className="card" style={{ 
                        width: '90%', 
                        maxWidth: '400px',
                        padding: '2rem'
                    }}>
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-purple-100 flex items-center justify-center rounded-full mx-auto mb-4">
                                <Shield size={32} className="text-purple-600" />
                            </div>
                            <h2 className="text-xl font-bold mb-2">Admin Controls Access</h2>
                            <p className="text-sm text-muted">Enter system password to continue</p>
                        </div>

                        <form onSubmit={handleSystemPasswordSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">System Password</label>
                                <input
                                    type="password"
                                    className="input-field"
                                    value={systemPassword}
                                    onChange={(e) => setSystemPassword(e.target.value)}
                                    placeholder="Enter system password"
                                    autoFocus
                                    required
                                />
                            </div>

                            {passwordError && (
                                <div className="p-3 mb-4 bg-red-50 text-red-700 rounded text-sm flex items-center gap-2">
                                    <AlertCircle size={16} />
                                    {passwordError}
                                </div>
                            )}

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
                                className="btn btn-secondary w-full mt-2"
                            >
                                Cancel
                            </button>
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
                                    <th>ID</th>
                                    <th>Username</th>
                                    <th>Business Name</th>
                                    <th>Role</th>
                                    <th>Subscription</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.filter(u => {
                                    if (!searchQuery) return true; // Show all if no search query
                                    const query = searchQuery.toLowerCase();
                                    return (
                                        (u.username && u.username.toLowerCase().includes(query)) ||
                                        (u.business_name && u.business_name.toLowerCase().includes(query)) ||
                                        (u.email && u.email.toLowerCase().includes(query)) ||
                                        (u.phone && u.phone.toLowerCase().includes(query)) ||
                                        (u.id && u.id.toString().includes(query)) ||
                                        (u.role && u.role.toLowerCase().includes(query))
                                    );
                                }).map(u => (
                                    <tr key={u.id}>
                                        <td>{u.id}</td>
                                        <td className="font-medium">
                                            {u.username}
                                            <div className="text-xs text-muted">{u.phone || ''}</div>
                                        </td>
                                        <td>{u.business_name || '-'}</td>
                                        <td>
                                            <span className={`badge ${u.role === 'admin' ? 'bg-blue-500' : 'bg-purple-500'}`}>
                                                {u.role === 'admin' ? 'Admin' : 'System Admin'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${u.subscription_status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}>
                                                {u.subscription_status || 'active'}
                                            </span>
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
                                        <td>
                                            <div className="flex gap-2">
                                                <button
                                                    className="btn-icon"
                                                    onClick={() => openEditModal(u)}
                                                    title="Edit User"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                {u.id !== user?.id && (
                                                    <button
                                                        className="btn-icon danger"
                                                        onClick={() => handleDeleteUser(u.id)}
                                                        title="Delete User"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {searchQuery && users.filter(u => {
                                    const query = searchQuery.toLowerCase();
                                    return (
                                        (u.username && u.username.toLowerCase().includes(query)) ||
                                        (u.business_name && u.business_name.toLowerCase().includes(query)) ||
                                        (u.email && u.email.toLowerCase().includes(query)) ||
                                        (u.phone && u.phone.toLowerCase().includes(query)) ||
                                        (u.id && u.id.toString().includes(query)) ||
                                        (u.role && u.role.toLowerCase().includes(query))
                                    );
                                }).length === 0 && (
                                        <tr>
                                            <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                                    <Search size={32} style={{ opacity: 0.3 }} />
                                                    <p>No users found matching "{searchQuery}"</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Add User Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="card max-w-lg w-full">
                        <h2 className="mb-4">Add New User</h2>
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded flex items-center gap-2">
                                <AlertCircle size={18} color="#dc2626" />
                                <span className="text-sm text-red-600">{error}</span>
                            </div>
                        )}
                        <form onSubmit={handleAddUser}>
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
                                    <option value="sysadmin">System Administrator</option>
                                </select>
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
                <div className="fixed inset-0 bg-black-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full flex flex-col" style={{ maxHeight: '90vh' }}>
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0 bg-white rounded-t-xl">
                            <div className="flex items-center gap-3">
                                <div className="bg-indigo-50 p-2 rounded-lg">
                                    <Shield size={24} className="text-indigo-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Edit User Account</h2>
                                    <p className="text-sm text-gray-500">Update system access and business profile</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition-all"
                                onClick={() => { setShowEditModal(false); setError(''); }}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {error && (
                            <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded flex items-center gap-2">
                                <AlertCircle size={18} className="text-red-500" />
                                <span className="text-sm text-red-700">{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleUpdateUser} className="flex-1 overflow-y-auto p-6 bg-gray-50-50">

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
                                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                                    </div>
                                </div>
                            </div>

                        </form>

                        {/* Footer Actions */}
                        <div className="p-4 border-t border-gray-200 bg-white rounded-b-xl flex gap-3 justify-end flex-shrink-0">
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => { setShowEditModal(false); setError(''); }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                onClick={handleUpdateUser} /* Trigger form submit via button click if needed, or rely on form submit */
                                className="btn"
                            >
                                <Edit size={16} />
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminManagement;
