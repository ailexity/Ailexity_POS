#!/bin/bash

# ============================================
# Ailexity POS - Update Deployment
# Run this to update the app after code changes
# ============================================

APP_DIR="/var/www/ailexity-pos"

echo "Updating Ailexity POS..."

# Update backend
echo "[1/3] Updating backend..."
if [ -d "$APP_DIR/backend" ]; then
	cd $APP_DIR/backend
	source venv/bin/activate
	pip install -r requirements.txt
elif [ -d "$APP_DIR/ailexity_backend" ]; then
	cd $APP_DIR
	source venv/bin/activate
	pip install -r ailexity_backend/requirements.txt
else
	echo "Backend directory not found (expected backend/ or ailexity_backend/)"
	exit 1
fi

# Rebuild frontend
echo "[2/3] Rebuilding frontend..."
cd $APP_DIR/frontend
npm install
npm run build

# Restart backend service
echo "[3/3] Restarting services..."
sudo systemctl restart ailexity-pos

echo ""
echo "Update complete!"
echo "Check status: sudo systemctl status ailexity-pos"
