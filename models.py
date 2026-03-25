"""
MongoDB Document Schemas and Helper Functions
No ORM models - MongoDB uses documents directly
"""
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from bson import ObjectId

# India Standard Time (IST) - GMT+5:30
IST = timezone(timedelta(hours=5, minutes=30))

# Helper function to serialize MongoDB documents
def serialize_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Convert MongoDB document to JSON-serializable dict"""
    if doc is None:
        return None
    if "_id" in doc:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
    return doc

def serialize_docs(docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Convert list of MongoDB documents to JSON-serializable list"""
    return [serialize_doc(doc) for doc in docs]

# Document Structure Definitions (for reference)

class UserDocument:
    """User document structure"""
    @staticmethod
    def create(
        username: str,
        hashed_password: str,
        role: str = "admin",
        business_name: Optional[str] = None,
        phone: Optional[str] = None,
        email: Optional[str] = None,
        full_name: Optional[str] = None,
        business_address: Optional[str] = None,
        business_type: Optional[str] = None,
        tax_id: Optional[str] = None,
        tax_rate: float = 0.0,
        store_email: Optional[str] = None,
        store_phone: Optional[str] = None,
        bank_account: Optional[str] = None,
        bank_name: Optional[str] = None,
        account_name: Optional[str] = None,
        invoice_notes: Optional[str] = None,
        invoice_terms: Optional[str] = None,
        subscription_status: str = "active",
        active_window_start: Optional[str] = None,
        active_window_end: Optional[str] = None,
        is_active: bool = True,
        enable_multi_device_sync: bool = False,
        enable_order_management: bool = False
    ) -> Dict[str, Any]:
        return {
            "username": username,
            "hashed_password": hashed_password,
            "role": role,
            "is_active": is_active,
            "business_name": business_name,
            "phone": phone,
            "email": email,
            "full_name": full_name,
            "business_address": business_address,
            "business_type": business_type,
            "tax_id": tax_id,
            "tax_rate": tax_rate,
            "store_email": store_email,
            "store_phone": store_phone,
            "bank_account": bank_account,
            "bank_name": bank_name,
            "account_name": account_name,
            "invoice_notes": invoice_notes,
            "invoice_terms": invoice_terms,
            "subscription_status": subscription_status,
            "active_window_start": active_window_start,
            "active_window_end": active_window_end,
            "enable_multi_device_sync": enable_multi_device_sync,
            "enable_order_management": enable_order_management,
            "created_at": datetime.now(IST),
            "last_login": None
        }
        

class ItemDocument:
    """Item document structure"""
    @staticmethod
    def create(
        admin_id: str,
        name: str,
        category: str,
        price: float,
        tax_rate: float = 0.0,
        hsn_code: Optional[str] = None,
        stock_quantity: int = 0,
        limit_stock: bool = True,
        manufacturing_cost: float = 0.0
    ) -> Dict[str, Any]:
        return {
            "admin_id": admin_id,
            "name": name,
            "category": category,
            "price": price,
            "tax_rate": tax_rate,
            "hsn_code": hsn_code,
            "stock_quantity": stock_quantity,
            "limit_stock": limit_stock,
            "manufacturing_cost": manufacturing_cost
        }

class InvoiceDocument:
    """Invoice document structure"""
    @staticmethod
    def create(
        admin_id: str,
        invoice_number: str,
        customer_name: Optional[str],
        customer_phone: Optional[str],
        customer_address: Optional[str],
        customer_gstin: Optional[str],
        total_amount: float,
        payment_mode: str = "Cash",
        transaction_id: Optional[str] = None,
        payment_status: str = "Paid",
        items: List[Dict[str, Any]] = None,
        created_at: Optional[datetime] = None
    ) -> Dict[str, Any]:
        return {
            "admin_id": admin_id,
            "invoice_number": invoice_number,
            "created_at": created_at if created_at else datetime.now(IST),
            "customer_name": customer_name,
            "customer_phone": customer_phone,
            "customer_address": customer_address,
            "customer_gstin": customer_gstin,
            "total_amount": total_amount,
            "payment_mode": payment_mode,
            "transaction_id": transaction_id,
            "payment_status": payment_status,
            "items": items or []
        }

class InvoiceItemDocument:
    """Invoice item subdocument structure (embedded in invoice)"""
    @staticmethod
    def create(
        item_id: Optional[str],
        item_name: str,
        quantity: int,
        unit_price: float,
        tax_amount: float,
        total_price: float,
        manufacturing_cost: float = 0.0
    ) -> Dict[str, Any]:
        return {
            "item_id": item_id,
            "item_name": item_name,
            "quantity": quantity,
            "unit_price": unit_price,
            "tax_amount": tax_amount,
            "total_price": total_price,
            "manufacturing_cost": manufacturing_cost,
            "profit": (unit_price - manufacturing_cost) * quantity  # Profit per line item
        }

class SystemSettingsDocument:
    """System settings document structure"""
    @staticmethod
    def create(setting_key: str, setting_value: str) -> Dict[str, Any]:
        return {
            "setting_key": setting_key,
            "setting_value": setting_value,
            "created_at": datetime.now(IST),
            "updated_at": datetime.now(IST)
        }

class TableDocument:
    """Table document structure for restaurant table management"""
    @staticmethod
    def create(
        admin_id: str,
        table_number: str,
        table_name: Optional[str] = None,
        capacity: int = 4,
        is_active: bool = True
    ) -> Dict[str, Any]:
        return {
            "admin_id": admin_id,
            "table_number": table_number,
            "table_name": table_name or f"Table {table_number}",
            "capacity": capacity,
            "is_active": is_active,
            "created_at": datetime.now(IST),
            "updated_at": datetime.now(IST)
        }


