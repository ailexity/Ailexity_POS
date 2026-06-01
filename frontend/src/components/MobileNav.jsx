import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, ShoppingBag, Package, FileText, Settings, Shield, BarChart3, Bell, Boxes, Users, DollarSign, UserCheck, Lock, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { canAccessOrderManagement, hasFeature, normalizeBusinessType, isLimitedRoleUser } from '../utils/featureAccess';

const accessMessage = 'This feature is locked for your account. Please contact admin to access it.';

const MobileNavItem = ({ to, icon: Icon, label, locked = false }) => {
    if (locked) {
        return (
            <button
                type="button"
                className="mobile-nav-item mobile-nav-item-locked"
                aria-label={`${label} locked. Contact admin to access it.`}
                title={accessMessage}
                onClick={() => window.alert(accessMessage)}
            >
                <Icon size={20} />
                <Lock size={12} className="mobile-nav-lock-icon" aria-hidden="true" />
            </button>
        );
    }

    return (
        <NavLink to={to} className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`} aria-label={label} title={label}>
            <Icon size={20} />
        </NavLink>
    );
};

const MobileNav = () => {
    const { user, logout } = useAuth();
    const isSysAdmin = user?.role === 'sysadmin';
    const isLimited = isLimitedRoleUser(user);
    const businessType = normalizeBusinessType(user?.business_type);
    const isRetailer = !isSysAdmin && businessType === 'retailer';
    const isRestaurant = !isSysAdmin && businessType === 'restaurant';

    if (!user) return null;

    return (
        <nav className="mobile-nav" aria-label="Primary" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
                {isLimited ? (
                    // Simplified for KOT/attendee users
                    <>
                        {user?.role === 'kitchen' && hasFeature(user, 'kot_printing') && (
                            <MobileNavItem to="/kots" icon={Package} label="Kitchen Orders" />
                        )}
                        {user?.role === 'attendee' && hasFeature(user, 'pos_billing') && (
                            <MobileNavItem to="/pos" icon={ShoppingBag} label="Billing" />
                        )}
                    </>
                ) : !isSysAdmin ? (
                    <>
                        <MobileNavItem to="/dashboard" icon={Home} label="Dashboard" locked={!hasFeature(user, 'dashboard')} />
                        <MobileNavItem to="/pos" icon={ShoppingBag} label="Billing" locked={!hasFeature(user, 'pos_billing')} />
                        <MobileNavItem to="/history" icon={FileText} label={isRetailer ? 'Invoices' : 'History'} locked={!hasFeature(user, 'invoices')} />
                        <MobileNavItem to="/employees" icon={UserCheck} label="Employees" locked={!hasFeature(user, 'attendees_management')} />
                        {isRestaurant && (
                            <>
                                <MobileNavItem to="/items" icon={Package} label="Inventory" locked={!hasFeature(user, 'items_management')} />
                                <MobileNavItem to="/orders" icon={Package} label="Online Orders" locked={!canAccessOrderManagement(user)} />
                            </>
                        )}
                        {isRetailer && (
                            <>
                                <MobileNavItem to="/stock" icon={Boxes} label="Stock" locked={!hasFeature(user, 'stock_management')} />
                                <MobileNavItem to="/parties" icon={Users} label="Parties" locked={!hasFeature(user, 'parties_management')} />
                                <MobileNavItem to="/ledger" icon={DollarSign} label="Ledger" locked={!hasFeature(user, 'ledger_management')} />
                            </>
                        )}
                        <MobileNavItem to="/settings" icon={Settings} label="Settings" locked={!hasFeature(user, 'admin_panel')} />
                    </>
                ) : (
                    <>
                        <NavLink to="/system" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`} aria-label="System Dashboard" title="System Dashboard">
                            <BarChart3 size={20} />
                        </NavLink>
                        <NavLink to="/admin" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`} aria-label="System Admin" title="System Admin">
                            <Shield size={20} />
                        </NavLink>
                        <NavLink to="/alerts" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`} aria-label="Alerts" title="Alerts">
                            <Bell size={20} />
                        </NavLink>
                    </>
                )}
            </div>

            <button
                onClick={logout}
                className="mobile-nav-item"
                aria-label="Logout"
                title="Logout"
                style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
            >
                <LogOut size={20} />
            </button>
        </nav>
    );
}};

export default MobileNav;
