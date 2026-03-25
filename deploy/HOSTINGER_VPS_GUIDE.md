# Ailexity POS - Hostinger VPS Deployment Guide

## Prerequisites

- Hostinger VPS with Ubuntu 22.04 LTS
- SSH access to your VPS
- A domain pointing to your VPS IP (optional, can use IP directly)

---

## Quick Deployment (Recommended)

### Step 1: Upload Project to VPS

**Option A: Using Git (Recommended)**
```bash
# SSH into your VPS
ssh root@your-vps-ip

# Clone your repository
cd /root
git clone https://github.com/your-username/ailexity-pos.git
cd ailexity-pos
```

**Option B: Using SFTP/SCP**
```bash
# From your local machine, upload the project
scp -r "D:\Ailexity POS\POS" root@your-vps-ip:/root/ailexity-pos
```

### Step 2: Run Quick Setup

```bash
# SSH into VPS
ssh root@your-vps-ip

# Navigate to deploy folder
cd /root/ailexity-pos/deploy

# Make scripts executable
chmod +x *.sh

# Run quick setup
./quick-setup.sh
```

The script will ask for:
1. Your domain name (or VPS IP address)
2. Your email (for SSL certificate)

That's it! The script handles everything automatically.

---

## Manual Deployment (Advanced)

If you prefer manual control:

### 1. Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### 3. Install Python
```bash
sudo apt install -y python3 python3-pip python3-venv
```

### 4. Install MongoDB
```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
    sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
    sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 5. Install Nginx
```bash
sudo apt install -y nginx
```

### 6. Setup Backend
```bash
cd /var/www/ailexity-pos/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install gunicorn uvicorn[standard]
```

### 7. Build Frontend
```bash
cd /var/www/ailexity-pos/frontend
npm install
npm run build
```

### 8. Configure Nginx
See `/deploy/deploy-vps.sh` for nginx configuration.

### 9. Create Systemd Service
See `/deploy/deploy-vps.sh` for service configuration.

---

## Post-Deployment

### Check Service Status
```bash
# Backend API
sudo systemctl status ailexity-pos

# MongoDB
sudo systemctl status mongod

# Nginx
sudo systemctl status nginx
```

### View Logs
```bash
# Backend logs
sudo journalctl -u ailexity-pos -f

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Restart Services
```bash
sudo systemctl restart ailexity-pos
sudo systemctl restart nginx
sudo systemctl restart mongod
```

---

## Updating the Application

After making changes to your code:

```bash
cd /root/ailexity-pos

# If using git
git pull origin main

# Run update script
cd deploy
./update.sh
```

---

## SSL Certificate (HTTPS)

After deployment, set up HTTPS:

```bash
cd /root/ailexity-pos/deploy
./setup-ssl.sh
```

Or manually:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Firewall Configuration

```bash
# Allow HTTP, HTTPS, and SSH
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

---

## Troubleshooting

### Backend not starting
```bash
# Check logs
sudo journalctl -u ailexity-pos -n 50

# Test manually
cd /var/www/ailexity-pos/backend
source venv/bin/activate
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### MongoDB connection issues
```bash
# Check MongoDB status
sudo systemctl status mongod

# Check MongoDB logs
sudo cat /var/log/mongodb/mongod.log
```

### Frontend 404 errors
- Ensure nginx is configured correctly
- Check that `dist` folder exists after build
- Verify nginx config: `sudo nginx -t`

### CORS errors
- Check ALLOWED_ORIGINS in backend .env file
- Make sure your domain is listed

---

## Default Credentials

After deployment, log in with:
- **Sysadmin**: `sysadmin` / `sysadmin123`

**⚠️ Change these passwords immediately after first login!**

---

## Backup

### Backup MongoDB
```bash
mongodump --out /backup/$(date +%Y%m%d)
```

### Restore MongoDB
```bash
mongorestore /backup/20260127
```

---

## Support

For issues, check:
1. Service logs: `sudo journalctl -u ailexity-pos -f`
2. Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. MongoDB logs: `sudo cat /var/log/mongodb/mongod.log`
