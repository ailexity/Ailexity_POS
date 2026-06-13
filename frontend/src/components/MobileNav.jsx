import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, ShoppingBag, Package, FileText, Settings, Shield, BarChart3, Bell, Boxes } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const normalizeBusinessType = (businessType) => {
    const value = String(businessType || '').toLowerCase();
    if (value.includes('retail')) return 'retailer';
    return 'restaurant';
};

const MobileNav = () => {
    const { user } = useAuth();
    const isSysAdmin = user?.role === 'sysadmin';
    const businessType = normalizeBusinessType(user?.business_type);
    const isRestaurant = !isSysAdmin && businessType === 'restaurant';
    const isRetailer = !isSysAdmin && businessType === 'retailer';

    if (!user) return null;

    return (
        <nav className="mobile-nav" aria-label="Primary">
            {!isSysAdmin && (
                <>
                    <NavLink to="/dashboard" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`} aria-label="Dashboard" title="Dashboard">
                        <Home size={20} />
                    </NavLink>
                    <NavLink to="/pos" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`} aria-label="Billing" title="Billing">
                        <ShoppingBag size={20} />
                    </NavLink>

                    {isRestaurant && (
                        <NavLink to="/history" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`} aria-label="History" title="History">
                            <FileText size={20} />
                        </NavLink>
                    )}

                    {isRestaurant && (
                        <NavLink to="/items" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`} aria-label="Inventory" title="Inventory">
                            <Package size={20} />
                        </NavLink>
                    )}

                    {isRetailer && (
                        <NavLink to="/stock" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`} aria-label="Stock" title="Stock">
                            <Boxes size={20} />
                        </NavLink>
                    )}

                    <NavLink to="/settings" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`} aria-label="Settings" title="Settings">
                        <Settings size={20} />
                    </NavLink>
                </>
            )}

            {isSysAdmin && (
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
        </nav>
    );
};

export default MobileNav;
