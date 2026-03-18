from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
import bcrypt
import os
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pymongo.database import Database
from ailexity_backend import database, schemas
from .models import serialize_doc

# CONSTANTS - Load from environment variables for production security
SECRET_KEY = os.getenv("JWT_SECRET", "dev-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 12  # 12 hours

# Validate JWT_SECRET in production
if SECRET_KEY == "dev-secret-key-change-in-production":
    import warnings
    warnings.warn("WARNING: Using default JWT_SECRET. Set JWT_SECRET environment variable in production!")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def verify_password(plain_password, hashed_password):
    # hashed_password comes as string from DB, needs to be bytes
    # plain_password needs to be bytes
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password):
    # returns string representation of hash
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Database = Depends(database.get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = schemas.TokenData(username=username)
    except JWTError:
        raise credentials_exception
    
    user = database.users_collection.find_one({"username": token_data.username})
    if user is None:
        raise credentials_exception
    return serialize_doc(user)

async def get_current_active_user(current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_active"):
        raise HTTPException(status_code=400, detail="Inactive user")
    if current_user.get("subscription_status") == 'inactive':
        raise HTTPException(status_code=403, detail="Account is inactive")
    return current_user

async def get_admin_user(current_user: dict = Depends(get_current_active_user)):
    if current_user.get("role") not in ["admin", "sysadmin"]:  # Both admin and sysadmin can access admin features
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return current_user

async def get_sysadmin_user(current_user: dict = Depends(get_current_active_user)):
    """System Administrator only - highest privilege level"""
    if current_user.get("role") != "sysadmin":
        raise HTTPException(status_code=403, detail="System Administrator access required")
    return current_user

