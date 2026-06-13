import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import PageLoader from './PageLoader';

const ProtectedRoute = () => {
    const { user, loading } = useAuth();
    const [showMobileNav, setShowMobileNav] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1024);

    useEffect(() => {
        const handleResize = () => setShowMobileNav(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (loading) return <PageLoader message="Loading your workspace..." fullscreen />;
    if (!user) return <Navigate to="/login" />;

    return (
        <div className="layout-container">
            <Sidebar />
            <div className="main-content w-full overflow-auto">
                <Outlet />
            </div>
            {showMobileNav && <MobileNav />}
        </div>
    );
};

export default ProtectedRoute;
