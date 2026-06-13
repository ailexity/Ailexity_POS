        proxy_set_header Connection "upgrade";
    }
}
```

## Ailexity POS Master Guide

This repository contains a full-stack multi-tenant point of sale system for restaurants, cafes, and retail businesses. It combines a FastAPI backend, a React/Vite frontend, and MongoDB for persistent data.

## What the system does


## Main stack


## Project layout


## Local setup

1. Install Python 3.8+ and Node.js 16+.
2. Create and activate a virtual environment.
3. Install backend dependencies with `pip install -r requirements.txt`.
4. Configure backend environment variables for MongoDB and JWT secrets.
5. Run database initialization if your environment includes the seed command.
6. In `frontend/`, run `npm install` and `npm run dev`.

### Typical environment variables

```env
JWT_SECRET=your-long-random-secret
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB=ailexity_pos
ALLOWED_ORIGINS=http://localhost:5173
ENVIRONMENT=development
VITE_API_URL=http://localhost:8000
```

## Running locally

Backend:

```bash
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

Frontend:

```bash
cd frontend
npm run dev
```

## Default access

The sample data in this project uses seeded accounts such as system admin and business admin logins. Change all default credentials immediately before any real use.

## Deployment summary

The standard production flow is:

1. Provision a VPS or hosting target.
2. Install Python, Node.js, nginx, and MongoDB or connect to MongoDB Atlas.
3. Configure backend environment variables.
4. Build the frontend with production API settings.
5. Serve the frontend through nginx and proxy API requests to FastAPI.
6. Verify login, API routing, and database connectivity.

### Common production pattern

```text
Browser -> Nginx -> Frontend static files
Browser -> Nginx /api -> FastAPI backend -> MongoDB
```

## Business roles


## Data model notes


## Operational checklist


## Troubleshooting


## Maintenance


## Note on removed docs

This file replaces the separate markdown guides that used to live across the root, `docs/`, `deploy/`, and nested duplicate project folders.
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
