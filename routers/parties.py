from datetime import datetime, timezone, timedelta
from typing import List, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query
from pymongo.database import Database

from ailexity_backend import auth, database, schemas
from ailexity_backend.models import serialize_doc, serialize_docs

IST = timezone(timedelta(hours=5, minutes=30))

router = APIRouter(prefix="/parties", tags=["parties", "ledger", "payments"])

VALID_PARTY_TYPES = {"customer", "supplier", "both"}
VALID_LEDGER_TYPES = {"sale", "purchase", "adjustment"}
VALID_PAYMENT_TYPES = {"payment_in", "payment_out"}


def _to_float(value, default=0.0):
    try:
        return float(value)
    except Exception:
        return float(default)


def _to_int(value, default=0):
    try:
        return int(value)
    except Exception:
        return int(default)


def _normalize_party_type(value: Optional[str]) -> str:
    normalized = (value or "customer").strip().lower()
    if normalized not in VALID_PARTY_TYPES:
        raise HTTPException(status_code=400, detail="party_type must be customer, supplier, or both")
    return normalized


def _scope_query(current_user: dict, extra: Optional[dict] = None) -> dict:
    q = dict(extra or {})
    if current_user.get("role") != "sysadmin":
        q["admin_id"] = current_user["id"]
    return q


def _get_party_or_404(party_id: str, current_user: dict):
    if not ObjectId.is_valid(party_id):
        raise HTTPException(status_code=400, detail="Invalid party id")

    party = database.parties_collection.find_one(_scope_query(current_user, {"_id": ObjectId(party_id)}))
    if not party:
        raise HTTPException(status_code=404, detail="Party not found")
    return party


def _recalculate_party_balance(party_id: str, admin_id: str):
    ledger_rows = list(
        database.party_ledger_collection.find(
            {
                "party_id": party_id,
                "admin_id": admin_id,
            },
            {"entry_type": 1, "amount": 1, "status": 1, "due_amount": 1},
        )
    )

    balance = 0.0
    total_receivable = 0.0
    total_payable = 0.0

    for row in ledger_rows:
        entry_type = row.get("entry_type")
        amount = _to_float(row.get("amount"), 0)

        if entry_type == "sale":
            balance += amount
        elif entry_type == "purchase":
            balance -= amount
        elif entry_type == "payment_in":
            balance -= amount
        elif entry_type == "payment_out":
            balance += amount
        elif entry_type == "adjustment":
            balance += amount

        if row.get("status") in ["open", "partial"]:
            due_amt = _to_float(row.get("due_amount"), 0)
            if entry_type == "sale" and due_amt > 0:
                total_receivable += due_amt
            elif entry_type == "purchase" and due_amt > 0:
                total_payable += due_amt

    database.parties_collection.update_one(
        {"_id": ObjectId(party_id)},
        {
            "$set": {
                "current_balance": round(balance, 2),
                "total_receivable": round(total_receivable, 2),
                "total_payable": round(total_payable, 2),
                "updated_at": datetime.now(IST),
            }
        },
    )


def _ledger_direction(entry_type: str) -> str:
    if entry_type in ["sale", "payment_out"]:
        return "increase_receivable"
    if entry_type in ["purchase", "payment_in"]:
        return "increase_payable"
    return "adjustment"


def _create_ledger_entry(
    admin_id: str,
    party_id: str,
    entry_type: str,
    amount: float,
    paid_amount: float = 0.0,
    reference_no: Optional[str] = None,
    due_date: Optional[datetime] = None,
    notes: Optional[str] = None,
):
    amount = round(_to_float(amount, 0), 2)
    paid_amount = round(_to_float(paid_amount, 0), 2)

    if amount <= 0:
        raise HTTPException(status_code=400, detail="amount must be greater than 0")
    if paid_amount < 0:
        raise HTTPException(status_code=400, detail="paid_amount cannot be negative")
    if paid_amount > amount:
        raise HTTPException(status_code=400, detail="paid_amount cannot exceed amount")

    due_amount = round(amount - paid_amount, 2)
    status = "paid" if due_amount == 0 else ("partial" if paid_amount > 0 else "open")

    now = datetime.now(IST)
    row = {
        "admin_id": admin_id,
        "party_id": party_id,
        "entry_type": entry_type,
        "amount": amount,
        "paid_amount": paid_amount,
        "due_amount": due_amount,
        "status": status,
        "direction": _ledger_direction(entry_type),
        "reference_no": (reference_no or "").strip() or None,
        "due_date": due_date,
        "notes": (notes or "").strip() or None,
        "created_at": now,
        "updated_at": now,
    }

    result = database.party_ledger_collection.insert_one(row)
    row["_id"] = result.inserted_id
    return row


def _auto_allocate_payment(admin_id: str, party_id: str, payment_type: str, amount: float):
    target_entry_type = "sale" if payment_type == "payment_in" else "purchase"
    remaining = round(_to_float(amount, 0), 2)
    allocations = []

    if remaining <= 0:
        return allocations

    open_rows = list(
        database.party_ledger_collection.find(
            {
                "admin_id": admin_id,
                "party_id": party_id,
                "entry_type": target_entry_type,
                "status": {"$in": ["open", "partial"]},
                "due_amount": {"$gt": 0},
            }
        ).sort([("due_date", 1), ("created_at", 1)])
    )

    for row in open_rows:
        if remaining <= 0:
            break
        due = round(_to_float(row.get("due_amount"), 0), 2)
        if due <= 0:
            continue
        allocate = min(due, remaining)
        new_paid = round(_to_float(row.get("paid_amount"), 0) + allocate, 2)
        new_due = round(due - allocate, 2)
        new_status = "paid" if new_due == 0 else "partial"

        database.party_ledger_collection.update_one(
            {"_id": row["_id"]},
            {
                "$set": {
                    "paid_amount": new_paid,
                    "due_amount": new_due,
                    "status": new_status,
                    "updated_at": datetime.now(IST),
                }
            },
        )

        allocations.append({"ledger_entry_id": str(row["_id"]), "amount": allocate})
        remaining = round(remaining - allocate, 2)

    return allocations


@router.post("/", response_model=schemas.PartyResponse)
def create_party(
    payload: schemas.PartyCreate,
    db: Database = Depends(database.get_db),
    current_user: dict = Depends(auth.get_admin_user),
):
    if current_user.get("role") == "sysadmin":
        raise HTTPException(status_code=403, detail="SysAdmin cannot create parties")

    party_name = payload.party_name.strip()
    if not party_name:
        raise HTTPException(status_code=400, detail="party_name is required")

    party_type = _normalize_party_type(payload.party_type)

    duplicate = database.parties_collection.find_one({
        "admin_id": current_user["id"],
        "party_name": party_name,
    })
    if duplicate:
        raise HTTPException(status_code=400, detail="Party with this name already exists")

    opening_balance = round(_to_float(payload.opening_balance, 0), 2)
    now = datetime.now(IST)

    party = {
        "admin_id": current_user["id"],
        "party_name": party_name,
        "party_type": party_type,
        "contact_person": (payload.contact_person or "").strip() or None,
        "phone": (payload.phone or "").strip() or None,
        "email": (payload.email or "").strip() or None,
        "address": (payload.address or "").strip() or None,
        "gstin": (payload.gstin or "").strip() or None,
        "credit_limit": round(_to_float(payload.credit_limit, 0), 2),
        "payment_terms_days": max(0, _to_int(payload.payment_terms_days, 0)),
        "opening_balance": opening_balance,
        "notes": (payload.notes or "").strip() or None,
        "is_active": bool(payload.is_active),
        "current_balance": opening_balance,
        "total_receivable": round(max(opening_balance, 0), 2),
        "total_payable": round(abs(min(opening_balance, 0)), 2),
        "created_at": now,
        "updated_at": now,
    }

    result = database.parties_collection.insert_one(party)
    party["_id"] = result.inserted_id

    if opening_balance != 0:
        _create_ledger_entry(
            admin_id=current_user["id"],
            party_id=str(result.inserted_id),
            entry_type="adjustment",
            amount=abs(opening_balance),
            paid_amount=abs(opening_balance),
            reference_no="OPENING_BALANCE",
            notes="Opening balance adjustment",
        )
        _recalculate_party_balance(str(result.inserted_id), current_user["id"])

    return serialize_doc(party)


@router.get("/", response_model=List[schemas.PartyResponse])
def list_parties(
    q: Optional[str] = Query(default=None),
    party_type: Optional[str] = Query(default=None),
    is_active: Optional[bool] = Query(default=None),
    has_dues: Optional[bool] = Query(default=None),
    db: Database = Depends(database.get_db),
    current_user: dict = Depends(auth.get_current_active_user),
):
    query = _scope_query(current_user)

    if party_type:
        query["party_type"] = _normalize_party_type(party_type)
    if is_active is not None:
        query["is_active"] = is_active
    if q:
        query["$or"] = [
            {"party_name": {"$regex": q, "$options": "i"}},
            {"phone": {"$regex": q, "$options": "i"}},
            {"email": {"$regex": q, "$options": "i"}},
            {"gstin": {"$regex": q, "$options": "i"}},
        ]

    rows = serialize_docs(list(database.parties_collection.find(query).sort("party_name", 1)))

    if has_dues is None:
        return rows

    filtered = []
    for row in rows:
        receivable = _to_float(row.get("total_receivable"), 0)
        payable = _to_float(row.get("total_payable"), 0)
        due = receivable > 0 or payable > 0
        if (has_dues and due) or (not has_dues and not due):
            filtered.append(row)
    return filtered


@router.get("/dues/alerts", response_model=List[schemas.PartyDueAlertResponse])
def due_alerts(
    days: int = Query(default=0, ge=0),
    db: Database = Depends(database.get_db),
    current_user: dict = Depends(auth.get_current_active_user),
):
    today = datetime.now(IST).replace(hour=0, minute=0, second=0, microsecond=0)
    cutoff = today - timedelta(days=days)

    query = _scope_query(
        current_user,
        {
            "status": {"$in": ["open", "partial"]},
            "due_amount": {"$gt": 0},
            "due_date": {"$lte": cutoff},
            "entry_type": {"$in": ["sale", "purchase"]},
        },
    )

    dues = list(database.party_ledger_collection.find(query).sort([("due_date", 1), ("created_at", 1)]))
    if not dues:
        return []

    party_ids = list({row.get("party_id") for row in dues if row.get("party_id")})
    parties = {
        p["id"]: p
        for p in serialize_docs(
            list(
                database.parties_collection.find(
                    {"_id": {"$in": [ObjectId(pid) for pid in party_ids if ObjectId.is_valid(pid)]}},
                    {"party_name": 1},
                )
            )
        )
    }

    result = []
    for row in dues:
        due_date = row.get("due_date")
        if not isinstance(due_date, datetime):
            continue
        due_base = due_date.astimezone(IST).replace(tzinfo=None) if due_date.tzinfo else due_date
        day_base = today.replace(tzinfo=None)
        days_overdue = max(0, (day_base - due_base.replace(hour=0, minute=0, second=0, microsecond=0)).days)

        party_id = row.get("party_id")
        party_name = parties.get(party_id, {}).get("party_name", "Unknown Party")

        result.append(
            {
                "party_id": party_id,
                "party_name": party_name,
                "ledger_entry_id": str(row["_id"]),
                "entry_type": row.get("entry_type"),
                "due_amount": round(_to_float(row.get("due_amount"), 0), 2),
                "due_date": due_date,
                "days_overdue": days_overdue,
            }
        )

    return result


@router.get("/{party_id}", response_model=schemas.PartyResponse)
def get_party(
    party_id: str,
    db: Database = Depends(database.get_db),
    current_user: dict = Depends(auth.get_current_active_user),
):
    return serialize_doc(_get_party_or_404(party_id, current_user))


@router.put("/{party_id}", response_model=schemas.PartyResponse)
def update_party(
    party_id: str,
    payload: schemas.PartyUpdate,
    db: Database = Depends(database.get_db),
    current_user: dict = Depends(auth.get_admin_user),
):
    party = _get_party_or_404(party_id, current_user)

    updates = {}
    if payload.party_name is not None:
        party_name = payload.party_name.strip()
        if not party_name:
            raise HTTPException(status_code=400, detail="party_name cannot be blank")

        duplicate = database.parties_collection.find_one(
            {
                "admin_id": party["admin_id"],
                "party_name": party_name,
                "_id": {"$ne": party["_id"]},
            }
        )
        if duplicate:
            raise HTTPException(status_code=400, detail="Party with this name already exists")
        updates["party_name"] = party_name

    if payload.party_type is not None:
        updates["party_type"] = _normalize_party_type(payload.party_type)
    if payload.contact_person is not None:
        updates["contact_person"] = (payload.contact_person or "").strip() or None
    if payload.phone is not None:
        updates["phone"] = (payload.phone or "").strip() or None
    if payload.email is not None:
        updates["email"] = (payload.email or "").strip() or None
    if payload.address is not None:
        updates["address"] = (payload.address or "").strip() or None
    if payload.gstin is not None:
        updates["gstin"] = (payload.gstin or "").strip() or None
    if payload.credit_limit is not None:
        updates["credit_limit"] = round(_to_float(payload.credit_limit, 0), 2)
    if payload.payment_terms_days is not None:
        updates["payment_terms_days"] = max(0, _to_int(payload.payment_terms_days, 0))
    if payload.notes is not None:
        updates["notes"] = (payload.notes or "").strip() or None
    if payload.is_active is not None:
        updates["is_active"] = bool(payload.is_active)

    if payload.opening_balance is not None:
        old_opening = round(_to_float(party.get("opening_balance"), 0), 2)
        new_opening = round(_to_float(payload.opening_balance, 0), 2)
        delta = round(new_opening - old_opening, 2)
        updates["opening_balance"] = new_opening

        if delta != 0:
            _create_ledger_entry(
                admin_id=party["admin_id"],
                party_id=party_id,
                entry_type="adjustment",
                amount=abs(delta),
                paid_amount=abs(delta),
                reference_no="OPENING_BALANCE_UPDATE",
                notes="Opening balance updated",
            )

    updates["updated_at"] = datetime.now(IST)
    database.parties_collection.update_one({"_id": party["_id"]}, {"$set": updates})

    _recalculate_party_balance(party_id, party["admin_id"])
    updated = database.parties_collection.find_one({"_id": party["_id"]})
    return serialize_doc(updated)


@router.delete("/{party_id}")
def deactivate_party(
    party_id: str,
    db: Database = Depends(database.get_db),
    current_user: dict = Depends(auth.get_admin_user),
):
    party = _get_party_or_404(party_id, current_user)
    database.parties_collection.update_one(
        {"_id": party["_id"]},
        {"$set": {"is_active": False, "updated_at": datetime.now(IST)}},
    )
    return {"ok": True, "message": "Party deactivated"}


@router.post("/{party_id}/ledger", response_model=schemas.PartyLedgerResponse)
def create_party_ledger_entry(
    party_id: str,
    payload: schemas.PartyLedgerCreate,
    db: Database = Depends(database.get_db),
    current_user: dict = Depends(auth.get_admin_user),
):
    party = _get_party_or_404(party_id, current_user)
    entry_type = (payload.entry_type or "").strip().lower()
    if entry_type not in VALID_LEDGER_TYPES:
        raise HTTPException(status_code=400, detail="entry_type must be sale, purchase, or adjustment")

    if entry_type == "sale" and party.get("party_type") not in ["customer", "both"]:
        raise HTTPException(status_code=400, detail="Selected party is not configured as customer")
    if entry_type == "purchase" and party.get("party_type") not in ["supplier", "both"]:
        raise HTTPException(status_code=400, detail="Selected party is not configured as supplier")

    due_date = payload.due_date
    if due_date is None and entry_type in ["sale", "purchase"]:
        terms = max(0, _to_int(party.get("payment_terms_days"), 0))
        due_date = datetime.now(IST) + timedelta(days=terms)

    row = _create_ledger_entry(
        admin_id=party["admin_id"],
        party_id=party_id,
        entry_type=entry_type,
        amount=payload.amount,
        paid_amount=payload.paid_amount or 0,
        reference_no=payload.reference_no,
        due_date=due_date,
        notes=payload.notes,
    )

    _recalculate_party_balance(party_id, party["admin_id"])
    return serialize_doc(row)


@router.get("/{party_id}/ledger", response_model=List[schemas.PartyLedgerResponse])
def list_party_ledger(
    party_id: str,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=200, ge=1, le=1000),
    db: Database = Depends(database.get_db),
    current_user: dict = Depends(auth.get_current_active_user),
):
    party = _get_party_or_404(party_id, current_user)
    rows = list(
        database.party_ledger_collection.find(
            _scope_query(current_user, {"party_id": party_id})
        )
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )
    return serialize_docs(rows)


@router.post("/{party_id}/payments", response_model=schemas.PartyPaymentResponse)
def create_party_payment(
    party_id: str,
    payload: schemas.PartyPaymentCreate,
    db: Database = Depends(database.get_db),
    current_user: dict = Depends(auth.get_admin_user),
):
    party = _get_party_or_404(party_id, current_user)
    payment_type = (payload.payment_type or "").strip().lower()
    if payment_type not in VALID_PAYMENT_TYPES:
        raise HTTPException(status_code=400, detail="payment_type must be payment_in or payment_out")

    if payment_type == "payment_in" and party.get("party_type") not in ["customer", "both"]:
        raise HTTPException(status_code=400, detail="payment_in is only valid for customer/both party type")
    if payment_type == "payment_out" and party.get("party_type") not in ["supplier", "both"]:
        raise HTTPException(status_code=400, detail="payment_out is only valid for supplier/both party type")

    amount = round(_to_float(payload.amount, 0), 2)
    if amount <= 0:
        raise HTTPException(status_code=400, detail="amount must be greater than 0")

    allocations = []

    if payload.allocations:
        for allocation in payload.allocations:
            if not ObjectId.is_valid(allocation.ledger_entry_id):
                raise HTTPException(status_code=400, detail="Invalid ledger_entry_id in allocations")
            if allocation.amount <= 0:
                raise HTTPException(status_code=400, detail="Allocation amount must be greater than 0")

            ledger_row = database.party_ledger_collection.find_one(
                {
                    "_id": ObjectId(allocation.ledger_entry_id),
                    "party_id": party_id,
                    "admin_id": party["admin_id"],
                    "status": {"$in": ["open", "partial"]},
                }
            )
            if not ledger_row:
                raise HTTPException(status_code=400, detail="Allocated ledger row not found or closed")

            target_type = "sale" if payment_type == "payment_in" else "purchase"
            if ledger_row.get("entry_type") != target_type:
                raise HTTPException(status_code=400, detail="Allocation type mismatch with payment type")

            current_due = round(_to_float(ledger_row.get("due_amount"), 0), 2)
            alloc_amt = round(_to_float(allocation.amount, 0), 2)
            if alloc_amt > current_due:
                raise HTTPException(status_code=400, detail="Allocation exceeds due amount")

            new_due = round(current_due - alloc_amt, 2)
            new_paid = round(_to_float(ledger_row.get("paid_amount"), 0) + alloc_amt, 2)
            new_status = "paid" if new_due == 0 else "partial"

            database.party_ledger_collection.update_one(
                {"_id": ledger_row["_id"]},
                {
                    "$set": {
                        "due_amount": new_due,
                        "paid_amount": new_paid,
                        "status": new_status,
                        "updated_at": datetime.now(IST),
                    }
                },
            )

            allocations.append(
                {
                    "ledger_entry_id": allocation.ledger_entry_id,
                    "amount": alloc_amt,
                }
            )

        allocated_total = round(sum(x["amount"] for x in allocations), 2)
        if allocated_total > amount:
            raise HTTPException(status_code=400, detail="Total allocations exceed payment amount")
    else:
        allocations = _auto_allocate_payment(party["admin_id"], party_id, payment_type, amount)

    payment_date = payload.payment_date or datetime.now(IST)
    payment_doc = {
        "admin_id": party["admin_id"],
        "party_id": party_id,
        "payment_type": payment_type,
        "amount": amount,
        "payment_mode": (payload.payment_mode or "Cash").strip() or "Cash",
        "reference_no": (payload.reference_no or "").strip() or None,
        "notes": (payload.notes or "").strip() or None,
        "allocations": allocations,
        "payment_date": payment_date,
        "created_at": datetime.now(IST),
    }
    result = database.party_payments_collection.insert_one(payment_doc)
    payment_doc["_id"] = result.inserted_id

    _create_ledger_entry(
        admin_id=party["admin_id"],
        party_id=party_id,
        entry_type=payment_type,
        amount=amount,
        paid_amount=amount,
        reference_no=payload.reference_no,
        due_date=None,
        notes=payload.notes,
    )

    _recalculate_party_balance(party_id, party["admin_id"])
    return serialize_doc(payment_doc)


@router.get("/{party_id}/payments", response_model=List[schemas.PartyPaymentResponse])
def list_party_payments(
    party_id: str,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=200, ge=1, le=1000),
    db: Database = Depends(database.get_db),
    current_user: dict = Depends(auth.get_current_active_user),
):
    _get_party_or_404(party_id, current_user)
    rows = list(
        database.party_payments_collection.find(
            _scope_query(current_user, {"party_id": party_id})
        )
        .sort("payment_date", -1)
        .skip(skip)
        .limit(limit)
    )
    return serialize_docs(rows)


@router.get("/{party_id}/summary", response_model=schemas.PartySummaryResponse)
def party_summary(
    party_id: str,
    db: Database = Depends(database.get_db),
    current_user: dict = Depends(auth.get_current_active_user),
):
    party = _get_party_or_404(party_id, current_user)

    now = datetime.now(IST)
    open_rows = list(
        database.party_ledger_collection.find(
            _scope_query(
                current_user,
                {
                    "party_id": party_id,
                    "status": {"$in": ["open", "partial"]},
                    "entry_type": {"$in": ["sale", "purchase"]},
                },
            )
        )
    )

    overdue_receivable = 0.0
    overdue_payable = 0.0

    for row in open_rows:
        due_date = row.get("due_date")
        if not isinstance(due_date, datetime):
            continue

        due_cmp = due_date.astimezone(IST).replace(tzinfo=None) if due_date.tzinfo else due_date
        now_cmp = now.replace(tzinfo=None)
        if due_cmp.date() >= now_cmp.date():
            continue

        if row.get("entry_type") == "sale":
            overdue_receivable += _to_float(row.get("due_amount"), 0)
        elif row.get("entry_type") == "purchase":
            overdue_payable += _to_float(row.get("due_amount"), 0)

    latest = database.party_ledger_collection.find_one(
        _scope_query(current_user, {"party_id": party_id}),
        sort=[("created_at", -1)],
    )

    return {
        "party_id": str(party["_id"]),
        "party_name": party.get("party_name"),
        "current_balance": round(_to_float(party.get("current_balance"), 0), 2),
        "total_receivable": round(_to_float(party.get("total_receivable"), 0), 2),
        "total_payable": round(_to_float(party.get("total_payable"), 0), 2),
        "overdue_receivable": round(overdue_receivable, 2),
        "overdue_payable": round(overdue_payable, 2),
        "open_entries": len(open_rows),
        "last_transaction_at": latest.get("created_at") if latest else None,
    }


@router.get("/summaries/all", response_model=List[schemas.PartySummaryResponse])
def all_party_summaries(
    db: Database = Depends(database.get_db),
    current_user: dict = Depends(auth.get_current_active_user),
):
    parties = list(database.parties_collection.find(_scope_query(current_user)).sort("party_name", 1))
    result = []

    now = datetime.now(IST)
    now_cmp = now.replace(tzinfo=None)

    for party in parties:
        party_id = str(party["_id"])
        open_rows = list(
            database.party_ledger_collection.find(
                _scope_query(
                    current_user,
                    {
                        "party_id": party_id,
                        "status": {"$in": ["open", "partial"]},
                        "entry_type": {"$in": ["sale", "purchase"]},
                    },
                )
            )
        )

        overdue_receivable = 0.0
        overdue_payable = 0.0
        for row in open_rows:
            due_date = row.get("due_date")
            if not isinstance(due_date, datetime):
                continue

            due_cmp = due_date.astimezone(IST).replace(tzinfo=None) if due_date.tzinfo else due_date
            if due_cmp.date() >= now_cmp.date():
                continue

            if row.get("entry_type") == "sale":
                overdue_receivable += _to_float(row.get("due_amount"), 0)
            elif row.get("entry_type") == "purchase":
                overdue_payable += _to_float(row.get("due_amount"), 0)

        latest = database.party_ledger_collection.find_one(
            _scope_query(current_user, {"party_id": party_id}),
            sort=[("created_at", -1)],
        )

        result.append(
            {
                "party_id": party_id,
                "party_name": party.get("party_name"),
                "current_balance": round(_to_float(party.get("current_balance"), 0), 2),
                "total_receivable": round(_to_float(party.get("total_receivable"), 0), 2),
                "total_payable": round(_to_float(party.get("total_payable"), 0), 2),
                "overdue_receivable": round(overdue_receivable, 2),
                "overdue_payable": round(overdue_payable, 2),
                "open_entries": len(open_rows),
                "last_transaction_at": latest.get("created_at") if latest else None,
            }
        )

    return result
