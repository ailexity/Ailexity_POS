from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import json
import io

import database
import auth
from models import serialize_doc, serialize_docs

IST = timezone(timedelta(hours=5, minutes=30))

router = APIRouter(prefix="/system", tags=["backup"])

COLLECTIONS = {
    "users": database.users_collection,
    "items": database.items_collection,
    "invoices": database.invoices_collection,
    "invoice_items": database.invoice_items_collection,
    "tables": database.database["tables"],
    "table_carts": database.table_carts_collection,
    "raw_stock": database.raw_stock_collection,
    "parties": database.parties_collection,
    "party_ledger": database.party_ledger_collection,
    "party_payments": database.party_payments_collection,
}

SENSITIVE_FIELDS = {"hashed_password"}


def _sanitize(doc: dict) -> dict:
    return {k: v for k, v in doc.items() if k not in SENSITIVE_FIELDS}


def _serialize_value(v):
    if isinstance(v, ObjectId):
        return str(v)
    if isinstance(v, datetime):
        return v.isoformat()
    if isinstance(v, dict):
        return {k2: _serialize_value(v2) for k2, v2 in v.items()}
    if isinstance(v, list):
        return [_serialize_value(i) for i in v]
    return v


def _export_doc(doc: dict) -> dict:
    doc = dict(doc)
    if "_id" in doc:
        doc["id"] = str(doc.pop("_id"))
    return {k: _serialize_value(v) for k, v in _sanitize(doc).items()}


def _build_full_export() -> dict:
    payload = {
        "exported_at": datetime.now(IST).isoformat(),
        "version": "1.0",
        "collections": {},
    }
    for name, col in COLLECTIONS.items():
        payload["collections"][name] = [_export_doc(d) for d in col.find({})]
    return payload


def _build_admin_export(admin_id: str) -> dict:
    payload = {
        "exported_at": datetime.now(IST).isoformat(),
        "version": "1.0",
        "admin_id": admin_id,
        "collections": {},
    }

    per_admin = {
        "items": database.items_collection,
        "invoices": database.invoices_collection,
        "invoice_items": database.invoice_items_collection,
        "tables": database.database["tables"],
        "table_carts": database.table_carts_collection,
        "raw_stock": database.raw_stock_collection,
        "parties": database.parties_collection,
        "party_ledger": database.party_ledger_collection,
        "party_payments": database.party_payments_collection,
    }

    for name, col in per_admin.items():
        payload["collections"][name] = [_export_doc(d) for d in col.find({"admin_id": admin_id})]

    # Sub-users (attendees/kitchen) belonging to this admin
    sub_users = list(database.users_collection.find({"admin_id": admin_id}))
    payload["collections"]["sub_users"] = [_export_doc(d) for d in sub_users]

    return payload


@router.get("/backup")
async def full_system_backup(current_user: dict = Depends(auth.get_sysadmin_user)):
    """Download a full JSON backup of all collections (sysadmin only, passwords excluded)."""
    data = _build_full_export()
    ts = datetime.now(IST).strftime("%Y%m%d_%H%M%S")
    filename = f"ailexity_backup_{ts}.json"

    content = json.dumps(data, ensure_ascii=False, indent=2)
    return StreamingResponse(
        io.BytesIO(content.encode("utf-8")),
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/backup/{admin_id}")
async def admin_data_export(admin_id: str, current_user: dict = Depends(auth.get_sysadmin_user)):
    """Download a JSON export of a single admin's data (sysadmin only, passwords excluded)."""
    admin = database.users_collection.find_one({"_id": ObjectId(admin_id)})
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    if admin.get("role") not in ("admin", "attendee", "kitchen"):
        raise HTTPException(status_code=400, detail="Target must be an admin account")

    data = _build_admin_export(admin_id)
    safe_name = (admin.get("business_name") or admin.get("username") or admin_id).replace(" ", "_")
    ts = datetime.now(IST).strftime("%Y%m%d_%H%M%S")
    filename = f"ailexity_export_{safe_name}_{ts}.json"

    content = json.dumps(data, ensure_ascii=False, indent=2)
    return StreamingResponse(
        io.BytesIO(content.encode("utf-8")),
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/backup-stats")
async def backup_stats(current_user: dict = Depends(auth.get_sysadmin_user)):
    """Return document counts per collection for the stats panel."""
    counts = {name: col.count_documents({}) for name, col in COLLECTIONS.items()}
    counts["total"] = sum(counts.values())
    return counts
