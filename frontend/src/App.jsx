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
import InvoiceView from './pages/InvoiceView';
import StockManagement from './pages/StockManagement';
import PartyManagement from './pages/PartyManagement';
import LedgerManagement from './pages/LedgerManagement';
import './index.css';

const normalizeBusinessType = (businessType) => {
  const value = String(businessType || '').toLowerCase();
  if (value.includes('retail')) return 'retailer';
  return 'restaurant';
};

const BusinessTypeRoute = ({ allow, children }) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'sysadmin') return <Navigate to="/system" replace />;

  const businessType = normalizeBusinessType(user.business_type);
  if (!allow.includes(businessType)) {
    return <Navigate to={businessType === 'retailer' ? '/stock' : '/dashboard'} replace />;
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
            navigate(isSysAdmin ? '/system' : '/dashboard');
            break;
          case 'b':
            e.preventDefault();
            if (!isSysAdmin) navigate('/pos');
            break;
          case 'h':
            e.preventDefault();
            if (!isSysAdmin) navigate('/history');
            break;
          case 'i':
            e.preventDefault();
            if (isRestaurant) navigate('/items');
            break;
          case 'k':
            e.preventDefault();
            if (isRetailer) navigate('/stock');
            break;
          case 'p':
            e.preventDefault();
            if (isRetailer) navigate('/parties');
            break;
          case 'g':
            e.preventDefault();
            if (isRetailer) navigate('/ledger');
            break;
          case 'o':
            e.preventDefault();
            if (isRestaurant && user?.enable_order_management) navigate('/orders');
            break;
          case 's':
            e.preventDefault();
            if (!isSysAdmin) navigate('/settings');
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
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/system" element={<SystemDashboard />} />
              <Route path="/pos" element={<POS />} />
              <Route path="/items" element={<BusinessTypeRoute allow={['restaurant']}><Items /></BusinessTypeRoute>} />
              <Route path="/history" element={<BusinessTypeRoute allow={['restaurant', 'retailer']}><History /></BusinessTypeRoute>} />
              <Route path="/orders" element={<BusinessTypeRoute allow={['restaurant']}><OrderManagement /></BusinessTypeRoute>} />
              <Route path="/stock" element={<BusinessTypeRoute allow={['retailer']}><StockManagement /></BusinessTypeRoute>} />
              <Route path="/parties" element={<BusinessTypeRoute allow={['retailer']}><PartyManagement /></BusinessTypeRoute>} />
              <Route path="/ledger" element={<BusinessTypeRoute allow={['retailer']}><LedgerManagement /></BusinessTypeRoute>} />
              <Route path="/admin" element={<AdminManagement />} />
              <Route path="/alerts" element={<AlertsManagement />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
