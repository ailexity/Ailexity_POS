import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import database, users_collection, items_collection, system_settings_collection
from backend.models import UserDocument, ItemDocument, SystemSettingsDocument
from backend import auth

def init_db():
    """Initialize MongoDB database with default data"""
    
    # Create System Admin
    sysadmin = users_collection.find_one({"username": "sysadmin"})
    if not sysadmin:
        sysadmin_doc = UserDocument.create(
            username="sysadmin",
            hashed_password=auth.get_password_hash("sysadmin123"),
            role="sysadmin",
            business_name="System Administrator",
            subscription_status="active"
        )
        users_collection.insert_one(sysadmin_doc)
        print("✓ Created sysadmin user")
    
    # Create Default Admin (Business 1)
    admin_user = users_collection.find_one({"username": "admin"})
    if not admin_user:
        admin_doc = UserDocument.create(
            username="admin",
            hashed_password=auth.get_password_hash("admin123"),
            role="admin",
            business_name="Downtown Cafe",
            phone="123-456-7890",
            subscription_status="active"
        )
        result = users_collection.insert_one(admin_doc)
        admin_user_id = str(result.inserted_id)
        print("✓ Created admin user (Downtown Cafe)")
        
        # Create some sample items for admin (Downtown Cafe)
        if items_collection.count_documents({"admin_id": admin_user_id}) == 0:
            print("Creating sample items for admin...")
            items = [
                ItemDocument.create(admin_id=admin_user_id, name="Premium Coffee", category="Beverage", price=4.50, stock_quantity=100),
                ItemDocument.create(admin_id=admin_user_id, name="Croissant", category="Bakery", price=3.00, stock_quantity=50),
                ItemDocument.create(admin_id=admin_user_id, name="Green Tea", category="Beverage", price=3.50, stock_quantity=80),
            ]
            items_collection.insert_many(items)
            print("✓ Sample items created for admin")
        
    # Create Second Admin (Business 2)
    admin2_user = users_collection.find_one({"username": "admin2"})
    if not admin2_user:
        admin2_doc = UserDocument.create(
            username="admin2",
            hashed_password=auth.get_password_hash("admin123"),
            role="admin",
            business_name="City Pizza",
            phone="987-654-3210",
            subscription_status="active"
        )
        result = users_collection.insert_one(admin2_doc)
        admin2_user_id = str(result.inserted_id)
        print("✓ Created admin2 user (City Pizza)")
        
        # Create some sample items for admin2 (City Pizza)
        if items_collection.count_documents({"admin_id": admin2_user_id}) == 0:
            print("Creating sample items for admin2...")
            items2 = [
                ItemDocument.create(admin_id=admin2_user_id, name="Pepperoni Pizza", category="Pizza", price=12.00, stock_quantity=20),
                ItemDocument.create(admin_id=admin2_user_id, name="Cheese Pizza", category="Pizza", price=10.00, stock_quantity=20),
                ItemDocument.create(admin_id=admin2_user_id, name="Cola", category="Beverage", price=2.00, stock_quantity=100),
            ]
            items_collection.insert_many(items2)
            print("✓ Sample items created for admin2")
    
    # Initialize System Settings (System Admin Password)
    system_password = system_settings_collection.find_one({"setting_key": "system_admin_password"})
    if not system_password:
        system_password_doc = SystemSettingsDocument.create(
            setting_key="system_admin_password",
            setting_value=auth.get_password_hash("9561587176")
        )
        system_settings_collection.insert_one(system_password_doc)
        print("✓ Initialized system admin password")
    
    print("\n✅ MongoDB database initialized successfully!")
    print("\n📋 Default Accounts:")
    print("   1. System Admin: sysadmin / sysadmin123")
    print("   2. Downtown Cafe: admin / admin123")
    print("   3. City Pizza:   admin2 / admin123")
    print("\n🔒 Multi-tenant isolation is now active!")
    print("   Each admin has their own isolated data.")

if __name__ == "__main__":
    init_db()

