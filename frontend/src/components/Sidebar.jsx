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
    const isRestaurant = !isSysAdmin && businessType === 'restaurant';
    const isRetailer = !isSysAdmin && businessType === 'retailer';

    return (
        <div className="sidebar">
            <div className="nav-brand">
                <img src="/ailexity logo.png" alt="Logo" />
                <h1>Ailexity POS</h1>
            </div>

            <nav>
                {/* Dashboard - Only for admin, NOT sysadmin */}
                {!isSysAdmin && (
                    <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Home size={20} />
                        <span>Dashboard</span>
                    </NavLink>
                )}

                {/* System Dashboard - Only sysadmin */}
                {isSysAdmin && (
                    <NavLink to="/system" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <BarChart3 size={20} />
                        <span>System Dashboard</span>
                    </NavLink>
                )}

                {/* Only show POS, History, Items to admin - NOT sysadmin */}
                {!isSysAdmin && (
                    <>
                        <NavLink to="/pos" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <ShoppingCart size={20} />
                            <span>Billing</span>
                        </NavLink>

                        {isRestaurant && (
                            <NavLink to="/history" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                <FileText size={20} />
                                <span>History</span>
                            </NavLink>
                        )}

                        {isRetailer && (
                            <NavLink to="/history" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                <FileText size={20} />
                                <span>Invoices</span>
                            </NavLink>
                        )}

                        {isRestaurant && (
                            <NavLink to="/items" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                <Package size={20} />
                                <span>Inventory</span>
                            </NavLink>
                        )}

                        {isRetailer && (
                            <NavLink to="/stock" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                <Boxes size={20} />
                                <span>Stock</span>
                            </NavLink>
                        )}

                        {isRetailer && (
                            <NavLink to="/parties" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                <Users size={20} />
                                <span>Parties</span>
                            </NavLink>
                        )}

                        {isRetailer && (
                            <NavLink to="/ledger" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                <DollarSign size={20} />
                                <span>Ledger</span>
                            </NavLink>
                        )}

                        {isRestaurant && user?.enable_order_management && (
                            <NavLink to="/orders" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                <Box size={20} />
                                <span>Online Orders</span>
                            </NavLink>
                        )}
                    </>
                )}

                {/* System Admin - only for sysadmin */}
                {isSysAdmin && (
                    <>
                        <div style={{ margin: '0.5rem 0', borderTop: '1px solid var(--border-light)' }}></div>

                        <NavLink to="/admin" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <Shield size={20} />
                            <span>System Admin</span>
                        </NavLink>

                        <NavLink to="/alerts" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <Bell size={20} />
                            <span>Alerts</span>
                        </NavLink>
                    </>
                )}
            </nav>

            <div className="sidebar-footer">
                <div className="user-info">
                    <div className="user-name">{user?.username}</div>
                    <div className="user-role">
                        {user?.role}{!isSysAdmin ? ` · ${businessType}` : ''}
                    </div>
                </div>

                {!isSysAdmin && (
                    <NavLink to="/settings" className="nav-item">
                        <Settings size={20} />
                        <span>Settings</span>
                    </NavLink>
                )}

                <button onClick={logout} className="nav-item w-full text-left" style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
