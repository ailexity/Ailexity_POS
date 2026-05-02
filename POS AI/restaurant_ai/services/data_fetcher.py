"""
Data Fetcher Service
Advanced data fetching with database integration and caching
"""

import json
import random
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DataFetcher:
    """
    Service for fetching restaurant data from various sources
    Supports database connections, API calls, and mock data
    """
    
    def __init__(self, mode: str = 'mock', db_connection: Any = None):
        """
        Initialize data fetcher
        
        Args:
            mode: Operating mode ('mock', 'database', 'api')
            db_connection: Database connection object (if using database mode)
        """
        self.mode = mode
        self.db_connection = db_connection
        self.cache = {}
        self.cache_expiry = {}
        logger.info(f"DataFetcher initialized in {mode} mode")
    
    def fetch_pos_data(self, date: Optional[datetime] = None) -> Dict[str, Any]:
        """
        Fetch comprehensive POS data
        
        Args:
            date: Date for which to fetch data (defaults to today)
            
        Returns:
            Dictionary with POS data
        """
        if date is None:
            date = datetime.now()
        
        # Check cache first
        cache_key = f"pos_data_{date.strftime('%Y%m%d')}"
        if self._is_cache_valid(cache_key):
            logger.info("Returning cached POS data")
            return self.cache[cache_key]
        
        # Fetch based on mode
        if self.mode == 'database' and self.db_connection:
            data = self._fetch_from_database(date)
        elif self.mode == 'api':
            data = self._fetch_from_api(date)
        else:
            data = self._fetch_mock_data(date)
        
        # Cache the result
        self._update_cache(cache_key, data, ttl_seconds=300)
        
        return data
    
    def _fetch_mock_data(self, date: datetime) -> Dict[str, Any]:
        """Generate realistic mock data for testing"""
        # Base values with some randomization
        base_sales = random.randint(15000, 35000)
        orders_count = random.randint(50, 150)
        
        data = {
            # Sales data
            'total_sales': base_sales,
            'yesterday_sales': base_sales * random.uniform(0.85, 1.15),
            'orders_count': orders_count,
            'avg_order_value': base_sales / orders_count if orders_count > 0 else 0,
            'sales_drop': random.choice([True, False]),
            'sales_drop_percentage': random.uniform(5, 25),
            'sales_increase': random.choice([True, False]),
            'sales_increase_percentage': random.uniform(10, 30),
            
            # Inventory data
            'low_stock': self._generate_low_stock_items(),
            'out_of_stock': self._generate_out_of_stock_items(),
            'total_items': random.randint(80, 150),
            'quantities': self._generate_quantities(),
            
            # Profit data
            'top_item': random.choice([
                'Paneer Butter Masala', 'Chicken Biryani', 'Dal Makhani',
                'Butter Naan', 'Tandoori Chicken'
            ]),
            'top_margin': random.uniform(45, 75),
            'avg_margin': random.uniform(30, 50),
            'low_margin_items': ['Roti', 'Plain Rice', 'Papad'],
            'margins': {
                'Roti': 15.5,
                'Plain Rice': 18.2,
                'Papad': 12.8,
                'Paneer Butter Masala': 65.3,
                'Chicken Biryani': 58.7
            },
            
            # Operational data
            'trending_item': random.choice([
                'Butter Chicken', 'Paneer Tikka', 'Veg Biryani'
            ]),
            'high_wastage': random.choice([True, False]),
            'wastage_value': random.randint(500, 2000),
            'peak_hour_understaffed': random.choice([True, False]),
            'peak_time': random.choice(['lunch', 'dinner']),
            'negative_feedback_trend': random.choice([True, False]),
            
            # Menu data
            'menu_items': self._generate_menu_items(),
            'categories': ['Appetizers', 'Main Course', 'Beverages', 'Desserts'],
            'Appetizers_items': ['Samosa', 'Paneer Tikka', 'Spring Rolls', 'Veg Pakora'],
            'Main Course_items': ['Butter Chicken', 'Paneer Butter Masala', 'Dal Makhani', 'Biryani'],
            'Beverages_items': ['Lassi', 'Masala Chai', 'Cold Coffee', 'Fresh Juice'],
            'Desserts_items': ['Gulab Jamun', 'Rasmalai', 'Ice Cream', 'Kheer'],
            'prices': self._generate_prices(),
            
            # Reservation data
            'available_slots': self._generate_time_slots(),
            
            # Order data
            'pending_orders': random.randint(5, 20),
            'completed_orders': orders_count - random.randint(5, 20),
            'avg_prep_time': random.randint(15, 35),
            
            # Feedback data
            'avg_rating': random.uniform(3.5, 4.8),
            'total_reviews': random.randint(50, 200),
            'positive_count': random.randint(100, 150),
            'negative_count': random.randint(10, 40),
            
            # Staff data
            'top_performer': random.choice([
                'Rajesh Kumar', 'Priya Sharma', 'Amit Patel', 'Sneha Reddy'
            ]),
            'total_staff': random.randint(15, 30),
            'attendance_rate': random.uniform(85, 98),
            
            # Peak hours data
            'peak_hours': [
                ('12:00 PM - 1:00 PM', random.randint(25, 40)),
                ('1:00 PM - 2:00 PM', random.randint(30, 45)),
                ('7:00 PM - 8:00 PM', random.randint(35, 50)),
                ('8:00 PM - 9:00 PM', random.randint(30, 45))
            ],
            'busiest_day': random.choice([
                'Saturday', 'Sunday', 'Friday'
            ]),
            
            # Metadata
            'date': date.strftime('%Y-%m-%d'),
            'timestamp': datetime.now().isoformat()
        }
        
        return data
    
    def _generate_low_stock_items(self) -> List[str]:
        """Generate random low stock items"""
        items = [
            'Cheese', 'Tomato', 'Onion', 'Paneer', 'Chicken',
            'Rice', 'Flour', 'Oil', 'Spices', 'Milk'
        ]
        return random.sample(items, k=random.randint(2, 5))
    
    def _generate_out_of_stock_items(self) -> List[str]:
        """Generate random out of stock items"""
        items = ['Mushrooms', 'Bell Peppers', 'Cottage Cheese', 'Yogurt']
        return random.sample(items, k=random.randint(0, 2))
    
    def _generate_quantities(self) -> Dict[str, int]:
        """Generate quantity data for items"""
        return {
            'Cheese': random.randint(5, 15),
            'Tomato': random.randint(10, 25),
            'Paneer': random.randint(8, 20),
            'Chicken': random.randint(15, 30),
            'Rice': random.randint(20, 40)
        }
    
    def _generate_menu_items(self) -> List[str]:
        """Generate menu items list"""
        return [
            'Butter Chicken', 'Paneer Butter Masala', 'Dal Makhani',
            'Chicken Biryani', 'Veg Biryani', 'Tandoori Chicken',
            'Palak Paneer', 'Butter Naan', 'Garlic Naan', 'Roti'
        ]
    
    def _generate_prices(self) -> Dict[str, float]:
        """Generate price data"""
        return {
            'Samosa': 40,
            'Paneer Tikka': 280,
            'Butter Chicken': 320,
            'Paneer Butter Masala': 280,
            'Dal Makhani': 220,
            'Biryani': 300,
            'Lassi': 80,
            'Gulab Jamun': 60,
            'Butter Naan': 50,
            'Roti': 25
        }
    
    def _generate_time_slots(self) -> List[str]:
        """Generate available time slots"""
        return [
            '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM',
            '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM'
        ]
    
    def _fetch_from_database(self, date: datetime) -> Dict[str, Any]:
        """
        Fetch data from database
        
        Args:
            date: Date for which to fetch data
            
        Returns:
            Dictionary with data from database
        """
        # TODO: Implement actual database queries
        # Example:
        # cursor = self.db_connection.cursor()
        # cursor.execute("SELECT * FROM sales WHERE date = ?", (date,))
        # results = cursor.fetchall()
        
        logger.warning("Database mode not fully implemented, returning mock data")
        return self._fetch_mock_data(date)
    
    def _fetch_from_api(self, date: datetime) -> Dict[str, Any]:
        """
        Fetch data from API
        
        Args:
            date: Date for which to fetch data
            
        Returns:
            Dictionary with data from API
        """
        # TODO: Implement actual API calls
        # Example:
        # import requests
        # response = requests.get(f"{API_URL}/data?date={date}")
        # return response.json()
        
        logger.warning("API mode not fully implemented, returning mock data")
        return self._fetch_mock_data(date)
    
    def fetch_sales_data(self, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """
        Fetch sales data for a date range
        
        Args:
            start_date: Start date
            end_date: End date
            
        Returns:
            Sales data aggregated over the date range
        """
        daily_data = []
        current_date = start_date
        
        while current_date <= end_date:
            data = self.fetch_pos_data(current_date)
            daily_data.append({
                'date': current_date.strftime('%Y-%m-%d'),
                'sales': data['total_sales'],
                'orders': data['orders_count']
            })
            current_date += timedelta(days=1)
        
        total_sales = sum(d['sales'] for d in daily_data)
        total_orders = sum(d['orders'] for d in daily_data)
        
        return {
            'daily_data': daily_data,
            'total_sales': total_sales,
            'total_orders': total_orders,
            'avg_daily_sales': total_sales / len(daily_data) if daily_data else 0,
            'date_range': f"{start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}"
        }
    
    def fetch_inventory_data(self) -> Dict[str, Any]:
        """Fetch current inventory status"""
        data = self.fetch_pos_data()
        return {
            'low_stock': data['low_stock'],
            'out_of_stock': data['out_of_stock'],
            'total_items': data['total_items'],
            'quantities': data['quantities']
        }
    
    def fetch_customer_data(self) -> Dict[str, Any]:
        """Fetch customer and feedback data"""
        data = self.fetch_pos_data()
        return {
            'avg_rating': data['avg_rating'],
            'total_reviews': data['total_reviews'],
            'positive_count': data['positive_count'],
            'negative_count': data['negative_count']
        }
    
    def _is_cache_valid(self, key: str) -> bool:
        """Check if cached data is still valid"""
        if key not in self.cache:
            return False
        
        if key not in self.cache_expiry:
            return False
        
        return datetime.now() < self.cache_expiry[key]
    
    def _update_cache(self, key: str, data: Any, ttl_seconds: int = 300):
        """Update cache with new data"""
        self.cache[key] = data
        self.cache_expiry[key] = datetime.now() + timedelta(seconds=ttl_seconds)
    
    def clear_cache(self):
        """Clear all cached data"""
        self.cache = {}
        self.cache_expiry = {}
        logger.info("Cache cleared")


def fetch_pos_data():
    """
    Legacy function for backward compatibility
    Returns basic POS data
    """
    fetcher = DataFetcher(mode='mock')
    return fetcher.fetch_pos_data()
