# 🧾 Order Management System - Implementation Guide

## ✅ Feature Overview

A comprehensive Order Management System has been implemented with full feature toggle control for each user. This system allows restaurant staff to manage orders from multiple platforms (Zomato, Swiggy, Website, App) with real-time tracking and status management.

---

## 🔧 Backend Changes

### 1. **User Model Update** (`ailexity_backend/models.py`)
- Added `enable_order_management: bool` field to UserDocument
- Defaults to `False` for new users
- Can be toggled on/off per user

### 2. **API Schema Update** (`ailexity_backend/schemas.py`)
- Added `enable_order_management` to UserBase schema
- Available in all user creation and update operations

### 3. **User Endpoints** (`ailexity_backend/routers/users.py`)
- Updated `/users/` (POST) - Create user with feature flag
- Updated `/users/{user_id}` (PUT) - Edit user and toggle feature

---

## 🎨 Frontend Implementation

### 1. **New Order Management Page**
**File:** `frontend/src/pages/OrderManagement.jsx`

#### Features Implemented:

##### 📋 Order Cards (Main View)
- Order ID (auto-generated)
- Order Time & Elapsed Time
- Order Type (Dine-in, Takeaway, Delivery)
- Customer Name & Phone
- Delivery Address (if applicable)
- Total Amount
- Payment Status

##### 🔄 Order Status Flow
- **New** 🔴
- **Accepted** 🟠
- **Preparing** 🟡
- **Ready** 🟢
- **Out for Delivery** 🔵
- **Delivered** ✅

##### 📊 Detailed Order View (Right Panel)
- Full customer details
- Item breakdown with quantities and prices
- Bill breakdown summary
- Payment status badge
- Quick action buttons:
  - 🖨 Print KOT (Kitchen Order Ticket)
  - 📄 Print Bill
  - 💬 Send WhatsApp

##### 🔍 Filters & Search
- **Search:** By Order ID, Customer Name, Phone
- **Filter by Status:** All, New, Accepted, Preparing, Ready, Out for Delivery, Delivered
- **Filter by Type:** All, Dine-in, Takeaway, Delivery
- **Filter by Platform:** All, Website, App, Zomato, Swiggy, POS
- **Sort:** Newest First, Oldest First, By Priority

##### 🔔 Notifications
- Sound alerts toggle (🔊)
- Visual notifications toggle (🔔)
- Auto-refresh every 5 seconds

---

### 2. **System Dashboard Update**
**File:** `frontend/src/pages/SystemDashboard.jsx`

**New Control Added:**
- When editing a user (as Sysadmin), there's now an **"Order Management"** toggle
- Color-coded: Amber (#f59e0b) when enabled
- Provides clear description of the feature
- Easy enable/disable for any user

**Location:** Edit User Modal → "Order Management" section (after Multi-Device Settings)

---

### 3. **Sidebar Integration**
**File:** `frontend/src/components/Sidebar.jsx`

- **New Navigation Link:** "Orders" (📦 icon)
- Only visible to non-sysadmin users with `enable_order_management` enabled
- Positioned after Items in navigation menu
- Keyboard shortcut: **Alt + O**

---

### 4. **Routing**
**File:** `frontend/src/App.jsx`

- Route added: `/orders` → OrderManagement component
- Protected route (requires authentication)
- Security check ensures only enabled users can access
- Keyboard shortcut: Alt + O for quick navigation

---

## 🚀 Usage Instructions

### For System Admin (Sysadmin):

1. **Enable Feature for User:**
   - Navigate to System Dashboard
   - Edit desired user
   - Scroll to "Order Management" section
   - Toggle "Enable Order Management System" ON
   - Save changes

2. **Disable Feature for User:**
   - Follow same steps
   - Toggle OFF
   - Save changes

### For Staff/Users:

1. **Access Order Management:**
   - Look for "Orders" in sidebar (shows only if enabled)
   - Or press **Alt + O** for quick navigation
   - Or navigate to `/orders`

2. **View Orders:**
   - See all orders in card format
   - Click any order to see full details in right panel
   - Auto-refreshes every 5 seconds

3. **Filter Orders:**
   - Use search bar for Order ID, Customer Name, Phone
   - Filter by Status, Type (Dine-in/Takeaway/Delivery), Platform
   - Sort by newest/oldest/priority

4. **Update Order Status:**
   - Click on order to open details
   - Status timeline shows all available statuses
   - Click status to mark as that status (Admin Controls)

5. **Quick Actions:**
   - Print KOT (Kitchen Order Ticket)
   - Print Bill (Customer Invoice)
   - Send WhatsApp notification to customer

6. **Notifications:**
   - Enable/disable sound alerts with speaker icon
   - Enable/disable visual notifications with bell icon
   - Toggle based on your preference

---

## 🔐 Security & Access Control

### Permission Hierarchy:
- **Sysadmin:** Can enable/disable for any user
- **Admin:** Can access Orders feature if enabled by Sysadmin
- **Regular Users:** Cannot see Orders tab until feature is enabled

### Data Isolation:
- Each user sees orders from their business/account
- Multi-business support ready

---

## 📱 Data Sources

The Order Management system pulls from:
1. **Invoices Collection** - Existing invoice data with order fields
2. **Order Fields** (now stored with invoices):
   - `order_type` - dine-in, takeaway, delivery
   - `order_source` - website, app, zomato, swiggy, pos
   - `status` - new, accepted, preparing, ready, out_for_delivery, delivered
   - `delivery_address` - for delivery orders
   - `rider_name`, `rider_phone`, `rider_otp` - for delivery

---

## 🔄 Future Integration Points

The system is ready for:

### 1. **External Platform APIs**
```python
# Backend routes ready to add:
- POST /orders/import/zomato
- POST /orders/import/swiggy
- GET /orders/sync/all
```

### 2. **Real-time Updates**
- WebSocket support for live order updates
- Signal system for status changes
- Notification service integration

### 3. **Advanced Features**
- SLA (Service Level Agreement) timers
- Auto-alerts for delayed orders
- Delivery partner assignment
- OTP verification for deliveries
- Analytics & reporting

---

## 📊 Field Mapping

### Order Document Structure:
```json
{
  "id": "invoice_id",
  "invoice_number": "#A1024",
  "customer_name": "John Doe",
  "customer_phone": "9876543210",
  "customer_address": "123 Main St, City",
  "order_type": "dine-in | takeaway | delivery",
  "order_source": "website | app | zomato | swiggy | pos",
  "status": "new | accepted | preparing | ready | out_for_delivery | delivered",
  "total_amount": 450.00,
  "payment_mode": "Cash | UPI | Card | Online",
  "payment_status": "paid | pending",
  "items": [...],
  "created_at": "2024-01-15T10:30:00",
  "delivery_time": "00:45",
  "rider_name": "Raj Kumar",
  "rider_phone": "9876543211",
  "rider_otp": "1234",
  "table_name": "Table 4"
}
```

---

## 🎯 Feature Toggle Status

| User | Feature Enabled | Sidebar Link | Access `/orders` |
|------|-----------------|--------------|------------------|
| New User | ❌ No | Hidden | Protected |
| Enabled by Sysadmin | ✅ Yes | Visible | ✅ Full |
| Disabled by Sysadmin | ❌ No | Hidden | Protected |

---

## 💡 Best Practices

1. **Enable Strategically:** Only enable for users who need order management
2. **Keyboard Shortcuts:** Train staff on Alt + O for quick access
3. **Auto-Refresh:** System auto-refreshes every 5 seconds (no manual action needed)
4. **Sound Alerts:** Use in busy environments for status notifications
5. **Status Updates:** Update statuses promptly to keep customers informed

---

## 🐛 Troubleshooting

### Order Management link not visible?
- ✅ Verify user has `enable_order_management: true` in System Dashboard
- ✅ Refresh browser (Ctrl + R)
- ✅ Check user role (should be admin, not sysadmin)

### Can't access Orders page directly?
- ✅ System Dashboard → Edit User → Enable Order Management
- ✅ Check backend has been restarted after model changes

### Orders not loading?
- ✅ Click refresh icon in Order Management header
- ✅ Check backend API is running
- ✅ Check browser console for errors

### No auto-refresh?
- ✅ System auto-refreshes every 5 seconds
- ✅ Click refresh icon (🔄) for manual refresh

---

## 📞 Next Steps

1. **Enable Feature:** System Dashboard → Select User → Toggle Feature
2. **Test Access:** User logs in → Should see "Orders" in sidebar
3. **Test Orders:** Click Orders → Should load order list
4. **Train Staff:** Demo filtering, status updates, and quick actions

---

## 🚦 Status Color Legend

| Status | Color | Icon | Meaning |
|--------|-------|------|---------|
| New | 🔴 Red | Urgent | Just received |
| Accepted | 🟠 Orange | In Progress | Staff confirmed |
| Preparing | 🟡 Yellow | Active | Being prepared |
| Ready | 🟢 Green | Complete | Ready for pickup |
| Out for Delivery | 🔵 Blue | Travelling | On the way |
| Delivered | ✅ Green | Done | Order complete |

---

## 📝 Configuration

### Auto-Refresh Interval
**File:** `frontend/src/pages/OrderManagement.jsx` - Line ~61
```javascript
const interval = setInterval(fetchOrders, 5000); // Change 5000 to desired ms
```

### Max Orders Display
Currently shows all matching orders. Pagination can be added if needed.

### SLA Timers
Ready to be implemented. Currently tracks elapsed time only.

---

## 🎓 Training Checklist

- [ ] Sysadmin trained on enabling/disabling feature
- [ ] Staff trained on navigating to Orders
- [ ] Staff trained on filtering and searching
- [ ] Staff trained on status updates
- [ ] Staff trained on quick actions (KOT, Bill, WhatsApp)
- [ ] Staff trained on keyboard shortcuts (Alt + O)
- [ ] Sound and notification settings explained

---

**Implementation Date:** 2024
**Status:** ✅ Complete and Ready for Production
**Version:** 1.0

---

*For additional support or feature requests, contact the development team.*
