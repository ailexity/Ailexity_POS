#!/bin/bash
# Frontend Deployment Verification Script
# Run this to verify the frontend is correctly deployed

echo "🔍 Ailexity POS - Frontend Deployment Verification"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_DIR="/var/www/ailexity.in/frontend"
DEPLOY_DIR="/var/www/ailexity.in/html"
NGINX_CONFIG="/etc/nginx/sites-available/ailexity"

PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

function check_pass() {
    echo -e "${GREEN}✅ PASS${NC}: $1"
    ((PASS_COUNT++))
}

function check_fail() {
    echo -e "${RED}❌ FAIL${NC}: $1"
    ((FAIL_COUNT++))
}

function check_warn() {
    echo -e "${YELLOW}⚠️  WARN${NC}: $1"
    ((WARN_COUNT++))
}

# Test 1: Backend is running
echo "Test 1: Backend Service Status"
if systemctl is-active --quiet ailexity-backend; then
    check_pass "Backend service is running"
else
    check_fail "Backend service is not running"
fi
echo ""

# Test 2: Frontend directory exists and has files
echo "Test 2: Frontend Deployment Directory"
if [ -d "$DEPLOY_DIR" ] && [ "$(ls -A $DEPLOY_DIR)" ]; then
    FILE_COUNT=$(find "$DEPLOY_DIR" -type f | wc -l)
    check_pass "Deployment directory exists with $FILE_COUNT files"
    
    # Check for index.html
    if [ -f "$DEPLOY_DIR/index.html" ]; then
        check_pass "index.html exists"
    else
        check_fail "index.html not found in $DEPLOY_DIR"
    fi
    
    # Check for assets directory
    if [ -d "$DEPLOY_DIR/assets" ]; then
        JS_COUNT=$(find "$DEPLOY_DIR/assets" -name "*.js" | wc -l)
        check_pass "Assets directory exists with $JS_COUNT JS files"
    else
        check_fail "Assets directory not found"
    fi
else
    check_fail "Deployment directory is empty or does not exist"
fi
echo ""

# Test 3: Check for localhost in built files
echo "Test 3: Localhost References in Build"
if [ -d "$DEPLOY_DIR/assets" ]; then
    LOCALHOST_COUNT=$(grep -r "localhost" "$DEPLOY_DIR/assets"/*.js 2>/dev/null | wc -l)
    if [ "$LOCALHOST_COUNT" -eq 0 ]; then
        check_pass "No localhost references found in JS files"
    else
        check_fail "Found $LOCALHOST_COUNT localhost references in JS files"
        echo "   Run: grep -r 'localhost' $DEPLOY_DIR/assets/*.js"
    fi
else
    check_warn "Cannot check - assets directory not found"
fi
echo ""

# Test 4: Check for /api references
echo "Test 4: API Path References in Build"
if [ -d "$DEPLOY_DIR/assets" ]; then
    API_COUNT=$(grep -r '"/api' "$DEPLOY_DIR/assets"/*.js 2>/dev/null | wc -l)
    if [ "$API_COUNT" -gt 0 ]; then
        check_pass "Found /api references in JS files (correct)"
    else
        check_warn "No /api references found - verify VITE_API_URL was set correctly"
    fi
else
    check_warn "Cannot check - assets directory not found"
fi
echo ""

# Test 5: Nginx configuration
echo "Test 5: Nginx Configuration"
if [ -f "$NGINX_CONFIG" ]; then
    check_pass "Nginx config file exists"
    
    # Check root directive
    if grep -q "root /var/www/ailexity.in/html" "$NGINX_CONFIG"; then
        check_pass "Nginx root is set to correct directory"
    else
        check_fail "Nginx root is not set to /var/www/ailexity.in/html"
        echo "   Current root: $(grep 'root ' $NGINX_CONFIG | head -1)"
    fi
    
    # Check try_files for SPA
    if grep -q "try_files.*index.html" "$NGINX_CONFIG"; then
        check_pass "SPA routing configured (try_files)"
    else
        check_fail "SPA routing not configured - pages will 404 on refresh"
    fi
    
    # Check /api proxy
    if grep -q "location /api" "$NGINX_CONFIG"; then
        check_pass "/api proxy location exists"
        
        if grep -q "proxy_pass.*127.0.0.1:8000" "$NGINX_CONFIG"; then
            check_pass "/api proxies to backend on 127.0.0.1:8000"
        else
            check_fail "/api does not proxy to 127.0.0.1:8000"
        fi
    else
        check_fail "/api proxy location not found in config"
    fi
    
    # Check nginx config validity
    if sudo nginx -t 2>&1 | grep -q "successful"; then
        check_pass "Nginx configuration syntax is valid"
    else
        check_fail "Nginx configuration has syntax errors"
    fi
else
    check_fail "Nginx config file not found at $NGINX_CONFIG"
fi
echo ""

# Test 6: Nginx is running
echo "Test 6: Nginx Service Status"
if systemctl is-active --quiet nginx; then
    check_pass "Nginx service is running"
else
    check_fail "Nginx service is not running"
fi
echo ""

# Test 7: File permissions
echo "Test 7: File Permissions"
if [ -d "$DEPLOY_DIR" ]; then
    OWNER=$(stat -c '%U:%G' "$DEPLOY_DIR")
    if [ "$OWNER" = "www-data:www-data" ] || [ "$OWNER" = "root:root" ]; then
        check_pass "Directory owner is $OWNER"
    else
        check_warn "Directory owner is $OWNER (expected www-data:www-data)"
    fi
    
    PERMS=$(stat -c '%a' "$DEPLOY_DIR")
    if [ "$PERMS" = "755" ] || [ "$PERMS" = "775" ]; then
        check_pass "Directory permissions are $PERMS"
    else
        check_warn "Directory permissions are $PERMS (expected 755)"
    fi
fi
echo ""

# Test 8: Environment file
echo "Test 8: Environment Configuration"
if [ -f "$FRONTEND_DIR/.env" ]; then
    check_pass ".env file exists in frontend directory"
    
    ENV_CONTENT=$(cat "$FRONTEND_DIR/.env")
    echo "   Content: $ENV_CONTENT"
    
    if echo "$ENV_CONTENT" | grep -q "VITE_API_URL=/api"; then
        check_pass "VITE_API_URL is set to /api (correct)"
    elif echo "$ENV_CONTENT" | grep -q "localhost"; then
        check_fail "VITE_API_URL contains localhost (should be /api)"
    else
        check_warn "VITE_API_URL value is unusual: $ENV_CONTENT"
    fi
else
    check_fail ".env file not found in $FRONTEND_DIR"
fi
echo ""

# Test 9: Backend connectivity
echo "Test 9: Backend API Connectivity"
if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/ | grep -q "200"; then
    check_pass "Backend is responding on 127.0.0.1:8000"
else
    check_fail "Backend is not responding on 127.0.0.1:8000"
fi
echo ""

# Summary
echo "=================================================="
echo "📊 Verification Summary"
echo "=================================================="
echo -e "${GREEN}✅ Passed: $PASS_COUNT${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARN_COUNT${NC}"
echo -e "${RED}❌ Failed: $FAIL_COUNT${NC}"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}🎉 All critical tests passed!${NC}"
    echo ""
    echo "🧪 Manual Browser Tests:"
    echo "   1. Open http://ailexity.in"
    echo "   2. Open DevTools → Network tab"
    echo "   3. Try to login"
    echo "   4. Verify requests go to: http://ailexity.in/api/token"
    echo "   5. Check backend logs: sudo journalctl -u ailexity-backend -f"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Review the issues above.${NC}"
    echo ""
    echo "Common fixes:"
    echo "   • Rebuild frontend: cd $FRONTEND_DIR && npm run build"
    echo "   • Redeploy: sudo cp -r $FRONTEND_DIR/dist/* $DEPLOY_DIR/"
    echo "   • Fix permissions: sudo chown -R www-data:www-data $DEPLOY_DIR"
    echo "   • Reload nginx: sudo nginx -t && sudo systemctl reload nginx"
    exit 1
fi
