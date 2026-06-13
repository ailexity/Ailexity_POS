#!/bin/bash

# ============================================
# Ailexity POS - Quick Setup for Hostinger VPS
# One-command deployment
# ============================================

set -e

echo "================================================"
echo "  Ailexity POS - Hostinger VPS Quick Setup"
echo "================================================"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "Please run without sudo. The script will ask for sudo when needed."
    exit 1
fi

# Get configuration from user
read -p "Enter your domain name (or VPS IP): " DOMAIN
read -p "Enter your email (for SSL certificate): " EMAIL

# Validate inputs
if [ -z "$DOMAIN" ]; then
    echo "Domain cannot be empty"
    exit 1
fi

# Update deploy script with user's domain
sed -i "s/DOMAIN=\"your-domain.com\"/DOMAIN=\"$DOMAIN\"/" deploy-vps.sh
sed -i "s/DOMAIN=\"your-domain.com\"/DOMAIN=\"$DOMAIN\"/" setup-ssl.sh
sed -i "s/EMAIL=\"your-email@example.com\"/EMAIL=\"$EMAIL\"/" setup-ssl.sh

echo ""
echo "Configuration saved. Starting deployment..."
echo ""

# Run main deployment
chmod +x deploy-vps.sh
./deploy-vps.sh

# Ask about SSL
echo ""
read -p "Do you want to set up SSL certificate now? (y/n): " SETUP_SSL

if [ "$SETUP_SSL" = "y" ] || [ "$SETUP_SSL" = "Y" ]; then
    chmod +x setup-ssl.sh
    ./setup-ssl.sh
fi

echo ""
echo "================================================"
echo "  Setup Complete!"
echo "================================================"
echo ""
echo "Your Ailexity POS is running at:"
echo "  http://$DOMAIN"
[ "$SETUP_SSL" = "y" ] || [ "$SETUP_SSL" = "Y" ] && echo "  https://$DOMAIN"
echo ""
