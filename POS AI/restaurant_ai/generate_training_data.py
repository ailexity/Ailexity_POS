"""
Generate Enhanced Training Data from Orders
Create many more variations for better model training
"""

import json
import random
from collections import defaultdict, Counter
from datetime import datetime

def load_orders():
    """Load orders from JSON"""
    with open('../orders_5000.json', 'r', encoding='utf-8') as f:
        return json.load(f)

def generate_enhanced_training_data(orders):
    """Generate comprehensive training data with many variations"""
    
    training_data = []
    
    # Sales Overview Patterns (50 variations)
    sales_patterns = [
        "What were today's sales?", "Show me today's sales", "Total sales today",
        "How much did we make today?", "Today's revenue", "Sales report",
        "Show me sales overview", "Daily sales summary", "What's our total revenue?",
        "How are sales doing?", "Sales performance today", "Revenue today",
        "Total money made today", "How much revenue?", "Show revenue",
        "Sales figures", "Give me sales stats", "What's the daily sales?",
        "How many sales today?", "Show me the money", "Today's earnings",
        "What did we earn?", "How profitable was today?", "Business performance",
        "Show business stats", "Revenue report", "What's our income?",
        "Today's income", "Show earnings", "Sales analytics",
        "How much did I make?", "Show me today's income", "Total earnings today",
        "Business revenue", "Restaurant sales", "What are the sales numbers?",
        "Show sales data", "Daily revenue", "How's business?",
        "Give me sales details", "What's the turnover?", "Show total sales",
        "Today's business", "Sales summary", "Revenue statistics",
        "What's the collection?", "Show collections", "Total collections today",
        "How much business today?", "Day's sales"
    ]
    
    # Stock Status Patterns (50 variations)
    stock_patterns = [
        "What's low in stock?", "Show inventory", "Check stock status",
        "Low stock items", "Out of stock", "What needs restocking?",
        "Inventory status", "Stock levels", "Which items are running low?",
        "Show me low inventory", "What's running out?", "Stock report",
        "Inventory check", "Low stock alert", "Check inventory status",
        "What needs to be ordered?", "Show stock items", "Inventory overview",
        "Which items need refilling?", "Stock alerts", "Show stock levels",
        "Inventory report", "What's the stock situation?", "Low inventory items",
        "Check stock levels", "Stock status report", "Inventory management",
        "What items are low?", "Show low stock", "Stock availability",
        "Inventory alerts", "Which products are low?", "Stock summary",
        "What do we need to restock?", "Low stock warning", "Inventory status check",
        "Show inventory levels", "Stock management", "What's in stock?",
        "Available inventory", "Stock details", "Inventory data",
        "Low supply items", "Stock requirements", "What's our inventory?",
        "Check what's low", "Restock needed", "Inventory issues",
        "Stock problems", "Running low on what?"
    ]
    
    # Profit Margin Patterns (50 variations)
    profit_patterns = [
        "Best profit margin items", "Show profit analysis", "Which items are most profitable?",
        "Top profit margin", "Highest margin items", "Most profitable dishes",
        "Show profitability", "Profit margins", "Which items make most money?",
        "Margin analysis", "Profit report", "Best performing items",
        "High margin products", "Profitability analysis", "Which dishes have high margins?",
        "Show me profits", "Profit breakdown", "Most valuable items",
        "Best profit items", "Margin report", "Which items give best profit?",
        "Profit performance", "Show margin analysis", "Profitable menu items",
        "Top earning items", "Highest profit dishes", "Best margin products",
        "Profitability report", "Show profitability analysis", "Which items earn most?",
        "Margin details", "Profit statistics", "Best ROI items",
        "High profit products", "Most lucrative dishes", "Profit leaders",
        "Show profit leaders", "Best profit performers", "Top margin items",
        "Which dishes are profitable?", "Profit margins report", "Best earners",
        "High profitability items", "Top profit dishes", "Margin statistics",
        "Show best margins", "Highest earning items", "Profit champions"
    ]
    
    # AI Daily Advice Patterns (50 variations)
    advice_patterns = [
        "Give me business recommendations", "Daily insights", "What should I focus on?",
        "Business advice", "Today's recommendations", "What to improve?",
        "Give me suggestions", "Business tips", "What should I do today?",
        "AI recommendations", "Business insights", "Help me improve",
        "What are your suggestions?", "Daily advice", "Business guidance",
        "Give me tips", "What's your recommendation?", "How to improve business?",
        "AI insights", "Business strategy", "What should I prioritize?",
        "Give me advice", "Today's tips", "Business suggestions",
        "What do you recommend?", "Help me grow", "Business recommendations",
        "What's important today?", "Key insights", "Priority areas",
        "What to work on?", "Improvement suggestions", "Growth tips",
        "Strategic advice", "Business optimization", "What needs attention?",
        "Key recommendations", "Focus areas", "What matters most?",
        "Business improvement tips", "Today's priorities", "What to optimize?",
        "Growth recommendations", "Success tips", "Performance advice",
        "What can I do better?", "Optimization suggestions", "Business enhancements",
        "How to increase profit?", "Revenue tips", "Success strategies"
    ]
    
    # Order Status Patterns (50 variations)
    order_patterns = [
        "Pending orders", "Order status", "How many orders pending?",
        "Show active orders", "Current orders", "Orders in progress",
        "How many orders?", "Order count", "Active order status",
        "Pending order count", "Show orders", "Order queue",
        "How many in kitchen?", "Orders being prepared", "Kitchen orders",
        "Order summary", "Show pending", "How many active?",
        "Order details", "Current order status", "Orders today",
        "How many orders do we have?", "Show order list", "Active order count",
        "Order overview", "Pending order list", "Orders in queue",
        "How many waiting?", "Show current orders", "Order tracking",
        "Kitchen queue", "Orders to prepare", "How many in pipeline?",
        "Order management", "Active orders list", "Show order status",
        "How many orders waiting?", "Pending order status", "Orders being made",
        "Current order queue", "How many to make?", "Order load",
        "Show active queue", "Orders in kitchen", "Preparation status",
        "How many cooking?", "Order prep status", "Kitchen status",
        "Orders to complete", "Remaining orders", "Incomplete orders"
    ]
    
    # Menu Inquiry Patterns (40 variations)
    menu_patterns = [
        "What's on the menu?", "Show menu items", "Available dishes",
        "Menu list", "What dishes do you have?", "Show available items",
        "Menu options", "What can I order?", "Food items",
        "Restaurant menu", "Show all dishes", "Available menu",
        "What's available?", "Menu catalog", "Food options",
        "Show menu", "List dishes", "Menu items",
        "What do you serve?", "Available food", "Dish list",
        "Show food items", "Menu details", "What's in menu?",
        "Available dishes list", "Show offerings", "Food menu",
        "What items available?", "Menu selections", "Food catalog",
        "Show dish options", "Available options", "Menu overview",
        "What can we make?", "Available preparations", "Dish catalog",
        "Show food options", "Menu availability", "Dish options"
    ]
    
    # Top Items Patterns (40 variations)
    top_items_patterns = [
        "Top selling items", "Most popular dishes", "Best sellers",
        "What's trending?", "Popular menu items", "Top dishes",
        "Most ordered items", "Bestselling dishes", "Customer favorites",
        "What sells most?", "Top performers", "Most popular",
        "Trending dishes", "Best performing items", "Top orders",
        "What do customers love?", "Popular items", "Top rated dishes",
        "Most ordered", "Customer top picks", "Favorite dishes",
        "What's hot?", "Popular orders", "Best items",
        "Most wanted dishes", "Top choices", "Popular selections",
        "What's selling well?", "Top menu items", "Best dishes",
        "Customer preferences", "Most loved items", "Top picks",
        "What's in demand?", "Popular food", "Best orders",
        "Top rated items", "Most requested", "Customer hits"
    ]
    
    # Customer Feedback Patterns (40 variations)
    feedback_patterns = [
        "Customer reviews", "Average rating", "Customer feedback",
        "How are the ratings?", "Review summary", "Customer satisfaction",
        "What's our rating?", "Show reviews", "Feedback report",
        "Customer opinions", "Rating overview", "How satisfied are customers?",
        "Review analysis", "Customer ratings", "Satisfaction score",
        "What do customers say?", "Review stats", "Feedback summary",
        "Rating report", "Customer experience", "How happy are customers?",
        "Review breakdown", "Satisfaction level", "Customer comments",
        "Rating analysis", "Feedback overview", "Customer sentiment",
        "What's the feedback?", "Review score", "Satisfaction report",
        "Customer response", "Rating statistics", "Feedback analysis",
        "How are we rated?", "Customer perception", "Review data",
        "Satisfaction metrics", "Customer happiness", "Review summary"
    ]
    
    # Payment Analysis Patterns (40 variations)
    payment_patterns = [
        "Payment breakdown", "Payment mode distribution", "Cash vs card",
        "Show payment stats", "Payment analysis", "How much cash?",
        "Payment summary", "Cash card split", "Payment methods",
        "Payment report", "Transaction types", "Payment modes used",
        "Cash transactions", "Card payments", "How did people pay?",
        "Payment details", "Cash vs online", "Payment distribution",
        "Transaction breakdown", "Payment method analysis", "How much by cash?",
        "Card transaction amount", "UPI payments", "Payment type report",
        "How much online?", "Cash collected", "Digital payments",
        "Payment channel", "Transaction split", "Payment statistics",
        "Cash vs digital", "Payment mode stats", "Collection breakdown",
        "How did customers pay?", "Payment preferences", "Transaction modes",
        "Payment type breakdown", "Collection analysis", "Payment channels"
    ]
    
    # Peak Hours Patterns (40 variations)
    peak_hours_patterns = [
        "Peak hours", "Busiest hours", "When are we busiest?",
        "Rush hours", "Peak time analysis", "When do we get most orders?",
        "Busy hours", "Peak period", "When is it crowded?",
        "Rush periods", "Busiest time", "High traffic hours",
        "Peak traffic", "When are we packed?", "Busy periods",
        "Rush time", "Peak hours analysis", "When do customers come?",
        "Busiest periods", "High demand hours", "Peak demand time",
        "When is peak?", "Rush hour analysis", "Busy time slots",
        "Peak business hours", "When are we full?", "High traffic time",
        "Customer rush hours", "Peak footfall", "Busiest day time",
        "When do we serve most?", "Peak service hours", "High order time",
        "When are orders highest?", "Peak activity", "Busy slots",
        "Rush period analysis", "Peak customer time", "High volume hours"
    ]
    
    # Greeting Patterns (30 variations)
    greeting_patterns = [
        "Hello", "Hi", "Good morning", "Good afternoon", "Good evening",
        "Hey", "Hi there", "Hello there", "Greetings", "Hey there",
        "Good day", "Morning", "Evening", "Afternoon", "Howdy",
        "Hi AI", "Hello AI", "Hey AI", "Yo", "Sup",
        "What's up", "Hiya", "Heya", "Hi friend", "Hello friend",
        "Namaste", "Namaskar", "Ram Ram", "Salaam", "Vanakkam"
    ]
    
    # Goodbye Patterns (30 variations)
    goodbye_patterns = [
        "Goodbye", "Bye", "See you", "Thanks bye", "Thank you bye",
        "Exit", "Quit", "That's all", "Done", "Finish",
        "Good bye", "Bye bye", "See ya", "Later", "Catch you later",
        "Thanks", "Thank you", "That's it", "All done", "Finished",
        "End", "Close", "Leave", "Signing off", "Ciao",
        "Tata", "Alvida", "Bye for now", "Until next time", "Peace"
    ]
    
    # Add all patterns with their intents
    for pattern in sales_patterns:
        training_data.append({'text': pattern, 'intent': 'sales_overview'})
    
    for pattern in stock_patterns:
        training_data.append({'text': pattern, 'intent': 'stock_status'})
    
    for pattern in profit_patterns:
        training_data.append({'text': pattern, 'intent': 'profit_margin_analysis'})
    
    for pattern in advice_patterns:
        training_data.append({'text': pattern, 'intent': 'ai_daily_advice'})
    
    for pattern in order_patterns:
        training_data.append({'text': pattern, 'intent': 'order_status'})
    
    for pattern in menu_patterns:
        training_data.append({'text': pattern, 'intent': 'menu_inquiry'})
    
    for pattern in top_items_patterns:
        training_data.append({'text': pattern, 'intent': 'top_items'})
    
    for pattern in feedback_patterns:
        training_data.append({'text': pattern, 'intent': 'customer_feedback'})
    
    for pattern in payment_patterns:
        training_data.append({'text': pattern, 'intent': 'payment_analysis'})
    
    for pattern in peak_hours_patterns:
        training_data.append({'text': pattern, 'intent': 'peak_hours'})
    
    for pattern in greeting_patterns:
        training_data.append({'text': pattern, 'intent': 'greeting'})
    
    for pattern in goodbye_patterns:
        training_data.append({'text': pattern, 'intent': 'goodbye'})
    
    # Shuffle the data
    random.shuffle(training_data)
    
    return training_data


def main():
    """Main function"""
    print("Loading orders...")
    orders = load_orders()
    print(f"Loaded {len(orders)} orders")
    
    print("\nGenerating enhanced training data...")
    training_data = generate_enhanced_training_data(orders)
    
    # Count by intent
    intent_counts = Counter(item['intent'] for item in training_data)
    
    print(f"\nGenerated {len(training_data)} training samples:")
    for intent, count in sorted(intent_counts.items()):
        print(f"  • {intent}: {count} samples")
    
    # Save training data
    output_file = 'data/training_data.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(training_data, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Training data saved to {output_file}")
    print(f"📊 Total samples: {len(training_data)}")
    print(f"🎯 Unique intents: {len(intent_counts)}")
    print(f"📈 Average samples per intent: {len(training_data) / len(intent_counts):.1f}")


if __name__ == '__main__':
    main()
