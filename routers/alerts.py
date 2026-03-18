from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from pydantic import BaseModel, Field
from pymongo.database import Database

from .. import database, auth

router = APIRouter(prefix="/alerts", tags=["alerts"])

# Get collections
alerts_collection = database.database["alerts"]
alert_dismissals_collection = database.database["alert_dismissals"]


class AlertCreate(BaseModel):
    title: str
    content: str
    type: str = "info"  # info, success, warning, error
    target_users: Optional[List[str]] = None  # None means all users
    expires_at: Optional[datetime] = None


class AlertResponse(BaseModel):
    id: str
    title: str
    content: str
    type: str
    target_users: Optional[List[str]]
    expires_at: Optional[datetime]
    created_at: datetime
    created_by: str


class AlertDismissal(BaseModel):
    user_id: str
    alert_id: str
    dismissed_at: datetime


def alert_helper(alert) -> dict:
    return {
        "id": str(alert["_id"]),
        "title": alert["title"],
        "content": alert["content"],
        "type": alert.get("type", "info"),
        "target_users": alert.get("target_users"),
        "expires_at": alert.get("expires_at"),
        "created_at": alert.get("created_at", datetime.utcnow()),
        "created_by": alert.get("created_by", "")
    }


@router.post("/", response_model=AlertResponse)
async def create_alert(alert: AlertCreate, current_user: dict = Depends(auth.get_current_active_user)):
    """Create a new alert (sysadmin only)"""
    if current_user.get("role") != "sysadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only sysadmin can create alerts"
        )
    
    alert_doc = {
        "title": alert.title,
        "content": alert.content,
        "type": alert.type,
        "target_users": alert.target_users,
        "expires_at": alert.expires_at,
        "created_at": datetime.utcnow(),
        "created_by": current_user.get("id")
    }
    
    result = alerts_collection.insert_one(alert_doc)
    alert_doc["_id"] = result.inserted_id
    
    return alert_helper(alert_doc)


@router.get("/", response_model=List[AlertResponse])
async def get_all_alerts(current_user: dict = Depends(auth.get_current_active_user)):
    """Get all alerts (sysadmin only)"""
    if current_user.get("role") != "sysadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only sysadmin can view all alerts"
        )
    
    alerts = []
    for alert in alerts_collection.find().sort("created_at", -1):
        alerts.append(alert_helper(alert))
    
    return alerts


@router.get("/my-alerts", response_model=List[AlertResponse])
async def get_my_alerts(current_user: dict = Depends(auth.get_current_active_user)):
    """Get alerts for the current user (non-expired and not dismissed)"""
    
    user_id = current_user.get("id")
    
    # Get dismissed alert IDs for this user
    dismissed_ids = set()
    for dismissal in alert_dismissals_collection.find({"user_id": user_id}):
        dismissed_ids.add(dismissal["alert_id"])
    
    # Build query for active alerts
    now = datetime.utcnow()
    query = {
        "$and": [
            {
                "$or": [
                    {"expires_at": None},
                    {"expires_at": {"$gt": now}}
                ]
            },
            {
                "$or": [
                    {"target_users": None},
                    {"target_users": user_id}
                ]
            }
        ]
    }
    
    alerts = []
    for alert in alerts_collection.find(query).sort("created_at", -1):
        alert_id = str(alert["_id"])
        if alert_id not in dismissed_ids:
            alerts.append(alert_helper(alert))
    
    return alerts


@router.post("/{alert_id}/dismiss")
async def dismiss_alert(alert_id: str, current_user: dict = Depends(auth.get_current_active_user)):
    """Dismiss an alert for the current user"""
    
    user_id = current_user.get("id")
    
    # Check if alert exists
    alert = alerts_collection.find_one({"_id": ObjectId(alert_id)})
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    
    # Check if already dismissed
    existing = alert_dismissals_collection.find_one({
        "user_id": user_id,
        "alert_id": alert_id
    })
    
    if not existing:
        alert_dismissals_collection.insert_one({
            "user_id": user_id,
            "alert_id": alert_id,
            "dismissed_at": datetime.utcnow()
        })
    
    return {"message": "Alert dismissed"}


@router.delete("/{alert_id}")
async def delete_alert(alert_id: str, current_user: dict = Depends(auth.get_current_active_user)):
    """Delete an alert (sysadmin only)"""
    if current_user.get("role") != "sysadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only sysadmin can delete alerts"
        )
    
    result = alerts_collection.delete_one({"_id": ObjectId(alert_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    
    # Also delete all dismissals for this alert
    alert_dismissals_collection.delete_many({"alert_id": alert_id})
    
    return {"message": "Alert deleted"}
