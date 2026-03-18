"""
POS Database Data Fetcher
Fetch real data from the POS database for AI responses
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from collections import Counter

logger = logging.getLogger(__name__)


class POSDataFetcher:
    """
    Fetch data from POS database for AI assistant
    """
    
    def __init__(self, db, current_user):
        """
        Initialize with database and current user
        
        Args:
            db: MongoDB database instance
            current_user: Current logged-in user (dict)
        """
        self.db = db
        self.user = current_user
        self.admin_id = self._resolve_admin_id(current_user)
        logger.info(f"POSDataFetcher initialized for user: {current_user.get('username')}")

    def _resolve_admin_id(self, current_user: Dict[str, Any]) -> Optional[str]:
        """Resolve tenant scope for data queries."""
        if current_user.get("role") == "sysadmin":
            return None
        return current_user.get("id")

    def _parse_invoice_datetime(self, value: Any) -> Optional[datetime]:
        """Safely parse invoice datetime fields from Mongo values."""
        if value is None:
            return None
        if isinstance(value, datetime):
            return value
        if isinstance(value, str):
            try:
                return datetime.fromisoformat(value.replace('Z', '+00:00'))
            except ValueError:
                return None
        return None
    
    def fetch_pos_data(self, date: Optional[datetime] = None) -> Dict[str, Any]:
        """
        Fetch comprehensive POS data from database
        
        Args:
            date: Date for which to fetch data (defaults to today)
            
        Returns:
            Dictionary with POS data
        """
        try:
            from .. import database
            
            invoice_filter = {} if self.admin_id is None else {"admin_id": self.admin_id}

            # Get all invoices for this user
            invoices = list(database.invoices_collection.find(invoice_filter))
            
            # Get all items for this user
            items = list(database.items_collection.find(invoice_filter))

            # Normalize invoice datetimes for safe comparisons
            for invoice in invoices:
                invoice["_parsed_created_at"] = self._parse_invoice_datetime(invoice.get("created_at"))
            
            # Calculate basic stats
            total_revenue = sum(inv.get("total_amount", 0) for inv in invoices)
            total_orders = len(invoices)
            total_items = len(items)
            avg_order_value = total_revenue / total_orders if total_orders > 0 else 0
            
            # Today's stats
            today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            today_invoices = [
                inv for inv in invoices 
                if inv.get("_parsed_created_at") and inv["_parsed_created_at"] >= today
            ]
            today_revenue = sum(inv.get("total_amount", 0) for inv in today_invoices)
            today_orders = len(today_invoices)
            
            # Yesterday's stats
            yesterday = today - timedelta(days=1)
            yesterday_invoices = [
                inv for inv in invoices 
                if inv.get("_parsed_created_at") and yesterday <= inv["_parsed_created_at"] < today
            ]
            yesterday_revenue = sum(inv.get("total_amount", 0) for inv in yesterday_invoices)
            yesterday_orders = len(yesterday_invoices)
            
            # This week's stats
            week_start = today - timedelta(days=today.weekday())
            week_invoices = [
                inv for inv in invoices 
                if inv.get("_parsed_created_at") and inv["_parsed_created_at"] >= week_start
            ]
            week_revenue = sum(inv.get("total_amount", 0) for inv in week_invoices)
            week_orders = len(week_invoices)
            
            # This month's stats
            month_start = today.replace(day=1)
            month_invoices = [
                inv for inv in invoices 
                if inv.get("_parsed_created_at") and inv["_parsed_created_at"] >= month_start
            ]

            # Payment mode insights
            payment_modes = Counter(
                (inv.get("payment_mode") or "Unknown")
                for inv in invoices
            )

            # Hourly order distribution
            hourly_orders = Counter()
            for inv in invoices:
                created_at = inv.get("_parsed_created_at")
                if created_at:
                    hourly_orders[created_at.hour] += 1
            peak_hour = max(hourly_orders, key=hourly_orders.get) if hourly_orders else None
            month_revenue = sum(inv.get("total_amount", 0) for inv in month_invoices)
            month_orders = len(month_invoices)
            
            # Analyze items from invoices to find top selling
            item_sales = Counter()
            item_quantities = Counter()
            for inv in invoices:
                for item in inv.get("items", []):
                    item_name = item.get("item_name")
                    item_price = item.get("unit_price", 0)
                    item_qty = item.get("quantity", 0)
                    item_sales[item_name] += item_price * item_qty
                    item_quantities[item_name] += item_qty
            
            top_items = item_sales.most_common(10)
            
            # Low stock items
            low_stock_items = [
                item.get("name") for item in items 
                if item.get("stock_quantity", 0) < 10
            ]
            
            # Build comprehensive data dictionary
            data = {
                # Overall stats
                'total_sales': total_revenue,
                'total_orders': total_orders,
                'total_items': total_items,
                'avg_order_value': avg_order_value,
                
                # Today's data
                'today_sales': today_revenue,
                'today_orders': today_orders,
                'today_avg': today_revenue / today_orders if today_orders > 0 else 0,
                
                # Yesterday's data
                'yesterday_sales': yesterday_revenue,
                'yesterday_orders': yesterday_orders,
                
                # Week data
                'week_sales': week_revenue,
                'week_orders': week_orders,
                'week_avg': week_revenue / week_orders if week_orders > 0 else 0,
                
                # Month data
                'month_sales': month_revenue,
                'month_orders': month_orders,
                'month_avg': month_revenue / month_orders if month_orders > 0 else 0,
                
                # Trends
                'sales_increase': today_revenue > yesterday_revenue if yesterday_revenue > 0 else True,
                'sales_increase_percentage': ((today_revenue - yesterday_revenue) / yesterday_revenue * 100) if yesterday_revenue > 0 else 0,
                'sales_drop': today_revenue < yesterday_revenue if yesterday_revenue > 0 else False,
                'sales_drop_percentage': ((yesterday_revenue - today_revenue) / yesterday_revenue * 100) if yesterday_revenue > 0 else 0,
                
                # Top items
                'top_items': [{'name': name, 'sales': sales} for name, sales in top_items],
                'top_item': top_items[0][0] if top_items else 'No items',
                'top_item_sales': top_items[0][1] if top_items else 0,
                
                # Item quantities
                'item_quantities': dict(item_quantities.most_common(20)),
                
                # Inventory
                'low_stock': low_stock_items,
                'low_stock_count': len(low_stock_items),
                
                # Business info
                'business_name': self.user.get("business_name") or self.user.get("username"),
                'user_role': self.user.get("role"),
                
                # Recent invoices
                'recent_invoices': [
                    {
                        'invoice_number': inv.get("invoice_number"),
                        'total': inv.get("total_amount", 0),
                        'date': inv["_parsed_created_at"].strftime('%Y-%m-%d %H:%M') if inv.get("_parsed_created_at") else 'N/A',
                        'items_count': len(inv.get("items", []))
                    }
                    for inv in sorted(invoices, key=lambda x: x.get("_parsed_created_at") or datetime.min, reverse=True)[:10]
                ],
                
                # Orders per day (last 7 days)
                'orders_per_day': self._calculate_orders_per_day(invoices, days=7),
                
                # Revenue per day (last 7 days)
                'revenue_per_day': self._calculate_revenue_per_day(invoices, days=7),

                # Payment mode split
                'payment_modes': dict(payment_modes),

                # Hourly trend
                'hourly_orders': {str(h): hourly_orders.get(h, 0) for h in range(24)},
                'peak_hour': peak_hour,

                # Target context from profile
                'monthly_target': float(self.user.get("monthly_target") or 0),
            }
            
            return data
            
        except Exception as e:
            logger.error(f"Error fetching POS data: {e}", exc_info=True)
            return self._get_fallback_data()
    
    def _calculate_orders_per_day(self, invoices, days=7):
        """Calculate orders per day for the last N days"""
        result = {}
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        
        for i in range(days):
            day = today - timedelta(days=i)
            day_end = day + timedelta(days=1)
            count = sum(1 for inv in invoices if inv.get("_parsed_created_at") and day <= inv["_parsed_created_at"] < day_end)
            result[day.strftime('%Y-%m-%d')] = count
        
        return result
    
    def _calculate_revenue_per_day(self, invoices, days=7):
        """Calculate revenue per day for the last N days"""
        result = {}
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        
        for i in range(days):
            day = today - timedelta(days=i)
            day_end = day + timedelta(days=1)
            revenue = sum(inv.get("total_amount", 0) for inv in invoices if inv.get("_parsed_created_at") and day <= inv["_parsed_created_at"] < day_end)
            result[day.strftime('%Y-%m-%d')] = revenue
        
        return result
    
    def _get_fallback_data(self):
        """Return basic fallback data if database query fails"""
        return {
            'total_sales': 0,
            'total_orders': 0,
            'total_items': 0,
            'avg_order_value': 0,
            'today_sales': 0,
            'today_orders': 0,
            'business_name': self.user.get("business_name") or self.user.get("username"),
            'error': 'Unable to fetch data from database'
        }

