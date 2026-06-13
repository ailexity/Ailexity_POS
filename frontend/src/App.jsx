import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardRedirect from './components/DashboardRedirect';
import AlertPopup from './components/AlertPopup';
import ShortcutsOverlay from './components/ShortcutsOverlay';
import OfflineBanner from './components/OfflineBanner';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import LandingPage from './pages/LandingPage';
import FeaturesPage from './pages/FeaturesPage';
import HowItWorks from './pages/HowItWorks';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SystemDashboard from './pages/SystemDashboard';
import POS from './pages/POS';
import Items from './pages/Items';
import History from './pages/History';
import AdminManagement from './pages/AdminManagement';
import AlertsManagement from './pages/AlertsManagement';
import Settings from './pages/Settings';
import OrderManagement from './pages/OrderManagement';
import KOTManagement from './pages/KOTManagement';
import InvoiceView from './pages/InvoiceView';
import StockManagement from './pages/StockManagement';
import PartyManagement from './pages/PartyManagement';
import LedgerManagement from './pages/LedgerManagement';
import EmployeesManagement from './pages/EmployeesManagement';
import { Lock, Mail } from 'lucide-react';
import './index.css';
import { canAccessOrderManagement, getDefaultUserPath, hasFeature, normalizeBusinessType, isLimitedRoleUser } from './utils/featureAccess';

/* ── feature metadata for the lock screen ─────────────────────────────── */
const FEATURE_META = {
  pos_billing:          { label: 'POS Billing',          desc: 'Access to the billing and cart system.' },
  invoices:             { label: 'Invoices',              desc: 'View, search, and export invoice history.' },
  dashboard:            { label: 'Dashboard',             desc: 'Analytics, KPIs, and business overview.' },
  stock_management:     { label: 'Stock Management',      desc: 'Track inventory levels and stock movements.' },
  items_management:     { label: 'Items Management',      desc: 'Create and manage menu/product catalogue.' },
  kot_printing:         { label: 'KOT Printing',          desc: 'Kitchen Order Ticket management.' },
  order_management:     { label: 'Order Management',      desc: 'Manage orders from Zomato, Swiggy, and more.' },
  ledger_management:    { label: 'Ledger Management',     desc: 'Party accounting and payables/receivables.' },
  parties_management:   { label: 'Parties Management',    desc: 'Manage suppliers and customers.' },
  payment_tracking:     { label: 'Payment Tracking',      desc: 'Track and reconcile payments.' },
  attendees_management: { label: 'Attendees Management',  desc: 'Create and manage staff logins.' },
  alerts:               { label: 'Alerts',                desc: 'View and manage system alerts.' },
  admin_panel:          { label: 'Admin Panel',           desc: 'Business settings and configuration.' },
};

const AccessDisabled = ({ feature }) => {
  const { user } = useAuth();
  const meta = FEATURE_META[feature] || { label: 'This feature', desc: 'This feature is not available for your account.' };
  const adminName = user?.full_name || user?.username || 'your administrator';

  return (
    <div className="page-container with-mobile-header-offset">
      <div className="content-area">
        <div className="access-disabled-card">
          <div className="access-disabled-icon">
            <Lock size={26} />
          </div>
          <span className="access-disabled-badge">
            <Lock size={10} /> Feature Locked
          </span>
          <h2 className="access-disabled-title">{meta.label} is disabled</h2>
          <p className="access-disabled-desc">{meta.desc} Your admin has not enabled this for your account.</p>
          <div className="access-disabled-meta">
            <span>What to do</span>
            <strong>Contact {adminName} to request access to this feature.</strong>
            {user?.email && (
              <a href={`mailto:${user.email}`} style={{ fontSize: 12, color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Mail size={12} /> {user.email}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const BusinessTypeRoute = ({ allow, feature, children }) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'sysadmin') return <Navigate to="/system" replace />;

  const businessType = normalizeBusinessType(user.business_type);
  if (!allow.includes(businessType)) {
    return <Navigate to={getDefaultUserPath(user)} replace />;
  }

  const featureAllowed = feature === 'order_management'
    ? canAccessOrderManagement(user)
    : hasFeature(user, feature);

  if (!featureAllowed) {
    return <AccessDisabled feature={feature} />;
  }

  return children;
};

const FeatureRoute = ({ feature, children }) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'sysadmin') return <Navigate to="/system" replace />;

  if (feature === 'admin_panel') {
    if (isLimitedRoleUser(user)) {
      return <Navigate to={getDefaultUserPath(user)} replace />;
    }
    return children;
  }

  if (!hasFeature(user, feature)) {
    return <AccessDisabled feature={feature} />;
  }

  return children;
};

/* ── keyboard shortcuts handler ────────────────────────────────────────── */
const KeyboardShortcuts = ({ onShowShortcuts }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const isSysAdmin = user?.role === 'sysadmin';
  const businessType = normalizeBusinessType(user?.business_type);
  const isRestaurant = !isSysAdmin && businessType === 'restaurant';
  const isRetailer = !isSysAdmin && businessType === 'retailer';

  React.useEffect(() => {
    const handleKeyboardShortcuts = (e) => {
      const activeElement = document.activeElement;
      const isTyping = activeElement.tagName === 'INPUT' ||
                       activeElement.tagName === 'TEXTAREA' ||
                       activeElement.isContentEditable;

      if (e.key === 'Escape' && isTyping) {
        activeElement.blur();
        return;
      }

      if (e.altKey && e.key === 'Enter') {
        e.preventDefault();
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
        return;
      }

      if (isTyping) return;
      if (location.pathname === '/login') return;

      // ? — show shortcuts overlay
      if (e.key === '?' && !e.altKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onShowShortcuts();
        return;
      }

      if (e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'd':
            e.preventDefault();
            navigate(isSysAdmin ? '/system' : hasFeature(user, 'dashboard') ? '/dashboard' : getDefaultUserPath(user));
            break;
          case 'b':
            e.preventDefault();
            if (!isSysAdmin && hasFeature(user, 'pos_billing')) navigate('/pos');
            break;
          case 'h':
            e.preventDefault();
            if (!isSysAdmin && hasFeature(user, 'invoices')) navigate('/history');
            break;
          case 'i':
            e.preventDefault();
            if (isRestaurant && hasFeature(user, 'items_management')) navigate('/items');
            break;
          case 'k':
            e.preventDefault();
            if (hasFeature(user, 'stock_management')) navigate('/stock');
            break;
          case 'p':
            e.preventDefault();
            if (isRetailer && hasFeature(user, 'parties_management')) navigate('/parties');
            break;
          case 'g':
            e.preventDefault();
            if (isRetailer && hasFeature(user, 'ledger_management')) navigate('/ledger');
            break;
          case 'o':
            e.preventDefault();
            if (isRestaurant && canAccessOrderManagement(user)) navigate('/orders');
            break;
          case 's':
            e.preventDefault();
            if (!isSysAdmin && hasFeature(user, 'admin_panel')) navigate('/settings');
            break;
          case 'a':
            e.preventDefault();
            if (isSysAdmin) navigate('/admin');
            break;
          case 'l':
            e.preventDefault();
            if (isSysAdmin) navigate('/alerts');
            break;
          case 'q':
            e.preventDefault();
            logout();
            break;
          default:
            break;
        }
      }

      if (e.ctrlKey && !e.shiftKey && !e.altKey) {
        if (e.key === '/') {
          e.preventDefault();
          const searchInput = document.querySelector('input[type="text"][placeholder*="Search"], input[type="search"]');
          if (searchInput) searchInput.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyboardShortcuts);
    return () => window.removeEventListener('keydown', handleKeyboardShortcuts);
  }, [navigate, location, user, isSysAdmin, isRestaurant, isRetailer, logout, onShowShortcuts]);

  return null;
};

/* ── session-expired toast ──────────────────────────────────────────────── */
const SessionExpiredToast = () => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const handler = () => setVisible(true);
    window.addEventListener('session-expired', handler);
    return () => window.removeEventListener('session-expired', handler);
  }, []);
  if (!visible) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      background: '#1e293b', color: '#fff', padding: '12px 20px', borderRadius: 10,
      fontSize: 14, fontWeight: 600, zIndex: 9999, display: 'flex', alignItems: 'center',
      gap: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.25)', animation: 'slideUp 0.2s ease',
    }}>
      <span style={{ fontSize: 18 }}>⚠️</span>
      Session expired — redirecting to login…
    </div>
  );
};

/* ── app shell ──────────────────────────────────────────────────────────── */
function AppShell() {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const { isOnline, pendingCount, syncing, syncResult, syncNow } = useOnlineStatus();

  return (
    <>
      <KeyboardShortcuts onShowShortcuts={() => setShowShortcuts(true)} />
      <AlertPopup />
      <SessionExpiredToast />
      <OfflineBanner
        isOnline={isOnline}
        pendingCount={pendingCount}
        syncing={syncing}
        syncResult={syncResult}
        onSyncNow={syncNow}
      />
      {showShortcuts && <ShortcutsOverlay onClose={() => setShowShortcuts(false)} />}
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/login" element={<Login />} />
        <Route path="/invoice/:invoiceId" element={<InvoiceView />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={<DashboardRedirect />} />
          <Route path="/dashboard" element={<FeatureRoute feature="dashboard"><Dashboard /></FeatureRoute>} />
          <Route path="/system" element={<SystemDashboard />} />
          <Route path="/pos" element={<FeatureRoute feature="pos_billing"><POS /></FeatureRoute>} />
          <Route path="/items" element={<BusinessTypeRoute allow={['restaurant']} feature="items_management"><Items /></BusinessTypeRoute>} />
          <Route path="/history" element={<BusinessTypeRoute allow={['restaurant', 'retailer']} feature="invoices"><History /></BusinessTypeRoute>} />
          <Route path="/orders" element={<BusinessTypeRoute allow={['restaurant']} feature="order_management"><OrderManagement /></BusinessTypeRoute>} />
          <Route path="/kots" element={<BusinessTypeRoute allow={['restaurant']} feature="kot_printing"><KOTManagement /></BusinessTypeRoute>} />
          <Route path="/stock" element={<BusinessTypeRoute allow={['restaurant', 'retailer']} feature="stock_management"><StockManagement /></BusinessTypeRoute>} />
          <Route path="/parties" element={<BusinessTypeRoute allow={['retailer']} feature="parties_management"><PartyManagement /></BusinessTypeRoute>} />
          <Route path="/ledger" element={<BusinessTypeRoute allow={['retailer']} feature="ledger_management"><LedgerManagement /></BusinessTypeRoute>} />
          <Route path="/employees" element={<FeatureRoute feature="attendees_management"><EmployeesManagement /></FeatureRoute>} />
          <Route path="/admin" element={<AdminManagement />} />
          <Route path="/alerts" element={<AlertsManagement />} />
          <Route path="/settings" element={<FeatureRoute feature="admin_panel"><Settings /></FeatureRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppShell />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
