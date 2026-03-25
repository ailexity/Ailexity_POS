import React, { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Settings as SettingsIcon, Save, Eye, EyeOff, Building, Lock, Grid3x3, Plus, Edit2, Trash2, FileText, CreditCard, Keyboard, AlertCircle, Check, LogOut } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import './Settings.css';

const normalizeBusinessType = (businessType) => {
    const value = String(businessType || '').toLowerCase();
    if (value.includes('retail')) return 'retailer';
    if (value.includes('restaurant')) return 'restaurant';
    return '';
};

const Settings = () => {
    const { user: currentUser, logout } = useAuth();
    const businessType = normalizeBusinessType(currentUser?.business_type);
    const isRestaurantBusiness = businessType === 'restaurant';
    const [activeTab, setActiveTab] = useState('business');
    const [formData, setFormData] = useState({
        username: '',
        business_name: '',
        tax_rate: '',
        phone: '',
        email: '',
        full_name: '',
        business_address: '',
        business_type: '',
        tax_id: '',
        store_email: '',
        store_phone: '',
        bank_account: '',
        bank_name: '',
        account_name: '',
        invoice_notes: '',
        invoice_terms: '',
        monthly_target: '',
        password: '',
        confirm_password: '',
        current_password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Password Change State
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordStep, setPasswordStep] = useState('initial'); // 'initial', 'verify', 'update'

    // Table Management State
    const [tables, setTables] = useState([]);
    const [showTableModal, setShowTableModal] = useState(false);
    const [editingTable, setEditingTable] = useState(null);
    const [tableFormData, setTableFormData] = useState({
        table_number: '',
        table_name: '',
        capacity: 4,
        is_active: true
    });
    const [tableMessage, setTableMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        if (currentUser) {
            setFormData(prev => ({
                ...prev,
                username: currentUser.username,
                business_name: currentUser.business_name || '',
                tax_rate: currentUser.tax_rate || 0,
                phone: currentUser.phone || '',
                email: currentUser.email || '',
                full_name: currentUser.full_name || '',
                business_address: currentUser.business_address || '',
                business_type: normalizeBusinessType(currentUser.business_type) || '',
                tax_id: currentUser.tax_id || '',
                store_email: currentUser.store_email || '',
                store_phone: currentUser.store_phone || '',
                bank_account: currentUser.bank_account || '',
                bank_name: currentUser.bank_name || '',
                account_name: currentUser.account_name || '',
                invoice_notes: currentUser.invoice_notes || '',
                invoice_terms: currentUser.invoice_terms || '',
                monthly_target: currentUser.monthly_target || ''
            }));
            if (isRestaurantBusiness) {
                fetchTables();
            } else {
                setTables([]);
            }
        }
    }, [currentUser, isRestaurantBusiness]);

    useEffect(() => {
        if (!isRestaurantBusiness && activeTab === 'tables') {
            setActiveTab('business');
        }
    }, [isRestaurantBusiness, activeTab]);

    const fetchTables = async () => {
        try {
            const response = await api.get('/tables/');
            setTables(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error fetching tables:', error);
            setTables([]);
        }
    };

    const handleTableSubmit = async (e) => {
        e.preventDefault();
        setTableMessage({ type: '', text: '' });

        try {
            if (editingTable) {
                await api.put(`/tables/${editingTable.id}`, tableFormData);
                setTableMessage({ type: 'success', text: 'Table updated successfully' });
            } else {
                await api.post('/tables/', tableFormData);
                setTableMessage({ type: 'success', text: 'Table created successfully' });
            }
            fetchTables();
            setShowTableModal(false);
            resetTableForm();
        } catch (error) {
            setTableMessage({ type: 'error', text: error.response?.data?.detail || 'Error saving table' });
        }
    };

    const handleDeleteTable = async (tableId) => {
        if (!window.confirm('Are you sure you want to delete this table?')) return;

        try {
            await api.delete(`/tables/${tableId}`);
            setTableMessage({ type: 'success', text: 'Table deleted successfully' });
            fetchTables();
            setTimeout(() => setTableMessage({ type: '', text: '' }), 3000);
        } catch (error) {
            setTableMessage({ type: 'error', text: 'Error deleting table' });
        }
    };

    const openTableModal = (table = null) => {
        if (table) {
            setEditingTable(table);
            setTableFormData({
                table_number: table.table_number,
                table_name: table.table_name || '',
                capacity: table.capacity,
                is_active: table.is_active
            });
        } else {
            resetTableForm();
        }
        setShowTableModal(true);
    };

    const resetTableForm = () => {
        setEditingTable(null);
        setTableFormData({
            table_number: '',
            table_name: '',
            capacity: 4,
            is_active: true
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (formData.password && formData.password !== formData.confirm_password) {
            setMessage({ type: 'error', text: 'Passwords do not match' });
            return;
        }

        setLoading(true);
        try {
            const payload = {
                username: formData.username,
                business_name: formData.business_name,
                tax_rate: parseFloat(formData.tax_rate) || 0,
                phone: formData.phone,
                email: formData.email,
                full_name: formData.full_name,
                business_address: formData.business_address,
                business_type: formData.business_type,
                tax_id: formData.tax_id,
                store_email: formData.store_email,
                store_phone: formData.store_phone,
                bank_account: formData.bank_account,
                bank_name: formData.bank_name,
                account_name: formData.account_name,
                invoice_notes: formData.invoice_notes,
                invoice_terms: formData.invoice_terms,
                monthly_target: parseFloat(formData.monthly_target) || null
            };

            // Include passwords only if new password is being set
            if (formData.password) {
                payload.password = formData.password;
                payload.current_password = formData.current_password;
            }

            const response = await api.put('/users/me', payload);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });

            // Clear password fields and reset state after successful update
            setFormData(prev => ({
                ...prev,
                password: '',
                confirm_password: '',
                current_password: ''
            }));
            setIsChangingPassword(false);
            setPasswordStep('initial');

            setTimeout(() => {
                window.location.reload();
            }, 1000);

        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to update profile' });
        } finally {
            setLoading(false);
        }
    };

    const TabButton = ({ active, onClick, icon: Icon, children }) => (
        <button
            onClick={onClick}
            style={{
                padding: '12px 18px',
                borderRadius: '8px',
                border: active ? '1px solid #111827' : '1px solid #d1d5db',
                backgroundColor: active ? '#111827' : '#ffffff',
                color: active ? 'white' : '#374151',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
            }}
        >
            <Icon size={18} /> {children}
        </button>
    );

    const SectionHeader = ({ title, description, icon: Icon }) => (
        <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                {Icon && <Icon size={24} style={{ color: '#111827' }} />}
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', margin: 0 }}>
                    {title}
                </h2>
            </div>
            {description && (
                <p style={{ fontSize: '14px', color: '#64748b', margin: '8px 0 0 0' }}>
                    {description}
                </p>
            )}
        </div>
    );

    const FormSection = ({ title, subtitle, children }) => (
        <div style={{ marginBottom: '28px', paddingBottom: '28px', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: '0 0 4px 0' }}>
                    {title}
                </h3>
                {subtitle && (
                    <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                        {subtitle}
                    </p>
                )}
            </div>
            {children}
        </div>
    );

    const FormGroup = ({ children, columns = 'auto' }) => (
        <div style={{
            display: 'grid',
            gridTemplateColumns: columns === 'auto' ? 'repeat(auto-fit, minmax(280px, 1fr))' : columns,
            gap: '20px'
        }}>
            {children}
        </div>
    );

    const FormField = ({ label, required = false, children, help = null }) => (
        <div>
            <label style={{ 
                display: 'block', 
                fontSize: '13px', 
                fontWeight: '600', 
                color: '#334155', 
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
            }}>
                {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
            </label>
            {children}
            {help && (
                <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px', margin: '6px 0 0 0' }}>
                    {help}
                </p>
            )}
        </div>
    );

    const FormInput = (props) => (
        <input
            className="input"
            style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '14px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: '#ffffff',
                transition: 'all 0.2s'
            }}
            {...props}
        />
    );

    const InfoBox = ({ type = 'info', children }) => {
        const bgColorMap = {
            info: '#f9fafb',
            warning: '#f9fafb',
            success: '#f9fafb',
            error: '#f9fafb'
        };
        const borderColorMap = {
            info: '#e5e7eb',
            warning: '#e5e7eb',
            success: '#e5e7eb',
            error: '#e5e7eb'
        };
        const textColorMap = {
            info: '#374151',
            warning: '#374151',
            success: '#374151',
            error: '#374151'
        };

        return (
            <div style={{
                backgroundColor: bgColorMap[type],
                border: `1px solid ${borderColorMap[type]}`,
                borderRadius: '8px',
                padding: '14px 16px',
                fontSize: '13px',
                color: textColorMap[type],
                lineHeight: '1.5'
            }}>
                {children}
            </div>
        );
    };

    const ShortcutItem = ({ keys, description }) => (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
        }}>
            <span style={{ fontSize: '14px', color: '#334155' }}>{description}</span>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                {keys.map((key, index) => (
                    <React.Fragment key={key}>
                        {index > 0 && <span style={{ color: '#94a3b8', fontSize: '12px' }}>+</span>}
                        <kbd style={{
                            padding: '4px 8px',
                            backgroundColor: 'white',
                            border: '1px solid #cbd5e1',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500',
                            fontFamily: 'system-ui, -apple-system, sans-serif',
                            color: '#1e293b',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}>
                            {key}
                        </kbd>
                    </React.Fragment>
                ))}
            </div>
        </div>
    );

    return (
        <div className="page-container with-mobile-header-offset settings-page" style={{ backgroundColor: '#fafafa' }}>
            <PageHeader 
                icon={SettingsIcon}
                title="Settings"
                subtitle="Manage your business, account security, and system preferences"
            />

            <div className="content-area settings-content" style={{ paddingTop: '24px' }}>
                {message.text && (
                    <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`} style={{ maxWidth: '1200px', margin: '0 auto 24px', borderRadius: '10px', padding: '14px 16px', fontSize: '14px' }}>
                        {message.text}
                    </div>
                )}

                {/* Tab Navigation */}
                <div className="settings-tabs-wrapper" style={{ maxWidth: '1200px', margin: '0 auto', marginBottom: '24px' }}>
                    <div className="settings-tabs-bar" style={{ 
                        backgroundColor: '#ffffff', 
                        borderRadius: '10px', 
                        padding: '10px', 
                        boxShadow: 'none', 
                        border: '1px solid #e5e7eb',
                        display: 'flex', 
                        gap: '6px', 
                        flexWrap: 'wrap',
                        alignItems: 'center'
                    }}>
                        <TabButton active={activeTab === 'business'} onClick={() => setActiveTab('business')} icon={Building}>Business</TabButton>
                        <TabButton active={activeTab === 'invoice'} onClick={() => setActiveTab('invoice')} icon={FileText}>Invoices</TabButton>
                        <TabButton active={activeTab === 'payment'} onClick={() => setActiveTab('payment')} icon={CreditCard}>Payment</TabButton>
                        {isRestaurantBusiness && (
                            <TabButton active={activeTab === 'tables'} onClick={() => setActiveTab('tables')} icon={Grid3x3}>Tables</TabButton>
                        )}
                        <TabButton active={activeTab === 'shortcuts'} onClick={() => setActiveTab('shortcuts')} icon={Keyboard}>Shortcuts</TabButton>
                        <TabButton active={activeTab === 'security'} onClick={() => setActiveTab('security')} icon={Lock}>Security</TabButton>
                    </div>
                </div>

                {/* Tab Content */}
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <form onSubmit={handleSubmit}>
                        
                        {/* Business Details Tab */}
                        {activeTab === 'business' && (
                            <div className="settings-panel" style={{ backgroundColor: 'white', borderRadius: '12px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
                                <SectionHeader 
                                    title="Business Information" 
                                    description="Manage your business profile and contact details"
                                    icon={Building}
                                />

                                <FormSection title="Basic Information" subtitle="Core business identity">
                                    <FormGroup>
                                        <FormField label="Business Name" required>
                                            <FormInput
                                                type="text"
                                                value={formData.business_name}
                                                onChange={e => setFormData({ ...formData, business_name: e.target.value })}
                                                placeholder="Your Business Name"
                                            />
                                        </FormField>

                                        <FormField label="Business Type" help="Choose Restaurant or Retailer">
                                            <select
                                                className="input"
                                                value={formData.business_type}
                                                onChange={e => setFormData({ ...formData, business_type: e.target.value })}
                                                required
                                            >
                                                <option value="">Select Type</option>
                                                <option value="restaurant">Restaurant</option>
                                                <option value="retailer">Retailer</option>
                                            </select>
                                        </FormField>
                                    </FormGroup>
                                </FormSection>

                                <FormSection title="Contact Information" subtitle="How customers can reach you">
                                    <FormGroup>
                                        <FormField label="Phone Number" help="Displayed on invoices">
                                            <FormInput
                                                type="text"
                                                value={formData.phone}
                                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                placeholder="+1 234 567 890"
                                            />
                                        </FormField>

                                        <FormField label="Email Address" help="Business email">
                                            <FormInput
                                                type="email"
                                                value={formData.email}
                                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                placeholder="email@example.com"
                                            />
                                        </FormField>
                                    </FormGroup>
                                    
                                    <div style={{ marginTop: '20px' }}>
                                        <FormField label="Business Address" help="Full address shown on invoices">
                                            <textarea
                                                className="input"
                                                style={{
                                                    width: '100%',
                                                    padding: '12px',
                                                    fontSize: '14px',
                                                    border: '1px solid #cbd5e1',
                                                    borderRadius: '6px',
                                                    backgroundColor: '#f8fafc',
                                                    fontFamily: 'inherit',
                                                    resize: 'vertical',
                                                    minHeight: '100px'
                                                }}
                                                rows="3"
                                                value={formData.business_address}
                                                onChange={e => setFormData({ ...formData, business_address: e.target.value })}
                                                placeholder="123 Main Street, City, State, ZIP"
                                            />
                                        </FormField>
                                    </div>
                                </FormSection>

                                <FormSection title="Tax & Compliance" subtitle="Tax identification and regulatory information">
                                    <FormGroup columns="repeat(auto-fit, minmax(250px, 1fr))">
                                        <FormField label="Tax Rate (%)" help="Applied to all sales">
                                            <FormInput
                                                type="number"
                                                value={formData.tax_rate}
                                                onChange={e => setFormData({ ...formData, tax_rate: e.target.value })}
                                                min="0"
                                                step="0.01"
                                                placeholder="10"
                                            />
                                        </FormField>

                                        <FormField label="Tax ID / GSTIN" help="Government ID for tax purposes">
                                            <FormInput
                                                type="text"
                                                value={formData.tax_id}
                                                onChange={e => setFormData({ ...formData, tax_id: e.target.value })}
                                                placeholder="123456789"
                                            />
                                        </FormField>

                                        <FormField label="Monthly Revenue Target (₹)" help="Used to track progress in dashboard">
                                            <FormInput
                                                type="number"
                                                value={formData.monthly_target}
                                                onChange={e => setFormData({ ...formData, monthly_target: e.target.value })}
                                                min="0"
                                                step="1000"
                                                placeholder="100000"
                                            />
                                        </FormField>
                                    </FormGroup>
                                </FormSection>

                                <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                    <button
                                        type="submit"
                                        style={{
                                            padding: '11px 28px',
                                            backgroundColor: '#111827',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            transition: 'all 0.2s'
                                        }}
                                        disabled={loading}
                                        onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#1f2937')}
                                        onMouseLeave={(e) => (e.target.style.backgroundColor = '#111827')}
                                    >
                                        {loading ? <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span> : <Save size={16} />}
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Invoice Settings Tab */}
                        {activeTab === 'invoice' && (
                            <div className="settings-panel" style={{ backgroundColor: 'white', borderRadius: '12px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
                                <SectionHeader 
                                    title="Invoice Configuration" 
                                    description="Customize how your invoices appear to customers"
                                    icon={FileText}
                                />

                                <FormSection title="Invoice Footer" subtitle="Content displayed at the bottom of all invoices">
                                    <FormField label="Footer Notes" help="Thank you message or additional instructions">
                                        <textarea
                                            className="input"
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                fontSize: '14px',
                                                border: '1px solid #cbd5e1',
                                                borderRadius: '6px',
                                                backgroundColor: '#f8fafc',
                                                fontFamily: 'inherit',
                                                resize: 'vertical',
                                                minHeight: '100px'
                                            }}
                                            rows="3"
                                            value={formData.invoice_notes}
                                            onChange={e => setFormData({ ...formData, invoice_notes: e.target.value })}
                                            placeholder="Thank you for your business!"
                                        />
                                    </FormField>
                                </FormSection>

                                <FormSection title="Terms & Conditions" subtitle="Legal terms and payment conditions">
                                    <FormField label="Terms & Conditions" help="Payment terms, return policy, etc.">
                                        <textarea
                                            className="input"
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                fontSize: '14px',
                                                border: '1px solid #cbd5e1',
                                                borderRadius: '6px',
                                                backgroundColor: '#f8fafc',
                                                fontFamily: 'inherit',
                                                resize: 'vertical',
                                                minHeight: '100px'
                                            }}
                                            rows="3"
                                            value={formData.invoice_terms}
                                            onChange={e => setFormData({ ...formData, invoice_terms: e.target.value })}
                                            placeholder="Payment due within 30 days"
                                        />
                                    </FormField>
                                </FormSection>

                                <InfoBox type="info">
                                    <strong>💡 Tip:</strong> These settings are applied to all future invoices. Previous invoices remain unchanged.
                                </InfoBox>

                                <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                    <button
                                        type="submit"
                                        style={{
                                            padding: '11px 28px',
                                            backgroundColor: '#111827',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            transition: 'all 0.2s'
                                        }}
                                        disabled={loading}
                                        onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#1f2937')}
                                        onMouseLeave={(e) => (e.target.style.backgroundColor = '#111827')}
                                    >
                                        {loading ? <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span> : <Save size={16} />}
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Payment Details Tab */}
                        {activeTab === 'payment' && (
                            <div className="settings-panel" style={{ backgroundColor: 'white', borderRadius: '12px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
                                <SectionHeader 
                                    title="Payment Information" 
                                    description="Bank details used for invoices and payments"
                                    icon={CreditCard}
                                />

                                <InfoBox type="warning">
                                    <strong>⚠️ Confidential:</strong> Bank details are only displayed in official invoices and are treated as confidential information.
                                </InfoBox>

                                <div style={{ marginTop: '28px' }}></div>

                                <FormSection title="Bank Account Details" subtitle="Primary business banking information">
                                    <FormGroup>
                                        <FormField label="Bank Name" required>
                                            <FormInput
                                                type="text"
                                                value={formData.bank_name}
                                                onChange={e => setFormData({ ...formData, bank_name: e.target.value })}
                                                placeholder="e.g., State Bank of India"
                                            />
                                        </FormField>

                                        <FormField label="Account Holder Name" required>
                                            <FormInput
                                                type="text"
                                                value={formData.account_name}
                                                onChange={e => setFormData({ ...formData, account_name: e.target.value })}
                                                placeholder="Full name as on bank account"
                                            />
                                        </FormField>

                                        <FormField label="Account Number" required help="Keep this secure">
                                            <FormInput
                                                type="text"
                                                value={formData.bank_account}
                                                onChange={e => setFormData({ ...formData, bank_account: e.target.value })}
                                                placeholder="1234567890"
                                            />
                                        </FormField>
                                    </FormGroup>
                                </FormSection>

                                <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                    <button
                                        type="submit"
                                        style={{
                                            padding: '11px 28px',
                                            backgroundColor: '#111827',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            transition: 'all 0.2s'
                                        }}
                                        disabled={loading}
                                        onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#1f2937')}
                                        onMouseLeave={(e) => (e.target.style.backgroundColor = '#111827')}
                                    >
                                        {loading ? <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span> : <Save size={16} />}
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Security Tab */}
                        {activeTab === 'security' && (
                            <div className="settings-panel" style={{ backgroundColor: 'white', borderRadius: '12px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
                                <SectionHeader 
                                    title="Security Settings" 
                                    description="Protect your account with a strong password"
                                    icon={Lock}
                                />

                                {!isChangingPassword ? (
                                    <div style={{ padding: '24px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                            <Check size={20} style={{ color: '#0369a1' }} />
                                            <p style={{ fontSize: '14px', color: '#374151', margin: 0 }}>
                                                Your account is secured with a password. Update your password regularly for better security.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsChangingPassword(true);
                                                setPasswordStep('verify');
                                                setMessage({ type: '', text: '' });
                                            }}
                                            style={{
                                                padding: '11px 28px',
                                                backgroundColor: '#111827',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => (e.target.style.backgroundColor = '#1f2937')}
                                            onMouseLeave={(e) => (e.target.style.backgroundColor = '#111827')}
                                        >
                                            Change Password
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ backgroundColor: '#f8fafc', padding: '28px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                                            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', margin: 0 }}>Update Password</h3>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsChangingPassword(false);
                                                    setPasswordStep('initial');
                                                    setFormData(prev => ({ ...prev, password: '', confirm_password: '', current_password: '' }));
                                                    setMessage({ type: '', text: '' });
                                                }}
                                                style={{
                                                    fontSize: '13px',
                                                    color: '#64748b',
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    fontWeight: '500',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={(e) => (e.target.style.color = '#334155')}
                                                onMouseLeave={(e) => (e.target.style.color = '#64748b')}
                                            >
                                                ✕ Cancel
                                            </button>
                                        </div>

                                        {passwordStep === 'verify' && (
                                            <div>
                                                <FormSection title="Verify Identity" subtitle="Enter your current password to proceed">
                                                    <FormField label="Current Password" required>
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            <FormInput
                                                                type="password"
                                                                style={{ flex: 1 }}
                                                                value={formData.current_password}
                                                                onChange={e => setFormData({ ...formData, current_password: e.target.value })}
                                                                placeholder="Enter current password"
                                                            />
                                                            <button
                                                                type="button"
                                                                disabled={loading}
                                                                onClick={async () => {
                                                                    if (!formData.current_password) return;
                                                                    try {
                                                                        setLoading(true);
                                                                        await api.post('/users/verify-password', { password: formData.current_password });
                                                                        setPasswordStep('update');
                                                                        setMessage({ type: 'success', text: 'Password verified successfully!' });
                                                                    } catch (err) {
                                                                        setMessage({ type: 'error', text: 'Incorrect password. Please try again.' });
                                                                    } finally {
                                                                        setLoading(false);
                                                                    }
                                                                }}
                                                                style={{
                                                                    padding: '11px 24px',
                                                                    backgroundColor: '#111827',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '8px',
                                                                    fontSize: '14px',
                                                                    fontWeight: '600',
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.2s',
                                                                    opacity: loading ? 0.7 : 1
                                                                }}
                                                                onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#1f2937')}
                                                                onMouseLeave={(e) => (e.target.style.backgroundColor = '#111827')}
                                                            >
                                                                {loading ? '...' : 'Verify'}
                                                            </button>
                                                        </div>
                                                    </FormField>
                                                </FormSection>
                                            </div>
                                        )}

                                        {passwordStep === 'update' && (
                                            <div>
                                                <FormSection title="Set New Password" subtitle="Create a strong password with at least 8 characters">
                                                    <FormGroup>
                                                        <FormField label="New Password" required help="Use uppercase, lowercase, numbers and symbols">
                                                            <div style={{ position: 'relative' }}>
                                                                <FormInput
                                                                    type={showPassword ? "text" : "password"}
                                                                    style={{ paddingRight: '40px' }}
                                                                    value={formData.password}
                                                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                                                    placeholder="Enter new password"
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
                                                                        color: '#94a3b8',
                                                                        transition: 'all 0.2s'
                                                                    }}
                                                                    onMouseEnter={(e) => (e.target.style.color = '#64748b')}
                                                                    onMouseLeave={(e) => (e.target.style.color = '#94a3b8')}
                                                                >
                                                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                                </button>
                                                            </div>
                                                        </FormField>

                                                        <FormField label="Confirm Password" required>
                                                            <FormInput
                                                                type="password"
                                                                value={formData.confirm_password}
                                                                onChange={e => setFormData({ ...formData, confirm_password: e.target.value })}
                                                                placeholder="Confirm new password"
                                                            />
                                                        </FormField>
                                                    </FormGroup>
                                                </FormSection>

                                                <InfoBox type="info">
                                                    <strong>🔒 Security Tips:</strong>
                                                    <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                                                        <li>Use a unique password you haven't used elsewhere</li>
                                                        <li>Mix uppercase, lowercase, numbers, and symbols</li>
                                                        <li>Avoid using personal information</li>
                                                    </ul>
                                                </InfoBox>

                                                <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                                    <button
                                                        type="submit"
                                                        style={{
                                                            padding: '11px 28px',
                                                            backgroundColor: '#111827',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '8px',
                                                            fontSize: '14px',
                                                            fontWeight: '600',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px',
                                                            transition: 'all 0.2s'
                                                        }}
                                                        disabled={loading}
                                                        onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#1f2937')}
                                                        onMouseLeave={(e) => (e.target.style.backgroundColor = '#111827')}
                                                    >
                                                        {loading ? <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span> : <Save size={16} />}
                                                        Update Password
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </form>

                    {/* Shortcuts Tab - Outside form */}
                    {activeTab === 'shortcuts' && (
                        <div className="settings-panel" style={{ backgroundColor: 'white', borderRadius: '12px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
                            <SectionHeader 
                                title="Keyboard Shortcuts" 
                                description="Use these keyboard shortcuts to navigate faster and work more efficiently"
                                icon={Keyboard}
                            />

                            {/* Navigation Shortcuts */}
                            <div style={{ marginBottom: '40px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                                    <div style={{ width: '5px', height: '24px', backgroundColor: '#111827', borderRadius: '3px' }}></div>
                                    <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#1e293b', margin: 0 }}>Navigation Shortcuts</h3>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
                                    <ShortcutItem keys={['Alt', 'D']} description="Go to Dashboard" />
                                    <ShortcutItem keys={['Alt', 'B']} description="Go to Billing (POS)" />
                                    <ShortcutItem keys={['Alt', 'H']} description="Go to History" />
                                    <ShortcutItem keys={['Alt', 'I']} description="Go to Items" />
                                    <ShortcutItem keys={['Alt', 'S']} description="Go to Settings" />
                                </div>
                            </div>

                            {/* Action Shortcuts */}
                            <div style={{ marginBottom: '40px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                                    <div style={{ width: '5px', height: '24px', backgroundColor: '#6b7280', borderRadius: '3px' }}></div>
                                    <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#1e293b', margin: 0 }}>Action Shortcuts</h3>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
                                    <ShortcutItem keys={['Ctrl', '/']} description="Focus Search Input" />
                                    <ShortcutItem keys={['Alt', 'Enter']} description="Toggle Fullscreen" />
                                    <ShortcutItem keys={['Escape']} description="Clear Input / Close Modal" />
                                </div>
                            </div>

                            {/* System Shortcuts */}
                            <div style={{ marginBottom: '40px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                                    <div style={{ width: '5px', height: '24px', backgroundColor: '#6b7280', borderRadius: '3px' }}></div>
                                    <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#1e293b', margin: 0 }}>System Shortcuts</h3>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
                                    <ShortcutItem keys={['Alt', 'Q']} description="Logout" />
                                </div>
                            </div>

                            {/* Tips */}
                            <InfoBox type="info">
                                <strong>💡 Pro Tips:</strong>
                                <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', fonts: '13px' }}>
                                    <li>Shortcuts won't work when typing in input fields</li>
                                    <li>Press <kbd style={{ backgroundColor: '#e0f2fe', padding: '2px 6px', borderRadius: '3px', fontFamily: 'monospace', fontSize: '12px', fontWeight: '600' }}>Escape</kbd> to exit inputs and enable shortcuts</li>
                                    <li>Use <kbd style={{ backgroundColor: '#e0f2fe', padding: '2px 6px', borderRadius: '3px', fontFamily: 'monospace', fontSize: '12px', fontWeight: '600' }}>Alt + Enter</kbd> for a fullscreen experience</li>
                                    <li>Navigate quickly between pages using <kbd style={{ backgroundColor: '#e0f2fe', padding: '2px 6px', borderRadius: '3px', fontFamily: 'monospace', fontSize: '12px', fontWeight: '600' }}>Alt</kbd> + letter shortcuts</li>
                                </ul>
                            </InfoBox>
                        </div>
                    )}

                    {/* Tables Tab - Outside form */}
                    {isRestaurantBusiness && activeTab === 'tables' && (
                        <div className="settings-panel" style={{ backgroundColor: 'white', borderRadius: '12px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                                <SectionHeader 
                                    title="Table Management" 
                                    description="Add and manage restaurant or seating tables"
                                    icon={Grid3x3}
                                />
                                <button
                                    onClick={() => openTableModal()}
                                    style={{
                                        padding: '11px 24px',
                                        backgroundColor: '#111827',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        transition: 'all 0.2s',
                                        whiteSpace: 'nowrap'
                                    }}
                                    onMouseEnter={(e) => (e.target.style.backgroundColor = '#1f2937')}
                                    onMouseLeave={(e) => (e.target.style.backgroundColor = '#111827')}
                                >
                                    <Plus size={18} />
                                    Add Table
                                </button>
                            </div>

                            {tableMessage.text && (
                                <div className={`mb-6 p-4 rounded-lg ${tableMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`} style={{ marginBottom: '24px' }}>
                                    {tableMessage.text}
                                </div>
                            )}

                            {tables.length > 0 ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '18px' }}>
                                    {tables.map(table => (
                                        <div key={table.id} style={{ 
                                            border: '1px solid #e2e8f0', 
                                            borderRadius: '10px', 
                                            padding: '22px',
                                            backgroundColor: '#f8fafc',
                                            transition: 'all 0.2s',
                                            hover: { boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                                            e.currentTarget.style.borderColor = '#cbd5e1';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.boxShadow = 'none';
                                            e.currentTarget.style.borderColor = '#e2e8f0';
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                                <div>
                                                    <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '6px', margin: '0 0 6px 0' }}>
                                                        {table.table_name || `Table ${table.table_number}`}
                                                    </h3>
                                                    <div style={{ display: 'grid', gap: '6px' }}>
                                                        <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                                                            <strong style={{ color: '#1e293b' }}>Number:</strong> {table.table_number}
                                                        </p>
                                                        <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                                                            <strong style={{ color: '#1e293b' }}>Capacity:</strong> {table.capacity} {table.capacity === 1 ? 'person' : 'people'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span style={{
                                                    padding: '6px 14px',
                                                    borderRadius: '12px',
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    backgroundColor: table.is_active ? '#f3f4f6' : '#f9fafb',
                                                    color: table.is_active ? '#111827' : '#64748b',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {table.is_active ? '✓ Active' : '○ Inactive'}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
                                                <button
                                                    onClick={() => openTableModal(table)}
                                                    style={{
                                                        flex: 1,
                                                        padding: '10px',
                                                        backgroundColor: '#f3f4f6',
                                                        color: '#111827',
                                                        border: '1px solid #d1d5db',
                                                        borderRadius: '8px',
                                                        fontSize: '13px',
                                                        fontWeight: '600',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '6px',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.target.style.backgroundColor = '#e5e7eb';
                                                        e.target.style.borderColor = '#9ca3af';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.target.style.backgroundColor = '#f3f4f6';
                                                        e.target.style.borderColor = '#d1d5db';
                                                    }}
                                                >
                                                    <Edit2 size={14} />
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTable(table.id)}
                                                    style={{
                                                        flex: 1,
                                                        padding: '10px',
                                                        backgroundColor: '#f9fafb',
                                                        color: '#374151',
                                                        border: '1px solid #d1d5db',
                                                        borderRadius: '8px',
                                                        fontSize: '13px',
                                                        fontWeight: '600',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '6px',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.target.style.backgroundColor = '#f3f4f6';
                                                        e.target.style.borderColor = '#9ca3af';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.target.style.backgroundColor = '#f9fafb';
                                                        e.target.style.borderColor = '#d1d5db';
                                                    }}
                                                >
                                                    <Trash2 size={14} />
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '2px dashed #cbd5e1' }}>
                                    <Grid3x3 size={48} style={{ margin: '0 auto 16px', color: '#cbd5e1' }} />
                                    <p style={{ fontSize: '15px', color: '#64748b', margin: '0 0 12px 0', fontWeight: '500' }}>No tables configured yet</p>
                                    <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>Click the "Add Table" button above to start creating tables</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Mobile Logout Button - Only visible on mobile */}
                <div className="mobile-logout-section" style={{ 
                    maxWidth: '1200px', 
                    margin: '24px auto 0',
                    display: 'none'
                }}>
                    <div style={{ 
                        backgroundColor: 'white', 
                        borderRadius: '12px', 
                        padding: '20px', 
                        boxShadow: '0 1px 3px rgba(0,0,0,0.08)', 
                        border: '1px solid #e2e8f0'
                    }}>
                        <button
                            onClick={logout}
                            style={{
                                width: '100%',
                                padding: '14px 20px',
                                backgroundColor: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '15px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => (e.target.style.backgroundColor = '#dc2626')}
                            onMouseLeave={(e) => (e.target.style.backgroundColor = '#ef4444')}
                        >
                            <LogOut size={18} />
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* Table Modal */}
            {showTableModal && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px', backdropFilter: 'blur(4px)' }}>
                    <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '32px', maxWidth: '500px', width: '100%', boxShadow: '0 20px 25px rgba(0,0,0,0.15)' }}>
                        <h3 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '24px', color: '#1e293b', margin: '0 0 24px 0' }}>
                            {editingTable ? '✎ Edit Table' : '+ Add New Table'}
                        </h3>
                        <form onSubmit={handleTableSubmit}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <FormField label="Table Number" required help="e.g., 1, 2, A1, VIP-01">
                                    <FormInput
                                        type="text"
                                        value={tableFormData.table_number}
                                        onChange={e => setTableFormData({ ...tableFormData, table_number: e.target.value })}
                                        required
                                        placeholder="e.g., 1, 2, A1"
                                    />
                                </FormField>
                                <FormField label="Table Name" help="Optional descriptive name">
                                    <FormInput
                                        type="text"
                                        value={tableFormData.table_name}
                                        onChange={e => setTableFormData({ ...tableFormData, table_name: e.target.value })}
                                        placeholder="e.g., VIP Table, Corner Table"
                                    />
                                </FormField>
                                <FormField label="Capacity (people)" required>
                                    <FormInput
                                        type="number"
                                        value={tableFormData.capacity}
                                        onChange={e => setTableFormData({ ...tableFormData, capacity: parseInt(e.target.value) })}
                                        min="1"
                                        required
                                        placeholder="4"
                                    />
                                </FormField>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <input
                                        type="checkbox"
                                        id="table_active"
                                        checked={tableFormData.is_active}
                                        onChange={e => setTableFormData({ ...tableFormData, is_active: e.target.checked })}
                                        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#111827' }}
                                    />
                                    <label htmlFor="table_active" style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', cursor: 'pointer', margin: 0 }}>
                                        Table is Active
                                    </label>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                                <button
                                    type="button"
                                    onClick={() => { setShowTableModal(false); resetTableForm(); }}
                                    style={{
                                        flex: 1,
                                        padding: '11px 24px',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        backgroundColor: 'white',
                                        color: '#64748b',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = '#f8fafc';
                                        e.target.style.borderColor = '#94a3b8';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = 'white';
                                        e.target.style.borderColor = '#cbd5e1';
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{
                                        flex: 1,
                                        padding: '11px 24px',
                                        backgroundColor: '#111827',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => (e.target.style.backgroundColor = '#1f2937')}
                                    onMouseLeave={(e) => (e.target.style.backgroundColor = '#111827')}
                                >
                                    {editingTable ? 'Update Table' : 'Create Table'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
