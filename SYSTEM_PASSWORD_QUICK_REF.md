# Quick Reference: System Admin Password

## System Admin Controls Password
**Password:** `9561587176`

## What This Password Protects
- Access to the Admin Controls page (`/admin` route)
- Only required for users with `sysadmin` role
- Separate from login credentials
- **Note:** System Dashboard (`/system`) is accessible without this password

## How to Access Admin Controls
1. Login as: `sysadmin` / `sysadmin123`
2. Click "Admin Management" in sidebar
3. Enter system password: `9561587176`
4. Click "Access Admin Controls"

## How to Change System Password
1. Login as sysadmin
2. Navigate to Settings page
3. Find "System Admin Password" section
4. Click "Change System Password"
5. Enter current password: `9561587176`
6. Enter and confirm new password
7. Click "Update System Password"

## Important Notes
- This password is stored separately in the database
- It is hashed using bcrypt for security
- Both the current and new password must be "9561587176" initially
- Only sysadmin users can change this password
- The password is required each time you access the Admin Controls page
- System Dashboard does NOT require this password

## Troubleshooting

**Q: I forgot the system password, what do I do?**
A: Run the migration script again:
```bash
cd "d:\Ailexity POS\antigravity POS"
python migrate_system_password.py
```
This will reset the password to `9561587176`

**Q: The password prompt doesn't appear**
A: Make sure you're logged in as a sysadmin user and accessing the `/admin` route (Admin Management page)

**Q: I get "Invalid system password" error**
A: Double-check you're entering `9561587176` correctly (no spaces)
