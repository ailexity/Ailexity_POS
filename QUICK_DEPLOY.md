# 🚀 Frontend VPS Quick Reference

## 📍 Critical Paths

```
Frontend Source:  /var/www/ailexity.in/frontend/
Deployed Files:   /var/www/ailexity.in/html/
Nginx Config:     /etc/nginx/sites-available/ailexity
Environment File: /var/www/ailexity.in/frontend/.env
```

## ⚡ One-Line Deploy

```bash
cd /var/www/ailexity.in/frontend && echo "VITE_API_URL=/api" > .env && npm run build && sudo rm -rf /var/www/ailexity.in/html/* && sudo cp -r dist/* /var/www/ailexity.in/html/ && sudo chown -R www-data:www-data /var/www/ailexity.in/html && sudo systemctl reload nginx && echo "✅ Deployed!"
```

## 🔧 Common Commands

### Deploy Frontend
```bash
cd /var/www/ailexity.in/frontend
chmod +x deploy.sh
sudo ./deploy.sh
```

### Verify Deployment
```bash
cd /var/www/ailexity.in/frontend
chmod +x verify-deployment.sh
sudo ./verify-deployment.sh
```

### Check for Localhost (Should return nothing)
```bash
grep -r "localhost" /var/www/ailexity.in/html/assets/*.js
```

### View Nginx Config
```bash
sudo cat /etc/nginx/sites-available/ailexity | grep -A 5 "root\|location /api"
```

### Watch Backend Logs
```bash
sudo journalctl -u ailexity-backend -f
```

### Test Nginx Config
```bash
sudo nginx -t && sudo systemctl reload nginx
```

## ✅ Pre-Deploy Checklist

- [ ] Backend running: `systemctl is-active ailexity-backend`
- [ ] .env file set: `cat /var/www/ailexity.in/frontend/.env` shows `VITE_API_URL=/api`
- [ ] Build clean: No errors during `npm run build`
- [ ] No localhost: `grep -r localhost /var/www/ailexity.in/html/assets/*.js` returns nothing

## 🐛 Emergency Fixes

### Frontend shows "Cannot reach server"
```bash
# Check .env
cat /var/www/ailexity.in/frontend/.env
# Should be: VITE_API_URL=/api

# If wrong:
echo "VITE_API_URL=/api" > /var/www/ailexity.in/frontend/.env
cd /var/www/ailexity.in/frontend && npm run build
sudo cp -r dist/* /var/www/ailexity.in/html/
sudo systemctl reload nginx
```

### API requests go to localhost
```bash
# Rebuild with correct .env
cd /var/www/ailexity.in/frontend
echo "VITE_API_URL=/api" > .env
npm run build
sudo rm -rf /var/www/ailexity.in/html/*
sudo cp -r dist/* /var/www/ailexity.in/html/
sudo chown -R www-data:www-data /var/www/ailexity.in/html
```

### Blank page / 404 on refresh
```bash
# Add SPA routing to nginx config
sudo nano /etc/nginx/sites-available/ailexity
# Add under location /:
#   try_files $uri $uri/ /index.html;
sudo nginx -t && sudo systemctl reload nginx
```

### Backend not receiving requests
```bash
# Check nginx proxy
sudo grep -A 10 "location /api" /etc/nginx/sites-available/ailexity
# Must have: proxy_pass http://127.0.0.1:8000;

# Check backend is running
sudo systemctl status ailexity-backend
```

## 📊 Verification

### ✅ Success Indicators
- Browser requests: `http://ailexity.in/api/token` ✅
- No requests to: `http://localhost:8000` ✅
- Backend logs show: `127.0.0.1 - "POST /token"` ✅
- Frontend loads without errors ✅

### ❌ Failure Indicators
- Browser requests: `http://localhost:8000/token` ❌
- Console error: "Failed to fetch" ❌
- Backend logs: Empty (no requests) ❌
- Grep finds localhost: `grep -r localhost html/assets/*.js` returns matches ❌

## 🔐 Environment Values

### Development (Local)
```env
VITE_API_URL=http://localhost:8000
```

### Production (VPS)
```env
VITE_API_URL=/api
```

## 📞 Need Help?

1. **Check this first**: `sudo ./verify-deployment.sh`
2. **View logs**: `sudo journalctl -u ailexity-backend -f`
3. **Test nginx**: `sudo nginx -t`
4. **See full guide**: `cat FRONTEND_DEPLOYMENT.md`

---

**Last Updated**: February 1, 2026  
**VPS Domain**: ailexity.in  
**Backend Port**: 127.0.0.1:8000 (internal only)
