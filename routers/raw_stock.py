from datetime import datetime, timezone, timedelta
from typing import List

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from pymongo.database import Database

from ailexity_backend import auth, database, schemas
from ailexity_backend.models import serialize_doc, serialize_docs

IST = timezone(timedelta(hours=5, minutes=30))

router = APIRouter(
    prefix="/raw-stock",
    tags=["raw-stock"],
    responses={404: {"detail": "Not found"}},
)


def _to_float(value, default=0.0):
    try:
        return float(value)
    except Exception:
        return float(default)


def _normalize_detail(detail: schemas.RawStockDetail):
    return {
        "id": detail.id or str(ObjectId()),
        "vendor": (detail.vendor or "").strip(),
        "batchNo": (detail.batchNo or "").strip(),
        "unitCost": _to_float(detail.unitCost, 0),
        "expiryDate": (detail.expiryDate or "").strip(),
        "note": (detail.note or "").strip(),
    }


def _normalize_txn_datetime(txn: dict):
    dt = txn.get("created_at") or txn.get("createdAt")
    if isinstance(dt, str):
        try:
            dt = datetime.fromisoformat(dt.replace("Z", "+00:00"))
        except Exception:
            return None
    if not isinstance(dt, datetime):
        return None

    if dt.tzinfo is not None:
        return dt.astimezone(IST).replace(tzinfo=None)
    return dt


@router.get("/", response_model=List[schemas.RawStockItemResponse])
def read_raw_stock(
    skip: int = 0,
    limit: int = 200,
    db: Database = Depends(database.get_db),
    current_user: dict = Depends(auth.get_current_active_user),
):
    if current_user.get("role") == "sysadmin":
        records = list(database.raw_stock_collection.find({}).sort("updated_at", -1).skip(skip).limit(limit))
    else:
        records = list(
            database.raw_stock_collection.find({"admin_id": current_user["id"]})
            .sort("updated_at", -1)
            .skip(skip)
            .limit(limit)
        )
    return serialize_docs(records)


@router.get("/insights", response_model=schemas.RawStockInsightsResponse)
def raw_stock_insights(
    db: Database = Depends(database.get_db),
    current_user: dict = Depends(auth.get_current_active_user),
):
    filter_query = {} if current_user.get("role") == "sysadmin" else {"admin_id": current_user["id"]}
    records = list(database.raw_stock_collection.find(filter_query, {"transactions": 1}))

    now = datetime.now()
    start_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
    start_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    month_buy = 0.0
    month_usage = 0.0
    today_buy = 0.0
    today_usage = 0.0

    for record in records:
        transactions = record.get("transactions")
        if not isinstance(transactions, list):
            continue

        for txn in transactions:
            if not isinstance(txn, dict):
                continue

            created_at = _normalize_txn_datetime(txn)
            if created_at is None:
                continue

            amount = _to_float(txn.get("totalPrice"), 0)
            is_today = created_at >= start_day
            is_month = created_at >= start_month

            if txn.get("type") == "entry":
                if is_today:
                    today_buy += amount
                if is_month:
                    month_buy += amount
            elif txn.get("type") == "exit":
                if is_today:
                    today_usage += amount
                if is_month:
                    month_usage += amount

    return {
        "monthBuyValue": month_buy,
        "monthUsageValue": month_usage,
        "monthNetCost": month_buy - month_usage,
        "todayBuyValue": today_buy,
        "todayUsageValue": today_usage,
    }


@router.post("/", response_model=schemas.RawStockItemResponse)
def create_raw_stock(
    payload: schemas.RawStockItemCreate,
    db: Database = Depends(database.get_db),
    current_user: dict = Depends(auth.get_admin_user),
):
    if current_user.get("role") == "sysadmin":
        raise HTTPException(status_code=403, detail="SysAdmin cannot create raw stock")

    now = datetime.now(IST)
    doc = {
        "admin_id": current_user["id"],
        "name": payload.name.strip(),
        "unit": payload.unit.strip(),
        "reorderLevel": _to_float(payload.reorderLevel, 0),
        "currentStock": _to_float(payload.currentStock, 0),
        "details": [_normalize_detail(d) for d in payload.details],
        "transactions": [],
        "created_at": now,
        "updated_at": now,
    }

    result = database.raw_stock_collection.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_doc(doc)


@router.put("/{item_id}", response_model=schemas.RawStockItemResponse)
def update_raw_stock(
    item_id: str,
    payload: schemas.RawStockItemUpdate,
    db: Database = Depends(database.get_db),
    current_user: dict = Depends(auth.get_admin_user),
):
    if not ObjectId.is_valid(item_id):
        raise HTTPException(status_code=400, detail="Invalid stock id")

    existing = database.raw_stock_collection.find_one({"_id": ObjectId(item_id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Stock item not found")

    if current_user.get("role") != "sysadmin" and existing.get("admin_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    update_data = {
        "name": payload.name.strip(),
        "unit": payload.unit.strip(),
        "reorderLevel": _to_float(payload.reorderLevel, 0),
        "currentStock": _to_float(payload.currentStock, 0),
        "details": [_normalize_detail(d) for d in payload.details],
        "updated_at": datetime.now(IST),
    }

    database.raw_stock_collection.update_one({"_id": ObjectId(item_id)}, {"$set": update_data})
    updated = database.raw_stock_collection.find_one({"_id": ObjectId(item_id)})
    return serialize_doc(updated)


@router.post("/{item_id}/transactions", response_model=schemas.RawStockItemResponse)
def add_raw_stock_transaction(
    item_id: str,
    payload: schemas.RawStockTransactionCreate,
    db: Database = Depends(database.get_db),
    current_user: dict = Depends(auth.get_admin_user),
):
    if not ObjectId.is_valid(item_id):
        raise HTTPException(status_code=400, detail="Invalid stock id")

    record = database.raw_stock_collection.find_one({"_id": ObjectId(item_id)})
    if not record:
        raise HTTPException(status_code=404, detail="Stock item not found")

    if current_user.get("role") != "sysadmin" and record.get("admin_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    txn_type = (payload.type or "").strip().lower()
    if txn_type not in ["entry", "exit"]:
        raise HTTPException(status_code=400, detail="Transaction type must be entry or exit")

    qty = _to_float(payload.quantity, 0)
    unit_price = _to_float(payload.unitPrice, 0)
    if qty <= 0 or unit_price <= 0:
        raise HTTPException(status_code=400, detail="Quantity and unit price must be greater than 0")

    used_at = (payload.usedAt or "").strip()
    if txn_type == "exit" and not used_at:
        raise HTTPException(status_code=400, detail="usedAt is required for exit")

    current_stock = _to_float(record.get("currentStock"), 0)
    if txn_type == "exit" and qty > current_stock:
        raise HTTPException(status_code=400, detail="Not enough stock for exit")

    stock_after = current_stock + qty if txn_type == "entry" else current_stock - qty

    txn = {
        "id": str(ObjectId()),
        "type": txn_type,
        "quantity": qty,
        "unitPrice": unit_price,
        "totalPrice": qty * unit_price,
        "reference": (payload.reference or "").strip(),
        "note": (payload.note or "").strip(),
        "usedAt": used_at,
        "usedFor": (payload.usedFor or "").strip(),
        "created_at": datetime.now(IST),
    }

    database.raw_stock_collection.update_one(
        {"_id": ObjectId(item_id)},
        {
            "$set": {
                "currentStock": stock_after,
                "updated_at": datetime.now(IST),
            },
            "$push": {
                "transactions": {
                    "$each": [txn],
                    "$position": 0,
                }
            },
        },
    )

    updated = database.raw_stock_collection.find_one({"_id": ObjectId(item_id)})
    return serialize_doc(updated)


@router.delete("/{item_id}")
def delete_raw_stock(
    item_id: str,
    db: Database = Depends(database.get_db),
    current_user: dict = Depends(auth.get_admin_user),
):
    if not ObjectId.is_valid(item_id):
        raise HTTPException(status_code=400, detail="Invalid stock id")

    existing = database.raw_stock_collection.find_one({"_id": ObjectId(item_id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Stock item not found")

    if current_user.get("role") != "sysadmin" and existing.get("admin_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    database.raw_stock_collection.delete_one({"_id": ObjectId(item_id)})
    return {"ok": True}
