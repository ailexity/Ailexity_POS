from pymongo import MongoClient
from typing import Generator
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# MongoDB Configuration - Use environment variables with fallback
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb+srv://pos_admin:admin123@cluster0.qvljupm.mongodb.net/")
DATABASE_NAME = os.getenv("MONGODB_DB", "ailexity_pos_db")

# Create MongoDB client
client = MongoClient(MONGODB_URL)
database = client[DATABASE_NAME]

# Collections
users_collection = database["users"]
items_collection = database["items"]
invoices_collection = database["invoices"]
invoice_items_collection = database["invoice_items"]
system_settings_collection = database["system_settings"]
alerts_collection = database["alerts"]
alert_dismissals_collection = database["alert_dismissals"]
table_carts_collection = database["table_carts"]
raw_stock_collection = database["raw_stock"]
parties_collection = database["parties"]
party_ledger_collection = database["party_ledger"]
party_payments_collection = database["party_payments"]

# Create indexes for better performance
users_collection.create_index("username", unique=True)
items_collection.create_index([("admin_id", 1), ("name", 1)])
items_collection.create_index("category")
invoices_collection.create_index([("admin_id", 1), ("invoice_number", 1)], unique=True)
invoices_collection.create_index([("admin_id", 1), ("created_at", -1)])
invoice_items_collection.create_index("invoice_id")
invoice_items_collection.create_index("admin_id")
system_settings_collection.create_index("setting_key", unique=True)
alerts_collection.create_index([("created_at", -1)])
alerts_collection.create_index("expires_at")
alert_dismissals_collection.create_index([("user_id", 1), ("alert_id", 1)], unique=True)
table_carts_collection.create_index([("admin_id", 1), ("table_id", 1)], unique=True)
table_carts_collection.create_index("updated_at")
raw_stock_collection.create_index([("admin_id", 1), ("name", 1)])
raw_stock_collection.create_index([("admin_id", 1), ("updated_at", -1)])
parties_collection.create_index([("admin_id", 1), ("party_name", 1)], unique=True)
parties_collection.create_index([("admin_id", 1), ("party_type", 1)])
parties_collection.create_index([("admin_id", 1), ("is_active", 1)])
party_ledger_collection.create_index([("admin_id", 1), ("party_id", 1), ("created_at", -1)])
party_ledger_collection.create_index([("admin_id", 1), ("party_id", 1), ("status", 1), ("due_date", 1)])
party_payments_collection.create_index([("admin_id", 1), ("party_id", 1), ("payment_date", -1)])

def get_db():
    """Dependency for database access"""
    try:
        yield database
    finally:
        pass  # MongoDB handles connection pooling automatically
