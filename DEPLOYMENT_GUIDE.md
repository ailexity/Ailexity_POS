# Ailexity POS - Deployment Guide

## 🚀 Hostinger VPS Deployment (Recommended)

For full deployment on Hostinger VPS/Cloud, see the complete guide:
**[deploy/HOSTINGER_VPS_GUIDE.md](deploy/HOSTINGER_VPS_GUIDE.md)**

### Quick Start
```bash
# 1. Upload project to VPS
scp -r "D:\Ailexity POS\POS" root@your-vps-ip:/root/ailexity-pos

# 2. SSH into VPS
ssh root@your-vps-ip

# 3. Run deployment
cd /root/ailexity-pos/deploy
chmod +x *.sh
./quick-setup.sh
```

---

## ⚠️ Important: This is a Full-Stack Application

Your POS system consists of:
- **Frontend**: React/Vite (Static files)
- **Backend**: FastAPI/Python (Requires Python runtime)
- **Database**: MongoDB (Requires MongoDB server)

---

## Deployment Options

### Option 1: Hostinger VPS (Recommended for Full Control)

If you have Hostinger VPS:

1. **SSH into your VPS**
2. **Install required software:**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   
   # Install Python
   sudo apt install -y python3 python3-pip python3-venv
   
   # Install MongoDB
   wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
   echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
   sudo apt update
   sudo apt install -y mongodb-org
   sudo systemctl start mongod
   sudo systemctl enable mongod
   ```

3. **Deploy Backend:**
   ```bash
   cd /var/www
   git clone your-repo.git pos
   cd pos/backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   
   # Run with PM2 or systemd
   pip install gunicorn
   gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:8000
   ```

4. **Build & Deploy Frontend:**
   ```bash
   cd /var/www/pos/frontend
   npm install
   npm run build
   # Copy dist folder to web root
   cp -r dist/* /var/www/html/
   ```

---

### Option 2: Split Deployment (Recommended for Shared Hosting)

#### Step 1: Deploy Backend to Railway/Render (Free)

**Using Railway (https://railway.app):**
1. Create account at railway.app
2. Connect your GitHub repository
3. Add MongoDB plugin or use MongoDB Atlas
4. Deploy backend folder
5. Get your API URL (e.g., `https://your-app.railway.app`)

**Using Render (https://render.com):**
1. Create account at render.com
2. Create new Web Service
3. Connect GitHub repo, set root to `backend`
4. Build Command: `pip install -r requirements.txt`
5. Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

#### Step 2: Deploy Database to MongoDB Atlas (Free)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string
4. Update backend to use Atlas connection string

#### Step 3: Deploy Frontend to Hostinger

1. **Build the frontend locally:**
   ```bash
   cd frontend
   
   # Create .env.production file
   echo "VITE_API_URL=https://your-backend-url.railway.app" > .env.production
   
   # Install dependencies and build
   npm install
   npm run build
   ```

2. **Upload to Hostinger:**
   - Go to Hostinger File Manager
   - Navigate to `public_html`
   - Delete existing files
   - Upload ALL contents of the `dist` folder (not the folder itself)
   - Also upload the `.htaccess` file from frontend folder

3. **Folder structure on Hostinger should be:**
   ```
   public_html/
   ├── .htaccess
   ├── index.html
   ├── assets/
   │   ├── index-xxxxx.js
   │   ├── index-xxxxx.css
   │   └── ...
   └── (other files)
   ```

---

## Environment Variables

### Frontend (.env.production)
```
VITE_API_URL=https://your-backend-api-url.com
```

### Backend (set in hosting platform)
```
MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/pos_db
JWT_SECRET=your-secret-key
```

---

## Common Issues & Fixes

### 1. "Failed to deploy" on Hostinger
- Don't upload the entire project folder
- Only upload the **contents of `dist`** after running `npm run build`
- Make sure `.htaccess` is uploaded

### 2. 404 errors on page refresh
- The `.htaccess` file handles this for React Router
- Make sure it's uploaded to public_html

### 3. API calls failing
- Check CORS settings in backend
- Verify VITE_API_URL in .env.production before building
- Check browser console for errors

### 4. Blank page
- Check browser console for errors
- Verify all files were uploaded correctly
- Check if paths in index.html are correct

---

## Quick Deploy Commands (Frontend Only)

```bash
# Navigate to frontend
cd frontend

# Create production environment file
echo "VITE_API_URL=https://your-backend-url.com" > .env.production

# Install and build
npm install
npm run build

# The 'dist' folder is ready to upload to Hostinger
```

---

## Need Help?

1. Hostinger shared hosting = Frontend only (need external backend)
2. Hostinger VPS = Full application (frontend + backend + database)
3. Consider Railway/Render for free backend hosting
4. Use MongoDB Atlas for free database hosting
