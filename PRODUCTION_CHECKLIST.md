# Production Deployment Checklist

Use this checklist before deploying Ailexity POS to production.

## ✅ Pre-Deployment

### Environment Files
- [ ] Created `backend/.env` from `backend/.env.example`
- [ ] Created `frontend/.env` from `frontend/.env.example`
- [ ] Generated strong JWT_SECRET (32+ characters): `openssl rand -hex 32`
- [ ] Configured MongoDB connection string (Atlas or local)
- [ ] Set ALLOWED_ORIGINS to exact frontend domain(s)
- [ ] Set VITE_API_URL to production backend URL
- [ ] Verified no `.env` files are committed to git

### Security
- [ ] Changed all default passwords (sysadmin, admin, admin2)
- [ ] JWT_SECRET is unique and secure
- [ ] MongoDB has authentication enabled
- [ ] MongoDB IP whitelist configured (if using Atlas)
- [ ] CORS origins are restricted (no wildcards)
- [ ] HTTPS/SSL certificates obtained
- [ ] Firewall configured on VPS (UFW or similar)

### Code Quality
- [ ] Removed all debug print statements
- [ ] All environment variables loaded from `.env`
- [ ] No hardcoded URLs, ports, or credentials
- [ ] Error handling is production-safe
- [ ] Logging configured properly

### Dependencies
- [ ] Backend requirements.txt is up to date
- [ ] Frontend package.json is up to date
- [ ] All dependencies are compatible versions
- [ ] python-dotenv added to requirements.txt

## 🚀 Deployment Steps

### VPS Preparation
- [ ] VPS is running and accessible via SSH
- [ ] System packages updated: `apt update && apt upgrade`
- [ ] Python 3.8+ installed
- [ ] Node.js 16+ installed
- [ ] Nginx installed
- [ ] MongoDB setup (Atlas or local)

### Backend Deployment
- [ ] Code deployed to VPS (e.g., `/var/www/ailexity-pos`)
- [ ] Virtual environment created: `python3 -m venv venv`
- [ ] Dependencies installed: `pip install -r requirements.txt`
- [ ] `.env` file configured with production values
- [ ] Database initialized: `python -m backend.routers.init_db`
- [ ] Systemd service created: `/etc/systemd/system/ailexity-backend.service`
- [ ] Service enabled: `systemctl enable ailexity-backend`
- [ ] Service started: `systemctl start ailexity-backend`
- [ ] Service status verified: `systemctl status ailexity-backend`

### Frontend Deployment
- [ ] `.env` configured with production VITE_API_URL
- [ ] Dependencies installed: `npm install`
- [ ] Production build created: `npm run build`
- [ ] Build output (dist/) is in correct location
- [ ] File permissions set: `chown -R www-data:www-data`

### Nginx Configuration
- [ ] Nginx config created in `/etc/nginx/sites-available/`
- [ ] Static files path is correct (`root` directive)
- [ ] Reverse proxy configured for backend API
- [ ] SPA routing configured: `try_files $uri $uri/ /index.html`
- [ ] Site symlinked: `ln -s /etc/nginx/sites-available/... /etc/nginx/sites-enabled/`
- [ ] Config tested: `nginx -t`
- [ ] Nginx reloaded: `systemctl reload nginx`

### SSL/HTTPS
- [ ] Certbot installed: `apt install certbot python3-certbot-nginx`
- [ ] SSL certificate obtained: `certbot --nginx -d yourdomain.com`
- [ ] Auto-renewal enabled: `systemctl status certbot.timer`
- [ ] HTTPS working correctly

## ✔️ Post-Deployment Verification

### Functional Testing
- [ ] Frontend loads at https://yourdomain.com
- [ ] Login page appears correctly
- [ ] Can login with default credentials
- [ ] Dashboard loads after login
- [ ] Can create/view items
- [ ] Can create/view invoices
- [ ] Logout works correctly
- [ ] JWT token refresh works
- [ ] Multi-tenant isolation verified (test with multiple users)

### Technical Verification
- [ ] Browser console shows no errors
- [ ] Network tab shows successful API calls
- [ ] API returns 401 for unauthorized requests
- [ ] CORS headers present in responses
- [ ] SSL certificate is valid
- [ ] Backend service is running: `systemctl status ailexity-backend`
- [ ] Backend logs show no errors: `journalctl -u ailexity-backend`
- [ ] Nginx logs show no errors: `tail /var/log/nginx/error.log`

### Performance
- [ ] Page load time is acceptable (< 3 seconds)
- [ ] API response time is fast (< 500ms for simple queries)
- [ ] MongoDB indexes are created (automatic)
- [ ] Backend workers configured appropriately (default: 4)

## 🔧 Monitoring Setup

### Logging
- [ ] Backend logs accessible: `journalctl -u ailexity-backend -f`
- [ ] Nginx access logs: `tail -f /var/log/nginx/access.log`
- [ ] Nginx error logs: `tail -f /var/log/nginx/error.log`
- [ ] Log rotation configured

### Backup
- [ ] MongoDB backup strategy defined
- [ ] Backup automation configured (cron job)
- [ ] Backup restore tested
- [ ] Backup storage location secure

### Monitoring (Optional but Recommended)
- [ ] Uptime monitoring configured (UptimeRobot, Pingdom, etc.)
- [ ] Error tracking configured (Sentry, Rollbar, etc.)
- [ ] Server monitoring (CPU, memory, disk)
- [ ] Alert notifications configured

## 📝 Documentation

- [ ] README.md updated with deployment info
- [ ] Environment variables documented
- [ ] Admin credentials shared securely with client
- [ ] Deployment date recorded
- [ ] Known issues documented

## 🔒 Final Security Review

- [ ] All default passwords changed
- [ ] JWT_SECRET is not "dev-secret-key-change-in-production"
- [ ] No .env files in git repository
- [ ] MongoDB not publicly accessible
- [ ] SSH key authentication enabled (password auth disabled)
- [ ] VPS firewall configured (only ports 22, 80, 443 open)
- [ ] Backend only accessible via Nginx (not directly on port 8000)
- [ ] HTTPS enforced (HTTP redirects to HTTPS)

## ✨ Handoff

- [ ] Client trained on system usage
- [ ] Admin panel access provided
- [ ] Support contact information shared
- [ ] Maintenance schedule agreed upon
- [ ] Deployment completed and signed off

---

## Quick Commands Reference

```bash
# Check backend status
sudo systemctl status ailexity-backend

# Restart backend
sudo systemctl restart ailexity-backend

# View backend logs
sudo journalctl -u ailexity-backend -f

# Test Nginx config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# View Nginx errors
sudo tail -f /var/log/nginx/error.log

# Check SSL certificate
sudo certbot certificates

# Renew SSL certificate
sudo certbot renew

# MongoDB backup (if local)
mongodump --uri="mongodb://localhost:27017/ailexity_pos_db" --out=/backup/$(date +%Y%m%d)
```

## Troubleshooting Quick Fixes

**500 Internal Server Error**
```bash
sudo journalctl -u ailexity-backend -n 50
```

**CORS Errors**
```bash
# Check ALLOWED_ORIGINS in backend/.env matches frontend domain exactly
grep ALLOWED_ORIGINS /var/www/ailexity-pos/backend/.env
```

**Blank Frontend**
```bash
# Verify build files exist
ls -la /var/www/ailexity-pos/frontend/dist/
# Check Nginx root path
grep -n "root" /etc/nginx/sites-available/ailexity-pos
```

**Database Connection Failed**
```bash
# Test MongoDB connection
python3 -c "from pymongo import MongoClient; print(MongoClient('your-connection-string').list_database_names())"
```

---

**Deployment Date**: _________________

**Deployed By**: _________________

**Production URL**: _________________

**Status**: [ ] Deployed [ ] Verified [ ] Client Approved
