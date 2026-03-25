@echo off
REM Quick Rebuild Script for Ailexity POS Frontend
REM Run this after making changes to rebuild the frontend

echo ========================================
echo Ailexity POS - Frontend Rebuild Script
echo ========================================
echo.

cd /d "%~dp0frontend"

echo [1/3] Installing/Updating Dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)
echo.

echo [2/3] Building Frontend for Production...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed
    pause
    exit /b 1
)
echo.

echo [3/3] Build Complete!
echo.
echo ========================================
echo BUILD SUCCESSFUL
echo ========================================
echo.
echo Built files are in: frontend\dist\
echo.
echo Next steps:
echo 1. Deploy dist\ folder to VPS: /var/www/ailexity.in/html/
echo 2. Restart backend on VPS
echo 3. Clear browser cache (Ctrl+Shift+R)
echo.
echo Deploy command:
echo scp -r dist/* user@srv1300017:/var/www/ailexity.in/html/
echo.
pause
