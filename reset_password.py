import sys
import os
sys.path.insert(0, os.path.abspath("."))

from ailexity_backend.database import users_collection
from ailexity_backend import auth

new_password = "sysadmin123"  
new_hash = auth.get_password_hash(new_password)

users_collection.update_one(
    {"username": "sysadmin"},
    {"$set": {"hashed_password": new_hash}}
)

print(f"✓ sysadmin password reset to: {new_password}")