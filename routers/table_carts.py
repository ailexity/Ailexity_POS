"""
Table Carts Router - Multi-Device Sync for Table Carts
Enables multiple devices to share the same cart data for each table
"""
from fastapi import APIRouter, Depends, HTTPException
from pymongo.database import Database
from bson import ObjectId
from datetime import datetime, timezone, timedelta
from typing import List
import schemas
import database
import auth
from models import serialize_doc, serialize_docs

# India Standard Time (IST) - GMT+5:30
IST = timezone(timedelta(hours=5, minutes=30))

router = APIRouter(prefix="/table-carts", tags=["table-carts"])

@router.get("/{table_id}", response_model=schemas.TableCartResponse)
async def get_table_cart(
    table_id: str,
    db: Database = Depends(database.get_db),
    current_user: dict = Depends(auth.get_current_active_user)
):
    """Get cart items for a specific table"""
    # Only return cart if user has multi-device sync enabled
    if not current_user.get("enable_multi_device_sync", False):
        raise HTTPException(status_code=403, detail="Multi-device sync not enabled for this user")
    
    admin_id = current_user["id"]
    
    # Find or create table cart
    cart = database.table_carts_collection.find_one({
        "admin_id": admin_id,
        "table_id": table_id
    })
    
    if not cart:
        # Create new empty cart
        new_cart = {
            "admin_id": admin_id,
            "table_id": table_id,
            "items": [],
            "created_at": datetime.now(IST),
            "updated_at": datetime.now(IST)
        }
        result = database.table_carts_collection.insert_one(new_cart)
        new_cart["_id"] = result.inserted_id
        return serialize_doc(new_cart)
    
    return serialize_doc(cart)

@router.put("/{table_id}", response_model=schemas.TableCartResponse)
async def update_table_cart(
    table_id: str,
    cart_update: schemas.TableCartUpdate,
    db: Database = Depends(database.get_db),
    current_user: dict = Depends(auth.get_current_active_user)
):
    """Update cart items for a specific table"""
    # Only allow update if user has multi-device sync enabled
    if not current_user.get("enable_multi_device_sync", False):
        raise HTTPException(status_code=403, detail="Multi-device sync not enabled for this user")
    
    admin_id = current_user["id"]
    
    # Convert cart items to dict
    items_data = [item.dict() for item in cart_update.items]
    
    # Update or create table cart
    result = database.table_carts_collection.update_one(
        {
            "admin_id": admin_id,
            "table_id": table_id
        },
        {
            "$set": {
                "items": items_data,
                "updated_at": datetime.now(IST)
            },
            "$setOnInsert": {
                "admin_id": admin_id,
                "table_id": table_id,
                "created_at": datetime.now(IST)
            }
        },
        upsert=True
    )
    
    # Get updated cart
    cart = database.table_carts_collection.find_one({
        "admin_id": admin_id,
        "table_id": table_id
    })
    
    return serialize_doc(cart)

@router.delete("/{table_id}")
async def clear_table_cart(
    table_id: str,
    db: Database = Depends(database.get_db),
    current_user: dict = Depends(auth.get_current_active_user)
):
    """Clear cart items for a specific table"""
    # Only allow delete if user has multi-device sync enabled
    if not current_user.get("enable_multi_device_sync", False):
        raise HTTPException(status_code=403, detail="Multi-device sync not enabled for this user")
    
    admin_id = current_user["id"]
    
    # Clear items but keep the cart document
    database.table_carts_collection.update_one(
        {
            "admin_id": admin_id,
            "table_id": table_id
        },
        {
            "$set": {
                "items": [],
                "updated_at": datetime.now(IST)
            }
        }
    )
    
    return {"message": "Cart cleared successfully"}

@router.get("/", response_model=List[schemas.TableCartResponse])
async def get_all_table_carts(
    db: Database = Depends(database.get_db),
    current_user: dict = Depends(auth.get_current_active_user)
):
    """Get all table carts for current user"""
    # Only return carts if user has multi-device sync enabled
    if not current_user.get("enable_multi_device_sync", False):
        raise HTTPException(status_code=403, detail="Multi-device sync not enabled for this user")
    
    admin_id = current_user["id"]
    carts = list(database.table_carts_collection.find({"admin_id": admin_id}))
    return serialize_docs(carts)
