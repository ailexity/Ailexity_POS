from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
from pymongo.database import Database
from bson import ObjectId
import database
import auth
from auth import get_current_active_user

# India Standard Time (IST) - GMT+5:30
IST = timezone(timedelta(hours=5, minutes=30))

router = APIRouter(
    prefix="/kots",
    tags=["kitchen-order-tickets"],
)


class KOTStatusPayload(BaseModel):
    status: str


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_kot(
    payload: dict,
    current_user: dict = Depends(get_current_active_user),
    db: Database = Depends(database.get_db),
) -> dict:
    """
    Create a KOT (Kitchen Order Ticket) record
    """
    try:
        # Validate required fields
        if not payload.get("items") or not isinstance(payload.get("items"), list):
            raise HTTPException(status_code=400, detail="Items list is required")

        admin_id = current_user.get("admin_id") or current_user["id"]

        # Create KOT document
        kot_doc = {
            "admin_id": admin_id,
            "table_number": payload.get("table_number"),
            "table_name": payload.get("table_name"),
            "items": payload.get("items", []),
            "status": "pending",  # pending, preparing, ready, completed, cancelled
            "printed_at": None,
            "completed_at": None,
            "created_at": datetime.now(IST),
            "updated_at": datetime.now(IST),
            "notes": payload.get("notes", ""),
        }

        # Store KOT in database
        result = db.kots.insert_one(kot_doc)
        kot_doc["_id"] = result.inserted_id
        kot_doc["id"] = str(result.inserted_id)

        return {
            "id": str(result.inserted_id),
            "status": "success",
            "message": "KOT created successfully",
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating KOT: {str(e)}")


@router.put("/{kot_id}/printed", response_model=dict)
async def mark_kot_printed(
    kot_id: str,
    current_user: dict = Depends(get_current_active_user),
    db: Database = Depends(database.get_db),
) -> dict:
    """
    Mark a KOT as printed
    """
    try:
        # Update KOT status to printed
        query = {"_id": ObjectId(kot_id)}
        if current_user.get("role") != "sysadmin":
            query["admin_id"] = current_user.get("admin_id") or current_user["id"]

        result = db.kots.update_one(
            query,
            {
                "$set": {
                    "status": "printed",
                    "printed_at": datetime.now(IST),
                    "updated_at": datetime.now(IST),
                }
            }
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="KOT not found")

        return {
            "status": "success",
            "message": "KOT marked as printed"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating KOT: {str(e)}")


@router.get("/", response_model=List[dict])
async def list_kots(
    status: Optional[str] = None,
    table_number: Optional[int] = None,
    current_user: dict = Depends(get_current_active_user),
    db: Database = Depends(database.get_db),
) -> List[dict]:
    """
    List KOTs, optionally filtered by status or table number.
    """
    try:
        query = {}
        if current_user.get("role") != "sysadmin":
            query["admin_id"] = current_user.get("admin_id") or current_user["id"]

        if status:
            query["status"] = status

        if table_number is not None:
            query["table_number"] = table_number

        kots = list(db.kots.find(query).sort("created_at", -1).limit(200))

        for kot in kots:
            kot["id"] = str(kot["_id"])
            if "_id" in kot:
                del kot["_id"]

        return kots

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching KOTs: {str(e)}")


@router.get("/pending", response_model=List[dict])
async def get_pending_kots(
    table_number: Optional[int] = None,
    current_user: dict = Depends(get_current_active_user),
    db: Database = Depends(database.get_db),
) -> List[dict]:
    """
    Get pending KOTs, optionally filtered by table
    """
    try:
        query = {
            "status": {"$in": ["pending", "printed"]}
        }
        if current_user.get("role") != "sysadmin":
            query["admin_id"] = current_user.get("admin_id") or current_user["id"]

        if table_number is not None:
            query["table_number"] = table_number

        kots = list(db.kots.find(query).sort("created_at", -1).limit(50))

        for kot in kots:
            kot["id"] = str(kot["_id"])
            if "_id" in kot:
                del kot["_id"]

        return kots

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching KOTs: {str(e)}")


@router.put("/{kot_id}/status", response_model=dict)
async def update_kot_status(
    kot_id: str,
    payload: KOTStatusPayload,
    current_user: dict = Depends(get_current_active_user),
    db: Database = Depends(database.get_db),
) -> dict:
    """
    Update KOT status to pending/preparing/ready/completed/cancelled
    """
    try:
        valid_statuses = ["pending", "preparing", "ready", "printed", "completed", "cancelled"]
        requested_status = payload.status.lower()
        if requested_status not in valid_statuses:
            raise HTTPException(status_code=400, detail="Invalid KOT status")

        query = {
            "_id": ObjectId(kot_id)
        }
        if current_user.get("role") != "sysadmin":
            query["admin_id"] = current_user.get("admin_id") or current_user["id"]

        update_data = {
            "status": requested_status,
            "updated_at": datetime.now(IST),
        }
        if requested_status == "printed":
            update_data["printed_at"] = datetime.now(IST)
        if requested_status == "completed":
            update_data["completed_at"] = datetime.now(IST)

        result = db.kots.update_one(query, {"$set": update_data})
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="KOT not found")

        return {
            "status": "success",
            "message": f"KOT marked as {requested_status}"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating KOT: {str(e)}")


@router.put("/{kot_id}/completed", response_model=dict)
async def mark_kot_completed(
    kot_id: str,
    current_user: dict = Depends(get_current_active_user),
    db: Database = Depends(database.get_db),
) -> dict:
    """
    Mark a KOT as completed
    """
    try:
        query = {"_id": ObjectId(kot_id)}
        if current_user.get("role") != "sysadmin":
            query["admin_id"] = current_user.get("admin_id") or current_user["id"]

        result = db.kots.update_one(
            query,
            {
                "$set": {
                    "status": "completed",
                    "completed_at": datetime.now(IST),
                    "updated_at": datetime.now(IST),
                }
            }
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="KOT not found")

        return {
            "status": "success",
            "message": "KOT marked as completed"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating KOT: {str(e)}")

