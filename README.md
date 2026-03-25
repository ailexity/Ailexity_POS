# Ailexity POS - Professional Point of Sale System

A modern, full-stack multi-tenant Point of Sale (POS) web application designed for restaurants, cafes, and retail businesses. Built with FastAPI (Python) backend and React/Vite frontend, featuring MongoDB for scalable data management.

## 🎯 Key Features

- **Multi-Tenant Architecture**: Isolated data for each business
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: System Admin and Business Admin roles
- **Invoice Management**: Generate, view, and track invoices
- **Inventory Management**: Track items, categories, and stock
- **AI Assistant**: (Optional) Intelligent sales insights and recommendations
- **WhatsApp Integration**: Share invoices directly via WhatsApp
- **PDF Generation**: Professional invoice PDFs
- **Alerts System**: Business notifications and reminders
- **Responsive Design**: Works on desktop, tablet, and mobile

## 🏗️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **Uvicorn** - ASGI server
- **MongoDB** - NoSQL database (via PyMongo)
- **JWT** - JSON Web Tokens for authentication (python-jose)
- **Bcrypt** - Password hashing

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Axios** - HTTP client
- **React Router** - Client-side routing

### Infrastructure
- **Nginx** - Reverse proxy and static file serving
- **Python Virtual Environment** - Isolated Python dependencies

## 📋 Prerequisites

- **Python 3.8+** with pip
- **Node.js 16+** with npm
- **MongoDB** (local or MongoDB Atlas)
- **Nginx** (for production deployment)
- **Git** (for version control)

## 🚀 Quick Start (Local Development)

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd "Ailexity POS/POS"
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file from example
copy .env.example .env  # Windows
# cp .env.example .env  # Linux/Mac

# Edit .env and set your values:
# - JWT_SECRET (generate with: openssl rand -hex 32)
# - MONGODB_URL
# - MONGODB_DB

# Initialize database with default users
python -m backend.routers.init_db

# Start backend server
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will run at: `http://localhost:8000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file from example
copy .env.example .env  # Windows
# cp .env.example .env  # Linux/Mac

# Edit .env and set:
# VITE_API_URL=http://localhost:8000

# Start development server
npm run dev
```

Frontend will run at: `http://localhost:5173`

### 4. Default Login Credentials

After initializing the database:

- **System Admin**: `sysadmin` / `sysadmin123`
- **Business 1 (Downtown Cafe)**: `admin` / `admin123`
- **Business 2 (City Pizza)**: `admin2` / `admin123`

⚠️ **Change these passwords immediately in production!**

## 🌐 Production Deployment

### Architecture Overview

```
Internet → Nginx (Port 80/443) → FastAPI Backend (Port 8000)
                  ↓
            Static Frontend Files
```

### Step 1: Prepare Your VPS

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required software
sudo apt install -y python3 python3-pip python3-venv nginx git

# Install Node.js (for building frontend)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### Step 2: Setup MongoDB

**Option A: MongoDB Atlas (Recommended)**
1. Create free account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create cluster and database
3. Get connection string
4. Whitelist your VPS IP address

**Option B: Local MongoDB**
```bash
# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

### Step 3: Deploy Backend

```bash
# Clone repository
cd /var/www
sudo git clone <your-repo-url> ailexity-pos
cd ailexity-pos/backend

# Create virtual environment
sudo python3 -m venv venv
sudo chown -R www-data:www-data venv

# Activate and install dependencies
source venv/bin/activate
pip install -r requirements.txt

# Setup environment variables
sudo cp .env.example .env
sudo nano .env
```

**Edit .env with production values:**
```env
JWT_SECRET=<generate-with-openssl-rand-hex-32>
MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/
MONGODB_DB=ailexity_pos_production
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
ENVIRONMENT=production
```

**Generate JWT secret:**
```bash
openssl rand -hex 32
```

```bash
# Initialize database
python -m backend.routers.init_db

# Set permissions
sudo chown -R www-data:www-data /var/www/ailexity-pos
```

### Step 4: Deploy Frontend

```bash
cd /var/www/ailexity-pos/frontend

# Create production .env
sudo cp .env.example .env
sudo nano .env
```

**Edit .env:**
```env
VITE_API_URL=https://yourdomain.com
```

```bash
# Build frontend
npm install
npm run build

# The build output is in frontend/dist/
```

### Step 5: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/ailexity-pos
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend - Serve static files
    root /var/www/ailexity-pos/frontend/dist;
    index index.html;

    # Frontend routes - SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API - Reverse proxy to FastAPI
    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support (if needed)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts for long requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Optional: Backend root endpoint
    location = /token {
        proxy_pass http://127.0.0.1:8000/token;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**Alternative: Backend on subdomain (api.yourdomain.com)**
```nginx
# Main app - yourdomain.com
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    root /var/www/ailexity-pos/frontend/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# API - api.yourdomain.com
server {
    listen 80;
    server_name api.yourdomain.com;
    
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Update frontend .env for subdomain approach:**
```env
VITE_API_URL=https://api.yourdomain.com
```

**Update backend .env ALLOWED_ORIGINS:**
```env
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

```bash
# Enable site and test configuration
sudo ln -s /etc/nginx/sites-available/ailexity-pos /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 6: Setup SSL with Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is configured automatically
sudo systemctl status certbot.timer
```

### Step 7: Setup Backend as System Service

```bash
sudo nano /etc/systemd/system/ailexity-backend.service
```

**Service Configuration:**
```ini
[Unit]
Description=Ailexity POS FastAPI Backend
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/ailexity-pos
Environment="PATH=/var/www/ailexity-pos/backend/venv/bin"
ExecStart=/var/www/ailexity-pos/backend/venv/bin/uvicorn backend.main:app --host 127.0.0.1 --port 8000 --workers 4
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Start and enable service
sudo systemctl daemon-reload
sudo systemctl start ailexity-backend
sudo systemctl enable ailexity-backend

# Check status
sudo systemctl status ailexity-backend

# View logs
sudo journalctl -u ailexity-backend -f
```

### Step 8: Verify Deployment

1. Visit `https://yourdomain.com` - Frontend should load
2. Try logging in with default credentials
3. Check browser console for any errors
4. Verify API calls are working (check Network tab)

## 🔒 Security Checklist

- [ ] Change all default passwords
- [ ] Generate strong JWT_SECRET (32+ characters)
- [ ] Use HTTPS (SSL/TLS) in production
- [ ] Configure CORS to only allow your domain
- [ ] Keep MongoDB access restricted (IP whitelist)
- [ ] Enable firewall on VPS (UFW)
- [ ] Regular backups of MongoDB database
- [ ] Keep all dependencies updated
- [ ] Review Nginx security headers
- [ ] Set up monitoring and alerts

## 🔧 Environment Variables

### Backend (.env)

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| JWT_SECRET | Secret key for JWT tokens | `abc123...` | ✅ Yes |
| MONGODB_URL | MongoDB connection string | `mongodb+srv://...` | ✅ Yes |
| MONGODB_DB | Database name | `ailexity_pos_db` | ✅ Yes |
| ALLOWED_ORIGINS | Comma-separated frontend URLs | `https://domain.com` | ✅ Yes |
| ENVIRONMENT | Environment indicator | `production` | ⚪ Optional |

### Frontend (.env)

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| VITE_API_URL | Backend API URL (no trailing slash) | `https://yourdomain.com` | ✅ Yes |

## 📁 Project Structure

```
POS/
├── backend/                 # FastAPI backend
│   ├── routers/            # API route handlers
│   │   ├── users.py        # User & auth endpoints
│   │   ├── items.py        # Inventory management
│   │   ├── invoices.py     # Invoice handling
│   │   ├── ai_assistant.py # AI features
│   │   ├── tables.py       # Table management
│   │   ├── alerts.py       # Alert system
│   │   └── init_db.py      # Database initialization
│   ├── main.py             # FastAPI app entry point
│   ├── auth.py             # JWT authentication
│   ├── database.py         # MongoDB connection
│   ├── models.py           # Data models
│   ├── schemas.py          # Pydantic schemas
│   ├── requirements.txt    # Python dependencies
│   └── .env.example        # Environment template
│
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── context/       # React contexts
│   │   ├── pages/         # Page components
│   │   ├── utils/         # Helper functions
│   │   ├── api.js         # Axios configuration
│   │   └── main.jsx       # React entry point
│   ├── package.json       # NPM dependencies
│   └── .env.example       # Environment template
│
├── deploy/                 # Deployment scripts
├── docs/                   # Documentation
└── README.md              # This file
```

## 🔍 API Endpoints

### Authentication
- `POST /token` - Login (returns JWT token)

### Users
- `GET /users/me` - Get current user info
- `POST /users/` - Create new user (admin only)
- `GET /users/` - List all users (admin only)
- `PUT /users/{user_id}` - Update user
- `DELETE /users/{user_id}` - Delete user

### Items
- `GET /items/` - List items (filtered by admin)
- `POST /items/` - Create item
- `PUT /items/{item_id}` - Update item
- `DELETE /items/{item_id}` - Delete item

### Invoices
- `GET /invoices/` - List invoices
- `POST /invoices/` - Create invoice
- `GET /invoices/{invoice_id}` - Get invoice details
- `DELETE /invoices/{invoice_id}` - Delete invoice

### Alerts
- `GET /alerts/` - List active alerts
- `POST /alerts/` - Create alert (admin only)
- `POST /alerts/{alert_id}/dismiss` - Dismiss alert

## 🐛 Troubleshooting

### Backend won't start

**Error: "Could not validate credentials"**
- Check JWT_SECRET is set in backend/.env
- Ensure token is being sent in Authorization header

**Error: "Connection refused" to MongoDB**
- Verify MONGODB_URL in backend/.env
- Check MongoDB Atlas IP whitelist (allow VPS IP)
- For local MongoDB: `sudo systemctl status mongod`

**Error: "Module not found"**
- Activate virtual environment: `source venv/bin/activate`
- Reinstall dependencies: `pip install -r requirements.txt`

### Frontend issues

**API calls failing with CORS error**
- Check ALLOWED_ORIGINS in backend/.env matches frontend URL exactly
- No trailing slashes in URLs
- Verify Nginx is proxying requests correctly

**"Cannot reach server" on login**
- Check VITE_API_URL in frontend/.env
- Verify backend is running: `sudo systemctl status ailexity-backend`
- Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`

**Blank page after deployment**
- Check browser console for errors
- Verify dist/ files are in correct Nginx root directory
- Check file permissions: `sudo chown -R www-data:www-data /var/www/ailexity-pos`

### Performance issues

**Slow API responses**
- Check MongoDB indexes are created (automatic on startup)
- Increase Uvicorn workers in systemd service (default: 4)
- Monitor server resources: `htop`

**High memory usage**
- Reduce Uvicorn workers
- Check for memory leaks in long-running processes
- Restart backend service: `sudo systemctl restart ailexity-backend`

## 🔄 Updating Deployment

```bash
# Pull latest code
cd /var/www/ailexity-pos
sudo git pull

# Update backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart ailexity-backend

# Update frontend
cd ../frontend
npm install
npm run build
sudo systemctl reload nginx
```

## 📊 Monitoring & Logs

```bash
# Backend logs
sudo journalctl -u ailexity-backend -f

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# MongoDB logs (if local)
sudo tail -f /var/log/mongodb/mongod.log

# System resource usage
htop
df -h  # Disk space
free -h  # Memory
```

## 🗃️ Database Backup

```bash
# MongoDB Atlas: Use built-in backup features

# Local MongoDB backup
mongodump --uri="mongodb://localhost:27017/ailexity_pos_db" --out=/backup/$(date +%Y%m%d)

# Restore from backup
mongorestore --uri="mongodb://localhost:27017/ailexity_pos_db" /backup/20260201/ailexity_pos_db
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

[Your License Here]

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Contact: [Your Contact Information]

## 🙏 Acknowledgments

- FastAPI for the excellent web framework
- MongoDB for scalable database solution
- React team for the powerful UI library
- All open-source contributors

---

**Built with ❤️ for modern businesses**
