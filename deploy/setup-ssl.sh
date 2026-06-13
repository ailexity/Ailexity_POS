#!/bin/bash

# ============================================
# Ailexity POS - SSL Certificate Setup
# Run after initial deployment
# ============================================

# Configuration - EDIT THIS
DOMAIN="your-domain.com"
EMAIL="your-email@example.com"

echo "Setting up SSL certificate for $DOMAIN..."

# Install certbot if not present
if ! command -v certbot &> /dev/null; then
    sudo apt install -y certbot python3-certbot-nginx
fi

# Get SSL certificate
sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m $EMAIL

# Set up auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

echo ""
echo "SSL certificate installed!"
echo "Your site is now accessible at: https://$DOMAIN"
echo ""
echo "Certificate will auto-renew before expiration."
