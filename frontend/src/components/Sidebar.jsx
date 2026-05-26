import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, ShoppingCart, Package, FileText, Settings, LogOut, Shield, BarChart3, Bell, Box, Boxes, Users, DollarSign } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const normalizeBusinessType = (businessType) => {
    const value = String(businessType || '').toLowerCase();
    if (value.includes('retail')) return 'retailer';
    return 'restaurant';
};

const Sidebar = () => {
    const { logout, user } = useAuth();
    const isSysAdmin = user?.role === 'sysadmin';
    const businessType = normalizeBusinessType(user?.business_type);
    const isRetailer = !isSysAdmin && businessType === 'retailer';

    return (
        <div className="sidebar">
            <div className="nav-brand">
                <img src="/ailexity logo.png" alt="Logo" />
                <h1>Ailexity POS</h1>
            </div>

            <div className="sidebar-status">
                <span className="sidebar-status-badge">
                    {isSysAdmin ? 'Sysadmin Workspace' : businessType === 'retailer' ? 'Retailer Workspace' : 'Restaurant Workspace'}
                </span>
                {!isSysAdmin && (
                    <p className="sidebar-status-copy">
                        {isRetailer
                            ? 'Organized for invoices, stock flow, party credit, and ledger control.'
                            : 'Organized for fast billing, kitchen inventory, and online order flow.'}
                    </p>
                )}
            </div>

            <nav>
                {!isSysAdmin && (
                    <>
                        <div className="sidebar-group">
                            <div className="sidebar-group-title">Core tools</div>
                            <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                <Home size={20} />
                                <span>Dashboard</span>
                            </NavLink>
                            <NavLink to="/pos" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                <ShoppingCart size={20} />
                                <span>Billing</span>
                            </NavLink>
                            <NavLink to="/history" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                <FileText size={20} />
                                <span>{isRetailer ? 'Invoices' : 'History'}</span>
                            </NavLink>
                        </div>

                        <div className="sidebar-group">
                            <div className="sidebar-group-title">Restaurant features</div>
                            <NavLink to="/items" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                <Package size={20} />
                                <span>Inventory</span>
                            </NavLink>
                            <NavLink to="/orders" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                <Box size={20} />
                                <span>Online Orders</span>
                            </NavLink>
                        </div>

                        <div className="sidebar-group">
                            <div className="sidebar-group-title">Retailer features</div>
                            <NavLink to="/stock" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                <Boxes size={20} />
                                <span>Stock</span>
                            </NavLink>
                            <NavLink to="/parties" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                <Users size={20} />
                                <span>Parties</span>
                            </NavLink>
                            <NavLink to="/ledger" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                <DollarSign size={20} />
                                <span>Ledger</span>
                            </NavLink>
                        </div>
                    </>
                )}

                {isSysAdmin && (
                    <div className="sidebar-group">
                        <div className="sidebar-group-title">Admin tools</div>
                        <NavLink to="/system" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <BarChart3 size={20} />
                            <span>System Dashboard</span>
                        </NavLink>
                        <NavLink to="/admin" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <Shield size={20} />
                            <span>System Admin</span>
                        </NavLink>
                        <NavLink to="/alerts" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <Bell size={20} />
                            <span>Alerts</span>
                        </NavLink>
                    </div>
                )}
            </nav>

            <div className="sidebar-footer">
                <div className="user-info">
                    <div className="user-name">{user?.username}</div>
                    <div className="user-role">
                        {user?.role}{!isSysAdmin ? ` · ${businessType}` : ''}
                    </div>
                </div>

                <NavLink to="/settings" className="nav-item">
                    <Settings size={20} />
                    <span>Settings</span>
                </NavLink>

                <button onClick={logout} className="nav-item w-full text-left" style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
