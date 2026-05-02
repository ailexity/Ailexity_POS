"""
Process Orders Data
Convert orders_5000.json into training data for intent classification
"""

import json
import os
import sys
from datetime import datetime
from collections import defaultdict, Counter

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))


def load_orders(filepath):
    """Load orders from JSON file"""
    print(f"Loading orders from {filepath}...")
    with open(filepath, 'r', encoding='utf-8') as f:
        orders = json.load(f)
    print(f"✅ Loaded {len(orders)} orders")
    return orders


def analyze_orders(orders):
    """Analyze orders to extract insights"""
    print("\n📊 Analyzing orders data...")
    
    # Basic stats
    total_revenue = sum(order['total_amount'] for order in orders)
    total_orders = len(orders)
    
    # Category analysis
    categories = defaultdict(int)
    items_sold = defaultdict(int)
    
    for order in orders:
        for item in order['items']:
            categories[item['category']] += item['quantity']
            items_sold[item['item_name']] += item['quantity']
    
    # Payment modes
    payment_modes = Counter(order['payment_mode'] for order in orders)
    
    # Order types
    order_types = Counter(order['order_type'] for order in orders)
    
    # Customer types
    customer_types = Counter(order['customer_type'] for order in orders)
    
    # Ratings
    ratings = [order['rating'] for order in orders if 'rating' in order]
    avg_rating = sum(ratings) / len(ratings) if ratings else 0
    
    # Date range
    dates = [order['date'] for order in orders]
    min_date = min(dates)
    max_date = max(dates)
    
    analysis = {
        'total_orders': total_orders,
        'total_revenue': total_revenue,
        'avg_order_value': total_revenue / total_orders,
        'top_categories': dict(Counter(categories).most_common(5)),
        'top_items': dict(Counter(items_sold).most_common(10)),
        'payment_modes': dict(payment_modes),
        'order_types': dict(order_types),
        'customer_types': dict(customer_types),
        'avg_rating': avg_rating,
        'date_range': f"{min_date} to {max_date}"
    }
    
    print(f"   Total Orders: {total_orders}")
    print(f"   Total Revenue: ₹{total_revenue:,.2f}")
    print(f"   Average Order: ₹{analysis['avg_order_value']:.2f}")
    print(f"   Average Rating: {avg_rating:.2f}/5")
    print(f"   Date Range: {min_date} to {max_date}")
    
    return analysis


def generate_training_data(orders, analysis):
    """Generate comprehensive training data from orders"""
    print("\n🔧 Generating training data...")
    
    training_data = {
        # Sales queries
        "sales_overview": [
            "What are today's sales?",
            "Show me total revenue",
            "How much did I earn today?",
            "What's the total sales amount?",
            "Show sales for today",
            "Daily sales report",
            "How much money did we make?",
            "What's my revenue today?",
            "Show me today's collection",
            "Total sales today",
            "What's the sales figure?",
            "How's the business today?",
            "What are my earnings?",
            "Show me the cash collection",
            "Total revenue for the day"
        ],
        
        # Inventory/Stock queries
        "stock_status": [
            "What stock is available?",
            "Which items are low in stock?",
            "Show inventory",
            "Check stock levels",
            "What needs restocking?",
            "Show me low stock items",
            "Inventory status",
            "Which items are out of stock?",
            "What do I need to order?",
            "Stock alert",
            "Show inventory levels",
            "What's running low?",
            "Check stock availability",
            "Inventory report",
            "What items need reordering?"
        ],
        
        # Profit analysis queries
        "profit_margin_analysis": [
            "Which dish is most profitable?",
            "Why is profit low?",
            "Show profit margins",
            "What's my profit today?",
            "Best selling items",
            "Most profitable dish",
            "Profit analysis",
            "Which items make the most money?",
            "Show me profit breakdown",
            "What's the margin on items?",
            "Which dishes have high margins?",
            "Profit report",
            "What makes the most profit?",
            "Show profitability",
            "Margin analysis"
        ],
        
        # Daily advice queries
        "ai_daily_advice": [
            "What should I focus on today?",
            "Any problems today?",
            "Give me today's summary",
            "What needs my attention?",
            "Daily insights",
            "What should I improve?",
            "Show me recommendations",
            "Any alerts?",
            "What's critical today?",
            "Business advice",
            "What are the issues?",
            "Daily report",
            "What should I know?",
            "Give me insights",
            "What needs fixing?"
        ],
        
        # Order status queries
        "order_status": [
            "Show pending orders",
            "How many orders today?",
            "What orders are pending?",
            "Order count",
            "Show all orders",
            "Completed orders today",
            "How many orders completed?",
            "Order statistics",
            "Show order summary",
            "Pending order list",
            "Total orders",
            "Order report",
            "How busy are we?",
            "Show order queue",
            "What's the order status?"
        ],
        
        # Menu/Item queries
        "menu_inquiry": [
            "What's on the menu?",
            "Show me the menu",
            "What dishes do we have?",
            "List all items",
            "What can we serve?",
            "Show available dishes",
            "What food do we have?",
            "Menu items",
            "What's available?",
            "Show dish list",
            "What can customers order?",
            "Display menu",
            "Show all dishes",
            "What's in stock to serve?",
            "Available menu items"
        ],
        
        # Top selling items queries
        "top_items": [
            "What's selling well?",
            "Top selling items",
            "Best sellers",
            "Most popular dishes",
            "What do customers prefer?",
            "Which items sell most?",
            "Show popular dishes",
            "What's trending?",
            "Customer favorites",
            "Most ordered items",
            "What's in demand?",
            "Popular menu items",
            "Best performing dishes",
            "Top dishes",
            "What sells the most?"
        ],
        
        # Customer queries
        "customer_feedback": [
            "Show customer ratings",
            "What do customers say?",
            "Customer reviews",
            "Feedback summary",
            "What's our rating?",
            "Customer satisfaction",
            "Show reviews",
            "How are we rated?",
            "Customer comments",
            "What's the feedback?",
            "Rating analysis",
            "Customer opinions",
            "How satisfied are customers?",
            "Show ratings",
            "Customer experience"
        ],
        
        # Payment queries
        "payment_analysis": [
            "How are customers paying?",
            "Payment mode breakdown",
            "Cash vs card ratio",
            "Show payment types",
            "Payment analysis",
            "How much cash received?",
            "How much card payment?",
            "Payment summary",
            "Payment method stats",
            "Show payment modes",
            "Cash collection",
            "Digital payments",
            "Payment report",
            "Payment distribution",
            "How do people pay?"
        ],
        
        # Peak hours queries
        "peak_hours": [
            "What are the peak hours?",
            "When are we busiest?",
            "Show busy times",
            "Rush hour analysis",
            "When do we get most orders?",
            "Busiest time of day",
            "Peak time report",
            "When is it crowded?",
            "High traffic hours",
            "When should I add staff?",
            "Busy period analysis",
            "Order timing",
            "When's the rush?",
            "Peak order times",
            "Busiest hours"
        ],
        
        # Greeting
        "greeting": [
            "Hi",
            "Hello",
            "Good morning",
            "Good evening",
            "Hey",
            "Namaste",
            "Hi there",
            "Hello there",
            "Good afternoon",
            "Hey there"
        ],
        
        # Goodbye
        "goodbye": [
            "Bye",
            "Goodbye",
            "See you",
            "Thanks",
            "Thank you",
            "That's all",
            "Exit",
            "Quit",
            "See you later",
            "Bye bye"
        ]
    }
    
    print(f"   ✅ Generated training data for {len(training_data)} intents")
    print(f"   ✅ Total training samples: {sum(len(v) for v in training_data.values())}")
    
    return training_data


def save_training_data(training_data, output_path):
    """Save training data to JSON file"""
    print(f"\n💾 Saving training data to {output_path}...")
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(training_data, f, indent=2, ensure_ascii=False)
    
    print(f"   ✅ Training data saved successfully!")


def save_orders_analysis(analysis, output_path):
    """Save orders analysis for reference"""
    print(f"\n💾 Saving orders analysis to {output_path}...")
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(analysis, f, indent=2, ensure_ascii=False)
    
    print(f"   ✅ Orders analysis saved!")


def main():
    """Main processing function"""
    print("\n" + "=" * 70)
    print("🔄 ORDERS DATA PROCESSING")
    print("=" * 70)
    
    # Paths
    base_dir = os.path.dirname(os.path.abspath(__file__))
    orders_file = os.path.join(os.path.dirname(base_dir), 'orders_5000.json')
    training_file = os.path.join(base_dir, 'data', 'training_data.json')
    analysis_file = os.path.join(base_dir, 'data', 'orders_analysis.json')
    
    # Check if orders file exists
    if not os.path.exists(orders_file):
        print(f"❌ Error: Orders file not found at {orders_file}")
        return 1
    
    # Load orders
    orders = load_orders(orders_file)
    
    # Analyze orders
    analysis = analyze_orders(orders)
    
    # Generate training data
    training_data = generate_training_data(orders, analysis)
    
    # Save files
    save_training_data(training_data, training_file)
    save_orders_analysis(analysis, analysis_file)
    
    print("\n" + "=" * 70)
    print("✅ DATA PROCESSING COMPLETE!")
    print("=" * 70)
    print(f"\nFiles created:")
    print(f"  1. {training_file}")
    print(f"  2. {analysis_file}")
    print(f"\nNext step:")
    print(f"  Run: python train.py")
    print("=" * 70 + "\n")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
