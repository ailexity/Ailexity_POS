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
        <div className="sidebar p-4">
            <div className="mb-8 p-2 flex flex-col items-center gap-2 text-center">
                <img src="/logo.png" alt="Logo" className="w-20 h-auto object-contain" />
                <div>
                    <h1 className="font-bold leading-none">Ailexity POS</h1>
                </div>
            </div>

            <nav className="flex flex-col gap-2 flex-1">
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
                                <span>Online</span>
                            </NavLink>
                        )}
                    </>
                )}

                {/* System Admin - only for sysadmin */}
                {isSysAdmin && (
                    <>
                        <div style={{ margin: '0.5rem 0', borderTop: '1px solid #475569' }}></div>

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

            <div className="mt-auto border-t border-slate-700 pt-4">
                <div className="p-2 mb-2">
                    <div className="text-sm font-medium text-main">{user?.username}</div>
                    <div className="text-xs text-slate-400 capitalize">
                        {user?.role}{!isSysAdmin ? ` · ${businessType}` : ''}
                    </div>
                </div>

                {!isSysAdmin && (
                    <NavLink to="/settings" className="nav-item mb-2">
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
