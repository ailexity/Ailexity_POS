from fastapi import APIRouter, Depends, HTTPException, Header
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from pymongo.database import Database
from bson import ObjectId
import os
import schemas
import database
import auth
from models import InvoiceDocument, InvoiceItemDocument, serialize_doc

# India Standard Time (IST) - GMT+5:30
IST = timezone(timedelta(hours=5, minutes=30))

router = APIRouter(
    prefix="/online-orders",
    tags=["online-orders"],
)

ALLOWED_SOURCES = {"zomato", "swiggy", "website", "app"}


def _generate_invoice_number(admin_id: str) -> str:
    counter_key = f"invoice_counter_{admin_id}"
    counter_doc = database.system_settings_collection.find_one({"setting_key": counter_key})

    if counter_doc:
        next_number = counter_doc["value"] + 1
        database.system_settings_collection.update_one(
            {"setting_key": counter_key},
            {"$set": {"value": next_number}}
        )
    else:
        next_number = 1
        database.system_settings_collection.insert_one({
            "setting_key": counter_key,
            "value": next_number,
            "admin_id": admin_id,
            "created_at": datetime.now(IST)
        })

    return f"INV-{str(next_number).zfill(5)}"


@router.get("/", response_model=List[schemas.InvoiceResponse])
def read_online_orders(
    source: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Database = Depends(database.get_db),
    current_user: dict = Depends(auth.get_current_active_user)
):
    query: Dict[str, Any] = {"order_source": {"$in": list(ALLOWED_SOURCES)}}

    if source:
        source_lc = source.lower()
        if source_lc not in ALLOWED_SOURCES:
            raise HTTPException(status_code=400, detail="Unsupported order source")
        query["order_source"] = source_lc

    if current_user.get("role") != "sysadmin":
        query["admin_id"] = current_user["id"]

    orders = list(database.invoices_collection.find(query).sort("created_at", -1).skip(skip).limit(limit))
    return [serialize_doc(order) for order in orders]


@router.post("/webhook/{platform}")
def receive_online_order(
    platform: str,
    payload: Dict[str, Any],
    x_webhook_token: Optional[str] = Header(default=None),
    db: Database = Depends(database.get_db)
):
    platform_lc = platform.lower()
    if platform_lc not in ALLOWED_SOURCES:
        raise HTTPException(status_code=400, detail="Unsupported order source")

    expected_token = os.getenv("ONLINE_ORDERS_WEBHOOK_TOKEN")
    if expected_token and x_webhook_token != expected_token:
        raise HTTPException(status_code=403, detail="Invalid webhook token")

    admin_id = payload.get("admin_id")
    if admin_id and not ObjectId.is_valid(admin_id):
        raise HTTPException(status_code=400, detail="Invalid admin_id")

    if not admin_id:
        admin_username = payload.get("admin_username")
        if admin_username:
            admin = database.users_collection.find_one({"username": admin_username})
            if admin:
                admin_id = str(admin["_id"])

    if not admin_id:
        raise HTTPException(status_code=400, detail="admin_id or admin_username is required")

    created_at = payload.get("created_at")
    if isinstance(created_at, str):
        try:
            created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
        except Exception:
            created_at = None

    invoice_items = []
    total_amount = 0.0
    for item in payload.get("items", []):
        quantity = int(item.get("quantity", 1) or 1)
        unit_price = float(item.get("unit_price", 0) or 0)
        tax_amount = float(item.get("tax_amount", 0) or 0)
        row_total = (unit_price * quantity) + tax_amount
        total_amount += row_total

        invoice_items.append(
            InvoiceItemDocument.create(
                item_id=None,
                item_name=str(item.get("item_name") or "Item"),
                quantity=quantity,
                unit_price=unit_price,
                tax_amount=tax_amount,
                total_price=row_total,
                manufacturing_cost=0.0
            )
        )

    if payload.get("total_amount") is not None:
        try:
            total_amount = float(payload.get("total_amount"))
        except Exception:
            pass

    payment_mode = str(payload.get("payment_mode") or "Online")
    payment_status = str(payload.get("payment_status") or "Paid")
    if payment_mode.lower() == "cod" and payload.get("payment_status") is None:
        payment_status = "Pending"

    new_invoice = InvoiceDocument.create(
        admin_id=admin_id,
        invoice_number=_generate_invoice_number(admin_id),
        customer_name=payload.get("customer_name") or "Online Customer",
        customer_phone=payload.get("customer_phone") or None,
        customer_address=payload.get("customer_address") or payload.get("delivery_address") or None,
        customer_gstin=None,
        total_amount=total_amount,
        payment_mode=payment_mode,
        transaction_id=payload.get("transaction_id"),
        payment_status=payment_status,
        items=invoice_items,
        created_at=created_at or datetime.now(IST)
    )

    new_invoice["order_source"] = platform_lc
    new_invoice["order_type"] = payload.get("order_type") or "delivery"
    new_invoice["status"] = payload.get("status") or "new"
    new_invoice["external_order_id"] = payload.get("external_order_id")

    result = database.invoices_collection.insert_one(new_invoice)
    new_invoice["_id"] = result.inserted_id

    return serialize_doc(new_invoice)
