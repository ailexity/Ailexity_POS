@echo off
echo ============================================
echo Stopping Ailexity POS System
echo ============================================
echo.

echo [1/3] Stopping Frontend...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo [2/3] Stopping Backend...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo [3/3] Stopping MongoDB...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :27017') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo All services stopped!
echo.
pause
