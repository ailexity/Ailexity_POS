import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, ShoppingCart, Package, FileText, Settings, LogOut, Shield, BarChart3, Bell, Box, Boxes, Users, DollarSign, UserCheck, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { canAccessOrderManagement, hasFeature, normalizeBusinessType, isLimitedRoleUser } from '../utils/featureAccess';

const accessMessage = 'This feature is locked for your account. Please contact admin to access it.';

const SidebarItem = ({ to, icon: Icon, label, locked = false }) => {
    if (locked) {
        return (
            <button
                type="button"
                className="nav-item nav-item-locked w-full text-left"
                title={accessMessage}
                aria-label={`${label} locked. Contact admin to access it.`}
                onClick={() => window.alert(accessMessage)}
            >
                <Icon size={20} />
                <span>{label}</span>
                <Lock size={15} className="nav-lock-icon" aria-hidden="true" />
            </button>
        );
    }

    return (
        <NavLink to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Icon size={20} />
            <span>{label}</span>
        </NavLink>
    );
};

const Sidebar = () => {
    const { logout, user } = useAuth();
    const isSysAdmin = user?.role === 'sysadmin';
    const isLimited = isLimitedRoleUser(user);
    const businessType = normalizeBusinessType(user?.business_type);
    const isRetailer = !isSysAdmin && businessType === 'retailer';
    const isRestaurant = !isSysAdmin && businessType === 'restaurant';

    return (
        <div className="sidebar">
            <div className="nav-brand">
                <img src="/ailexity logo.png" alt="Logo" />
                <h1>Ailexity POS</h1>
            </div>

            <div className="sidebar-status">
                <span className="sidebar-status-badge">
                    {isSysAdmin ? 'Sysadmin Workspace' : isLimited ? (user?.role === 'kitchen' ? 'Kitchen Display' : 'Attendee Workspace') : businessType === 'retailer' ? 'Retailer Workspace' : 'Restaurant Workspace'}
                </span>
                {!isSysAdmin && !isLimited && (
                    <p className="sidebar-status-copy">
                        {isRetailer
                            ? 'Organized for invoices, stock flow, party credit, and ledger control.'
                            : 'Organized for fast billing, kitchen inventory, and online order flow.'}
                    </p>
                )}
            </div>

            <nav>
                {isLimited ? (
                    // Simplified menu for KOT/attendee users - only show unlocked items
                    <div className="sidebar-group">
                        <div className="sidebar-group-title">Menu</div>
                        {user?.role === 'kitchen' && hasFeature(user, 'kot_printing') && (
                            <SidebarItem to="/kots" icon={Package} label="Kitchen Orders" />
                        )}
                        {user?.role === 'attendee' && hasFeature(user, 'pos_billing') && (
                            <SidebarItem to="/pos" icon={ShoppingCart} label="Billing" />
                        )}
                    </div>
                ) : !isSysAdmin && (
                    <>
                        <div className="sidebar-group">
                            <div className="sidebar-group-title">Core tools</div>
                            <SidebarItem to="/dashboard" icon={Home} label="Dashboard" locked={!hasFeature(user, 'dashboard')} />
                            <SidebarItem to="/pos" icon={ShoppingCart} label="Billing" locked={!hasFeature(user, 'pos_billing')} />
                            <SidebarItem to="/history" icon={FileText} label={isRetailer ? 'Invoices' : 'History'} locked={!hasFeature(user, 'invoices')} />
                            <SidebarItem to="/employees" icon={UserCheck} label="Employees" locked={!hasFeature(user, 'attendees_management')} />
                        </div>

                        {isRestaurant && (
                            <div className="sidebar-group">
                                <div className="sidebar-group-title">Restaurant features</div>
                                <SidebarItem to="/items" icon={Package} label="Inventory" locked={!hasFeature(user, 'items_management')} />
                                <SidebarItem to="/stock" icon={Boxes} label="Stock" locked={!hasFeature(user, 'stock_management')} />
                                <SidebarItem to="/orders" icon={Box} label="Online Orders" locked={!canAccessOrderManagement(user)} />
                                <SidebarItem to="/kots" icon={Package} label="Kitchen Orders" locked={!hasFeature(user, 'kot_printing')} />
                            </div>
                        )}

                        {isRetailer && (
                            <div className="sidebar-group">
                                <div className="sidebar-group-title">Retailer features</div>
                                <SidebarItem to="/stock" icon={Boxes} label="Stock" locked={!hasFeature(user, 'stock_management')} />
                                <SidebarItem to="/parties" icon={Users} label="Parties" locked={!hasFeature(user, 'parties_management')} />
                                <SidebarItem to="/ledger" icon={DollarSign} label="Ledger" locked={!hasFeature(user, 'ledger_management')} />
                            </div>
                        )}
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
                        {user?.role}{!isSysAdmin && !isLimited ? ` · ${businessType}` : ''}
                    </div>
                </div>

                {!isSysAdmin && !isLimited && (
                    <SidebarItem to="/settings" icon={Settings} label="Settings" locked={!hasFeature(user, 'admin_panel')} />
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
