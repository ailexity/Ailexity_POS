#!/bin/bash
# Frontend Deployment Script for VPS
# Run this on your VPS to deploy the frontend

set -e  # Exit on any error

echo "🚀 Ailexity POS - Frontend Deployment"
echo "======================================"
echo ""

# Configuration
FRONTEND_DIR="/var/www/ailexity.in/frontend"
DEPLOY_DIR="/var/www/ailexity.in/html"
NGINX_CONFIG="/etc/nginx/sites-available/ailexity"

# Step 1: Verify backend is running
echo "📡 Step 1: Checking backend status..."
if systemctl is-active --quiet ailexity-backend; then
    echo "✅ Backend is running"
else
    echo "❌ Backend is not running!"
    echo "   Start it with: sudo systemctl start ailexity-backend"
    exit 1
fi
echo ""

# Step 2: Check environment file
echo "🔍 Step 2: Checking environment configuration..."
if [ ! -f "$FRONTEND_DIR/.env" ]; then
    echo "⚠️  .env file not found. Creating it..."
    echo "VITE_API_URL=/api" > "$FRONTEND_DIR/.env"
    echo "✅ Created .env file with VITE_API_URL=/api"
else
    echo "✅ .env file exists"
    echo "   Content: $(cat $FRONTEND_DIR/.env)"
fi
echo ""

# Step 3: Build frontend
echo "🏗️  Step 3: Building frontend..."
cd "$FRONTEND_DIR"
echo "   Installing dependencies..."
npm install --silent
echo "   Building production bundle..."
npm run build
echo "✅ Build completed"
echo ""

# Step 4: Verify no localhost in build
echo "🔍 Step 4: Verifying build (checking for localhost)..."
if grep -r "localhost" dist/assets/*.js > /dev/null 2>&1; then
    echo "❌ ERROR: Build contains 'localhost' references!"
    echo "   This means the build used wrong environment variables."
    echo "   Check $FRONTEND_DIR/.env and rebuild."
    exit 1
else
    echo "✅ No localhost references found in build"
fi
echo ""

# Step 5: Deploy files
echo "📦 Step 5: Deploying files to $DEPLOY_DIR..."
echo "   Backing up old deployment..."
if [ -d "$DEPLOY_DIR" ] && [ "$(ls -A $DEPLOY_DIR)" ]; then
    BACKUP_DIR="/var/www/ailexity.in/html-backup-$(date +%Y%m%d-%H%M%S)"
    sudo mkdir -p "$BACKUP_DIR"
    sudo cp -r "$DEPLOY_DIR"/* "$BACKUP_DIR"/ 2>/dev/null || true
    echo "   Backup saved to: $BACKUP_DIR"
fi

echo "   Removing old files..."
sudo rm -rf "$DEPLOY_DIR"/*

echo "   Copying new files..."
sudo cp -r dist/* "$DEPLOY_DIR"/

echo "   Setting permissions..."
sudo chown -R www-data:www-data "$DEPLOY_DIR"
sudo chmod -R 755 "$DEPLOY_DIR"

echo "✅ Files deployed successfully"
echo ""

# Step 6: Verify nginx configuration
echo "🔧 Step 6: Verifying nginx configuration..."
if [ ! -f "$NGINX_CONFIG" ]; then
    echo "❌ Nginx config not found at: $NGINX_CONFIG"
    echo "   Copy frontend/nginx.conf to this location"
    exit 1
fi

# Check if config has correct root
if grep -q "root /var/www/ailexity.in/html" "$NGINX_CONFIG"; then
    echo "✅ Nginx root directory is correct"
else
    echo "⚠️  WARNING: Nginx root might not be set to /var/www/ailexity.in/html"
fi

# Check if config has api proxy
if grep -q "location /api" "$NGINX_CONFIG"; then
    echo "✅ Nginx has /api proxy configuration"
else
    echo "❌ WARNING: Nginx does not have /api proxy!"
fi

echo "   Testing nginx configuration..."
if sudo nginx -t 2>&1 | grep -q "successful"; then
    echo "✅ Nginx configuration is valid"
else
    echo "❌ Nginx configuration has errors!"
    sudo nginx -t
    exit 1
fi
echo ""

# Step 7: Reload nginx
echo "🔄 Step 7: Reloading nginx..."
sudo systemctl reload nginx
echo "✅ Nginx reloaded"
echo ""

# Step 8: Verification
echo "✅ Step 8: Deployment complete!"
echo ""
echo "📋 Verification Summary:"
echo "   Frontend location: $DEPLOY_DIR"
echo "   Files deployed: $(ls -1 $DEPLOY_DIR | wc -l) files"
echo "   Nginx status: $(systemctl is-active nginx)"
echo "   Backend status: $(systemctl is-active ailexity-backend)"
echo ""
echo "🧪 Next Steps:"
echo "   1. Open http://ailexity.in in browser"
echo "   2. Open DevTools → Network tab"
echo "   3. Try to login"
echo "   4. Verify API requests go to /api/* (NOT localhost)"
echo "   5. Watch backend logs: sudo journalctl -u ailexity-backend -f"
echo ""
echo "📝 Files locations:"
echo "   Frontend source: $FRONTEND_DIR"
echo "   Deployed files:  $DEPLOY_DIR"
echo "   Nginx config:    $NGINX_CONFIG"
echo "   Environment:     $FRONTEND_DIR/.env"
echo ""
echo "✨ Deployment completed successfully!"
