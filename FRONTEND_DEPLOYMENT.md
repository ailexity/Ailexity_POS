# Frontend VPS Deployment Guide

## 🎯 Critical Information

**Frontend Location on VPS**: `/var/www/ailexity.in/html`  
**Nginx Serves From**: `/var/www/ailexity.in/html`  
**API Requests Go To**: `/api/*` (proxied by nginx to backend on 127.0.0.1:8000)

⚠️ **DO NOT use any other directory** (`/var/www/html`, `/var/www/ailexity-frontend`, etc.)

---

## 📁 VPS Directory Structure

```
/var/www/ailexity.in/
├── html/               ← Frontend build output goes HERE
│   ├── index.html
│   ├── assets/
│   │   ├── index-xxx.js
│   │   └── index-xxx.css
│   └── ...
└── logs/              ← Optional: application logs
```

---

## 🚀 How to Deploy/Redeploy Frontend

### Step 1: Prepare Environment File

On your VPS, create `/var/www/ailexity.in/.env`:

```bash
cd /var/www/ailexity.in
sudo nano .env
```

Add this content:
```env
VITE_API_URL=/api
```

**IMPORTANT**: Use `/api` (relative path), NOT `http://...`

### Step 2: Build Frontend

```bash
cd /var/www/ailexity.in/frontend

# Copy production environment
cp .env.production .env

# OR manually create .env:
echo "VITE_API_URL=/api" > .env

# Install dependencies (first time only)
npm install

# Build for production
npm run build

# Verify build completed
ls -la dist/
```

### Step 3: Deploy Built Files

```bash
# Remove old build (if exists)
sudo rm -rf /var/www/ailexity.in/html/*

# Copy new build
sudo cp -r dist/* /var/www/ailexity.in/html/

# Set correct permissions
sudo chown -R www-data:www-data /var/www/ailexity.in/html
sudo chmod -R 755 /var/www/ailexity.in/html

# Verify files are in place
ls -la /var/www/ailexity.in/html/
```

### Step 4: Reload Nginx

```bash
# Test nginx configuration
sudo nginx -t

# Reload nginx (no downtime)
sudo systemctl reload nginx

# OR restart if needed
sudo systemctl restart nginx
```

---

## ✅ Verification Steps

### 1. Check Nginx is Serving Correct Directory

```bash
# View nginx config
sudo cat /etc/nginx/sites-available/ailexity

# Look for this line:
# root /var/www/ailexity.in/html;

# Verify symlink exists
ls -la /etc/nginx/sites-enabled/ailexity
```

### 2. Verify Built JS Files Do NOT Contain "localhost"

```bash
cd /var/www/ailexity.in/html/assets

# This should return NOTHING (no localhost references)
grep -r "localhost" *.js

# This should show /api usage
grep -r "/api" *.js | head -5
```

**Expected**: No "localhost" found in any JS file.  
**If localhost appears**: Your build used wrong `.env` file. Rebuild with correct `.env`.

### 3. Test Frontend in Browser

```bash
# Open browser to: http://ailexity.in
# Open DevTools → Network tab
# Try to login

# Check that API requests go to:
#   http://ailexity.in/api/token
#   http://ailexity.in/api/users/me
# NOT:
#   http://localhost:8000/...
```

### 4. Verify Backend Receives Requests

```bash
# Watch backend logs while using frontend
sudo journalctl -u ailexity-backend -f

# You should see:
# INFO:     127.0.0.1:xxxxx - "POST /token HTTP/1.1" 200 OK
# INFO:     127.0.0.1:xxxxx - "GET /users/me HTTP/1.1" 200 OK
```

If backend logs show requests, frontend is correctly configured! ✅

---

## 🔍 Troubleshooting

### Problem: "Request to localhost:8000 failed"

**Cause**: Built JS files still contain localhost  
**Solution**:
```bash
cd /var/www/ailexity.in/frontend

# Check .env file
cat .env
# Should show: VITE_API_URL=/api

# If wrong, fix it:
echo "VITE_API_URL=/api" > .env

# Rebuild
npm run build

# Redeploy
sudo rm -rf /var/www/ailexity.in/html/*
sudo cp -r dist/* /var/www/ailexity.in/html/
sudo chown -R www-data:www-data /var/www/ailexity.in/html
sudo systemctl reload nginx
```

### Problem: "404 Not Found" for API calls

**Cause**: Nginx not proxying `/api/*` correctly  
**Solution**:
```bash
# Check nginx config has proxy_pass
sudo grep -A 10 "location /api" /etc/nginx/sites-available/ailexity

# Should contain:
#   proxy_pass http://127.0.0.1:8000;

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

### Problem: Blank page or 404 on refresh

**Cause**: SPA routing not configured  
**Solution**:
```bash
# Nginx config must have:
#   try_files $uri $uri/ /index.html;

# Check:
sudo grep "try_files" /etc/nginx/sites-available/ailexity

# If missing, add it and reload
sudo systemctl reload nginx
```

### Problem: CORS errors

**Cause**: Backend ALLOWED_ORIGINS doesn't match domain  
**Solution**:
```bash
# Check backend .env
sudo cat /var/www/ailexity.in/backend/.env | grep ALLOWED_ORIGINS

# Should include your domain:
# ALLOWED_ORIGINS=http://ailexity.in,http://www.ailexity.in

# If wrong, fix and restart backend:
sudo systemctl restart ailexity-backend
```

---

## ❌ What NOT to Do

### 1. ❌ DO NOT use multiple frontend directories

**Wrong**:
```bash
/var/www/html              # Old location
/var/www/ailexity.in/html  # Current location
/var/www/ailexity-frontend # Another old location
```

**Right**:
```bash
/var/www/ailexity.in/html  # ONLY use this one
```

### 2. ❌ DO NOT build with localhost fallback

**Wrong** `.env`:
```env
# No .env file (uses localhost fallback)
```

**Right** `.env`:
```env
VITE_API_URL=/api
```

### 3. ❌ DO NOT skip rebuilding after changing .env

**Wrong workflow**:
```bash
echo "VITE_API_URL=/api" > .env
# Forgot to rebuild!
sudo cp -r dist/* /var/www/ailexity.in/html/  # Old build still has localhost
```

**Right workflow**:
```bash
echo "VITE_API_URL=/api" > .env
npm run build  # Must rebuild!
sudo cp -r dist/* /var/www/ailexity.in/html/
```

### 4. ❌ DO NOT edit built files directly

**Wrong**:
```bash
sudo nano /var/www/ailexity.in/html/assets/index-xxx.js  # Editing minified code
```

**Right**:
```bash
# Edit source, rebuild, redeploy
nano /var/www/ailexity.in/frontend/src/api.js
npm run build
sudo cp -r dist/* /var/www/ailexity.in/html/
```

### 5. ❌ DO NOT use absolute URLs in production

**Wrong** `.env`:
```env
VITE_API_URL=http://ailexity.in:8000  # Direct to backend port
VITE_API_URL=http://localhost:8000     # localhost
```

**Right** `.env`:
```env
VITE_API_URL=/api  # Relative path, nginx proxies
```

---

## 🔄 Quick Deployment Checklist

Before deploying, verify:

- [ ] Backend is running: `sudo systemctl status ailexity-backend`
- [ ] Created `frontend/.env` with `VITE_API_URL=/api`
- [ ] Built frontend: `npm run build`
- [ ] Deployed to `/var/www/ailexity.in/html/`
- [ ] Set permissions: `chown -R www-data:www-data`
- [ ] Verified no localhost in build: `grep -r "localhost" /var/www/ailexity.in/html/assets/*.js`
- [ ] Nginx config serves from `/var/www/ailexity.in/html`
- [ ] Nginx config proxies `/api/*` to backend
- [ ] Reloaded nginx: `sudo systemctl reload nginx`
- [ ] Tested in browser - API requests go to `/api/*`
- [ ] Backend logs show incoming requests

---

## 📞 Quick Commands Reference

```bash
# Build frontend
cd /var/www/ailexity.in/frontend && npm run build

# Deploy build
sudo rm -rf /var/www/ailexity.in/html/* && \
sudo cp -r dist/* /var/www/ailexity.in/html/ && \
sudo chown -R www-data:www-data /var/www/ailexity.in/html

# Check for localhost in build
grep -r "localhost" /var/www/ailexity.in/html/assets/*.js

# View nginx config
sudo cat /etc/nginx/sites-available/ailexity

# Reload nginx
sudo nginx -t && sudo systemctl reload nginx

# Watch backend logs
sudo journalctl -u ailexity-backend -f

# Check frontend files
ls -la /var/www/ailexity.in/html/
```

---

## 🎓 Understanding the Setup

**Why `/api` instead of full URL?**
- Frontend uses relative path: `/api/token`
- Browser sends to: `http://ailexity.in/api/token`
- Nginx intercepts `/api/*` and proxies to backend on `127.0.0.1:8000`
- Backend receives request as if it came to `http://127.0.0.1:8000/token`

**Benefits**:
- ✅ No CORS issues (same origin)
- ✅ Backend not exposed directly
- ✅ Works with or without HTTPS
- ✅ Easy to switch backends (just change nginx)

**Directory structure**:
```
Browser:  http://ailexity.in/          → Nginx → /var/www/ailexity.in/html/index.html
Browser:  http://ailexity.in/api/token → Nginx → http://127.0.0.1:8000/token
```

---

**Deployment Date**: _________________  
**Last Updated**: _________________  
**Status**: [ ] Deployed [ ] Verified [ ] Production-Ready
