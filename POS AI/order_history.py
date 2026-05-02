import random
import json
from datetime import datetime, timedelta

MENU = [
    ("Paneer Butter Masala", "main_course", 240, 150),
    ("Chicken Biryani", "main_course", 280, 180),
    ("Veg Biryani", "main_course", 220, 140),
    ("Butter Naan", "bread", 40, 20),
    ("Tandoori Roti", "bread", 30, 15),
    ("Masala Dosa", "south_indian", 120, 70),
    ("Cold Coffee", "beverages", 90, 40),
    ("Fresh Lime Soda", "beverages", 70, 30),
    ("Gulab Jamun", "dessert", 60, 25)
]

PAYMENT_MODES = ["Cash", "UPI", "Card"]
ORDER_TYPES = ["dine_in", "takeaway", "online"]
CUSTOMER_TYPES = ["new", "repeat"]

def random_date():
    start = datetime.now() - timedelta(days=60)
    return start + timedelta(days=random.randint(0, 60))

def generate_order(order_id):
    items_count = random.randint(1, 4)
    items = []
    total = 0

    for _ in range(items_count):
        name, category, price, cost = random.choice(MENU)
        qty = random.randint(1, 3)
        total += price * qty

        items.append({
            "item_name": name,
            "category": category,
            "quantity": qty,
            "price": price,
            "cost": cost
        })

    order_date = random_date()

    return {
        "order_id": f"ORD{order_id:04}",
        "date": order_date.strftime("%Y-%m-%d"),
        "time": order_date.strftime("%H:%M"),
        "order_type": random.choice(ORDER_TYPES),
        "items": items,
        "total_amount": total,
        "payment_mode": random.choice(PAYMENT_MODES),
        "customer_type": random.choice(CUSTOMER_TYPES),
        "table_number": random.randint(1, 20),
        "prep_time_minutes": random.randint(10, 30),
        "rating": random.randint(3, 5)
    }

def generate_orders(n=5000):
    return [generate_order(i+1) for i in range(n)]

if __name__ == "__main__":
    orders = generate_orders(5000)

    with open("orders_5000.json", "w") as f:
        json.dump(orders, f, indent=2)

    print("✅ 5000 orders generated successfully")
