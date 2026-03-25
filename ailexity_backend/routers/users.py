from fastapi import APIRouter, Depends, HTTPException, status, Form
from typing import List, Optional
from pymongo.database import Database
from bson import ObjectId
from datetime import datetime, timezone, timedelta
import schemas
import database
import auth
from models import UserDocument, serialize_doc, serialize_docs

# India Standard Time (IST) - GMT+5:30
IST = timezone(timedelta(hours=5, minutes=30))

router = APIRouter(tags=["auth", "users"])


def _normalize_business_type(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    lowered = str(value).strip().lower()
    if lowered == "":
        return None
    if "retail" in lowered:
        return "retailer"
    if "restaurant" in lowered:
        return "restaurant"
    return None

@router.post("/token", response_model=schemas.Token, summary="Login (OAuth2)")
async def login_for_access_token(
    username: str = Form(...),
    password: str = Form(...),
    remember_me: bool = Form(False),
    db: Database = Depends(database.get_db)
):
    user = database.users_collection.find_one({"username": username})
    if not user or not auth.verify_password(password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if user.get("subscription_status") == 'inactive':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive. Please contact system administrator.",
        )

    # Check active window (login access period)
    today = datetime.now(IST).date()
    active_start = user.get("active_window_start")
    active_end = user.get("active_window_end")
    
    if active_start:
        start_date = datetime.strptime(active_start, "%Y-%m-%d").date()
        if today < start_date:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Account access not yet active. Access starts on {active_start}.",
            )
    
    if active_end:
        end_date = datetime.strptime(active_end, "%Y-%m-%d").date()
        if today > end_date:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Account access has expired on {active_end}. Please contact system administrator.",
            )

    # Update last_login timestamp
    database.users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_login": datetime.now(IST)}}
    )

    expires_delta = timedelta(days=3650) if remember_me else timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(data={"sub": user["username"]}, expires_delta=expires_delta)
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/users/", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Database = Depends(database.get_db), current_user: dict = Depends(auth.get_admin_user)):
    db_user = database.users_collection.find_one({"username": user.username})
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    normalized_business_type = _normalize_business_type(user.business_type)
    if user.role != "sysadmin" and normalized_business_type is None:
        raise HTTPException(status_code=400, detail="business_type must be either restaurant or retailer")

    hashed_password = auth.get_password_hash(user.password)
    new_user = UserDocument.create(
        username=user.username,
        hashed_password=hashed_password,
        role=user.role,
        business_name=user.business_name,
        phone=user.phone,
        email=user.email,
        full_name=user.full_name,
        business_address=user.business_address,
        business_type=normalized_business_type,
        tax_id=user.tax_id,
        tax_rate=user.tax_rate if user.tax_rate is not None else 0.0,
        store_email=user.store_email,
        store_phone=user.store_phone,
        bank_account=user.bank_account,
        bank_name=user.bank_name,
        account_name=user.account_name,
        invoice_notes=user.invoice_notes,
        invoice_terms=user.invoice_terms,
        subscription_status=user.subscription_status,
        active_window_start=user.active_window_start,
        active_window_end=user.active_window_end,
        enable_multi_device_sync=user.enable_multi_device_sync if user.enable_multi_device_sync is not None else False,
        enable_order_management=user.enable_order_management if user.enable_order_management is not None else False
    )
    result = database.users_collection.insert_one(new_user)
    new_user["_id"] = result.inserted_id
    return serialize_doc(new_user)

@router.get("/users/me", response_model=schemas.UserResponse)
async def read_users_me(current_user: dict = Depends(auth.get_current_active_user)):
    return current_user

@router.post("/users/verify-password")
async def verify_password(verification: schemas.PasswordVerification, current_user: dict = Depends(auth.get_current_active_user)):
    if not auth.verify_password(verification.password, current_user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Invalid password")
    return {"valid": True}

@router.put("/users/me", response_model=schemas.UserResponse)
def update_me(user_update: schemas.UserUpdateProfile, db: Database = Depends(database.get_db), current_user: dict = Depends(auth.get_current_active_user)):
    """Update current user profile"""
    update_data = {}
    
    # Check username uniqueness if changed
    if user_update.username and user_update.username != current_user["username"]:
        existing_user = database.users_collection.find_one({"username": user_update.username})
        if existing_user:
            raise HTTPException(status_code=400, detail="Username already taken")
        update_data["username"] = user_update.username
        
    if user_update.password:
        if not user_update.current_password:
             raise HTTPException(status_code=400, detail="Current password is required to change password")
        if not auth.verify_password(user_update.current_password, current_user["hashed_password"]):
             raise HTTPException(status_code=400, detail="Incorrect current password")
        update_data["hashed_password"] = auth.get_password_hash(user_update.password)
        
    # Update all profile fields if provided
    if user_update.business_name is not None:
        update_data["business_name"] = user_update.business_name
    if user_update.phone is not None:
        update_data["phone"] = user_update.phone
    if user_update.email is not None:
        update_data["email"] = user_update.email
    if user_update.full_name is not None:
        update_data["full_name"] = user_update.full_name
    if user_update.business_address is not None:
        update_data["business_address"] = user_update.business_address
    if user_update.business_type is not None:
        normalized_business_type = _normalize_business_type(user_update.business_type)
        if user_update.business_type.strip() and normalized_business_type is None:
            raise HTTPException(status_code=400, detail="business_type must be either restaurant or retailer")
        update_data["business_type"] = normalized_business_type
    if user_update.tax_id is not None:
        update_data["tax_id"] = user_update.tax_id
    if user_update.tax_rate is not None:
        update_data["tax_rate"] = user_update.tax_rate
    # Store/Invoice details
    if user_update.store_email is not None:
        update_data["store_email"] = user_update.store_email
    if user_update.store_phone is not None:
        update_data["store_phone"] = user_update.store_phone
    if user_update.bank_account is not None:
        update_data["bank_account"] = user_update.bank_account
    if user_update.bank_name is not None:
        update_data["bank_name"] = user_update.bank_name
    if user_update.account_name is not None:
        update_data["account_name"] = user_update.account_name
    if user_update.invoice_notes is not None:
        update_data["invoice_notes"] = user_update.invoice_notes
    if user_update.invoice_terms is not None:
        update_data["invoice_terms"] = user_update.invoice_terms
    if user_update.monthly_target is not None:
        update_data["monthly_target"] = user_update.monthly_target
    
    if update_data:
        database.users_collection.update_one(
            {"_id": ObjectId(current_user["id"])},
            {"$set": update_data}
        )
    
    updated_user = database.users_collection.find_one({"_id": ObjectId(current_user["id"])})
    return serialize_doc(updated_user)

@router.get("/users/", response_model=List[schemas.UserResponse])
def get_all_users(db: Database = Depends(database.get_db), current_user: dict = Depends(auth.get_sysadmin_user)):
    """Get all users - System Admin only"""
    users = list(database.users_collection.find({}))
    return serialize_docs(users)

@router.put("/users/{user_id}", response_model=schemas.UserResponse)
def update_user(user_id: str, user_update: schemas.UserCreate, db: Database = Depends(database.get_db), current_user: dict = Depends(auth.get_sysadmin_user)):
    """Update user - System Admin only"""
    db_user = database.users_collection.find_one({"_id": ObjectId(user_id)})
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if username is being changed and if it's already taken
    if user_update.username != db_user["username"]:
        existing_user = database.users_collection.find_one({"username": user_update.username})
        if existing_user:
            raise HTTPException(status_code=400, detail="Username already taken")
    
    normalized_business_type = _normalize_business_type(user_update.business_type)
    if user_update.role != "sysadmin" and normalized_business_type is None:
        raise HTTPException(status_code=400, detail="business_type must be either restaurant or retailer")

    update_data = {
        "username": user_update.username,
        "role": user_update.role,
        "business_name": user_update.business_name,
        "phone": user_update.phone,
        "email": user_update.email,
        "full_name": user_update.full_name,
        "business_address": user_update.business_address,
        "business_type": normalized_business_type,
        "tax_id": user_update.tax_id,
        "tax_rate": user_update.tax_rate if user_update.tax_rate is not None else 0.0,
        "subscription_status": user_update.subscription_status,
        "active_window_start": user_update.active_window_start,
        "active_window_end": user_update.active_window_end,
        "enable_multi_device_sync": user_update.enable_multi_device_sync if user_update.enable_multi_device_sync is not None else False,
        "enable_order_management": user_update.enable_order_management if user_update.enable_order_management is not None else False
    }
    
    if user_update.password:  # Only update password if provided
        update_data["hashed_password"] = auth.get_password_hash(user_update.password)
    
    database.users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_data}
    )
    
    updated_user = database.users_collection.find_one({"_id": ObjectId(user_id)})
    return serialize_doc(updated_user)

@router.delete("/users/{user_id}")
def delete_user(user_id: str, db: Database = Depends(database.get_db), current_user: dict = Depends(auth.get_sysadmin_user)):
    """Delete user - System Admin only"""
    if user_id == current_user["id"]:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    db_user = database.users_collection.find_one({"_id": ObjectId(user_id)})
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    database.users_collection.delete_one({"_id": ObjectId(user_id)})
    return {"message": "User deleted successfully"}

# Setup endpoint for initial admin (if no users exist) - simplified for demo
@router.post("/setup/admin", response_model=schemas.UserResponse)
def create_initial_admin(user: schemas.UserCreate, db: Database = Depends(database.get_db)):
    if database.users_collection.count_documents({}) > 0:
        raise HTTPException(status_code=400, detail="Users already exist")
    
    hashed_password = auth.get_password_hash(user.password)
    new_user = UserDocument.create(username=user.username, hashed_password=hashed_password, role="admin")
    result = database.users_collection.insert_one(new_user)
    new_user["_id"] = result.inserted_id
    return serialize_doc(new_user)

# System Admin Password Endpoints
@router.post("/system/verify-password")
async def verify_system_password(
    verification: schemas.PasswordVerification,
    db: Database = Depends(database.get_db),
    current_user: dict = Depends(auth.get_sysadmin_user)
):
    """Verify system admin password - requires sysadmin role"""
    system_password = database.system_settings_collection.find_one(
        {"setting_key": "system_admin_password"}
    )
    
    # If password not configured, initialize it with default value
    if not system_password:
        default_password_hash = auth.get_password_hash("9561587176")
        database.system_settings_collection.insert_one({
            "setting_key": "system_admin_password",
            "setting_value": default_password_hash,
            "created_at": datetime.now(IST)
        })
        system_password = {"setting_value": default_password_hash}
    
    if not auth.verify_password(verification.password, system_password["setting_value"]):
        raise HTTPException(status_code=400, detail="Invalid system password")
    
    return {"valid": True}

@router.post("/system/change-internal-password")
async def change_internal_password(
    password_change: schemas.SystemPasswordChange,
    db: Database = Depends(database.get_db),
    current_user: dict = Depends(auth.get_sysadmin_user)
):
    """Change internal system password (for accessing system settings) - requires sysadmin role"""
    system_password = database.system_settings_collection.find_one(
        {"setting_key": "system_admin_password"}
    )
    
    # If password not configured, initialize it with default value first
    if not system_password:
        default_password_hash = auth.get_password_hash("9561587176")
        database.system_settings_collection.insert_one({
            "setting_key": "system_admin_password",
            "setting_value": default_password_hash,
            "created_at": datetime.now(IST)
        })
        system_password = {"setting_value": default_password_hash}
    
    # Verify current password
    if not auth.verify_password(password_change.current_password, system_password["setting_value"]):
        raise HTTPException(status_code=400, detail="Current internal password is incorrect")
    
    # Update to new password
    database.system_settings_collection.update_one(
        {"setting_key": "system_admin_password"},
        {"$set": {
            "setting_value": auth.get_password_hash(password_change.new_password),
            "updated_at": datetime.now(IST)
        }}
    )
    
    return {"message": "Internal system password updated successfully"}


@router.post("/system/change-login-password")
async def change_sysadmin_login_password(
    password_change: schemas.SystemPasswordChange,
    db: Database = Depends(database.get_db),
    current_user: dict = Depends(auth.get_sysadmin_user)
):
    """Change sysadmin login password - requires sysadmin role"""
    # Verify current password matches the sysadmin user's password
    if not auth.verify_password(password_change.current_password, current_user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Current login password is incorrect")
    
    # Update sysadmin user's password
    database.users_collection.update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$set": {
            "hashed_password": auth.get_password_hash(password_change.new_password)
        }}
    )
    
    return {"message": "Sysadmin login password updated successfully"}


@router.post("/system/change-password")
async def change_system_password(
    password_change: schemas.SystemPasswordChange,
    db: Database = Depends(database.get_db),
    current_user: dict = Depends(auth.get_sysadmin_user)
):
    """Change system admin password - requires sysadmin role (legacy endpoint)"""
    system_password = database.system_settings_collection.find_one(
        {"setting_key": "system_admin_password"}
    )
    
    if not system_password:
        raise HTTPException(status_code=500, detail="System password not configured")
    
    # Verify current password
    if not auth.verify_password(password_change.current_password, system_password["setting_value"]):
        raise HTTPException(status_code=400, detail="Current system password is incorrect")
    
    # Update to new password
    database.system_settings_collection.update_one(
        {"setting_key": "system_admin_password"},
        {"$set": {
            "setting_value": auth.get_password_hash(password_change.new_password),
            "updated_at": datetime.now(IST)
        }}
    )
    
    return {"message": "System password updated successfully"}

