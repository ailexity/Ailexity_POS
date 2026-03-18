from fastapi import APIRouter, Depends, HTTPException
from typing import List
from pymongo.database import Database
from bson import ObjectId
from ailexity_backend import schemas, database, auth
from ailexity_backend.models import ItemDocument, serialize_doc, serialize_docs

router = APIRouter(
    prefix="/items",
    tags=["items"],
    responses={404: {"detail": "Not found"}},
)

@router.get("/", response_model=List[schemas.ItemResponse])
def read_items(
    skip: int = 0, 
    limit: int = 100, 
    db: Database = Depends(database.get_db), 
    current_user: dict = Depends(auth.get_current_active_user)
):
    """Get items - filtered by admin_id for multi-tenant isolation"""
    if current_user.get("role") == 'sysadmin':
        # SysAdmin can see all items (read-only)
        items = list(database.items_collection.find({}).skip(skip).limit(limit))
    else:
        # Admin sees only their own items
        items = list(database.items_collection.find(
            {"admin_id": current_user["id"]}
        ).skip(skip).limit(limit))
    return serialize_docs(items)

@router.post("/", response_model=schemas.ItemResponse)
def create_item(
    item: schemas.ItemCreate, 
    db: Database = Depends(database.get_db), 
    current_user: dict = Depends(auth.get_admin_user)
):
    """Create item - auto-assign admin_id"""
    if current_user.get("role") == 'sysadmin':
        raise HTTPException(status_code=403, detail="SysAdmin cannot create items")
    
    # Auto-assign admin_id for multi-tenant isolation
    new_item = ItemDocument.create(
        admin_id=current_user["id"],
        name=item.name,
        category=item.category,
        price=item.price,
        tax_rate=item.tax_rate,
        hsn_code=item.hsn_code,
        stock_quantity=item.stock_quantity,
        limit_stock=item.limit_stock,
        manufacturing_cost=item.manufacturing_cost
    )
    result = database.items_collection.insert_one(new_item)
    new_item["_id"] = result.inserted_id
    return serialize_doc(new_item)

@router.put("/{item_id}", response_model=schemas.ItemResponse)
def update_item(
    item_id: str, 
    item: schemas.ItemUpdate, 
    db: Database = Depends(database.get_db), 
    current_user: dict = Depends(auth.get_admin_user)
):
    """Update item - check ownership"""
    db_item = database.items_collection.find_one({"_id": ObjectId(item_id)})
    if db_item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Security check: prevent cross-admin access
    if current_user.get("role") != 'sysadmin' and db_item["admin_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied - not your item")
    
    update_data = item.model_dump()
    database.items_collection.update_one(
        {"_id": ObjectId(item_id)},
        {"$set": update_data}
    )
    
    updated_item = database.items_collection.find_one({"_id": ObjectId(item_id)})
    return serialize_doc(updated_item)

@router.delete("/{item_id}")
def delete_item(
    item_id: str, 
    db: Database = Depends(database.get_db), 
    current_user: dict = Depends(auth.get_admin_user)
):
    """Delete item - check ownership"""
    db_item = database.items_collection.find_one({"_id": ObjectId(item_id)})
    if db_item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Security check: prevent cross-admin access
    if current_user.get("role") != 'sysadmin' and db_item["admin_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied - not your item")
    
    database.items_collection.delete_one({"_id": ObjectId(item_id)})
    return {"ok": True}

