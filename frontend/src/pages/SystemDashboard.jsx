import React, { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Users, Activity, TrendingUp, DollarSign, ShoppingCart, Package, BarChart3, Shield, UserPlus, AlertCircle, Eye, EyeOff, Search, Settings, Lock, Save, Database, Globe, MessageCircle } from 'lucide-react';
import PageLoader from '../components/PageLoader';

const normalizeBusinessType = (businessType) => {
    const value = String(businessType || '').trim().toLowerCase();
    if (value.includes('retail')) return 'retailer';
    if (value.includes('restaurant')) return 'restaurant';
    return '';
};

const SystemDashboard = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalAdmins: 0,
        totalSysAdmins: 0,
        totalInvoices: 0,
        totalRevenue: 0,
        totalItems: 0,
        recentActivity: []
    });
    const [users, setUsers] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedUser, setExpandedUser] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [activeView, setActiveView] = useState('overview'); // 'overview' or 'settings'
    const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
    const [systemPassword, setSystemPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    
    // System Settings State
    const [systemPasswordData, setSystemPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [loginPasswordData, setLoginPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [showSystemPassword, setShowSystemPassword] = useState(false);
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [systemMessage, setSystemMessage] = useState({ type: '', text: '' });
    const [loginMessage, setLoginMessage] = useState({ type: '', text: '' });
    const [systemConfig, setSystemConfig] = useState({
        max_users: 100,
        session_timeout: 30,
        enable_notifications: true,
        maintenance_mode: false,
        backup_enabled: true,
        backup_frequency: 'daily'
    });
    
    // WhatsApp Template State
    const [whatsappTemplate, setWhatsappTemplate] = useState({
        greeting: 'Dear {customer_name},',
        thank_you: 'Thank you for your recent order at {business_name}!\nYour invoice is now available. 🪄',
        closing: 'Loved your experience? Or something to improve? Tap to tell us! 🌟',
        show_invoice_link: true,
        show_date: true,
        show_total: true
    });
    const [whatsappMessage, setWhatsappMessage] = useState({ type: '', text: '' });
    
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
        enable_order_management: false
    });
    const { user } = useAuth();
    const navigate = useNavigate();

    // Security: Redirect if not sysadmin
    useEffect(() => {
        if (user && user.role !== 'sysadmin') {
            navigate('/');
        }
    }, [user, navigate]);

    useEffect(() => {
        fetchSystemStats();

        // Auto-refresh every 30 seconds
        const interval = setInterval(() => {
            fetchSystemStats();
        }, 30000);

        // Cleanup interval on unmount
        return () => clearInterval(interval);
    }, []);

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordError('');
        
        try {
            await api.post('/system/verify-password', {
                password: systemPassword
            });
            setShowPasswordPrompt(false);
            setActiveView('settings');
            setSystemPassword('');
            setPasswordError('');
        } catch (err) {
            setPasswordError(err.response?.data?.detail || 'Incorrect password');
        }
    };

    const handleSystemPasswordChange = async (e) => {
        e.preventDefault();
        setSystemMessage({ type: '', text: '' });

        if (systemPasswordData.new_password !== systemPasswordData.confirm_password) {
            setSystemMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        if (systemPasswordData.new_password.length < 6) {
            setSystemMessage({ type: 'error', text: 'Password must be at least 6 characters' });
            return;
        }

        try {
            await api.post('/system/change-internal-password', {
                current_password: systemPasswordData.current_password,
                new_password: systemPasswordData.new_password
            });
            setSystemMessage({ type: 'success', text: 'Internal system password updated successfully!' });
            setSystemPasswordData({
                current_password: '',
                new_password: '',
                confirm_password: ''
            });
            setTimeout(() => setSystemMessage({ type: '', text: '' }), 3000);
        } catch (err) {
            console.error(err);
            setSystemMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to update internal password' });
        }
    };

    const handleLoginPasswordChange = async (e) => {
        e.preventDefault();
        setLoginMessage({ type: '', text: '' });

        if (loginPasswordData.new_password !== loginPasswordData.confirm_password) {
            setLoginMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        if (loginPasswordData.new_password.length < 6) {
            setLoginMessage({ type: 'error', text: 'Password must be at least 6 characters' });
            return;
        }

        try {
            await api.post('/system/change-login-password', {
                current_password: loginPasswordData.current_password,
                new_password: loginPasswordData.new_password
            });
            setLoginMessage({ type: 'success', text: 'Sysadmin login password updated successfully!' });
            setLoginPasswordData({
                current_password: '',
                new_password: '',
                confirm_password: ''
            });
            setTimeout(() => setLoginMessage({ type: '', text: '' }), 3000);
        } catch (err) {
            console.error(err);
            setLoginMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to update login password' });
        }
    };

    const handleSystemConfigSave = async () => {
        setSystemMessage({ type: '', text: '' });
        try {
            // Here you would save to backend - for now just show success
            setSystemMessage({ type: 'success', text: 'System configuration saved successfully!' });
            setTimeout(() => setSystemMessage({ type: '', text: '' }), 3000);
        } catch (err) {
            setSystemMessage({ type: 'error', text: 'Failed to save system configuration' });
        }
    };

    const handleWhatsappTemplateSave = async () => {
        setWhatsappMessage({ type: '', text: '' });
        try {
            // Save to localStorage for now (can be moved to backend later)
            localStorage.setItem('whatsapp_template', JSON.stringify(whatsappTemplate));
            setWhatsappMessage({ type: 'success', text: 'WhatsApp template saved successfully!' });
            setTimeout(() => setWhatsappMessage({ type: '', text: '' }), 3000);
        } catch (err) {
            setWhatsappMessage({ type: 'error', text: 'Failed to save WhatsApp template' });
        }
    };

    const resetWhatsappTemplate = () => {
        setWhatsappTemplate({
            greeting: 'Dear {customer_name},',
            thank_you: 'Thank you for your recent order at {business_name}!\nYour invoice is now available. 🪄',
            closing: 'Loved your experience? Or something to improve? Tap to tell us! 🌟',
            show_invoice_link: true,
            show_date: true,
            show_total: true
        });
        setWhatsappMessage({ type: 'success', text: 'Template reset to default!' });
        setTimeout(() => setWhatsappMessage({ type: '', text: '' }), 3000);
    };

    // Load WhatsApp template from localStorage on mount
    useEffect(() => {
        const savedTemplate = localStorage.getItem('whatsapp_template');
        if (savedTemplate) {
            try {
                setWhatsappTemplate(JSON.parse(savedTemplate));
            } catch (e) {
                console.error('Error loading WhatsApp template:', e);
            }
        }
    }, []);

    const handleAddUser = async (e) => {
        e.preventDefault();
        console.log('Create User button clicked');
        console.log('Form Data:', formData);
        setError('');
        setLoading(true);
        try {
            const normalizedBusinessType = normalizeBusinessType(formData.business_type);
            if ((formData.role || 'admin') !== 'sysadmin' && !normalizedBusinessType) {
                setError('Business type must be Restaurant or Retailer');
                setLoading(false);
                return;
            }

            // Build API payload: required fields + optional only if non-empty; coerce numbers
            const payload = {
                username: formData.username?.trim() || '',
                password: formData.password || '',
                role: formData.role || 'admin',
                business_name: formData.business_name?.trim() || null,
                phone: formData.phone?.trim() || null,
                email: formData.email?.trim() || null,
                full_name: formData.full_name?.trim() || null,
                business_address: formData.business_address?.trim() || null,
                business_type: normalizedBusinessType || null,
                tax_id: formData.tax_id?.trim() || null,
                tax_rate: formData.tax_rate === '' || formData.tax_rate == null ? 0 : Number(formData.tax_rate),
                subscription_status: formData.subscription_status || 'active'
            };
            console.log('Sending request to create user...');
            const response = await api.post('/users/', payload);
            console.log('User created successfully:', response.data);
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
                subscription_status: 'active'
            });
            fetchSystemStats();
        } catch (err) {
            console.error('Error creating user:', err);
            console.error('Error response:', err.response);
            setError(err.response?.data?.detail || 'Failed to create user');
        } finally {
            setLoading(false);
        }
    };

    const handleEditUser = (user) => {
        setEditingUser({
            ...user,
            password: '', // Don't populate password
            enable_multi_device_sync: user.enable_multi_device_sync || false,
            enable_order_management: user.enable_order_management || false
        });
        setShowEditModal(true);
        setError('');
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const normalizedBusinessType = normalizeBusinessType(editingUser.business_type);
            if ((editingUser.role || 'admin') !== 'sysadmin' && !normalizedBusinessType) {
                setError('Business type must be Restaurant or Retailer');
                setLoading(false);
                return;
            }

            const payload = {
                username: editingUser.username?.trim() || '',
                password: editingUser.password || '', // Only send if changed
                role: editingUser.role || 'admin',
                business_name: editingUser.business_name?.trim() || null,
                phone: editingUser.phone?.trim() || null,
                email: editingUser.email?.trim() || null,
                full_name: editingUser.full_name?.trim() || null,
                business_address: editingUser.business_address?.trim() || null,
                business_type: normalizedBusinessType || null,
                tax_id: editingUser.tax_id?.trim() || null,
                tax_rate: editingUser.tax_rate === '' || editingUser.tax_rate == null ? 0 : Number(editingUser.tax_rate),
                subscription_status: editingUser.subscription_status || 'active',
                enable_multi_device_sync: editingUser.enable_multi_device_sync || false,
                enable_order_management: editingUser.enable_order_management || false
            };
            
            await api.put(`/users/${editingUser.id}`, payload);
            setShowEditModal(false);
            setEditingUser(null);
            fetchSystemStats();
        } catch (err) {
            console.error('Error updating user:', err);
            setError(err.response?.data?.detail || 'Failed to update user');
        } finally {
            setLoading(false);
        }
    };

    const fetchSystemStats = async () => {
        try {
            // Fetch users
            const usersRes = await api.get('/users/');
            const usersData = usersRes.data;

            // Fetch invoices
            const invoicesRes = await api.get('/invoices/');
            const invoicesData = Array.isArray(invoicesRes.data) ? invoicesRes.data : [];

            // Fetch items
            const itemsRes = await api.get('/items/');
            const itemsData = Array.isArray(itemsRes.data) ? itemsRes.data : [];

            // Calculate per-admin statistics
            const usersWithStats = usersData.map(u => {
                if (u.role === 'admin') {
                    // Calculate revenue for this admin
                    const adminInvoices = invoicesData.filter(inv => inv.admin_id === u.id);
                    const adminRevenue = adminInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
                    const adminItems = itemsData.filter(item => item.admin_id === u.id);

                    return {
                        ...u,
                        totalRevenue: adminRevenue,
                        totalInvoices: adminInvoices.length,
                        totalItems: adminItems.length
                    };
                }
                return {
                    ...u,
                    totalRevenue: 0,
                    totalInvoices: 0,
                    totalItems: 0
                };
            });

            setUsers(usersWithStats);

            // Calculate overall stats
            const totalRevenue = invoicesData.reduce((sum, inv) => sum + inv.total_amount, 0);
            const totalAdmins = usersData.filter(u => u.role === 'admin').length;
            const totalSysAdmins = usersData.filter(u => u.role === 'sysadmin').length;

            setStats({
                totalUsers: usersData.length,
                totalAdmins: totalAdmins,
                totalSysAdmins: totalSysAdmins,
                totalInvoices: invoicesData.length,
                totalRevenue: totalRevenue,
                totalItems: itemsData.length,
                recentActivity: invoicesData.slice(0, 10) // Already sorted newest first from backend
            });

            setLoading(false);
        } catch (err) {
            console.error('Error fetching system stats:', err);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="page-container with-mobile-header-offset">
                <PageLoader message="Loading system statistics..." />
            </div>
        );
    }

    return (
        <div className="page-container with-mobile-header-offset">
            {/* Header */}
            <div className="header-section">
                <div className="flex items-center gap-3">
                    <div style={{ width: '40px', height: '40px', background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <BarChart3 size={24} color="white" />
                    </div>
                    <div>
                        <h1>System Dashboard</h1>
                        <p className="text-muted text-sm">Overview of all system activities and users</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                        className="btn" 
                        style={{ 
                            background: activeView === 'settings' ? '#6366f1' : 'white',
                            color: activeView === 'settings' ? 'white' : '#6366f1',
                            border: '1px solid #6366f1'
                        }}
                        onClick={() => {
                            setShowPasswordPrompt(true);
                            setPasswordError('');
                            setSystemPassword('');
                        }}
                    >
                        <Settings size={18} />
                        System Settings
                    </button>
                    {activeView === 'overview' && (
                        <button className="btn" onClick={() => { setShowAddModal(true); setError(''); }}>
                            <UserPlus size={18} />
                            Add New User
                        </button>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="content-area">
                {activeView === 'settings' ? (
                    /* System Settings View */
                    <div>
                        {systemMessage.text && (
                            <div className={`mb-6 p-4 rounded-lg ${systemMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                {systemMessage.text}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                            <button 
                                className="btn" 
                                style={{ background: 'white', color: '#6366f1', border: '1px solid #6366f1' }}
                                onClick={() => setActiveView('overview')}
                            >
                                ← Back to Overview
                            </button>
                        </div>

                        {/* System Password Section */}
                        <div className="card mb-6">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                <div style={{ width: '40px', height: '40px', background: '#fef3c7', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Lock size={20} color="#f59e0b" />
                                </div>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Internal System Password</h2>
                                    <p className="text-muted text-sm">Password for accessing system settings and admin controls (Default: 9561587176)</p>
                                </div>
                            </div>

                            {systemMessage.text && (
                                <div className={`mb-4 p-3 rounded-lg ${systemMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                    {systemMessage.text}
                                </div>
                            )}

                            <form onSubmit={handleSystemPasswordChange}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', maxWidth: '900px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '8px' }}>Current Internal Password *</label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type={showSystemPassword ? "text" : "password"}
                                                className="input"
                                                style={{ width: '100%', paddingRight: '40px' }}
                                                value={systemPasswordData.current_password}
                                                onChange={e => setSystemPasswordData({ ...systemPasswordData, current_password: e.target.value })}
                                                required
                                                placeholder="Enter current internal password"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '8px' }}>New Internal Password *</label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type={showSystemPassword ? "text" : "password"}
                                                className="input"
                                                style={{ width: '100%', paddingRight: '40px' }}
                                                value={systemPasswordData.new_password}
                                                onChange={e => setSystemPasswordData({ ...systemPasswordData, new_password: e.target.value })}
                                                required
                                                placeholder="Enter new internal password"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '8px' }}>Confirm New Internal Password *</label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type={showSystemPassword ? "text" : "password"}
                                                className="input"
                                                style={{ width: '100%', paddingRight: '40px' }}
                                                value={systemPasswordData.confirm_password}
                                                onChange={e => setSystemPasswordData({ ...systemPasswordData, confirm_password: e.target.value })}
                                                required
                                                placeholder="Confirm new internal password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowSystemPassword(!showSystemPassword)}
                                                style={{
                                                    position: 'absolute',
                                                    right: '12px',
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    color: '#94a3b8'
                                                }}
                                            >
                                                {showSystemPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
                                    <button
                                        type="submit"
                                        className="btn"
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                    >
                                        <Save size={16} />
                                        Update Internal Password
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Sysadmin Login Password Section */}
                        <div className="card mb-6">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                <div style={{ width: '40px', height: '40px', background: '#ddd6fe', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Shield size={20} color="#7c3aed" />
                                </div>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Sysadmin Login Password</h2>
                                    <p className="text-muted text-sm">Password used to login as sysadmin user (Default: sysadmin123)</p>
                                </div>
                            </div>

                            {loginMessage.text && (
                                <div className={`mb-4 p-3 rounded-lg ${loginMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                    {loginMessage.text}
                                </div>
                            )}

                            <form onSubmit={handleLoginPasswordChange}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', maxWidth: '900px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '8px' }}>Current Login Password *</label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type={showLoginPassword ? "text" : "password"}
                                                className="input"
                                                style={{ width: '100%', paddingRight: '40px' }}
                                                value={loginPasswordData.current_password}
                                                onChange={e => setLoginPasswordData({ ...loginPasswordData, current_password: e.target.value })}
                                                required
                                                placeholder="Enter current login password"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '8px' }}>New Login Password *</label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type={showLoginPassword ? "text" : "password"}
                                                className="input"
                                                style={{ width: '100%', paddingRight: '40px' }}
                                                value={loginPasswordData.new_password}
                                                onChange={e => setLoginPasswordData({ ...loginPasswordData, new_password: e.target.value })}
                                                required
                                                placeholder="Enter new login password"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '8px' }}>Confirm New Login Password *</label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type={showLoginPassword ? "text" : "password"}
                                                className="input"
                                                style={{ width: '100%', paddingRight: '40px' }}
                                                value={loginPasswordData.confirm_password}
                                                onChange={e => setLoginPasswordData({ ...loginPasswordData, confirm_password: e.target.value })}
                                                required
                                                placeholder="Confirm new login password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowLoginPassword(!showLoginPassword)}
                                                style={{
                                                    position: 'absolute',
                                                    right: '12px',
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    color: '#94a3b8'
                                                }}
                                            >
                                                {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
                                    <button
                                        type="submit"
                                        className="btn"
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#7c3aed' }}
                                    >
                                        <Save size={16} />
                                        Update Login Password
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* System Configuration Section */}
                        <div className="card mb-6">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                <div style={{ width: '40px', height: '40px', background: '#dbeafe', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Settings size={20} color="#3b82f6" />
                                </div>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>System Configuration</h2>
                                    <p className="text-muted text-sm">Global system settings and parameters</p>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gap: '24px', maxWidth: '900px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '8px' }}>Maximum Users</label>
                                        <input
                                            type="number"
                                            className="input"
                                            style={{ width: '100%' }}
                                            value={systemConfig.max_users}
                                            onChange={e => setSystemConfig({ ...systemConfig, max_users: parseInt(e.target.value) })}
                                            min="1"
                                        />
                                        <p className="text-muted text-xs mt-1">Maximum number of users allowed in the system</p>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '8px' }}>Session Timeout (minutes)</label>
                                        <input
                                            type="number"
                                            className="input"
                                            style={{ width: '100%' }}
                                            value={systemConfig.session_timeout}
                                            onChange={e => setSystemConfig({ ...systemConfig, session_timeout: parseInt(e.target.value) })}
                                            min="5"
                                        />
                                        <p className="text-muted text-xs mt-1">Auto-logout after inactivity</p>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '8px' }}>Backup Frequency</label>
                                        <select
                                            className="input"
                                            style={{ width: '100%' }}
                                            value={systemConfig.backup_frequency}
                                            onChange={e => setSystemConfig({ ...systemConfig, backup_frequency: e.target.value })}
                                        >
                                            <option value="hourly">Hourly</option>
                                            <option value="daily">Daily</option>
                                            <option value="weekly">Weekly</option>
                                            <option value="monthly">Monthly</option>
                                        </select>
                                        <p className="text-muted text-xs mt-1">Automatic database backup schedule</p>
                                    </div>
                                </div>

                                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#1e293b' }}>System Features</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: '6px' }}>
                                            <div>
                                                <p style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b', marginBottom: '2px' }}>System Notifications</p>
                                                <p className="text-muted text-xs">Enable system-wide notifications</p>
                                            </div>
                                            <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '24px' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={systemConfig.enable_notifications}
                                                    onChange={e => setSystemConfig({ ...systemConfig, enable_notifications: e.target.checked })}
                                                    style={{ opacity: 0, width: 0, height: 0 }}
                                                />
                                                <span style={{
                                                    position: 'absolute',
                                                    cursor: 'pointer',
                                                    top: 0,
                                                    left: 0,
                                                    right: 0,
                                                    bottom: 0,
                                                    backgroundColor: systemConfig.enable_notifications ? '#6366f1' : '#cbd5e1',
                                                    transition: '0.3s',
                                                    borderRadius: '24px'
                                                }}>
                                                    <span style={{
                                                        position: 'absolute',
                                                        content: '',
                                                        height: '18px',
                                                        width: '18px',
                                                        left: systemConfig.enable_notifications ? '28px' : '3px',
                                                        bottom: '3px',
                                                        backgroundColor: 'white',
                                                        transition: '0.3s',
                                                        borderRadius: '50%'
                                                    }}></span>
                                                </span>
                                            </label>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: '6px' }}>
                                            <div>
                                                <p style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b', marginBottom: '2px' }}>Automatic Backups</p>
                                                <p className="text-muted text-xs">Enable automatic database backups</p>
                                            </div>
                                            <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '24px' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={systemConfig.backup_enabled}
                                                    onChange={e => setSystemConfig({ ...systemConfig, backup_enabled: e.target.checked })}
                                                    style={{ opacity: 0, width: 0, height: 0 }}
                                                />
                                                <span style={{
                                                    position: 'absolute',
                                                    cursor: 'pointer',
                                                    top: 0,
                                                    left: 0,
                                                    right: 0,
                                                    bottom: 0,
                                                    backgroundColor: systemConfig.backup_enabled ? '#6366f1' : '#cbd5e1',
                                                    transition: '0.3s',
                                                    borderRadius: '24px'
                                                }}>
                                                    <span style={{
                                                        position: 'absolute',
                                                        content: '',
                                                        height: '18px',
                                                        width: '18px',
                                                        left: systemConfig.backup_enabled ? '28px' : '3px',
                                                        bottom: '3px',
                                                        backgroundColor: 'white',
                                                        transition: '0.3s',
                                                        borderRadius: '50%'
                                                    }}></span>
                                                </span>
                                            </label>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#fef2f2', borderRadius: '6px', border: '1px solid #fee2e2' }}>
                                            <div>
                                                <p style={{ fontSize: '14px', fontWeight: '500', color: '#991b1b', marginBottom: '2px' }}>Maintenance Mode</p>
                                                <p className="text-muted text-xs">System unavailable for all users except sysadmin</p>
                                            </div>
                                            <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '24px' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={systemConfig.maintenance_mode}
                                                    onChange={e => setSystemConfig({ ...systemConfig, maintenance_mode: e.target.checked })}
                                                    style={{ opacity: 0, width: 0, height: 0 }}
                                                />
                                                <span style={{
                                                    position: 'absolute',
                                                    cursor: 'pointer',
                                                    top: 0,
                                                    left: 0,
                                                    right: 0,
                                                    bottom: 0,
                                                    backgroundColor: systemConfig.maintenance_mode ? '#ef4444' : '#cbd5e1',
                                                    transition: '0.3s',
                                                    borderRadius: '24px'
                                                }}>
                                                    <span style={{
                                                        position: 'absolute',
                                                        content: '',
                                                        height: '18px',
                                                        width: '18px',
                                                        left: systemConfig.maintenance_mode ? '28px' : '3px',
                                                        bottom: '3px',
                                                        backgroundColor: 'white',
                                                        transition: '0.3s',
                                                        borderRadius: '50%'
                                                    }}></span>
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={handleSystemConfigSave}
                                    className="btn"
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                    <Save size={16} />
                                    Save Configuration
                                </button>
                            </div>
                        </div>

                        {/* Database Management Section */}
                        <div className="card">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                <div style={{ width: '40px', height: '40px', background: '#dcfce7', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Database size={20} color="#16a34a" />
                                </div>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Database Management</h2>
                                    <p className="text-muted text-sm">Backup and maintenance operations</p>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                                <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#1e293b' }}>Create Backup</h4>
                                    <p className="text-muted text-xs mb-3">Generate a full database backup</p>
                                    <button className="btn" style={{ width: '100%', fontSize: '13px', padding: '8px' }}>Backup Now</button>
                                </div>

                                <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#1e293b' }}>Database Stats</h4>
                                    <p className="text-muted text-xs mb-1">Total Users: {stats.totalUsers}</p>
                                    <p className="text-muted text-xs mb-1">Total Invoices: {stats.totalInvoices}</p>
                                    <p className="text-muted text-xs">Total Items: {stats.totalItems}</p>
                                </div>

                                <div style={{ padding: '20px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fee2e2' }}>
                                    <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#991b1b' }}>Optimize Database</h4>
                                    <p className="text-muted text-xs mb-3">Clean and optimize database</p>
                                    <button className="btn" style={{ width: '100%', fontSize: '13px', padding: '8px', background: '#ef4444' }}>Optimize</button>
                                </div>
                            </div>
                        </div>

                        {/* WhatsApp Message Template Section */}
                        <div className="card mb-6">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                <div style={{ width: '40px', height: '40px', background: '#dcfce7', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <MessageCircle size={20} color="#25D366" />
                                </div>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>WhatsApp Message Template</h2>
                                    <p className="text-muted text-sm">Customize the invoice message sent via WhatsApp</p>
                                </div>
                            </div>

                            {whatsappMessage.text && (
                                <div className={`mb-4 p-3 rounded-lg ${whatsappMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                    {whatsappMessage.text}
                                </div>
                            )}

                            <div style={{ display: 'grid', gap: '20px', maxWidth: '900px' }}>
                                {/* Template Fields */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '8px' }}>Greeting Message</label>
                                        <input
                                            type="text"
                                            className="input"
                                            style={{ width: '100%' }}
                                            value={whatsappTemplate.greeting}
                                            onChange={e => setWhatsappTemplate({ ...whatsappTemplate, greeting: e.target.value })}
                                            placeholder="Dear {customer_name},"
                                        />
                                        <p className="text-muted text-xs mt-1">Use {'{customer_name}'} as placeholder</p>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '8px' }}>Thank You Message</label>
                                        <textarea
                                            className="input"
                                            style={{ width: '100%', minHeight: '80px', resize: 'vertical' }}
                                            value={whatsappTemplate.thank_you}
                                            onChange={e => setWhatsappTemplate({ ...whatsappTemplate, thank_you: e.target.value })}
                                            placeholder="Thank you for your recent order at {business_name}!&#10;Your invoice is now available. 🪄"
                                        />
                                        <p className="text-muted text-xs mt-1">Use {'{business_name}'} as placeholder</p>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '8px' }}>Closing Message</label>
                                    <input
                                        type="text"
                                        className="input"
                                        style={{ width: '100%' }}
                                        value={whatsappTemplate.closing}
                                        onChange={e => setWhatsappTemplate({ ...whatsappTemplate, closing: e.target.value })}
                                        placeholder="Loved your experience? Or something to improve? Tap to tell us! 🌟"
                                    />
                                </div>

                                {/* Toggle Options */}
                                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#1e293b' }}>Message Options</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: '6px' }}>
                                            <div>
                                                <p style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b', marginBottom: '2px' }}>Show Invoice Link</p>
                                                <p className="text-muted text-xs">Include clickable link to view invoice</p>
                                            </div>
                                            <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '24px' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={whatsappTemplate.show_invoice_link}
                                                    onChange={e => setWhatsappTemplate({ ...whatsappTemplate, show_invoice_link: e.target.checked })}
                                                    style={{ opacity: 0, width: 0, height: 0 }}
                                                />
                                                <span style={{
                                                    position: 'absolute',
                                                    cursor: 'pointer',
                                                    top: 0,
                                                    left: 0,
                                                    right: 0,
                                                    bottom: 0,
                                                    backgroundColor: whatsappTemplate.show_invoice_link ? '#25D366' : '#cbd5e1',
                                                    transition: '0.3s',
                                                    borderRadius: '24px'
                                                }}>
                                                    <span style={{
                                                        position: 'absolute',
                                                        content: '',
                                                        height: '18px',
                                                        width: '18px',
                                                        left: whatsappTemplate.show_invoice_link ? '28px' : '3px',
                                                        bottom: '3px',
                                                        backgroundColor: 'white',
                                                        transition: '0.3s',
                                                        borderRadius: '50%'
                                                    }}></span>
                                                </span>
                                            </label>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: '6px' }}>
                                            <div>
                                                <p style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b', marginBottom: '2px' }}>Show Date</p>
                                                <p className="text-muted text-xs">Include invoice date in message</p>
                                            </div>
                                            <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '24px' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={whatsappTemplate.show_date}
                                                    onChange={e => setWhatsappTemplate({ ...whatsappTemplate, show_date: e.target.checked })}
                                                    style={{ opacity: 0, width: 0, height: 0 }}
                                                />
                                                <span style={{
                                                    position: 'absolute',
                                                    cursor: 'pointer',
                                                    top: 0,
                                                    left: 0,
                                                    right: 0,
                                                    bottom: 0,
                                                    backgroundColor: whatsappTemplate.show_date ? '#25D366' : '#cbd5e1',
                                                    transition: '0.3s',
                                                    borderRadius: '24px'
                                                }}>
                                                    <span style={{
                                                        position: 'absolute',
                                                        content: '',
                                                        height: '18px',
                                                        width: '18px',
                                                        left: whatsappTemplate.show_date ? '28px' : '3px',
                                                        bottom: '3px',
                                                        backgroundColor: 'white',
                                                        transition: '0.3s',
                                                        borderRadius: '50%'
                                                    }}></span>
                                                </span>
                                            </label>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: '6px' }}>
                                            <div>
                                                <p style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b', marginBottom: '2px' }}>Show Total Amount</p>
                                                <p className="text-muted text-xs">Include total amount in message</p>
                                            </div>
                                            <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '24px' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={whatsappTemplate.show_total}
                                                    onChange={e => setWhatsappTemplate({ ...whatsappTemplate, show_total: e.target.checked })}
                                                    style={{ opacity: 0, width: 0, height: 0 }}
                                                />
                                                <span style={{
                                                    position: 'absolute',
                                                    cursor: 'pointer',
                                                    top: 0,
                                                    left: 0,
                                                    right: 0,
                                                    bottom: 0,
                                                    backgroundColor: whatsappTemplate.show_total ? '#25D366' : '#cbd5e1',
                                                    transition: '0.3s',
                                                    borderRadius: '24px'
                                                }}>
                                                    <span style={{
                                                        position: 'absolute',
                                                        content: '',
                                                        height: '18px',
                                                        width: '18px',
                                                        left: whatsappTemplate.show_total ? '28px' : '3px',
                                                        bottom: '3px',
                                                        backgroundColor: 'white',
                                                        transition: '0.3s',
                                                        borderRadius: '50%'
                                                    }}></span>
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Preview Section */}
                                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#1e293b' }}>Message Preview</h3>
                                    <div style={{ background: '#1e1e1e', color: '#e5e5e5', padding: '16px', borderRadius: '8px', fontFamily: 'system-ui', fontSize: '14px', lineHeight: '1.8', maxWidth: '450px', whiteSpace: 'pre-wrap' }}>
                                        {whatsappTemplate.greeting.replace('{customer_name}', 'John')}
                                        {'\n\n'}
                                        {whatsappTemplate.thank_you.replace('{business_name}', 'Your Business Name')}
                                        {whatsappTemplate.show_total && '\n💰 Amount : Rs.465'}
                                        {whatsappTemplate.show_date && '\n📅 Date : 27/01/2026 14:30'}
                                        {whatsappTemplate.show_invoice_link && '\n👁 View Invoice : https://yoursite.com/invoice/123'}
                                        {'\n\n'}
                                        {whatsappTemplate.closing}
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                                <button
                                    type="button"
                                    onClick={resetWhatsappTemplate}
                                    className="btn"
                                    style={{ background: 'white', color: '#64748b', border: '1px solid #e2e8f0' }}
                                >
                                    Reset to Default
                                </button>
                                <button
                                    type="button"
                                    onClick={handleWhatsappTemplateSave}
                                    className="btn"
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#25D366' }}
                                >
                                    <Save size={16} />
                                    Save Template
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-auto-fit gap-6 mb-6">
                    {/* Total Users */}
                    <div className="card">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted mb-2">Total Users</p>
                                <h2 className="text-2xl font-bold">{stats.totalUsers}</h2>
                                <p className="text-xs text-muted mt-1">All system users</p>
                            </div>
                            <div className="p-3" style={{ background: '#eef2ff' }}>
                                <Users size={28} color="#4f46e5" />
                            </div>
                        </div>
                    </div>

                    {/* Administrators */}
                    <div className="card">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted mb-2">Administrators</p>
                                <h2 className="text-2xl font-bold">{stats.totalAdmins}</h2>
                                <p className="text-xs text-muted mt-1">Active admins</p>
                            </div>
                            <div className="p-3" style={{ background: '#fef3c7' }}>
                                <Shield size={28} color="#f59e0b" />
                            </div>
                        </div>
                    </div>

                    {/* Total Revenue */}
                    <div className="card">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted mb-2">Total Revenue</p>
                                <h2 className="text-2xl font-bold">₹{stats.totalRevenue.toFixed(2)}</h2>
                                <p className="text-xs text-muted mt-1">All-time sales</p>
                            </div>
                            <div className="p-3" style={{ background: '#d1fae5' }}>
                                <DollarSign size={28} color="#10b981" />
                            </div>
                        </div>
                    </div>

                    {/* Total Invoices */}
                    <div className="card">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted mb-2">Total Invoices</p>
                                <h2 className="text-2xl font-bold">{stats.totalInvoices}</h2>
                                <p className="text-xs text-muted mt-1">Completed orders</p>
                            </div>
                            <div className="p-3" style={{ background: '#fce7f3' }}>
                                <ShoppingCart size={28} color="#ec4899" />
                            </div>
                        </div>
                    </div>

                    {/* Total Items */}
                    <div className="card">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted mb-2">Total Items</p>
                                <h2 className="text-2xl font-bold">{stats.totalItems}</h2>
                                <p className="text-xs text-muted mt-1">In inventory</p>
                            </div>
                            <div className="p-3" style={{ background: '#e0e7ff' }}>
                                <Package size={28} color="#6366f1" />
                            </div>
                        </div>
                    </div>

                    {/* Average Order Value */}
                    <div className="card">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted mb-2">Avg Order Value</p>
                                <h2 className="text-2xl font-bold">
                                    ₹{stats.totalInvoices > 0 ? (stats.totalRevenue / stats.totalInvoices).toFixed(2) : '0.00'}
                                </h2>
                                <p className="text-xs text-muted mt-1">Per invoice</p>
                            </div>
                            <div className="p-3" style={{ background: '#ddd6fe' }}>
                                <TrendingUp size={28} color="#7c3aed" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Users Table */}
                <div className="card mb-6">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h2 style={{ margin: 0 }}>All System Users & Statistics</h2>
                        <div className="search-input-wrapper" style={{ maxWidth: '300px' }}>
                            <Search className="search-input-icon" size={16} />
                            <input
                                className="search-input-field"
                                placeholder="Search by username, business, email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ paddingLeft: '36px' }}
                            />
                        </div>
                    </div>
                    <div className="overflow-hidden">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Username</th>
                                    <th>Business Name</th>
                                    <th>Role</th>
                                    <th>Total Revenue</th>
                                    <th>Invoices</th>
                                    <th>Items</th>
                                    <th>Subscription</th>
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
                                        (u.store_email && u.store_email.toLowerCase().includes(query)) ||
                                        (u.full_name && u.full_name.toLowerCase().includes(query))
                                    );
                                }).map(u => (
                                    <React.Fragment key={u.id}>
                                        <tr 
                                            onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)}
                                            style={{ cursor: 'pointer' }}
                                            className="hover:bg-gray-50"
                                        >
                                            <td className="font-medium">
                                                {u.username}
                                                <div className="text-xs text-muted">{u.phone || 'No phone'}</div>
                                            </td>
                                            <td>{u.business_name || '-'}</td>
                                            <td>
                                                <span className={`badge ${u.role === 'sysadmin' ? 'bg-purple-500' : 'bg-blue-500'}`}>
                                                    {u.role === 'sysadmin' ? 'System Admin' : 'Admin'}
                                                </span>
                                            </td>
                                            <td className="font-bold text-green-600">
                                                {u.role === 'admin' ? `₹${u.totalRevenue.toFixed(2)}` : '-'}
                                            </td>
                                            <td className="text-center">
                                                {u.role === 'admin' ? u.totalInvoices : '-'}
                                            </td>
                                            <td className="text-center">
                                                {u.role === 'admin' ? u.totalItems : '-'}
                                            </td>
                                            <td>
                                                <span className={`badge ${u.subscription_status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}>
                                                    {u.subscription_status || 'Active'}
                                                </span>
                                            </td>
                                        </tr>
                                        {expandedUser === u.id && (
                                            <tr>
                                                <td colSpan="7" style={{ padding: 0, background: '#f9fafb' }}>
                                                    <div style={{ padding: '24px', borderTop: '2px solid #e5e7eb' }}>
                                                        {/* Header with User Info */}
                                                        <div style={{ 
                                                            display: 'flex', 
                                                            justifyContent: 'space-between', 
                                                            alignItems: 'center',
                                                            marginBottom: '24px',
                                                            paddingBottom: '16px',
                                                            borderBottom: '1px solid #e5e7eb'
                                                        }}>
                                                            <div>
                                                                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', marginBottom: '4px' }}>
                                                                    {u.business_name || u.username}
                                                                </h3>
                                                                <p style={{ fontSize: '13px', color: '#6b7280' }}>
                                                                    User ID: {u.id} • Created: {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                                                                </p>
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                                {u.role === 'admin' && (
                                                                    <div style={{ textAlign: 'right' }}>
                                                                        <p style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>Total Revenue</p>
                                                                        <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>
                                                                            ₹{u.totalRevenue?.toFixed(2) || '0.00'}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                                                            {/* Business Information Section */}
                                                            <div style={{ 
                                                                background: 'white', 
                                                                padding: '16px', 
                                                                borderRadius: '8px',
                                                                border: '1px solid #e5e7eb'
                                                            }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                                                    <div style={{ 
                                                                        width: '32px', 
                                                                        height: '32px', 
                                                                        background: '#eff6ff', 
                                                                        borderRadius: '6px',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center'
                                                                    }}>
                                                                        <Package size={18} color="#3b82f6" />
                                                                    </div>
                                                                    <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', margin: 0 }}>
                                                                        Business Information
                                                                    </h4>
                                                                </div>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                                    <div>
                                                                        <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                                            Business Type
                                                                        </p>
                                                                        <p style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
                                                                            {u.business_type || <span style={{ color: '#9ca3af' }}>Not specified</span>}
                                                                        </p>
                                                                    </div>
                                                                    <div>
                                                                        <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                                            Address
                                                                        </p>
                                                                        <p style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937', lineHeight: '1.5' }}>
                                                                            {u.business_address || <span style={{ color: '#9ca3af' }}>Not specified</span>}
                                                                        </p>
                                                                    </div>
                                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                                                        <div>
                                                                            <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                                                Tax ID
                                                                            </p>
                                                                            <p style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
                                                                                {u.tax_id || <span style={{ color: '#9ca3af' }}>-</span>}
                                                                            </p>
                                                                        </div>
                                                                        <div>
                                                                            <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                                                Tax Rate
                                                                            </p>
                                                                            <p style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
                                                                                {u.tax_rate ? `${u.tax_rate}%` : <span style={{ color: '#9ca3af' }}>0%</span>}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Contact Information Section */}
                                                            <div style={{ 
                                                                background: 'white', 
                                                                padding: '16px', 
                                                                borderRadius: '8px',
                                                                border: '1px solid #e5e7eb'
                                                            }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                                                    <div style={{ 
                                                                        width: '32px', 
                                                                        height: '32px', 
                                                                        background: '#f0fdf4', 
                                                                        borderRadius: '6px',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center'
                                                                    }}>
                                                                        <Users size={18} color="#10b981" />
                                                                    </div>
                                                                    <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', margin: 0 }}>
                                                                        Contact Details
                                                                    </h4>
                                                                </div>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                                    <div>
                                                                        <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                                            Contact Person
                                                                        </p>
                                                                        <p style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
                                                                            {u.full_name || <span style={{ color: '#9ca3af' }}>Not specified</span>}
                                                                        </p>
                                                                    </div>
                                                                    <div>
                                                                        <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                                            Store Email
                                                                        </p>
                                                                        <p style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
                                                                            {u.store_email || u.email || <span style={{ color: '#9ca3af' }}>Not specified</span>}
                                                                        </p>
                                                                    </div>
                                                                    <div>
                                                                        <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                                            Store Phone
                                                                        </p>
                                                                        <p style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
                                                                            {u.store_phone || u.phone || <span style={{ color: '#9ca3af' }}>Not specified</span>}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Banking Information Section */}
                                                            <div style={{ 
                                                                background: 'white', 
                                                                padding: '16px', 
                                                                borderRadius: '8px',
                                                                border: '1px solid #e5e7eb'
                                                            }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                                                    <div style={{ 
                                                                        width: '32px', 
                                                                        height: '32px', 
                                                                        background: '#fef3c7', 
                                                                        borderRadius: '6px',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center'
                                                                    }}>
                                                                        <DollarSign size={18} color="#f59e0b" />
                                                                    </div>
                                                                    <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', margin: 0 }}>
                                                                        Banking Details
                                                                    </h4>
                                                                </div>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                                    <div>
                                                                        <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                                            Bank Name
                                                                        </p>
                                                                        <p style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
                                                                            {u.bank_name || <span style={{ color: '#9ca3af' }}>Not specified</span>}
                                                                        </p>
                                                                    </div>
                                                                    <div>
                                                                        <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                                            Account Name
                                                                        </p>
                                                                        <p style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
                                                                            {u.account_name || <span style={{ color: '#9ca3af' }}>Not specified</span>}
                                                                        </p>
                                                                    </div>
                                                                    <div>
                                                                        <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                                            Account Number
                                                                        </p>
                                                                        <p style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937', fontFamily: 'monospace' }}>
                                                                            {u.bank_account || <span style={{ color: '#9ca3af' }}>Not specified</span>}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Invoice Settings Section - Full Width */}
                                                        {(u.invoice_notes || u.invoice_terms) && (
                                                            <div style={{ 
                                                                background: 'white', 
                                                                padding: '16px', 
                                                                borderRadius: '8px',
                                                                border: '1px solid #e5e7eb',
                                                                marginTop: '20px'
                                                            }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                                                    <div style={{ 
                                                                        width: '32px', 
                                                                        height: '32px', 
                                                                        background: '#fce7f3', 
                                                                        borderRadius: '6px',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center'
                                                                    }}>
                                                                        <Activity size={18} color="#ec4899" />
                                                                    </div>
                                                                    <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', margin: 0 }}>
                                                                        Invoice Settings
                                                                    </h4>
                                                                </div>
                                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                                                    {u.invoice_notes && (
                                                                        <div>
                                                                            <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                                                Invoice Notes
                                                                            </p>
                                                                            <p style={{ 
                                                                                fontSize: '13px', 
                                                                                color: '#4b5563', 
                                                                                lineHeight: '1.6',
                                                                                background: '#f9fafb',
                                                                                padding: '10px',
                                                                                borderRadius: '4px',
                                                                                border: '1px solid #e5e7eb'
                                                                            }}>
                                                                                {u.invoice_notes}
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                    {u.invoice_terms && (
                                                                        <div>
                                                                            <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                                                Terms & Conditions
                                                                            </p>
                                                                            <p style={{ 
                                                                                fontSize: '13px', 
                                                                                color: '#4b5563', 
                                                                                lineHeight: '1.6',
                                                                                background: '#f9fafb',
                                                                                padding: '10px',
                                                                                borderRadius: '4px',
                                                                                border: '1px solid #e5e7eb'
                                                                            }}>
                                                                                {u.invoice_terms}
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Edit User Button */}
                                                        <div style={{ 
                                                            marginTop: '20px', 
                                                            paddingTop: '20px', 
                                                            borderTop: '1px solid #e5e7eb',
                                                            display: 'flex',
                                                            justifyContent: 'flex-end'
                                                        }}>
                                                            <button
                                                                onClick={() => handleEditUser(u)}
                                                                style={{
                                                                    padding: '10px 20px',
                                                                    background: '#6366f1',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '6px',
                                                                    fontSize: '14px',
                                                                    fontWeight: '500',
                                                                    cursor: 'pointer',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '8px',
                                                                    transition: 'all 0.2s'
                                                                }}
                                                                onMouseEnter={(e) => e.target.style.background = '#4f46e5'}
                                                                onMouseLeave={(e) => e.target.style.background = '#6366f1'}
                                                            >
                                                                <Settings size={16} />
                                                                Edit User
                                                            </button>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                                {searchQuery && users.filter(u => {
                                    const query = searchQuery.toLowerCase();
                                    return (
                                        (u.username && u.username.toLowerCase().includes(query)) ||
                                        (u.business_name && u.business_name.toLowerCase().includes(query)) ||
                                        (u.email && u.email.toLowerCase().includes(query)) ||
                                        (u.phone && u.phone.toLowerCase().includes(query)) ||
                                        (u.store_email && u.store_email.toLowerCase().includes(query)) ||
                                        (u.full_name && u.full_name.toLowerCase().includes(query))
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

                {/* Recent Activity */}
                <div className="card">
                    <h2 className="mb-4">Recent System Activity</h2>
                    <div className="overflow-hidden">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Invoice #</th>
                                    <th>Customer</th>
                                    <th>Amount</th>
                                    <th>Payment</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.recentActivity.length > 0 ? (
                                    stats.recentActivity.map(inv => (
                                        <tr key={inv.id}>
                                            <td className="font-medium">{inv.invoice_number}</td>
                                            <td>{inv.customer_name || 'Walk-in Customer'}</td>
                                            <td className="font-bold text-green-600">₹{inv.total_amount.toFixed(2)}</td>
                                            <td>
                                                <span className="badge bg-blue-500">{inv.payment_mode}</span>
                                            </td>
                                            <td className="text-sm text-muted">
                                                {new Date(inv.created_at).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="text-center text-muted">
                                            No recent activity
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                    </>
                )}
            </div>

            {/* System Settings Password Prompt */}
            {showPasswordPrompt && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
                    <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                            <div style={{ width: '40px', height: '40px', background: '#fef3c7', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Lock size={20} color="#f59e0b" />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>System Settings Access</h3>
                                <p className="text-muted text-sm">Enter password to continue</p>
                            </div>
                        </div>

                        {passwordError && (
                            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 border border-red-200">
                                {passwordError}
                            </div>
                        )}

                        <form onSubmit={handlePasswordSubmit}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '8px' }}>Password</label>
                                <input
                                    type="password"
                                    className="input"
                                    style={{ width: '100%' }}
                                    value={systemPassword}
                                    onChange={e => setSystemPassword(e.target.value)}
                                    placeholder="Enter system password"
                                    autoFocus
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowPasswordPrompt(false);
                                        setPasswordError('');
                                        setSystemPassword('');
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '10px 24px',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        cursor: 'pointer',
                                        backgroundColor: 'white',
                                        color: '#64748b'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn"
                                    style={{ flex: 1 }}
                                >
                                    Access
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add User Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
                    <div style={{ backgroundColor: 'white', borderRadius: '12px', maxWidth: '1000px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
                        {/* Header */}
                        <div style={{ padding: '24px 32px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 10, borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '40px', height: '40px', background: '#eef2ff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <UserPlus size={20} color="#6366f1" />
                                </div>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#1e293b' }}>Add New User</h2>
                                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b', marginTop: '2px' }}>Create a new admin or system administrator account</p>
                                </div>
                            </div>
                            <button 
                                type="button"
                                onClick={() => { setShowAddModal(false); setError(''); }}
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    background: '#f1f5f9',
                                    color: '#64748b',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {error && (
                            <div style={{ margin: '20px 32px', padding: '16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <AlertCircle size={18} color="#dc2626" />
                                <span style={{ fontSize: '14px', color: '#991b1b', fontWeight: '500' }}>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleAddUser} style={{ padding: '32px' }}>
                            {/* Account Credentials */}
                            <div style={{ marginBottom: '32px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                                    <Shield size={18} color="#6366f1" />
                                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>Account Credentials</h3>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '8px' }}>Username *</label>
                                        <input
                                            className="input"
                                            type="text"
                                            style={{ width: '100%' }}
                                            placeholder="Enter username"
                                            value={formData.username}
                                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '8px' }}>Password *</label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                className="input"
                                                type={showPassword ? 'text' : 'password'}
                                                style={{ width: '100%', paddingRight: '40px' }}
                                                placeholder="Enter password"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                style={{
                                                    position: 'absolute',
                                                    right: '12px',
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    color: '#94a3b8'
                                                }}
                                            >
                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '8px' }}>Role *</label>
                                        <select
                                            className="input"
                                            style={{ width: '100%' }}
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        >
                                            <option value="admin">Administrator</option>
                                            <option value="sysadmin">System Administrator</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '8px' }}>Subscription Status</label>
                                        <select
                                            className="input"
                                            style={{ width: '100%' }}
                                            value={formData.subscription_status}
                                            onChange={(e) => setFormData({ ...formData, subscription_status: e.target.value })}
                                        >
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                            <option value="trial">Trial</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Business Information */}
                            <div style={{ marginBottom: '32px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                                    <Package size={18} color="#6366f1" />
                                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>Business Information</h3>
                                </div>
                                <div style={{ display: 'grid', gap: '16px', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '8px' }}>Business Name</label>
                                            <input
                                                className="input"
                                                type="text"
                                                style={{ width: '100%' }}
                                                placeholder="Enter business name"
                                                value={formData.business_name}
                                                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '8px' }}>Business Type</label>
                                            <select
                                                className="input"
                                                style={{ width: '100%' }}
                                                value={formData.business_type}
                                                onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                                                required
                                            >
                                                <option value="restaurant">Restaurant</option>
                                                <option value="retailer">Retailer</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '8px' }}>Tax/GST ID</label>
                                            <input
                                                className="input"
                                                type="text"
                                                style={{ width: '100%' }}
                                                placeholder="Enter tax ID"
                                                value={formData.tax_id}
                                                onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '8px' }}>Tax Rate (%)</label>
                                            <input
                                                className="input"
                                                type="number"
                                                style={{ width: '100%' }}
                                                min="0"
                                                step="0.01"
                                                placeholder="e.g., 18.00"
                                                value={formData.tax_rate}
                                                onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '8px' }}>Business Address</label>
                                        <textarea
                                            className="input"
                                            style={{ width: '100%' }}
                                            placeholder="Enter complete business address"
                                            value={formData.business_address}
                                            onChange={(e) => setFormData({ ...formData, business_address: e.target.value })}
                                            rows="2"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Contact Information */}
                            <div style={{ marginBottom: '32px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                                    <Users size={18} color="#6366f1" />
                                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>Contact Information</h3>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '8px' }}>Full Name</label>
                                        <input
                                            className="input"
                                            type="text"
                                            style={{ width: '100%' }}
                                            placeholder="Enter full name"
                                            value={formData.full_name}
                                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '8px' }}>Email</label>
                                        <input
                                            className="input"
                                            type="email"
                                            style={{ width: '100%' }}
                                            placeholder="email@example.com"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '8px' }}>Phone</label>
                                        <input
                                            className="input"
                                            type="text"
                                            style={{ width: '100%' }}
                                            placeholder="+1234567890"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', gap: '12px', paddingTop: '24px', borderTop: '1px solid #e2e8f0' }}>
                                <button 
                                    type="button" 
                                    onClick={() => { setShowAddModal(false); setError(''); }}
                                    style={{
                                        flex: 1,
                                        padding: '12px 24px',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        cursor: 'pointer',
                                        backgroundColor: 'white',
                                        color: '#64748b',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={loading}
                                    style={{
                                        flex: 1,
                                        padding: '12px 24px',
                                        backgroundColor: loading ? '#94a3b8' : '#6366f1',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        transition: 'all 0.2s',
                                        opacity: loading ? 0.7 : 1
                                    }}
                                >
                                    {loading ? (
                                        <>
                                            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus size={18} />
                                            Create User
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {showEditModal && editingUser && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '20px'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        maxWidth: '900px',
                        width: '100%',
                        maxHeight: '90vh',
                        overflow: 'auto',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                    }}>
                        <form onSubmit={handleUpdateUser}>
                            {/* Header */}
                            <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0' }}>
                                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>
                                    Edit User: {editingUser.username}
                                </h2>
                                <p className="text-muted text-sm" style={{ marginTop: '8px' }}>
                                    Update user information and settings
                                </p>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div style={{
                                    margin: '20px 24px 0',
                                    padding: '12px 16px',
                                    backgroundColor: '#fee2e2',
                                    border: '1px solid #fecaca',
                                    borderRadius: '8px',
                                    color: '#991b1b',
                                    fontSize: '14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <AlertCircle size={18} />
                                    {error}
                                </div>
                            )}

                            {/* Form Content */}
                            <div style={{ padding: '24px' }}>
                                {/* Basic Information */}
                                <div style={{ marginBottom: '32px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                                        <Shield size={18} color="#6366f1" />
                                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>Account Settings</h3>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '8px' }}>Username *</label>
                                            <input
                                                className="input"
                                                type="text"
                                                style={{ width: '100%' }}
                                                placeholder="Enter username"
                                                value={editingUser.username}
                                                onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '8px' }}>New Password (leave blank to keep current)</label>
                                            <input
                                                className="input"
                                                type="password"
                                                style={{ width: '100%' }}
                                                placeholder="Enter new password"
                                                value={editingUser.password}
                                                onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '8px' }}>Role *</label>
                                            <select
                                                className="input"
                                                style={{ width: '100%' }}
                                                value={editingUser.role}
                                                onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                                            >
                                                <option value="admin">Administrator</option>
                                                <option value="sysadmin">System Administrator</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '8px' }}>Subscription Status</label>
                                            <select
                                                className="input"
                                                style={{ width: '100%' }}
                                                value={editingUser.subscription_status}
                                                onChange={(e) => setEditingUser({ ...editingUser, subscription_status: e.target.value })}
                                            >
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                                <option value="trial">Trial</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Multi-Device Sync Setting */}
                                <div style={{ marginBottom: '32px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                                        <Globe size={18} color="#6366f1" />
                                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>Multi-Device Settings</h3>
                                    </div>
                                    <div style={{ padding: '20px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div>
                                                <p style={{ fontSize: '14px', fontWeight: '600', color: '#15803d', marginBottom: '4px' }}>
                                                    Enable Multi-Device Cart Sync
                                                </p>
                                                <p className="text-muted text-sm">
                                                    Allow this user to share table cart data across multiple devices in real-time
                                                </p>
                                            </div>
                                            <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '24px' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={editingUser.enable_multi_device_sync || false}
                                                    onChange={(e) => setEditingUser({ ...editingUser, enable_multi_device_sync: e.target.checked })}
                                                    style={{ opacity: 0, width: 0, height: 0 }}
                                                />
                                                <span style={{
                                                    position: 'absolute',
                                                    cursor: 'pointer',
                                                    top: 0,
                                                    left: 0,
                                                    right: 0,
                                                    bottom: 0,
                                                    backgroundColor: editingUser.enable_multi_device_sync ? '#22c55e' : '#cbd5e1',
                                                    transition: '0.4s',
                                                    borderRadius: '24px'
                                                }}>
                                                    <span style={{
                                                        position: 'absolute',
                                                        content: '""',
                                                        height: '18px',
                                                        width: '18px',
                                                        left: editingUser.enable_multi_device_sync ? '28px' : '3px',
                                                        bottom: '3px',
                                                        backgroundColor: 'white',
                                                        transition: '0.4s',
                                                        borderRadius: '50%'
                                                    }}></span>
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Management Feature */}
                                <div style={{ marginBottom: '32px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                                        <ShoppingCart size={18} color="#6366f1" />
                                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>Order Management</h3>
                                    </div>
                                    <div style={{ padding: '20px', backgroundColor: '#fef3c7', borderRadius: '8px', border: '1px solid #fcd34d' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div>
                                                <p style={{ fontSize: '14px', fontWeight: '600', color: '#92400e', marginBottom: '4px' }}>
                                                    Enable Order Management System
                                                </p>
                                                <p className="text-muted text-sm">
                                                    Give this user access to the Order Management panel for tracking and managing orders from platforms like Zomato, Swiggy, and more
                                                </p>
                                            </div>
                                            <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '24px' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={editingUser.enable_order_management || false}
                                                    onChange={(e) => setEditingUser({ ...editingUser, enable_order_management: e.target.checked })}
                                                    style={{ opacity: 0, width: 0, height: 0 }}
                                                />
                                                <span style={{
                                                    position: 'absolute',
                                                    cursor: 'pointer',
                                                    top: 0,
                                                    left: 0,
                                                    right: 0,
                                                    bottom: 0,
                                                    backgroundColor: editingUser.enable_order_management ? '#f59e0b' : '#cbd5e1',
                                                    transition: '0.4s',
                                                    borderRadius: '24px'
                                                }}>
                                                    <span style={{
                                                        position: 'absolute',
                                                        content: '""',
                                                        height: '18px',
                                                        width: '18px',
                                                        left: editingUser.enable_order_management ? '28px' : '3px',
                                                        bottom: '3px',
                                                        backgroundColor: 'white',
                                                        transition: '0.4s',
                                                        borderRadius: '50%'
                                                    }}></span>
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Business Information */}
                                <div style={{ marginBottom: '32px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                                        <Package size={18} color="#6366f1" />
                                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>Business Information</h3>
                                    </div>
                                    <div style={{ display: 'grid', gap: '16px', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '8px' }}>Business Name</label>
                                                <input
                                                    className="input"
                                                    type="text"
                                                    style={{ width: '100%' }}
                                                    placeholder="Enter business name"
                                                    value={editingUser.business_name || ''}
                                                    onChange={(e) => setEditingUser({ ...editingUser, business_name: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '8px' }}>Business Type</label>
                                                <select
                                                    className="input"
                                                    style={{ width: '100%' }}
                                                    value={normalizeBusinessType(editingUser.business_type) || 'restaurant'}
                                                    onChange={(e) => setEditingUser({ ...editingUser, business_type: e.target.value })}
                                                    required
                                                >
                                                    <option value="restaurant">Restaurant</option>
                                                    <option value="retailer">Retailer</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '8px' }}>Tax/GST ID</label>
                                                <input
                                                    className="input"
                                                    type="text"
                                                    style={{ width: '100%' }}
                                                    placeholder="Enter tax ID"
                                                    value={editingUser.tax_id || ''}
                                                    onChange={(e) => setEditingUser({ ...editingUser, tax_id: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '8px' }}>Tax Rate (%)</label>
                                                <input
                                                    className="input"
                                                    type="number"
                                                    style={{ width: '100%' }}
                                                    min="0"
                                                    step="0.01"
                                                    placeholder="e.g., 18.00"
                                                    value={editingUser.tax_rate || ''}
                                                    onChange={(e) => setEditingUser({ ...editingUser, tax_rate: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div style={{ display: 'flex', gap: '12px', paddingTop: '24px', borderTop: '1px solid #e2e8f0' }}>
                                    <button 
                                        type="button" 
                                        onClick={() => { setShowEditModal(false); setEditingUser(null); setError(''); }}
                                        style={{
                                            flex: 1,
                                            padding: '12px 24px',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            cursor: 'pointer',
                                            backgroundColor: 'white',
                                            color: '#64748b',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={loading}
                                        style={{
                                            flex: 1,
                                            padding: '12px 24px',
                                            backgroundColor: loading ? '#94a3b8' : '#6366f1',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            cursor: loading ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            transition: 'all 0.2s',
                                            opacity: loading ? 0.7 : 1
                                        }}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                                                Updating...
                                            </>
                                        ) : (
                                            <>
                                                <Save size={18} />
                                                Update User
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SystemDashboard;
