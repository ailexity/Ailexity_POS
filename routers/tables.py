from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from bson import ObjectId
from datetime import datetime

from ailexity_backend.database import get_db
from ailexity_backend.auth import get_current_active_user
from ailexity_backend.schemas import TableCreate, TableUpdate, TableResponse
from ailexity_backend.models import TableDocument, serialize_doc, serialize_docs, IST

router = APIRouter()

@router.post("/", response_model=TableResponse, status_code=status.HTTP_201_CREATED)
async def create_table(
    table: TableCreate,
    current_user: dict = Depends(get_current_active_user),
    db = Depends(get_db)
):
    """Create a new table"""
    # Check if table number already exists for this admin
    existing = db.tables.find_one({
        "admin_id": current_user["id"],
        "table_number": table.table_number
    })
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Table number already exists"
        )
    
    # Create table document
    table_doc = TableDocument.create(
        admin_id=current_user["id"],
        table_number=table.table_number,
        table_name=table.table_name,
        capacity=table.capacity,
        is_active=table.is_active
    )
    
    result = db.tables.insert_one(table_doc)
    table_doc["_id"] = result.inserted_id
    
    return serialize_doc(table_doc)

@router.get("/", response_model=List[TableResponse])
async def get_tables(
    current_user: dict = Depends(get_current_active_user),
    db = Depends(get_db)
):
    """Get all tables for current admin"""
    tables = list(db.tables.find({"admin_id": current_user["id"]}).sort("table_number", 1))
    return serialize_docs(tables)

@router.get("/{table_id}", response_model=TableResponse)
async def get_table(
    table_id: str,
    current_user: dict = Depends(get_current_active_user),
    db = Depends(get_db)
):
    """Get a specific table"""
    if not ObjectId.is_valid(table_id):
        raise HTTPException(status_code=400, detail="Invalid table ID")
    
    table = db.tables.find_one({
        "_id": ObjectId(table_id),
        "admin_id": current_user["id"]
    })
    
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    return serialize_doc(table)

@router.put("/{table_id}", response_model=TableResponse)
async def update_table(
    table_id: str,
    table_update: TableUpdate,
    current_user: dict = Depends(get_current_active_user),
    db = Depends(get_db)
):
    """Update a table"""
    if not ObjectId.is_valid(table_id):
        raise HTTPException(status_code=400, detail="Invalid table ID")
    
    # Get existing table
    existing_table = db.tables.find_one({
        "_id": ObjectId(table_id),
        "admin_id": current_user["id"]
    })
    
    if not existing_table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    # Check if table number is being changed and already exists
    if table_update.table_number and table_update.table_number != existing_table["table_number"]:
        duplicate = db.tables.find_one({
            "admin_id": current_user["id"],
            "table_number": table_update.table_number,
            "_id": {"$ne": ObjectId(table_id)}
        })
        if duplicate:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Table number already exists"
            )
    
    # Update fields
    update_data = table_update.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.now(IST)
    
    db.tables.update_one(
        {"_id": ObjectId(table_id)},
        {"$set": update_data}
    )
    
    updated_table = db.tables.find_one({"_id": ObjectId(table_id)})
    return serialize_doc(updated_table)

@router.delete("/{table_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_table(
    table_id: str,
    current_user: dict = Depends(get_current_active_user),
    db = Depends(get_db)
):
    """Delete a table"""
    if not ObjectId.is_valid(table_id):
        raise HTTPException(status_code=400, detail="Invalid table ID")
    
    result = db.tables.delete_one({
        "_id": ObjectId(table_id),
        "admin_id": current_user["id"]
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Table not found")
    
    return None
