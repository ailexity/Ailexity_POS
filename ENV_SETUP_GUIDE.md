# Quick Environment Setup Guide

This guide helps you quickly set up environment variables for both local development and production deployment.

## 📍 Environment Files Location

```
POS/
├── backend/
│   ├── .env.example  ← Template (committed to git)
│   └── .env          ← Your actual config (NEVER commit!)
│
└── frontend/
    ├── .env.example  ← Template (committed to git)
    └── .env          ← Your actual config (NEVER commit!)
```

## 🔧 Local Development Setup

### Step 1: Backend Environment

```bash
cd backend
copy .env.example .env  # Windows
# OR
cp .env.example .env    # Linux/Mac
```

Edit `backend/.env`:
```env
# Development settings
JWT_SECRET=dev-secret-key-for-local-testing-only
MONGODB_URL=mongodb+srv://pos_admin:admin123@cluster0.qvljupm.mongodb.net/
MONGODB_DB=ailexity_pos_dev
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
ENVIRONMENT=development
```

### Step 2: Frontend Environment

```bash
cd frontend
copy .env.example .env  # Windows
# OR
cp .env.example .env    # Linux/Mac
```

Edit `frontend/.env`:
```env
# Point to local backend
VITE_API_URL=http://localhost:8000
```

### Step 3: Verify Setup

```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
python -m backend.routers.init_db
uvicorn backend.main:app --reload

# Frontend (in new terminal)
cd frontend
npm install
npm run dev
```

Visit: http://localhost:5173

---

## 🌐 Production Setup

### Step 1: Generate Secure Secrets

```bash
# Generate JWT_SECRET (keep this secret!)
openssl rand -hex 32

# Output example: a7f3c4e2b8d91f6e3a5c7b2d4f8e1a9c3b6d8f2e4a7c9b5d1f3e6a8c2b4d7f9
```

### Step 2: Backend Environment (Production)

On your VPS, create `backend/.env`:

```env
# CRITICAL: Use secure values!
JWT_SECRET=a7f3c4e2b8d91f6e3a5c7b2d4f8e1a9c3b6d8f2e4a7c9b5d1f3e6a8c2b4d7f9
MONGODB_URL=mongodb+srv://prod_user:STRONG_PASSWORD@cluster.mongodb.net/
MONGODB_DB=ailexity_pos_production
ALLOWED_ORIGINS=https://pos.yourdomain.com,https://yourdomain.com
ENVIRONMENT=production
```

⚠️ **Important:**
- Use HTTPS URLs in ALLOWED_ORIGINS
- No trailing slashes
- No spaces in the comma-separated list
- Match your actual domain exactly

### Step 3: Frontend Environment (Production)

On your VPS, create `frontend/.env`:

```env
# Point to production backend via Nginx
VITE_API_URL=https://pos.yourdomain.com
```

**OR** if using subdomain for API:
```env
VITE_API_URL=https://api.yourdomain.com
```

⚠️ **Important:**
- Use HTTPS (not HTTP)
- No trailing slash
- Must match backend ALLOWED_ORIGINS

### Step 4: Verify Production Config

```bash
# Backend - Check environment is loaded
cd /var/www/ailexity-pos/backend
source venv/bin/activate
python -c "import os; from dotenv import load_dotenv; load_dotenv(); print('JWT_SECRET:', os.getenv('JWT_SECRET')[:10] + '...')"

# Should output: JWT_SECRET: a7f3c4e2b8...

# Frontend - Check build includes correct API URL
cd /var/www/ailexity-pos/frontend
cat .env
npm run build
# Check dist/assets/index-*.js for VITE_API_URL value
```

---

## 🔍 Common Configuration Patterns

### Pattern 1: Single Domain (Recommended)

**Domain**: `https://mypos.com`

**Backend** `.env`:
```env
ALLOWED_ORIGINS=https://mypos.com,https://www.mypos.com
```

**Frontend** `.env`:
```env
VITE_API_URL=https://mypos.com
```

**Nginx**: Reverse proxy `/api/*` to backend on port 8000

### Pattern 2: Subdomain for API

**Domains**: 
- Frontend: `https://pos.company.com`
- Backend: `https://api.company.com`

**Backend** `.env`:
```env
ALLOWED_ORIGINS=https://pos.company.com
```

**Frontend** `.env`:
```env
VITE_API_URL=https://api.company.com
```

**Nginx**: Separate server blocks for each subdomain

### Pattern 3: Development + Production

Use different `.env` files:

```bash
# Development
backend/.env.development
frontend/.env.development

# Production
backend/.env.production
frontend/.env.production

# Copy appropriate one to .env before running
```

---

## ❌ Common Mistakes

### Mistake 1: Trailing Slashes
```env
❌ VITE_API_URL=https://mypos.com/
✅ VITE_API_URL=https://mypos.com

❌ ALLOWED_ORIGINS=https://mypos.com/
✅ ALLOWED_ORIGINS=https://mypos.com
```

### Mistake 2: HTTP in Production
```env
❌ VITE_API_URL=http://mypos.com
✅ VITE_API_URL=https://mypos.com
```

### Mistake 3: CORS Mismatch
```env
# Frontend
VITE_API_URL=https://mypos.com

# Backend
❌ ALLOWED_ORIGINS=https://www.mypos.com  # Missing non-www
✅ ALLOWED_ORIGINS=https://mypos.com,https://www.mypos.com
```

### Mistake 4: Weak JWT Secret
```env
❌ JWT_SECRET=secret123
❌ JWT_SECRET=dev-secret-key-change-in-production
✅ JWT_SECRET=a7f3c4e2b8d91f6e3a5c7b2d4f8e1a9c3b6d8f2e4a7c9b5d1f3e6a8c2b4d7f9
```

### Mistake 5: Committing .env Files
```bash
❌ git add backend/.env
❌ git commit -m "add config"
✅ # .env files should NEVER be committed
   # They're blocked by .gitignore
```

---

## 🔒 Security Checklist

Before deployment, verify:

- [ ] JWT_SECRET is long (32+ characters) and random
- [ ] JWT_SECRET is different from development
- [ ] MongoDB password is strong (16+ characters, mixed case, numbers, symbols)
- [ ] ALLOWED_ORIGINS only includes your actual domain(s)
- [ ] All URLs use HTTPS (not HTTP)
- [ ] No .env files committed to git (`git status` should not show them)
- [ ] .env files have restricted permissions: `chmod 600 .env`

---

## 🧪 Testing Your Configuration

### Test Backend Environment Loading

```bash
cd backend
source venv/bin/activate
python -c "
from dotenv import load_dotenv
import os
load_dotenv()
print('✓ JWT_SECRET loaded:', 'Yes' if os.getenv('JWT_SECRET') else 'No')
print('✓ MONGODB_URL loaded:', 'Yes' if os.getenv('MONGODB_URL') else 'No')
print('✓ ALLOWED_ORIGINS:', os.getenv('ALLOWED_ORIGINS'))
"
```

### Test Frontend Environment

```bash
cd frontend
cat .env
npm run build
# Check that API_BASE_URL in built files matches VITE_API_URL
grep -r "VITE_API_URL" dist/
```

### Test CORS Configuration

```bash
# From browser console on your frontend domain:
fetch('https://your-api-url.com/users/me', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
})
.then(r => console.log('CORS OK:', r.status))
.catch(e => console.log('CORS Error:', e))
```

---

## 📞 Need Help?

**CORS errors?** → Check ALLOWED_ORIGINS matches frontend URL exactly  
**"Cannot reach server"?** → Verify VITE_API_URL is correct and backend is running  
**401 Unauthorized?** → Check JWT_SECRET is set and tokens are being sent  
**Connection refused?** → Verify MongoDB URL and network access  

See [README.md](README.md#troubleshooting) for detailed troubleshooting.

---

**Pro Tip**: Keep a secure backup of your production `.env` files in a password manager or encrypted vault. If your VPS crashes, you'll need these to restore your deployment.
