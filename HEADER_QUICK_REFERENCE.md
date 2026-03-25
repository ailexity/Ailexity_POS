# Header Unification - Quick Reference Guide

## For Developers: How to Add a PageHeader to a New Page

### Step 1: Import the PageHeader Component
```jsx
import PageHeader from '../components/PageHeader';
```

### Step 2: Import Your Page Icon
```jsx
import { YourIcon } from 'lucide-react';
```

### Step 3: Use PageHeader in Your Component
```jsx
<PageHeader 
  icon={YourIcon}
  title="Your Page Title"
  subtitle="Your page description"
>
  {/* Optional: Add action buttons here */}
  <button className="btn">Action</button>
</PageHeader>
```

### Complete Example:
```jsx
import React from 'react';
import PageHeader from '../components/PageHeader';
import { Users } from 'lucide-react';

export default function MyPage() {
  return (
    <div className="page-container">
      <PageHeader 
        icon={Users}
        title="User Management"
        subtitle="Manage all users in your system"
      >
        <button className="btn" onClick={handleAdd}>
          Add User
        </button>
      </PageHeader>

      <div className="content-area">
        {/* Your page content here */}
      </div>
    </div>
  );
}
```

## Mobile Branding Bar

The mobile branding bar "Ailexity POS Powered by Ailexity" is automatically:
- ✅ Added to all pages using PageHeader component
- ✅ Visible only on mobile devices (< 640px width)
- ✅ Hidden on tablets and desktops
- ✅ Processed without any additional code

## CSS Classes Reference

### Header Related Classes
- `.mobile-branding-bar` - Mobile-only branding bar (auto-hidden on desktop)
- `.header-section` - Main header container
- `.page-title` - Title and subtitle wrapper
- `.page-title h1` - Page title element
- `.page-title p` - Page subtitle element

### Responsive Breakpoints
- **Mobile:** < 640px (includes branding bar)
- **Tablet:** 640px - 1023px (no branding bar)
- **Desktop:** ≥ 1024px (no branding bar)

## Pages Using PageHeader (Unified Headers)

| Page | Icon | Title | Subtitle |
|------|------|-------|----------|
| Items | Package | Item Management | Manage your inventory |
| History | FileText | History | Manage past transactions |
| Admin | Shield | System Administration | Manage users and access control |
| Alerts | Bell | Alerts Management | Send notifications to your users |
| Orders | ShoppingBag | Online Orders | Manage orders from all platforms |
| Settings | Settings | Settings | Manage your business and account settings |

## Pages With Custom Headers (Branding Bar Manually Added)

- **POS.jsx** - Has table selector, so kept custom header + added branding bar
- **Dashboard.jsx** - Has greeting section, so kept custom header + added branding bar

## Styling Standards

All headers follow these CONSISTENT standards:

### Colors
- Background: `#ffffff` (white)
- Border: `#e2e8f0` (light gray)
- Icon Background: `#6366f1` (indigo-600)
- Text: `#1e293b` (dark slate)
- Subtitle: `#64748b` (muted slate)

### Spacing
- **Mobile Padding:** 0.75rem
- **Tablet Padding:** 1rem - 1.5rem
- **Desktop Padding:** 1.5rem
- **Gap between elements:** 0.75rem - 1.5rem

### Typography
- **Mobile H1:** 1.125rem / 700 weight
- **Tablet+ H1:** 1.375rem / 700 weight
- **Subtitle Mobile:** 0.75rem / 400 weight
- **Subtitle Tablet+:** 0.875rem / 400 weight

### Icon
- Size: 32px × 32px
- Background: Indigo-600
- Icon: White color
- Shape: Square (no border-radius)

## Performance Notes

- PageHeader component is lightweight (< 1KB compressed)
- No external dependencies beyond lucide-react
- Mobile branding bar uses CSS display:none (no DOM removal)
- Responsive without JavaScript
- Compatible with all modern browsers

## Component Props

```typescript
interface PageHeaderProps {
  icon?: React.ComponentType;           // Lucide-react icon
  title: string;                         // Page title
  subtitle?: string;                     // Optional subtitle
  className?: string;                    // Optional CSS class
  children?: React.ReactNode;            // Action buttons, etc.
}
```

## Common Icon Imports
```jsx
import { 
  Package,           // Items
  FileText,          // History
  Shield,            // Admin
  Bell,              // Alerts
  ShoppingBag,       // Orders
  Settings,          // Settings
  Grid,              // POS/Billing
  LayoutDashboard    // Dashboard
} from 'lucide-react';
```

## Troubleshooting

### Branding Bar Not Showing
- Check if viewport width is < 640px
- Verify `.mobile-branding-bar` CSS is in index.css
- Check browser DevTools for CSS display property

### Header Misalignment
- Ensure page uses `.page-container` as wrapper
- Check if padding/margin is being overridden
- Verify z-index for fixed/sticky elements (should be ≥ 10)

### Icon Not Displaying
- Verify icon import from lucide-react
- Pass icon as component reference (not string)
- Check icon size (default 18px, adjust with `size` prop if needed)

## Future Enhancements

Potential improvements for next iteration:
1. Add breadcrumb navigation support
2. Add search functionality to headers
3. Add user profile dropdown
4. Add theme toggle option
5. Add animated transitions
6. Add sticky header toggle option
7. MultiLanguage support for subtitle

## Related Files

- Component: `frontend/src/components/PageHeader.jsx`
- Styles: `frontend/src/index.css` (lines ~765-825)
- Mobile Branding: `frontend/src/index.css` (lines ~765-785)
- Documentation: `UNIFIED_HEADER_IMPLEMENTATION.md`

---

**Last Updated:** February 17, 2026
**Version:** 1.0
**Status:** Production Ready
