# MongoDB Setup Guide

## Prerequisites
- MongoDB installed and running on localhost:27017
- Python 3.11 or higher

## Installation Steps

### 1. Install Python Dependencies
```bash
pip install -r backend/requirements.txt
```

### 2. Initialize MongoDB Database
```bash
python backend/init_db.py
```

This will create:
- Database: `ailexity_pos_db`
- Collections: users, items, invoices, system_settings
- Default users:
  - **sysadmin** / sysadmin123 (System Administrator)
  - **admin** / admin123 (Downtown Cafe)
  - **admin2** / admin123 (City Pizza)

### 3. Start the Backend Server
```bash
# Windows
start_backend.bat

# Or manually
uvicorn backend.main:app --reload
```

### 4. Start the Frontend (in a separate terminal)
```bash
cd frontend
npm install
npm run dev
```

## Testing

### Verify Database Credentials
```bash
python verify_credentials.py
```

### Test API Login
```bash
# Make sure backend is running first
python test_login.py
```

Or use the batch file:
```bash
run_login_tests.bat
```

## Database Information

- **Database Name**: ailexity_pos_db
- **Connection URL**: mongodb://localhost:27017/
- **Collections**:
  - users (with unique username index)
  - items (indexed by admin_id and category)
  - invoices (indexed by admin_id and invoice_number)
  - system_settings (for system configuration)

## Migration Notes

This project has been migrated from SQLite to MongoDB. All SQLite database files (*.db) have been removed.
