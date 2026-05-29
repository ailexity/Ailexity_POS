import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardRedirect from './components/DashboardRedirect';
import AlertPopup from './components/AlertPopup';
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
import AttendeesManagement from './pages/AttendeesManagement';
import { Lock } from 'lucide-react';
import './index.css';
import { canAccessOrderManagement, getDefaultUserPath, hasFeature, normalizeBusinessType } from './utils/featureAccess';

const AccessDisabled = () => (
  <div className="page-container with-mobile-header-offset">
    <div className="content-area">
      <div className="access-disabled-card">
        <div className="access-disabled-icon">
          <Lock size={28} />
        </div>
        <h2>Feature locked</h2>
        <p className="text-muted mt-2">This feature is restricted by the system admin. Please contact admin to access it.</p>
      </div>
    </div>
  </div>
);

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
    return <AccessDisabled />;
  }

  return children;
};

const FeatureRoute = ({ feature, children }) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'sysadmin') return <Navigate to="/system" replace />;
  if (!hasFeature(user, feature)) {
    return <AccessDisabled />;
  }

  return children;
};

// Keyboard shortcuts handler component
const KeyboardShortcuts = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const isSysAdmin = user?.role === 'sysadmin';
  const businessType = normalizeBusinessType(user?.business_type);
  const isRestaurant = !isSysAdmin && businessType === 'restaurant';
  const isRetailer = !isSysAdmin && businessType === 'retailer';

  React.useEffect(() => {
    const handleKeyboardShortcuts = (e) => {
      // Don't trigger shortcuts when typing in inputs
      const activeElement = document.activeElement;
      const isTyping = activeElement.tagName === 'INPUT' || 
                       activeElement.tagName === 'TEXTAREA' || 
                       activeElement.isContentEditable;

      // Allow Escape key even when typing (to blur inputs)
      if (e.key === 'Escape' && isTyping) {
        activeElement.blur();
        return;
      }

      // Alt + Enter for fullscreen - works everywhere, even when typing
      if (e.altKey && e.key === 'Enter') {
        e.preventDefault();
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(err => {
            console.error('Error attempting to enable fullscreen:', err);
          });
        } else {
          document.exitFullscreen().catch(err => {
            console.error('Error attempting to exit fullscreen:', err);
          });
        }
        return;
      }

      if (isTyping) return;

      // Don't trigger on login page
      if (location.pathname === '/login') return;

      // Alt + key shortcuts for navigation
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
            if (isRetailer && hasFeature(user, 'stock_management')) navigate('/stock');
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

      // Ctrl + key shortcuts for actions
      if (e.ctrlKey && !e.shiftKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case '/':
            e.preventDefault();
            // Focus search input if exists
            const searchInput = document.querySelector('input[type="text"][placeholder*="Search"], input[type="search"]');
            if (searchInput) searchInput.focus();
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyboardShortcuts);
    return () => window.removeEventListener('keydown', handleKeyboardShortcuts);
  }, [navigate, location, user, isSysAdmin, isRestaurant, isRetailer, logout]);

  return null;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <KeyboardShortcuts />
          <AlertPopup />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/login" element={<Login />} />
            
            {/* Public invoice view - no authentication required */}
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
              <Route path="/stock" element={<BusinessTypeRoute allow={['retailer']} feature="stock_management"><StockManagement /></BusinessTypeRoute>} />
              <Route path="/parties" element={<BusinessTypeRoute allow={['retailer']} feature="parties_management"><PartyManagement /></BusinessTypeRoute>} />
              <Route path="/ledger" element={<BusinessTypeRoute allow={['retailer']} feature="ledger_management"><LedgerManagement /></BusinessTypeRoute>} />
              <Route path="/attendees" element={<FeatureRoute feature="attendees_management"><AttendeesManagement /></FeatureRoute>} />
              <Route path="/admin" element={<AdminManagement />} />
              <Route path="/alerts" element={<AlertsManagement />} />
              <Route path="/settings" element={<FeatureRoute feature="admin_panel"><Settings /></FeatureRoute>} />
            </Route>

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
