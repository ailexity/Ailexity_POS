"""
Test script to verify ailexity_backend package is correctly structured
"""
import sys
print("Python version:", sys.version)
print("Python path:", sys.executable)
print()

try:
    print("✅ Step 1: Import package...")
    import ailexity_backend
    print(f"   Package version: {ailexity_backend.__version__}")
    print(f"   Package location: {ailexity_backend.__file__}")
    print()
    
    print("✅ Step 2: Import main module...")
    from ailexity_backend.main import app
    print(f"   App title: {app.title}")
    print(f"   Total routes: {len(app.routes)}")
    print()
    
    print("✅ Step 3: Verify database module...")
    from ailexity_backend import database
    print(f"   Database name: {database.DATABASE_NAME}")
    print()
    
    print("✅ Step 4: Verify auth module...")
    from ailexity_backend import auth
    print(f"   JWT algorithm: {auth.ALGORITHM}")
    print()
    
    print("✅ Step 5: Verify routers...")
    from ailexity_backend.routers import users, items, invoices
    print(f"   Users router: {users.router.prefix}")
    print()
    
    print("="*60)
    print("✅ ALL TESTS PASSED!")
    print("="*60)
    print()
    print("Package is correctly structured and can be run with:")
    print("  uvicorn ailexity_backend.main:app")
    print()
    
except Exception as e:
    print(f"❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
