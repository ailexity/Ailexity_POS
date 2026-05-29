export const normalizeBusinessType = (businessType) => {
  const value = String(businessType || '').toLowerCase();
  if (value.includes('retail')) return 'retailer';
  return 'restaurant';
};

export const hasFeature = (user, featureKey) => {
  if (!user || !featureKey) return false;
  if (user.role === 'sysadmin') return true;
  return Boolean(user.features?.[featureKey]);
};

export const canAccessOrderManagement = (user) => hasFeature(user, 'order_management');

export const getDefaultUserPath = (user) => {
  if (!user) return '/login';
  if (user.role === 'sysadmin') return '/system';

  const businessType = normalizeBusinessType(user.business_type);
  if (hasFeature(user, 'dashboard')) return '/dashboard';
  if (hasFeature(user, 'pos_billing')) return '/pos';
  if (hasFeature(user, 'invoices')) return '/history';
  if (hasFeature(user, 'attendees_management')) return '/attendees';

  if (businessType === 'restaurant') {
    if (hasFeature(user, 'items_management')) return '/items';
    if (canAccessOrderManagement(user)) return '/orders';
  }

  if (businessType === 'retailer') {
    if (hasFeature(user, 'stock_management')) return '/stock';
    if (hasFeature(user, 'parties_management')) return '/parties';
    if (hasFeature(user, 'ledger_management')) return '/ledger';
  }

  return '/settings';
};
