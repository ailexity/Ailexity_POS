#!/bin/bash

# ============================================
# Ailexity POS - VPS Full Deployment Script
# Hostinger VPS / Cloud Deployment
# ============================================

set -e  # Exit on error

echo "=========================================="
echo "  Ailexity POS - VPS Deployment"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration - EDIT THESE
DOMAIN="your-domain.com"  # Your domain or VPS IP
APP_DIR="/var/www/ailexity-pos"
MONGODB_DB="ailexity_pos"

echo -e "${YELLOW}[1/8] Updating system...${NC}"
sudo apt update && sudo apt upgrade -y

echo -e "${YELLOW}[2/8] Installing dependencies...${NC}"
# Install essential packages
sudo apt install -y curl wget git build-essential nginx certbot python3-certbot-nginx

# Install Node.js 18.x
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
fi
echo -e "${GREEN}Node.js version: $(node -v)${NC}"

# Install Python 3 and pip
sudo apt install -y python3 python3-pip python3-venv
echo -e "${GREEN}Python version: $(python3 --version)${NC}"

echo -e "${YELLOW}[3/8] Installing MongoDB...${NC}"
if ! command -v mongod &> /dev/null; then
    # Import MongoDB public GPG key
    curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
        sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
    
    # Add MongoDB repository
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
        sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
    
    sudo apt update
    sudo apt install -y mongodb-org
    
    # Start and enable MongoDB
    sudo systemctl start mongod
    sudo systemctl enable mongod
fi
echo -e "${GREEN}MongoDB installed and running${NC}"

echo -e "${YELLOW}[4/8] Setting up application directory...${NC}"
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR

# Copy project files (assuming we're running from project root)
if [ -d "./ailexity_backend" ] && [ -d "./frontend" ]; then
    cp -r ./ailexity_backend $APP_DIR/
    cp -r ./frontend $APP_DIR/
    cp -r ./deploy $APP_DIR/
    cp ./README.md $APP_DIR/ 2>/dev/null || true
    echo -e "${GREEN}Project files copied${NC}"
else
    echo -e "${RED}Error: Run this script from the project root directory${NC}"
    exit 1
fi

echo -e "${YELLOW}[5/8] Setting up Backend...${NC}"
cd $APP_DIR

# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install --upgrade pip
pip install -r ailexity_backend/requirements.txt
pip install gunicorn uvicorn[standard]

# Create environment file
cat > $APP_DIR/.env << EOF
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB=$MONGODB_DB
JWT_SECRET=$(openssl rand -hex 32)
ALLOWED_ORIGINS=http://$DOMAIN,https://$DOMAIN,http://localhost:5173
EOF

echo -e "${GREEN}Backend setup complete${NC}"

echo -e "${YELLOW}[6/8] Building Frontend...${NC}"
cd $APP_DIR/frontend

# Create production environment file
cat > .env.production << EOF
VITE_API_URL=https://$DOMAIN/api
EOF

# Install dependencies and build
npm install
npm run build

echo -e "${GREEN}Frontend built successfully${NC}"

echo -e "${YELLOW}[7/8] Configuring Nginx...${NC}"
sudo tee /etc/nginx/sites-available/ailexity-pos << EOF
server {
    listen 80;
    server_name $DOMAIN;

    # Frontend - Serve static files
    root $APP_DIR/frontend/dist;
    index index.html;

    # Handle React Router
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # API Proxy to Backend
    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Static assets caching
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml;
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/ailexity-pos /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
sudo nginx -t
sudo systemctl reload nginx

echo -e "${GREEN}Nginx configured${NC}"

echo -e "${YELLOW}[8/8] Creating systemd service for Backend...${NC}"
sudo tee /etc/systemd/system/ailexity-pos.service << EOF
[Unit]
Description=Ailexity POS Backend API
After=network.target mongod.service
Wants=mongod.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$APP_DIR
Environment="PATH=$APP_DIR/venv/bin"
EnvironmentFile=$APP_DIR/.env
ExecStart=$APP_DIR/venv/bin/gunicorn ailexity_backend.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 127.0.0.1:8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and start service
sudo systemctl daemon-reload
sudo systemctl enable ailexity-pos
sudo systemctl start ailexity-pos

echo ""
echo -e "${GREEN}=========================================="
echo "  Deployment Complete!"
echo "==========================================${NC}"
echo ""
echo -e "Your POS is now running at: ${GREEN}http://$DOMAIN${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Update DOMAIN variable in this script with your actual domain"
echo "2. Point your domain's DNS to this server's IP"
echo "3. Run: sudo certbot --nginx -d $DOMAIN (for HTTPS)"
echo ""
echo -e "${YELLOW}Useful Commands:${NC}"
echo "  Check backend status:  sudo systemctl status ailexity-pos"
echo "  View backend logs:     sudo journalctl -u ailexity-pos -f"
echo "  Restart backend:       sudo systemctl restart ailexity-pos"
echo "  Check MongoDB:         sudo systemctl status mongod"
echo ""
