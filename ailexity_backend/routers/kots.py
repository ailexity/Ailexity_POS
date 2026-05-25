from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime, timezone, timedelta
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

        # Create KOT document
        kot_doc = {
            "admin_id": current_user["id"],
            "table_number": payload.get("table_number"),
            "table_name": payload.get("table_name"),
            "items": payload.get("items", []),
            "status": "pending",  # pending, printed, completed, cancelled
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
        result = db.kots.update_one(
            {
                "_id": ObjectId(kot_id),
                "admin_id": current_user["id"]
            },
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
            "admin_id": current_user["id"],
            "status": {"$in": ["pending", "printed"]}
        }

        if table_number is not None:
            query["table_number"] = table_number

        kots = list(db.kots.find(query).sort("created_at", -1).limit(50))

        for kot in kots:
            kot["id"] = str(kot["_id"])

        return kots

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching KOTs: {str(e)}")


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
        result = db.kots.update_one(
            {
                "_id": ObjectId(kot_id),
                "admin_id": current_user["id"]
            },
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

